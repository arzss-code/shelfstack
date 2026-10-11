-- =========================================================================
-- Sprint 5 / Task 05.2: Refund Webhook Identity Correlation & Amount Validation Hardening
-- 1. Hardened handle_refund_webhook with strict refund identity correlation
-- 2. Amount validation against local refund record (amount_cents integer comparison)
-- 3. Strict rejection of unknown/unmatched refund identifiers without touching pending refunds
-- =========================================================================

drop function if exists public.handle_refund_webhook(uuid, text, text, boolean, text, text, jsonb, text, timestamptz);
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
  p_bank_confirmed_at timestamptz default null,
  p_refund_amount_cents int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order record;
  v_refund public.refunds%rowtype;
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

  -- =======================================================================
  -- 5. REFUND IDENTITY CORRELATION (Matching ketat berdasarkan identifier)
  -- =======================================================================
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

  -- ATURAN IDENTITAS: Jika webhook memberikan identifier (refund_key atau gateway_refund_id)
  -- tetapi TIDAK ADA record refund lokal yang cocok:
  -- STOP! Jangan pernah menyentuh atau memfinalisasi pending refund lain pada order ini!
  if v_refund.id is null and (p_refund_key is not null or p_gateway_refund_id is not null) then
    if p_event_key is not null then
      insert into public.payment_events (
        event_key, order_id, event_type, status, gateway, payload_summary
      ) values (
        p_event_key, p_order_id, 'refund', 'ignored', 'midtrans', p_payload_summary
      ) on conflict (event_key) do nothing;
    end if;

    return jsonb_build_object(
      'order_id', p_order_id,
      'result', 'REFUND_IDENTITY_MISMATCH',
      'refund_key', p_refund_key,
      'gateway_refund_id', p_gateway_refund_id,
      'no_op', true,
      'message', 'Identifier refund pada webhook tidak cocok dengan record refund lokal mana pun untuk pesanan ini'
    );
  end if;

  -- Fallback HANYA bila webhook tidak menyertakan identifier sama sekali (legacy flat event)
  if v_refund.id is null then
    select * into v_refund
    from public.refunds
    where order_id = p_order_id and status = 'pending'
    order by created_at desc
    limit 1
    for update;
  end if;

  -- Jika belum ada record refund sama sekali di database untuk order ini:
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
      coalesce(p_refund_amount_cents, v_order.total_cents),
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
  -- 6. AMOUNT VALIDATION (Validasi nominal rupiah integer cents)
  -- =======================================================================
  if p_refund_amount_cents is not null and p_refund_amount_cents <> v_refund.amount_cents then
    if p_event_key is not null then
      insert into public.payment_events (
        event_key, order_id, event_type, status, gateway, payload_summary
      ) values (
        p_event_key, p_order_id, 'refund', 'failed', 'midtrans', p_payload_summary
      ) on conflict (event_key) do nothing;
    end if;

    return jsonb_build_object(
      'order_id', p_order_id,
      'refund_id', v_refund.id,
      'result', 'REFUND_AMOUNT_MISMATCH',
      'expected_amount_cents', v_refund.amount_cents,
      'received_amount_cents', p_refund_amount_cents,
      'no_op', true,
      'message', 'Nominal refund pada webhook (' || p_refund_amount_cents || ') tidak cocok dengan record lokal (' || v_refund.amount_cents || ')'
    );
  end if;

  -- =======================================================================
  -- 7. PISAHKAN LOGIKA BERDASARKAN TAHAP KONFIRMASI (STAGE)
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
      'gateway_refund_id', v_refund.gateway_refund_id,
      'message', 'Permintaan refund diterima oleh gateway, menunggu konfirmasi bank (bank_confirmed_at)',
      'no_op', false
    );
  end if;

  -- TAHAP B: 'confirmed' (Konfirmasi resmi dari bank telah tiba)
  if p_stage = 'confirmed' then
    if not p_is_success then
      -- Jika payload menyatakan bukan sukses, route ke gagal
      p_stage := 'failed';
    else
      -- Finalisasi refund dengan bank_confirmed_at valid
      v_finalize_res := public.finalize_refund(
        v_refund.id,
        true,
        coalesce(p_gateway_refund_id, v_refund.gateway_refund_id),
        null::text,
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
        'already_finalized', coalesce((v_finalize_res->>'already_finalized')::boolean, false),
        'bank_confirmed_at', v_finalize_res->>'bank_confirmed_at',
        'no_op', false
      );
    end if;
  end if;

  -- TAHAP C: 'failed' (Penolakan definitif dari payment gateway)
  if p_stage = 'failed' then
    if v_refund.status = 'succeeded' then
      -- Stale failure: Refund sudah berhasil, jangan ubah
      return jsonb_build_object(
        'order_id', p_order_id,
        'refund_id', v_refund.id,
        'result', 'IGNORED_STALE_FAILURE_AFTER_REFUND',
        'status', 'succeeded',
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
