-- =========================================================================
-- MIGRATION: 20261206000001_widen_monetary_cents_to_bigint.sql
-- Fix PostgreSQL 22003 (integer out of range) on checkout and large orders:
-- 1. Widen all monetary _cents and coupon value columns from int4 to bigint
-- 2. Update sync_price_cents() trigger cast from ::int to ::bigint
-- 3. Update create_order() local monetary variables to bigint and compute
--    percentage coupon discounts via ::numeric before division
-- 4. Widen p_refund_amount_cents to bigint in admin_review_return_request
--    and handle_refund_webhook while preserving exact security grants
-- =========================================================================

alter table public.products
  alter column price_cents type bigint;

alter table public.product_variants
  alter column price_cents type bigint;

alter table public.flash_deals
  alter column promo_price_cents type bigint;

alter table public.coupons
  alter column discount_value type bigint,
  alter column max_discount_cents type bigint,
  alter column min_purchase_cents type bigint;

alter table public.coupon_usages
  alter column discount_cents type bigint;

alter table public.orders
  alter column total_cents type bigint,
  alter column subtotal_cents type bigint,
  alter column discount_cents type bigint,
  alter column shipping_cost_cents type bigint;

alter table public.order_items
  alter column price_cents type bigint;

alter table public.refunds
  alter column amount_cents type bigint;

alter table public.return_requests
  alter column refund_amount_cents type bigint;

-- Trigger function: sync products.price_cents without int4 overflow
create or replace function public.sync_price_cents()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' or new.price is distinct from old.price then
    new.price_cents := round((new.price::numeric) * 100)::bigint;
  end if;
  return new;
end;
$$;

-- Checkout RPC: widen monetary accumulators and item prices to bigint
create or replace function public.create_order(
  p_items jsonb,
  p_address jsonb,
  p_idempotency_key text default null,
  p_request_hash text default null,
  p_coupon_code text default null,
  p_shipping_service text default 'reguler',
  p_courier_code text default null,
  p_coins_used bigint default 0
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order uuid;
  v_subtotal bigint := 0;
  v_discount bigint := 0;
  v_subtotal_after_coupon bigint := 0;
  v_max_coins bigint := 0;
  v_actual_coins_used bigint := 0;
  v_coins_discount_cents bigint := 0;
  v_total bigint := 0;
  r record;
  v_price bigint;
  v_stock int;
  v_variant_price bigint;
  v_variant_stock int;
  v_item_price bigint;
  v_flash_promo_price bigint;
  v_flash_deal_id uuid;
  v_existing_order uuid;
  v_existing_hash text;
  v_lock_key bigint;
  v_coupon record;
  v_coupon_id uuid := null;
  v_coupon_code text := null;
  v_user_usage_count int := 0;
  v_shipping_cost bigint := 0;
  v_shipping_service text := coalesce(lower(trim(p_shipping_service)), 'reguler');
  v_user_coins record;
  v_new_coin_balance bigint;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membuat pesanan';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  if p_idempotency_key is not null and p_idempotency_key <> '' then
    v_lock_key := ('x' || substr(md5(auth.uid()::text || ':' || p_idempotency_key), 1, 16))::bit(64)::bigint;
    perform pg_advisory_xact_lock(v_lock_key);

    select order_id, request_hash into v_existing_order, v_existing_hash
    from public.order_idempotency_keys
    where user_id = auth.uid() and idempotency_key = p_idempotency_key;

    if found then
      if p_request_hash is not null and v_existing_hash <> p_request_hash then
        raise exception 'IDEMPOTENCY_CONFLICT: Idempotency-Key "%" telah digunakan untuk transaksi dengan rincian berbeda', p_idempotency_key;
      end if;

      return v_existing_order;
    end if;
  end if;

  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  perform set_config('app.stock_change_reason', 'checkout', true);
  perform set_config('app.stock_change_order_id', v_order::text, true);

  for r in
    select product_id, qty, variant_id
    from jsonb_to_recordset(p_items) as (product_id bigint, qty int, variant_id uuid)
    order by product_id asc, variant_id nulls last
  loop
    if r.qty <= 0 then
      raise exception 'Kuantitas tidak valid untuk produk ID %', r.product_id;
    end if;

    select price_cents, stock into v_price, v_stock
    from public.products
    where id = r.product_id and deleted_at is null
    for update;

    if not found then
      raise exception 'Produk ID % tidak ditemukan atau sudah dihapus', r.product_id;
    end if;

    if v_stock < r.qty then
      raise exception 'Stok tidak mencukupi untuk produk ID % (sisa: %, diminta: %)', r.product_id, v_stock, r.qty;
    end if;

    v_item_price := v_price;

    if r.variant_id is not null then
      select price_cents, stock into v_variant_price, v_variant_stock
      from public.product_variants
      where id = r.variant_id and product_id = r.product_id and is_active = true and deleted_at is null
      for update;

      if not found then
        raise exception 'Varian ID % tidak valid untuk produk ID %', r.variant_id, r.product_id;
      end if;

      if v_variant_stock < r.qty then
        raise exception 'Stok varian tidak mencukupi untuk produk ID % (sisa: %, diminta: %)', r.product_id, v_variant_stock, r.qty;
      end if;

      if v_variant_price is not null and v_variant_price > 0 then
        v_item_price := v_variant_price;
      end if;

      update public.product_variants
      set stock = stock - r.qty,
          updated_at = now()
      where id = r.variant_id;
    end if;

    select promo_price_cents, id into v_flash_promo_price, v_flash_deal_id
    from public.flash_deals
    where product_id = r.product_id
      and is_active = true
      and starts_at <= now()
      and ends_at >= now()
      and (claimed + r.qty) <= quota
    for update;

    if found and v_flash_promo_price is not null and v_flash_promo_price > 0 then
      v_item_price := v_flash_promo_price;
      update public.flash_deals
      set claimed = claimed + r.qty
      where id = v_flash_deal_id;
    end if;

    update public.products
    set stock = stock - r.qty
    where id = r.product_id;

    insert into public.order_items (order_id, product_id, variant_id, qty, price_cents)
    values (v_order, r.product_id, r.variant_id, r.qty, v_item_price);

    v_subtotal := v_subtotal + (v_item_price * r.qty::bigint);
  end loop;

  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(trim(p_coupon_code))
      and is_active = true
      and deleted_at is null
    for update;

    if not found then
      raise exception 'Kupon promo "%" tidak ditemukan atau sudah tidak aktif', p_coupon_code;
    end if;

    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception 'Kupon promo "%" belum dapat digunakan', v_coupon.code;
    end if;

    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'Kupon promo "%" sudah kedaluwarsa', v_coupon.code;
    end if;

    if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then
      raise exception 'Kuota penggunaan kupon promo "%" telah habis', v_coupon.code;
    end if;

    if v_coupon.min_purchase_cents > 0 and v_subtotal < v_coupon.min_purchase_cents then
      raise exception 'Total belanja belum memenuhi syarat minimum kupon "%"', v_coupon.code;
    end if;

    if v_coupon.user_limit is not null and v_coupon.user_limit > 0 then
      select count(*) into v_user_usage_count
      from public.coupon_usages
      where user_id = auth.uid()
        and coupon_id = v_coupon.id
        and deleted_at is null;

      if v_user_usage_count >= v_coupon.user_limit then
        raise exception 'Anda telah mencapai batas maksimal penggunaan kupon "%"', v_coupon.code;
      end if;
    end if;

    if v_coupon.discount_type = 'percentage' then
      v_discount := floor((v_subtotal::numeric * v_coupon.discount_value::numeric) / 100)::bigint;
      if v_coupon.max_discount_cents is not null and v_discount > v_coupon.max_discount_cents then
        v_discount := v_coupon.max_discount_cents;
      end if;
    else
      v_discount := v_coupon.discount_value;
    end if;

    if v_discount > v_subtotal then
      v_discount := v_subtotal;
    end if;

    update public.coupons
    set usage_count = usage_count + 1, updated_at = now()
    where id = v_coupon.id;

    insert into public.coupon_usages (coupon_id, user_id, order_id, discount_cents)
    values (v_coupon.id, auth.uid(), v_order, v_discount);

    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;

    update public.user_coupons
    set status = 'used',
        used_at = now(),
        order_id = v_order,
        updated_at = now()
    where user_id = auth.uid()
      and coupon_id = v_coupon_id
      and status = 'claimed';

    if not found then
      insert into public.user_coupons (
        user_id, coupon_id, status, claimed_at, used_at, order_id
      ) values (
        auth.uid(), v_coupon_id, 'used', now(), now(), v_order
      )
      on conflict (user_id, coupon_id) do update set
        status = 'used',
        used_at = now(),
        order_id = v_order,
        updated_at = now();
    end if;
  end if;

  v_subtotal_after_coupon := greatest(0, v_subtotal - v_discount);

  if p_coins_used is not null and p_coins_used > 0 then
    select * into v_user_coins
    from public.user_coins
    where user_id = auth.uid()
    for update;

    if not found or v_user_coins.balance_coins < p_coins_used then
      raise exception 'Saldo koin tidak mencukupi (Saldo: %, Diminta: %)',
        coalesce(v_user_coins.balance_coins, 0), p_coins_used;
    end if;

    v_max_coins := floor((v_subtotal_after_coupon * 0.5) / 100);
    v_actual_coins_used := least(p_coins_used, v_max_coins);
    v_coins_discount_cents := v_actual_coins_used * 100;

    if v_actual_coins_used > 0 then
      update public.user_coins
      set balance_coins = balance_coins - v_actual_coins_used,
          lifetime_spent_coins = lifetime_spent_coins + v_actual_coins_used,
          updated_at = now()
      where user_id = auth.uid()
      returning balance_coins into v_new_coin_balance;

      insert into public.coin_transactions (
        user_id, order_id, amount_coins, type, description, balance_after
      )
      values (
        auth.uid(),
        v_order,
        v_actual_coins_used,
        'spent',
        'Pemotongan ' || v_actual_coins_used::text || ' Koin saat checkout pesanan',
        v_new_coin_balance
      );
    end if;
  end if;

  if v_shipping_service = 'express' then
    v_shipping_cost := 3000000;
  elsif v_shipping_service = 'instant' then
    v_shipping_cost := 4500000;
  elsif v_shipping_service = 'cargo' then
    v_shipping_cost := 2500000;
  else
    v_shipping_service := 'reguler';
    if v_subtotal >= 50000000 then
      v_shipping_cost := 0;
    else
      v_shipping_cost := 1500000;
    end if;
  end if;

  v_total := greatest(0, v_subtotal_after_coupon - v_coins_discount_cents) + v_shipping_cost;

  update public.orders
  set total_cents = v_total,
      subtotal_cents = v_subtotal,
      discount_cents = v_discount,
      coupon_id = v_coupon_id,
      coupon_code = v_coupon_code,
      shipping_service = v_shipping_service,
      shipping_cost_cents = v_shipping_cost,
      courier_code = p_courier_code,
      coins_used = v_actual_coins_used,
      coins_discount_cents = v_coins_discount_cents,
      updated_at = now()
  where id = v_order;

  if p_idempotency_key is not null and p_idempotency_key <> '' then
    insert into public.order_idempotency_keys (user_id, idempotency_key, order_id, request_hash)
    values (auth.uid(), p_idempotency_key, v_order, p_request_hash);
  end if;

  return v_order;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text, text, text, text, text, bigint) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, text, text, text, text, text, bigint) to authenticated, service_role;

-- RMA review RPC: accept bigint refund amounts cleanly without overload ambiguity
drop function if exists public.admin_review_return_request(uuid, text, text, text, text, int, boolean);

create or replace function public.admin_review_return_request(
  p_return_id uuid,
  p_status text,
  p_admin_notes text default null,
  p_replacement_courier text default null,
  p_replacement_tracking_number text default null,
  p_refund_amount_cents bigint default null,
  p_restock_inventory boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket public.return_requests%rowtype;
  v_order public.orders%rowtype;
  v_updated public.return_requests%rowtype;
  v_now timestamptz := now();
  v_restocked_at timestamptz;
  v_resolved_at timestamptz;
  v_refund_cents bigint;
  v_refund_key text;
  v_new_coin_balance bigint;
  v_clawback_coins bigint := 0;
  r record;
begin
  if (auth.uid() is not null and not public.is_admin())
     or (auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon')) then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang dapat meninjau tiket retur';
  end if;

  if p_status not in ('approved', 'rejected', 'item_received', 'completed') then
    raise exception 'INVALID_RETURN_STATUS: Status keputusan retur tidak valid: %', p_status;
  end if;

  select * into v_ticket
  from public.return_requests
  where id = p_return_id and deleted_at is null
  for update;

  if not found then
    raise exception 'RETURN_NOT_FOUND: Tiket retur tidak ditemukan';
  end if;

  if v_ticket.status in ('rejected', 'cancelled') and v_ticket.status <> p_status then
    raise exception 'INVALID_RETURN_TRANSITION: Tiket retur dalam status % tidak dapat diubah lagi', v_ticket.status;
  end if;

  if v_ticket.status = 'completed' and p_status <> 'completed' then
    raise exception 'INVALID_RETURN_TRANSITION: Tiket retur yang sudah selesai tidak dapat dikembalikan ke %', p_status;
  end if;

  select * into v_order
  from public.orders
  where id = v_ticket.order_id
  for update;

  v_restocked_at := v_ticket.restocked_at;
  if p_status = 'completed' and p_restock_inventory and v_ticket.restocked_at is null then
    perform set_config('app.stock_change_reason', 'return_restock', true);
    perform set_config('app.stock_change_order_id', v_ticket.order_id::text, true);
    perform set_config('app.stock_change_notes', 'Restock retur #' || substr(v_ticket.id::text, 1, 8), true);

    for r in
      select product_id, variant_id, qty
      from public.order_items
      where order_id = v_ticket.order_id
      order by product_id asc, variant_id nulls last
    loop
      update public.products
      set stock = stock + r.qty,
          sold_count = greatest(0, coalesce(sold_count, 0) - r.qty)
      where id = r.product_id;

      if r.variant_id is not null then
        update public.product_variants
        set stock = stock + r.qty,
            updated_at = v_now
        where id = r.variant_id;
      end if;
    end loop;

    v_restocked_at := v_now;
  end if;

  if p_status = 'completed' and v_ticket.status <> 'completed' and v_ticket.solution_type = 'refund' and v_order.id is not null then
    v_refund_cents := coalesce(p_refund_amount_cents, v_ticket.refund_amount_cents, v_order.total_cents);
    v_refund_key := 'rma-refund-' || v_ticket.id::text;

    if v_refund_cents > 0 then
      insert into public.refunds (
        order_id,
        user_id,
        amount_cents,
        currency,
        gateway,
        status,
        idempotency_key,
        reason,
        processed_at,
        bank_confirmed_at
      ) values (
        v_order.id,
        v_order.user_id,
        v_refund_cents,
        'IDR',
        'rma_settlement',
        'succeeded',
        v_refund_key,
        coalesce(nullif(trim(p_admin_notes), ''), 'Penyelesaian retur dana #' || substr(v_ticket.id::text, 1, 8)),
        v_now,
        v_now
      )
      on conflict (idempotency_key) do nothing;
    end if;

    if coalesce(v_order.coins_used, 0) > 0 and not exists (
      select 1 from public.coin_transactions
      where order_id = v_order.id and type in ('refunded_order', 'cancelled_order')
    ) then
      update public.user_coins
      set balance_coins = balance_coins + v_order.coins_used,
          lifetime_spent_coins = greatest(0, lifetime_spent_coins - v_order.coins_used),
          updated_at = v_now
      where user_id = v_order.user_id
      returning balance_coins into v_new_coin_balance;

      if found then
        insert into public.coin_transactions (
          user_id, type, amount_coins, balance_after, order_id, description
        ) values (
          v_order.user_id,
          'refunded_order',
          v_order.coins_used,
          v_new_coin_balance,
          v_order.id,
          'Pengembalian ' || v_order.coins_used::text || ' Koin dari retur pesanan #' || substr(v_order.id::text, 1, 8)
        );
      end if;
    end if;

    if coalesce(v_order.coins_earned, 0) > 0 and exists (
      select 1 from public.coin_transactions
      where order_id = v_order.id and type = 'earned'
    ) and not exists (
      select 1 from public.coin_transactions
      where order_id = v_order.id
        and type = 'spent'
        and description like 'Penyesuaian cashback retur%'
    ) then
      select balance_coins into v_new_coin_balance
      from public.user_coins
      where user_id = v_order.user_id
      for update;

      if found and v_new_coin_balance > 0 then
        v_clawback_coins := least(v_new_coin_balance, v_order.coins_earned);

        update public.user_coins
        set balance_coins = balance_coins - v_clawback_coins,
            lifetime_earned_coins = greatest(0, lifetime_earned_coins - v_clawback_coins),
            updated_at = v_now
        where user_id = v_order.user_id
        returning balance_coins into v_new_coin_balance;

        if v_clawback_coins > 0 then
          insert into public.coin_transactions (
            user_id, type, amount_coins, balance_after, order_id, description
          ) values (
            v_order.user_id,
            'spent',
            v_clawback_coins,
            v_new_coin_balance,
            v_order.id,
            'Penyesuaian cashback retur #' || substr(v_ticket.id::text, 1, 8)
          );
        end if;
      end if;
    end if;
  end if;

  v_resolved_at := case
    when p_status in ('completed', 'rejected') then coalesce(v_ticket.resolved_at, v_now)
    else v_ticket.resolved_at
  end;

  update public.return_requests
  set status = p_status,
      admin_notes = coalesce(nullif(trim(p_admin_notes), ''), admin_notes),
      replacement_courier = coalesce(nullif(trim(p_replacement_courier), ''), replacement_courier),
      replacement_tracking_number = coalesce(nullif(trim(p_replacement_tracking_number), ''), replacement_tracking_number),
      refund_amount_cents = coalesce(p_refund_amount_cents, refund_amount_cents),
      restocked_at = v_restocked_at,
      resolved_at = v_resolved_at,
      updated_at = v_now
  where id = p_return_id
  returning * into v_updated;

  return to_jsonb(v_updated);
end;
$$;

revoke all on function public.admin_review_return_request(uuid, text, text, text, text, bigint, boolean) from public, anon;
grant execute on function public.admin_review_return_request(uuid, text, text, text, text, bigint, boolean) to authenticated, service_role;

-- Refund webhook RPC: accept bigint amounts while preserving strict service_role access
drop function if exists public.handle_refund_webhook(uuid, text, text, boolean, text, text, jsonb, text, timestamptz, int);

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
  p_refund_amount_cents bigint default null
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

  if v_order.status = 'refunded' then
    if p_event_key is not null then
      insert into public.payment_events (
        event_key, order_id, event_type, status, gateway, payload_summary
      ) values (
        p_event_key, p_order_id, 'refund', 'ignored', 'midtrans', p_payload_summary
      ) on conflict (event_key) do nothing;
    end if;

    if p_stage = 'failed' or not p_is_success then
      return jsonb_build_object(
        'order_id', p_order_id,
        'result', 'IGNORED_STALE_FAILURE_AFTER_REFUND',
        'status', 'refunded',
        'no_op', true
      );
    else
      return jsonb_build_object(
        'order_id', p_order_id,
        'result', 'ALREADY_REFUNDED_NO_OP',
        'status', 'refunded',
        'no_op', true
      );
    end if;
  end if;

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

  if v_refund.id is null then
    select * into v_refund
    from public.refunds
    where order_id = p_order_id and status = 'pending'
    order by created_at desc
    limit 1
    for update;
  end if;

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

  if p_stage = 'confirmed' then
    if not p_is_success then
      p_stage := 'failed';
    else
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

  if p_stage = 'failed' then
    if v_refund.status = 'succeeded' then
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

revoke all on function public.handle_refund_webhook(
  uuid, text, text, boolean, text, text, jsonb, text, timestamptz, bigint
) from public, anon, authenticated;

grant execute on function public.handle_refund_webhook(
  uuid, text, text, boolean, text, text, jsonb, text, timestamptz, bigint
) to service_role;
