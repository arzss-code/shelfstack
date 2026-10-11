-- Sprint 5 / Task 05.1: Refund Confirmation Semantics Hardening
-- 1. Tambah kolom bank_confirmed_at pada public.refunds
-- 2. Update finalize_refund untuk mendukung bank_confirmed_at
-- 3. Hardened handle_refund_webhook: Pisahkan 'accepted' (pending) vs 'confirmed' (bank_confirmed_at)

-- =========================================================================
-- 1. ADD BANK_CONFIRMED_AT TO REFUNDS TABLE
-- =========================================================================
alter table public.refunds
  add column if not exists bank_confirmed_at timestamptz;

-- =========================================================================
-- 2. HARDENED FINALIZE_REFUND WITH BANK_CONFIRMED_AT
-- =========================================================================
drop function if exists public.finalize_refund(uuid, boolean, text, text);

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
    -- A. Update status refund ke 'succeeded' dan simpan konfirmasi bank
    update public.refunds
    set
      status = 'succeeded',
      gateway_refund_id = coalesce(p_gateway_refund_id, gateway_refund_id),
      bank_confirmed_at = coalesce(p_bank_confirmed_at, now()),
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
-- 3. HARDENED HANDLE_REFUND_WEBHOOK WITH 3-STAGE CONFIRMATION SEMANTICS
-- =========================================================================
drop function if exists public.handle_refund_webhook(uuid, text, text, boolean, text, text, jsonb);

create or replace function public.handle_refund_webhook(
  p_order_id uuid,
  p_refund_key text default null,
  p_gateway_refund_id text default null,
  p_is_success boolean default true,
  p_failure_reason text default null,
  p_event_key text default null,
  p_payload_summary jsonb default '{}'::jsonb,
  p_stage text default 'confirmed',
  p_bank_confirmed_at timestamptz default null
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

    if p_stage = 'failed' or not p_is_success then
      -- Stale failure received after order was already refunded: DENIED
      return jsonb_build_object(
        'order_id', p_order_id,
        'result', 'IGNORED_STALE_FAILURE_AFTER_REFUND',
        'status', 'refunded',
        'no_op', true
      );
    else
      -- Duplicate or initial notification received after already confirmed
      return jsonb_build_object(
        'order_id', p_order_id,
        'result', 'ALREADY_REFUNDED_NO_OP',
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

  if v_refund.id is null and p_gateway_refund_id is not null then
    select * into v_refund
    from public.refunds
    where order_id = p_order_id and gateway_refund_id = p_gateway_refund_id
    for update;
  end if;

  if v_refund.id is null then
    select * into v_refund
    from public.refunds
    where order_id = p_order_id and status = 'pending'
    order by created_at desc
    limit 1
    for update;
  end if;

  -- Jika belum ada record refund sama sekali di database:
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

  -- =======================================================================
  -- 6. PISAHKAN LOGIKA BERDASARKAN TAHAP KONFIRMASI (STAGE)
  -- =======================================================================

  -- TAHAP A: 'accepted' (Permintaan diterima gateway, BELUM konfirmasi bank)
  -- ATURAN BISNIS: Jangan ubah orders.status ke 'refunded', jangan restock!
  if p_stage = 'accepted' then
    update public.refunds
    set
      gateway_refund_id = coalesce(p_gateway_refund_id, gateway_refund_id),
      updated_at = now()
    where id = v_refund.id;

    if p_event_key is not null then
      insert into public.payment_events (
        event_key, order_id, event_type, status, gateway, payload_summary
      ) values (
        p_event_key, p_order_id, 'refund', 'processed', 'midtrans', p_payload_summary
      ) on conflict (event_key) do update
      set status = excluded.status, processed_at = now();
    end if;

    return jsonb_build_object(
      'order_id', p_order_id,
      'refund_id', v_refund.id,
      'result', 'REFUND_ACCEPTED_AWAITING_CONFIRMATION',
      'status', 'pending',
      'order_status', 'paid',
      'no_op', false,
      'message', 'Permintaan refund diterima oleh gateway, menunggu konfirmasi bank (bank_confirmed_at)'
    );
  end if;

  -- TAHAP B: 'confirmed' (Konfirmasi resmi dari Bank / Provider via bank_confirmed_at)
  -- ATURAN BISNIS: Finalisasi atomic (refunds.succeeded, orders.refunded, restock + sold_count)
  if p_stage = 'confirmed' or (p_is_success and p_stage <> 'failed') then
    if v_refund.status = 'succeeded' then
      return jsonb_build_object(
        'order_id', p_order_id,
        'refund_id', v_refund.id,
        'result', 'ALREADY_SUCCEEDED_NO_OP',
        'status', 'succeeded',
        'order_status', 'refunded',
        'no_op', true
      );
    end if;

    v_finalize_res := public.finalize_refund(
      v_refund.id,
      true,
      p_gateway_refund_id,
      null,
      p_bank_confirmed_at
    );

    if p_event_key is not null then
      insert into public.payment_events (
        event_key, order_id, event_type, status, gateway, payload_summary
      ) values (
        p_event_key, p_order_id, 'refund', 'processed', 'midtrans', p_payload_summary
      ) on conflict (event_key) do update
      set status = excluded.status, processed_at = now();
    end if;

    return jsonb_build_object(
      'order_id', p_order_id,
      'refund_id', v_refund.id,
      'result', 'REFUND_CONFIRMED',
      'status', v_finalize_res->>'status',
      'order_status', v_finalize_res->>'order_status',
      'bank_confirmed_at', v_finalize_res->>'bank_confirmed_at',
      'already_finalized', coalesce((v_finalize_res->>'already_finalized')::boolean, false),
      'no_op', false
    );
  end if;

  -- TAHAP C: 'failed' (Penolakan definitif dari Payment Gateway / Bank)
  -- ATURAN BISNIS: refunds.failed, order tetap paid, stok tidak berubah!
  if p_stage = 'failed' or not p_is_success then
    if v_refund.status = 'succeeded' then
      return jsonb_build_object(
        'order_id', p_order_id,
        'refund_id', v_refund.id,
        'result', 'IGNORED_STALE_FAILURE_AFTER_SUCCESS',
        'status', 'succeeded',
        'order_status', 'refunded',
        'no_op', true
      );
    end if;

    if v_refund.status = 'failed' then
      return jsonb_build_object(
        'order_id', p_order_id,
        'refund_id', v_refund.id,
        'result', 'ALREADY_FAILED_NO_OP',
        'status', 'failed',
        'order_status', 'paid',
        'no_op', true
      );
    end if;

    v_finalize_res := public.finalize_refund(
      v_refund.id,
      false,
      null::text,
      p_failure_reason,
      null::timestamptz
    );

    if p_event_key is not null then
      insert into public.payment_events (
        event_key, order_id, event_type, status, gateway, payload_summary
      ) values (
        p_event_key, p_order_id, 'refund', 'processed', 'midtrans', p_payload_summary
      ) on conflict (event_key) do update
      set status = excluded.status, processed_at = now();
    end if;

    return jsonb_build_object(
      'order_id', p_order_id,
      'refund_id', v_refund.id,
      'result', 'REFUND_FAILED',
      'status', v_finalize_res->>'status',
      'order_status', v_finalize_res->>'order_status',
      'failure_reason', p_failure_reason,
      'already_finalized', coalesce((v_finalize_res->>'already_finalized')::boolean, false),
      'no_op', false
    );
  end if;

  return jsonb_build_object('order_id', p_order_id, 'result', 'NO_ACTION', 'no_op', true);
end;
$$;

-- Permissions
revoke execute on function public.handle_refund_webhook from public, anon;
grant execute on function public.handle_refund_webhook to authenticated, service_role;
revoke execute on function public.finalize_refund from public, anon;
grant execute on function public.finalize_refund to authenticated, service_role;
