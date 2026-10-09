-- Sprint 5 / Task 05: Payment Reconciliation & Refund Webhook Hardening
-- 1. Tabel public.payment_events (Gateway Notification Ledger & Deduplication)
-- 2. Hardened handle_payment_webhook (Explicit guard for 'refunded' orders)
-- 3. Hardened finalize_refund (Strict sold_count consistency validation)
-- 4. RPC public.handle_refund_webhook (Atomic, Idempotent Webhook Processor for Refunds)

-- =========================================================================
-- 1. TABLE PUBLIC.PAYMENT_EVENTS (EVENT LEDGER & DEDUPLICATION)
-- =========================================================================
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  order_id uuid references public.orders(id) on delete cascade,
  event_type text not null check (event_type in ('payment', 'refund')),
  status text not null check (status in ('processed', 'ignored', 'failed')),
  gateway text not null default 'midtrans',
  payload_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz not null default now(),
  constraint uq_payment_events_event_key unique (event_key)
);

create index if not exists idx_payment_events_order_id on public.payment_events(order_id);
create index if not exists idx_payment_events_event_key on public.payment_events(event_key);

-- RLS: Only Admins can inspect payment_events
alter table public.payment_events enable row level security;

drop policy if exists "admin read payment_events" on public.payment_events;
create policy "admin read payment_events"
  on public.payment_events for select
  to authenticated
  using (public.is_admin());

-- =========================================================================
-- 2. HARDENED HANDLE_PAYMENT_WEBHOOK (EXPLICIT REFUNDED STATE GUARD)
-- =========================================================================
create or replace function public.handle_payment_webhook(
  p_order_id uuid,
  p_target_status text,
  p_payment_type text default null,
  p_midtrans_id text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_status text;
  r record;
begin
  -- 1. Kunci baris order secara eksklusif FOR UPDATE
  select status into v_current_status
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return 'ORDER_NOT_FOUND';
  end if;

  -- 2. Proteksi Pesanan yang Sudah Direfund (Terminal Refunded State Guard)
  if v_current_status = 'refunded' then
    return 'IGNORED_ORDER_ALREADY_REFUNDED';
  end if;

  -- 3. Proteksi State Terminal / Progresif (paid, shipped, completed)
  if v_current_status in ('paid', 'shipped', 'completed') then
    if p_target_status = 'cancelled' then
      return 'IGNORED_STALE_CANCEL_ON_PAID_ORDER';
    end if;

    if p_target_status = 'paid' then
      return 'NO_CHANGE_ALREADY_' || upper(v_current_status);
    end if;

    return 'IGNORED_ORDER_ALREADY_PROGRESSING';
  end if;

  -- 4. Proteksi Pesanan yang Sudah Dibatalkan (Phantom Stock & Late Payment Protection)
  if v_current_status = 'cancelled' then
    if p_target_status = 'paid' then
      begin
        insert into public.activity_logs (
          action,
          entity_type,
          entity_id,
          description,
          new_data
        ) values (
          'UPDATE'::public.activity_action,
          'orders',
          0,
          'CONFLICT: Webhook paid diterima untuk order yang sudah cancelled (Refund Required)',
          jsonb_build_object(
            'order_id', p_order_id,
            'midtrans_id', p_midtrans_id,
            'payment_type', p_payment_type
          )
        );
      exception when others then
        null;
      end;

      return 'CONFLICT_ALREADY_CANCELLED';
    end if;

    if p_target_status = 'cancelled' then
      return 'NO_CHANGE_ALREADY_CANCELLED';
    end if;

    return 'IGNORED_ORDER_ALREADY_CANCELLED';
  end if;

  -- 5. Transisi Normal dari status 'pending'
  if v_current_status = 'pending' then
    if p_target_status = 'paid' then
      update public.orders
      set
        status = 'paid',
        payment_type = coalesce(p_payment_type, payment_type),
        midtrans_id = coalesce(p_midtrans_id, midtrans_id),
        paid_at = coalesce(paid_at, now()),
        updated_at = now()
      where id = p_order_id;

      for r in select product_id, qty from public.order_items where order_id = p_order_id loop
        update public.products
        set sold_count = sold_count + r.qty
        where id = r.product_id;
      end loop;

      return 'PAID_SUCCESS';
    end if;

    if p_target_status = 'cancelled' then
      perform set_config('app.stock_change_reason', 'webhook_expire_restock', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

      for r in select product_id, qty from public.order_items where order_id = p_order_id loop
        update public.products
        set stock = stock + r.qty
        where id = r.product_id;
      end loop;

      update public.orders
      set
        status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = 'Dibatalkan/Kadaluarsa oleh Payment Gateway',
        updated_at = now()
      where id = p_order_id;

      return 'CANCELLED_SUCCESS';
    end if;
  end if;

  return 'NO_CHANGE';
end;
$$;

-- =========================================================================
-- 3. HARDENED FINALIZE_REFUND (STRICT SOLD_COUNT CONSISTENCY ENFORCEMENT)
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
set search_path = public, pg_temp
as $$
declare
  v_refund record;
  v_order record;
  v_current_sold int;
  r record;
begin
  -- 1. Authorization: Administrator or Service Role
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
    -- State transition rule: succeeded -> failed is STRICTLY FORBIDDEN
    if v_refund.status = 'succeeded' and not p_success then
      return jsonb_build_object(
        'refund_id', p_refund_id,
        'order_id', v_refund.order_id,
        'status', 'succeeded',
        'already_finalized', true,
        'error', 'DENIED_STATUS_TRANSITION: Refund yang sudah berhasil tidak dapat diubah menjadi gagal'
      );
    end if;

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

    -- C. Restock stok produk & kurangi sold_count secara atomik dengan validasi integritas
    perform set_config('app.stock_change_reason', 'order_refund_restock', true);
    perform set_config('app.stock_change_order_id', v_refund.order_id::text, true);

    for r in select product_id, qty from public.order_items where order_id = v_refund.order_id loop
      -- Validasi agar tidak silent masking korupsi data
      select sold_count into v_current_sold
      from public.products
      where id = r.product_id
      for update;

      if v_current_sold < r.qty then
        raise exception 'DATA_INCONSISTENCY_SOLD_COUNT: sold_count (%) kurang dari qty order (%) untuk produk %', v_current_sold, r.qty, r.product_id;
      end if;

      update public.products
      set
        stock = stock + r.qty,
        sold_count = sold_count - r.qty
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

-- =========================================================================
-- 4. RPC PUBLIC.HANDLE_REFUND_WEBHOOK (IDEMPOTENT & ATOMIC WEBHOOK REVERSAL)
-- =========================================================================
create or replace function public.handle_refund_webhook(
  p_order_id uuid,
  p_refund_key text default null,
  p_gateway_refund_id text default null,
  p_is_success boolean default true,
  p_failure_reason text default null,
  p_event_key text default null,
  p_payload_summary jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order record;
  v_refund record;
  v_finalize_res jsonb;
begin
  -- 1. Deduplikasi Event: Periksa payment_events jika event_key disertakan
  if p_event_key is not null then
    if exists (
      select 1 from public.payment_events
      where event_key = p_event_key and status in ('processed', 'ignored')
    ) then
      return jsonb_build_object(
        'order_id', p_order_id,
        'result', 'DUPLICATE_EVENT_IGNORED',
        'no_op', true,
        'message', 'Event notifikasi webhook sudah diproses sebelumnya'
      );
    end if;
  end if;

  -- 2. Kunci baris order FOR UPDATE
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return jsonb_build_object(
      'order_id', p_order_id,
      'result', 'ORDER_NOT_FOUND',
      'no_op', true,
      'message', 'Pesanan tidak ditemukan'
    );
  end if;

  -- 3. Proteksi State: Jika order sudah dalam status 'refunded'
  if v_order.status = 'refunded' then
    if p_event_key is not null then
      insert into public.payment_events (
        event_key, order_id, event_type, status, gateway, payload_summary
      ) values (
        p_event_key, p_order_id, 'refund', 'ignored', 'midtrans', p_payload_summary
      ) on conflict (event_key) do nothing;
    end if;

    if p_is_success then
      return jsonb_build_object(
        'order_id', p_order_id,
        'result', 'ALREADY_REFUNDED_NO_OP',
        'status', 'refunded',
        'no_op', true
      );
    else
      -- Stale failure received after order was already refunded: DENIED
      return jsonb_build_object(
        'order_id', p_order_id,
        'result', 'IGNORED_STALE_FAILURE_AFTER_REFUND',
        'status', 'refunded',
        'no_op', true
      );
    end if;
  end if;

  -- 4. Validasi bahwa order berada pada status 'paid'
  if v_order.status <> 'paid' then
    if p_event_key is not null then
      insert into public.payment_events (
        event_key, order_id, event_type, status, gateway, payload_summary
      ) values (
        p_event_key, p_order_id, 'refund', 'ignored', 'midtrans', p_payload_summary
      ) on conflict (event_key) do nothing;
    end if;

    return jsonb_build_object(
      'order_id', p_order_id,
      'result', 'INVALID_ORDER_STATE_FOR_REFUND',
      'current_status', v_order.status,
      'no_op', true
    );
  end if;

  -- 5. Temukan record refund terkait di public.refunds
  if p_refund_key is not null then
    select * into v_refund
    from public.refunds
    where order_id = p_order_id and idempotency_key = p_refund_key
    for update;
  end if;

  if v_refund.id is null then
    -- Cari attempt pending terakhir
    select * into v_refund
    from public.refunds
    where order_id = p_order_id and status = 'pending'
    order by created_at desc
    limit 1
    for update;
  end if;

  -- Jika belum ada record refund sama sekali (misal refund langsung diinisiasi via Midtrans Dashboard)
  if v_refund.id is null then
    insert into public.refunds (
      order_id,
      user_id,
      amount_cents,
      status,
      gateway,
      gateway_transaction_id,
      gateway_refund_id,
      idempotency_key,
      reason
    ) values (
      p_order_id,
      v_order.user_id,
      v_order.total_cents,
      'pending',
      'midtrans',
      coalesce(v_order.midtrans_id, v_order.id::text),
      p_gateway_refund_id,
      coalesce(p_refund_key, 'gateway-webhook-' || gen_random_uuid()::text),
      'Refund dikonfirmasi via Midtrans Webhook'
    )
    returning * into v_refund;
  end if;

  -- 6. Eksekusi finalisasi atomik
  v_finalize_res := public.finalize_refund(
    v_refund.id,
    p_is_success,
    p_gateway_refund_id,
    p_failure_reason
  );

  -- 7. Catat ke payment_events
  if p_event_key is not null then
    insert into public.payment_events (
      event_key,
      order_id,
      event_type,
      status,
      gateway,
      payload_summary
    ) values (
      p_event_key,
      p_order_id,
      'refund',
      'processed',
      'midtrans',
      p_payload_summary
    )
    on conflict (event_key) do update
    set status = excluded.status, processed_at = now();
  end if;

  return jsonb_build_object(
    'order_id', p_order_id,
    'refund_id', v_refund.id,
    'result', case when p_is_success then 'REFUND_SUCCEEDED' else 'REFUND_FAILED' end,
    'status', v_finalize_res->>'status',
    'order_status', v_finalize_res->>'order_status',
    'already_finalized', coalesce((v_finalize_res->>'already_finalized')::boolean, false),
    'no_op', false
  );
end;
$$;

-- Permissions
revoke execute on function public.handle_refund_webhook from public, anon;
grant execute on function public.handle_refund_webhook to authenticated, service_role;
revoke execute on function public.finalize_refund from public, anon;
grant execute on function public.finalize_refund to authenticated, service_role;
revoke execute on function public.handle_payment_webhook from public, anon;
grant execute on function public.handle_payment_webhook to authenticated, service_role;
