-- Sprint 5 / Task 04: Order Refund & Payment Gateway Reversal
-- 1. Tabel public.refunds (Audit Ledger & Idempotency)
-- 2. Perluasan ENUM/Check Constraint orders.status untuk menyertakan 'refunded'
-- 3. RPC public.create_refund_attempt (Atomic Lock & Idempotent Initiation)
-- 4. RPC public.finalize_refund (Atomic Execution: Restock, Ledger, Status Transition)

-- =========================================================================
-- 1. UPDATE ORDERS STATUS CHECK CONSTRAINT & REFUNDED_AT
-- =========================================================================
alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'));

alter table public.orders
  add column if not exists refunded_at timestamptz;

-- =========================================================================
-- 2. CREATE REFUNDS TABLE
-- =========================================================================
create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'IDR',
  status text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed')),
  gateway text not null default 'midtrans',
  gateway_transaction_id text,
  gateway_refund_id text,
  idempotency_key text not null,
  reason text not null,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  constraint uq_refunds_idempotency_order unique (order_id, idempotency_key)
);

create index if not exists idx_refunds_order_id on public.refunds(order_id);
create index if not exists idx_refunds_status on public.refunds(status);
create index if not exists idx_refunds_idempotency on public.refunds(idempotency_key);

-- Row Level Security
alter table public.refunds enable row level security;

drop policy if exists "admin read refunds" on public.refunds;
create policy "admin read refunds"
on public.refunds for select to authenticated
using (public.is_admin());

drop policy if exists "owner read refunds" on public.refunds;
create policy "owner read refunds"
on public.refunds for select to authenticated
using (user_id = auth.uid());

-- =========================================================================
-- 3. RPC CREATE_REFUND_ATTEMPT (ATOMIC LOCK & IDEMPOTENT INITIATION)
-- =========================================================================
create or replace function public.create_refund_attempt(
  p_order_id uuid,
  p_idempotency_key text,
  p_reason text default 'Permintaan refund oleh Administrator'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_existing_refund record;
  v_refund_id uuid;
begin
  -- 1. Authorization: Administrator only
  if auth.uid() is not null and not public.is_admin() and current_user not in ('service_role', 'postgres') then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang berhak memproses refund pesanan';
  end if;

  -- 2. Kunci baris order secara eksklusif FOR UPDATE
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND: Pesanan tidak ditemukan';
  end if;

  -- 3. Cek Idempotency: jika ada attempt dengan (order_id, idempotency_key) yang sama persis
  select * into v_existing_refund
  from public.refunds
  where order_id = p_order_id and idempotency_key = p_idempotency_key;

  if found then
    return jsonb_build_object(
      'refund_id', v_existing_refund.id,
      'order_id', p_order_id,
      'amount_cents', v_existing_refund.amount_cents,
      'status', v_existing_refund.status,
      'idempotency_key', v_existing_refund.idempotency_key,
      'gateway_transaction_id', v_existing_refund.gateway_transaction_id,
      'is_replay', true
    );
  end if;

  -- 4. Validasi Status Order: HANYA order berstatus 'paid' yang dapat direfund
  if v_order.status <> 'paid' then
    raise exception 'INVALID_ORDER_STATE_FOR_REFUND: Hanya pesanan dengan status "paid" yang dapat direfund (status saat ini: %)', v_order.status;
  end if;

  -- 5. Cek apakah ada refund lain untuk order ini yang sedang aktif atau sudah berhasil
  if exists (
    select 1 from public.refunds
    where order_id = p_order_id and status in ('succeeded', 'pending')
  ) then
    raise exception 'REFUND_ALREADY_IN_PROGRESS: Pesanan ini sudah memiliki refund aktif atau telah berhasil direfund';
  end if;

  -- 6. Insert new refund record dengan status 'pending'
  -- Amount di-derive SERVER-SIDE secara terpercaya dari order.total_cents
  insert into public.refunds (
    order_id,
    user_id,
    amount_cents,
    status,
    gateway,
    gateway_transaction_id,
    idempotency_key,
    reason
  ) values (
    p_order_id,
    v_order.user_id,
    v_order.total_cents,
    'pending',
    'midtrans',
    coalesce(v_order.midtrans_id, v_order.id::text),
    p_idempotency_key,
    coalesce(p_reason, 'Permintaan refund oleh Administrator')
  )
  returning id into v_refund_id;

  -- Catat inisiasi ke activity_logs
  begin
    insert into public.activity_logs (
      entity_type,
      entity_id,
      action,
      description,
      old_data,
      new_data
    ) values (
      'order',
      0,
      'UPDATE'::public.activity_action,
      'Refund diinisiasi: ' || coalesce(p_reason, 'Admin request'),
      jsonb_build_object('order_id', p_order_id, 'status', 'paid'),
      jsonb_build_object('order_id', p_order_id, 'refund_id', v_refund_id, 'amount_cents', v_order.total_cents, 'idempotency_key', p_idempotency_key)
    );
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'refund_id', v_refund_id,
    'order_id', p_order_id,
    'amount_cents', v_order.total_cents,
    'status', 'pending',
    'idempotency_key', p_idempotency_key,
    'gateway_transaction_id', coalesce(v_order.midtrans_id, v_order.id::text),
    'is_replay', false
  );
end;
$$;

-- =========================================================================
-- 4. RPC FINALIZE_REFUND (ATOMIC EXECUTION: RESTOCK, LEDGER, STATUS)
-- =========================================================================
create or replace function public.finalize_refund(
  p_refund_id uuid,
  p_success boolean,
  p_gateway_refund_id text default null,
  p_failure_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_refund record;
  v_order record;
  r record;
begin
  -- 1. Authorization
  if auth.uid() is not null and not public.is_admin() and current_user not in ('service_role', 'postgres') then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang berhak menyelesaikan refund';
  end if;

  -- 2. Kunci baris refund FOR UPDATE
  select * into v_refund
  from public.refunds
  where id = p_refund_id
  for update;

  if not found then
    raise exception 'REFUND_NOT_FOUND: Record refund tidak ditemukan';
  end if;

  -- Idempotent check: jika refund sudah difinalisasi
  if v_refund.status in ('succeeded', 'failed') then
    return jsonb_build_object(
      'refund_id', p_refund_id,
      'order_id', v_refund.order_id,
      'status', v_refund.status,
      'already_finalized', true
    );
  end if;

  -- 3. Kunci baris order FOR UPDATE
  select * into v_order
  from public.orders
  where id = v_refund.order_id
  for update;

  if p_success then
    -- A. Update status refund ke 'succeeded'
    update public.refunds
    set
      status = 'succeeded',
      gateway_refund_id = coalesce(p_gateway_refund_id, gateway_refund_id),
      processed_at = now(),
      updated_at = now()
    where id = p_refund_id;

    -- B. Update status order ke 'refunded'
    update public.orders
    set
      status = 'refunded',
      refunded_at = now(),
      updated_at = now()
    where id = v_refund.order_id;

    -- C. Restock stok produk & kurangi sold_count secara atomik
    perform set_config('app.stock_change_reason', 'order_refund_restock', true);
    perform set_config('app.stock_change_order_id', v_refund.order_id::text, true);

    for r in select product_id, qty from public.order_items where order_id = v_refund.order_id loop
      update public.products
      set
        stock = stock + r.qty,
        sold_count = greatest(0, sold_count - r.qty)
      where id = r.product_id;
    end loop;

    -- D. Activity log
    begin
      insert into public.activity_logs (
        entity_type,
        entity_id,
        action,
        description,
        old_data,
        new_data
      ) values (
        'order',
        0,
        'UPDATE'::public.activity_action,
        'Refund berhasil diselesaikan oleh Gateway: dana dikembalikan dan stok direstock',
        jsonb_build_object('order_id', v_refund.order_id, 'status', 'paid', 'refund_id', p_refund_id),
        jsonb_build_object('order_id', v_refund.order_id, 'status', 'refunded', 'gateway_refund_id', p_gateway_refund_id)
      );
    exception when others then
      null;
    end;

    return jsonb_build_object(
      'refund_id', p_refund_id,
      'order_id', v_refund.order_id,
      'status', 'succeeded',
      'order_status', 'refunded',
      'already_finalized', false
    );
  else
    -- B. Refund gagal di gateway
    update public.refunds
    set
      status = 'failed',
      failure_reason = coalesce(p_failure_reason, 'Refund ditolak oleh payment gateway'),
      processed_at = now(),
      updated_at = now()
    where id = p_refund_id;

    -- Activity log failure
    begin
      insert into public.activity_logs (
        entity_type,
        entity_id,
        action,
        description,
        old_data,
        new_data
      ) values (
        'order',
        0,
        'UPDATE'::public.activity_action,
        'Refund gagal di Gateway: ' || coalesce(p_failure_reason, 'Gateway failure'),
        jsonb_build_object('order_id', v_refund.order_id, 'refund_id', p_refund_id),
        jsonb_build_object('order_id', v_refund.order_id, 'status', 'failed', 'failure_reason', p_failure_reason)
      );
    exception when others then
      null;
    end;

    return jsonb_build_object(
      'refund_id', p_refund_id,
      'order_id', v_refund.order_id,
      'status', 'failed',
      'order_status', v_order.status,
      'failure_reason', p_failure_reason,
      'already_finalized', false
    );
  end if;
end;
$$;

-- Izin eksekusi RPC
revoke execute on function public.create_refund_attempt(uuid, text, text) from public;
grant execute on function public.create_refund_attempt(uuid, text, text) to authenticated;
grant execute on function public.create_refund_attempt(uuid, text, text) to service_role;

revoke execute on function public.finalize_refund(uuid, boolean, text, text) from public;
grant execute on function public.finalize_refund(uuid, boolean, text, text) to authenticated;
grant execute on function public.finalize_refund(uuid, boolean, text, text) to service_role;

-- =========================================================================
-- 5. UPDATE TRANSITION_ORDER_STATUS TO RECOGNIZE 'refunded' AS TERMINAL
-- =========================================================================
create or replace function public.transition_order_status(
  p_order_id uuid,
  p_target_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  r record;
begin
  if auth.uid() is not null and not public.is_admin() and current_user not in ('service_role', 'postgres') then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang dapat memperbarui status pesanan';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND: Pesanan tidak ditemukan';
  end if;

  if v_order.status = p_target_status then
    return jsonb_build_object(
      'order_id', p_order_id,
      'current_status', v_order.status,
      'previous_status', v_order.status,
      'no_op', true,
      'message', 'Status pesanan sudah dalam status target (' || p_target_status || ')'
    );
  end if;

  if v_order.status = 'pending' then
    if p_target_status = 'paid' then
      update public.orders
      set status = 'paid', paid_at = coalesce(paid_at, now()), updated_at = now()
      where id = p_order_id;

      for r in select product_id, qty from public.order_items where order_id = p_order_id loop
        update public.products set sold_count = sold_count + r.qty where id = r.product_id;
      end loop;
    elsif p_target_status = 'cancelled' then
      perform set_config('app.stock_change_reason', 'admin_order_cancellation', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

      for r in select product_id, qty from public.order_items where order_id = p_order_id loop
        update public.products set stock = stock + r.qty where id = r.product_id;
      end loop;

      update public.orders
      set status = 'cancelled', cancelled_at = now(), cancellation_reason = coalesce(p_reason, 'Dibatalkan oleh Administrator'), updated_at = now()
      where id = p_order_id;
    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status = 'paid' then
    if p_target_status = 'shipped' then
      update public.orders set status = 'shipped', updated_at = now() where id = p_order_id;
    elsif p_target_status = 'cancelled' then
      raise exception 'INVALID_ORDER_TRANSITION: Pesanan berstatus paid tidak dapat dibatalkan tanpa proses refund resmi (gunakan modul refund)';
    elsif p_target_status = 'refunded' then
      raise exception 'INVALID_ORDER_TRANSITION: Transisi ke status refunded harus melalui modul refund resmi (create_refund_attempt & finalize_refund)';
    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status = 'shipped' then
    if p_target_status = 'completed' then
      update public.orders set status = 'completed', updated_at = now() where id = p_order_id;
    else
      raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', v_order.status, p_target_status;
    end if;

  elsif v_order.status in ('completed', 'cancelled', 'refunded') then
    raise exception 'INVALID_ORDER_TRANSITION: Pesanan sudah berada dalam status terminal (%) dan tidak dapat diubah lagi', v_order.status;

  else
    raise exception 'INVALID_ORDER_TRANSITION: Status pesanan tidak dikenal: %', v_order.status;
  end if;

  begin
    insert into public.activity_logs (
      entity_type, entity_id, action, description, old_data, new_data
    ) values (
      'order', 0, 'UPDATE'::public.activity_action,
      coalesce(p_reason, 'Status pesanan diubah dari ' || v_order.status || ' ke ' || p_target_status || ' oleh Administrator'),
      jsonb_build_object('order_id', p_order_id, 'status', v_order.status),
      jsonb_build_object('order_id', p_order_id, 'status', p_target_status)
    );
  exception when others then null; end;

  return jsonb_build_object(
    'order_id', p_order_id,
    'current_status', p_target_status,
    'previous_status', v_order.status,
    'no_op', false,
    'message', 'Status pesanan berhasil diubah menjadi ' || p_target_status
  );
end;
$$;

