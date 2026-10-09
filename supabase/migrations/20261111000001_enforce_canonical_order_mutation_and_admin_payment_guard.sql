-- =========================================================================
-- Sprint 6 / Task 06.1: Enforce Canonical Order Mutation & Admin Payment Guard
-- 1. Strict Trigger Guard: Rejects ANY direct SQL status update lacking trusted context
--    - Sets app.order_transition_source in all trusted canonical RPCs
--    - Trigger verifies caller source context for each transition
-- 2. Admin Payment Guard:
--    - Explicitly disables admin pending -> paid in public.transition_order_status
--    - Only gateway-confirmed payment flow (Midtrans) can mark orders as paid
-- 3. Revoke direct column UPDATE privilege on orders(status) from authenticated and anon
-- =========================================================================

-- =========================================================================
-- 1. REVOKE DIRECT COLUMN UPDATE PRIVILEGE ON ORDERS(STATUS)
-- =========================================================================
revoke update (status) on public.orders from authenticated, anon;


-- =========================================================================
-- 2. HARDENED TRIGGER FUNCTION: TRG_ENFORCE_ORDER_STATE_MACHINE
-- =========================================================================
create or replace function public.trg_enforce_order_state_machine()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source text;
begin
  -- 2.1. Jika status tidak berubah, izinkan operasi update lainnya (snap_token, updated_at, tracking_number, dsb.)
  if old.status is not distinct from new.status then
    return new;
  end if;

  -- 2.2. VALIDASI TRUSTED TRANSITION SOURCE CONTEXT (Anti Direct SQL Bypass)
  v_source := nullif(current_setting('app.order_transition_source', true), '');

  if v_source is null then
    raise exception 'DIRECT_STATUS_MUTATION_FORBIDDEN: Perubahan status pesanan dari "%" ke "%" ditolak. Direct SQL UPDATE dilarang; seluruh perubahan status wajib melalui canonical RPC resmi yang menjalankan business side-effects secara atomik.', old.status, new.status;
  end if;

  -- 2.3. Guard: Status Terminal (completed, cancelled, refunded) bersifat mutlak dan tidak boleh diubah
  if old.status in ('completed', 'cancelled', 'refunded') then
    raise exception 'TERMINAL_ORDER_STATE: Pesanan dalam status "%" bersifat terminal dan tidak dapat diubah lagi ke "%"', old.status, new.status;
  end if;

  -- 2.4. Validasi Sumber Otorisasi Transisi (Source Authority Matching)
  if new.status = 'paid' then
    if v_source not in ('payment_webhook') then
      raise exception 'INVALID_TRANSITION_SOURCE: Status "paid" hanya dapat ditetapkan melalui payment webhook resmi (source saat ini: %)', v_source;
    end if;
  elsif new.status = 'cancelled' then
    if v_source not in ('cancel_order_rpc', 'payment_webhook', 'admin_transition_rpc') then
      raise exception 'INVALID_TRANSITION_SOURCE: Status "cancelled" hanya dapat diubah melalui cancellation RPC resmi (source saat ini: %)', v_source;
    end if;
  elsif new.status in ('shipped', 'completed') then
    if v_source <> 'admin_transition_rpc' then
      raise exception 'INVALID_TRANSITION_SOURCE: Status "%" hanya dapat diubah melalui admin transition RPC resmi (source saat ini: %)', new.status, v_source;
    end if;
  elsif new.status = 'refunded' then
    if v_source <> 'finalize_refund_rpc' then
      raise exception 'INVALID_TRANSITION_SOURCE: Status "refunded" hanya dapat diubah melalui finalize_refund RPC resmi (source saat ini: %)', v_source;
    end if;
  end if;

  -- 2.5. Validasi Matriks Transisi Status Resmi
  if old.status = 'pending' and new.status not in ('paid', 'cancelled') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  elsif old.status = 'paid' and new.status not in ('shipped', 'refunded') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  elsif old.status = 'shipped' and new.status not in ('completed') then
    raise exception 'INVALID_ORDER_TRANSITION: Transisi status tidak diizinkan: % -> %', old.status, new.status;
  end if;

  -- 2.6. Invariant: Pastikan timestamp transisi terisi otomatis jika belum ada
  if new.status = 'paid' and new.paid_at is null then
    new.paid_at := now();
  elsif new.status = 'cancelled' and new.cancelled_at is null then
    new.cancelled_at := now();
  elsif new.status = 'refunded' and new.refunded_at is null then
    new.refunded_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_order_state_machine_guard on public.orders;
create trigger trg_order_state_machine_guard
before update on public.orders
for each row
execute function public.trg_enforce_order_state_machine();


-- =========================================================================
-- 3. CANONICAL RPC: HANDLE_PAYMENT_WEBHOOK (DENGAN CONTEXT SOURCE)
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
      -- Set trusted transition source context
      perform set_config('app.order_transition_source', 'payment_webhook', true);

      update public.orders
      set
        status = 'paid',
        payment_type = coalesce(p_payment_type, payment_type),
        midtrans_id = coalesce(p_midtrans_id, midtrans_id),
        paid_at = coalesce(paid_at, now()),
        updated_at = now()
      where id = p_order_id;

      for r in
        select product_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc
      loop
        update public.products
        set sold_count = sold_count + r.qty
        where id = r.product_id;
      end loop;

      return 'PAID_SUCCESS';
    end if;

    if p_target_status = 'cancelled' then
      -- Set trusted transition source context
      perform set_config('app.order_transition_source', 'payment_webhook', true);
      perform set_config('app.stock_change_reason', 'webhook_expire_restock', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

      for r in
        select product_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc
      loop
        update public.products
        set stock = stock + r.qty
        where id = r.product_id;
      end loop;

      update public.orders
      set
        status = 'cancelled',
        cancelled_at = coalesce(cancelled_at, now()),
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
-- 4. CANONICAL RPC: CANCEL_ORDER (DENGAN CONTEXT SOURCE)
-- =========================================================================
create or replace function public.cancel_order(
  p_order_id uuid,
  p_reason text default 'Dibatalkan oleh pelanggan'
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order record;
  r record;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized: Sesi login tidak ditemukan';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if v_order.user_id <> auth.uid() then
    if not exists (
      select 1 from public.profiles
      where profiles.user_id = auth.uid() and profiles.role = 'admin'
    ) then
      raise exception 'Forbidden: Anda tidak berhak membatalkan pesanan ini';
    end if;
  end if;

  if v_order.status <> 'pending' then
    raise exception 'Hanya pesanan pending yang dapat dibatalkan (status saat ini: %)', v_order.status;
  end if;

  -- Set trusted transition context & audit ledger context
  perform set_config('app.order_transition_source', 'cancel_order_rpc', true);
  perform set_config('app.stock_change_reason', 'order_cancellation', true);
  perform set_config('app.stock_change_order_id', p_order_id::text, true);

  -- Restock item dengan urutan deterministik
  for r in
    select product_id, qty
    from public.order_items
    where order_id = p_order_id
    order by product_id asc
  loop
    update public.products
    set stock = stock + r.qty
    where id = r.product_id;
  end loop;

  update public.orders
  set 
    status = 'cancelled',
    cancelled_at = coalesce(cancelled_at, now()),
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_order_id;

  -- Activity log
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
      'Pesanan dibatalkan: ' || coalesce(p_reason, 'Dibatalkan oleh pelanggan/admin'),
      jsonb_build_object('order_id', p_order_id, 'status', 'pending'),
      jsonb_build_object('order_id', p_order_id, 'status', 'cancelled', 'reason', p_reason)
    );
  exception when others then
    null;
  end;

  return true;
end;
$$;


-- =========================================================================
-- 5. CANONICAL RPC: TRANSITION_ORDER_STATUS (ADMIN PAYMENT GUARD ENFORCED)
-- =========================================================================
create or replace function public.transition_order_status(
  p_order_id uuid,
  p_target_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
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

  -- Set trusted transition source context for admin transitions
  perform set_config('app.order_transition_source', 'admin_transition_rpc', true);

  if v_order.status = 'pending' then
    if p_target_status = 'paid' then
      -- GUARD: Admin dilarang menandai pending -> paid tanpa verifikasi payment gateway
      raise exception 'ADMIN_PAYMENT_OVERRIDE_DISABLED: Perubahan status dari "pending" ke "paid" oleh admin dinonaktifkan. Status paid hanya dapat ditetapkan melalui konfirmasi resmi payment gateway (Midtrans).';
    elsif p_target_status = 'cancelled' then
      perform set_config('app.stock_change_reason', 'admin_order_cancellation', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

      for r in
        select product_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc
      loop
        update public.products set stock = stock + r.qty where id = r.product_id;
      end loop;

      update public.orders
      set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()), cancellation_reason = coalesce(p_reason, 'Dibatalkan oleh Administrator'), updated_at = now()
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
      'Status pesanan diperbarui menjadi: ' || p_target_status || coalesce(' (Alasan: ' || p_reason || ')', ''),
      jsonb_build_object('order_id', p_order_id, 'status', v_order.status),
      jsonb_build_object('order_id', p_order_id, 'status', p_target_status, 'reason', p_reason)
    );
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'order_id', p_order_id,
    'current_status', p_target_status,
    'previous_status', v_order.status,
    'no_op', false,
    'message', 'Status pesanan berhasil diperbarui menjadi ' || p_target_status
  );
end;
$$;


-- =========================================================================
-- 6. CANONICAL RPC: FINALIZE_REFUND (DENGAN CONTEXT SOURCE)
-- =========================================================================
create or replace function public.finalize_refund(
  p_refund_id uuid,
  p_success boolean,
  p_gateway_refund_id text default null,
  p_failure_reason text default null,
  p_bank_confirmed_at timestamptz default null
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

  -- Jika refund sudah final (succeeded/failed), return idempotent
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
    -- A. Update status refund ke 'succeeded' dan simpan konfirmasi bank
    update public.refunds
    set
      status = 'succeeded',
      gateway_refund_id = coalesce(p_gateway_refund_id, gateway_refund_id),
      bank_confirmed_at = coalesce(p_bank_confirmed_at, now()),
      processed_at = now(),
      updated_at = now()
    where id = p_refund_id;

    -- B. Set trusted transition source context sebelum mengupdate order ke 'refunded'
    perform set_config('app.order_transition_source', 'finalize_refund_rpc', true);

    update public.orders
    set
      status = 'refunded',
      refunded_at = now(),
      updated_at = now()
    where id = v_refund.order_id;

    -- C. Restock stok produk & kurangi sold_count secara atomik dengan validasi integritas
    perform set_config('app.stock_change_reason', 'order_refund_restock', true);
    perform set_config('app.stock_change_order_id', v_refund.order_id::text, true);

    for r in select product_id, qty from public.order_items where order_id = v_refund.order_id order by product_id asc loop
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
        'Refund berhasil dikonfirmasi oleh Bank/Gateway: dana dikembalikan dan stok direstock',
        jsonb_build_object('order_id', v_refund.order_id, 'status', 'paid', 'refund_id', p_refund_id),
        jsonb_build_object('order_id', v_refund.order_id, 'status', 'refunded', 'gateway_refund_id', p_gateway_refund_id, 'bank_confirmed_at', coalesce(p_bank_confirmed_at, now()))
      );
    exception when others then
      null;
    end;

    return jsonb_build_object(
      'refund_id', p_refund_id,
      'order_id', v_refund.order_id,
      'status', 'succeeded',
      'order_status', 'refunded',
      'bank_confirmed_at', coalesce(p_bank_confirmed_at, now()),
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
-- 7. FUNCTION PRIVILEGES & SECURITY HARDENING
-- =========================================================================
-- Ensure public/anon cannot execute trusted transition RPCs
revoke all on function public.handle_payment_webhook(uuid, text, text, text) from public, anon;
grant execute on function public.handle_payment_webhook(uuid, text, text, text) to service_role;

revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated, service_role;

revoke all on function public.transition_order_status(uuid, text, text) from public, anon;
grant execute on function public.transition_order_status(uuid, text, text) to authenticated, service_role;

revoke all on function public.finalize_refund(uuid, boolean, text, text, timestamptz) from public, anon;
grant execute on function public.finalize_refund(uuid, boolean, text, text, timestamptz) to authenticated, service_role;

