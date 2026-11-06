-- =========================================================================
-- MIGRATION: 20261130000001_order_cancellation_parity_and_expiry_hardening.sql
-- Purpose:
-- 1. Enforce soft delete (deleted_at) on public.coupon_usages instead of hard DELETE.
-- 2. Restore canonical state-machine context (app.order_transition_source), admin
--    authorization support, and service_role grants on public.cancel_order.
-- 3. Unify atomic stock restock, coupon quota/wallet restoration, loyalty coin
--    refund (coins_used), and customer notifications across all three canonical
--    order cancellation paths:
--      a) public.cancel_order
--      b) public.handle_payment_webhook (gateway expire & BullMQ auto_timeout)
--      c) public.transition_order_status (admin cancellation)
-- =========================================================================

-- =========================================================================
-- 1. SOFT DELETE SUPPORT ON PUBLIC.COUPON_USAGES
-- =========================================================================
alter table public.coupon_usages
  add column if not exists deleted_at timestamptz default null;

alter table public.coupon_usages
  drop constraint if exists uq_coupon_user_order;

create unique index if not exists idx_coupon_usages_active_unique
  on public.coupon_usages (user_id, coupon_id, order_id)
  where deleted_at is null;

create index if not exists idx_coupon_usages_user_coupon_active
  on public.coupon_usages (user_id, coupon_id)
  where deleted_at is null;


-- =========================================================================
-- 2. UPDATE RPC CREATE_ORDER TO FILTER ACTIVE COUPON_USAGES (DELETED_AT IS NULL)
-- =========================================================================
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
  v_subtotal int := 0;
  v_discount int := 0;
  v_subtotal_after_coupon int := 0;
  v_max_coins bigint := 0;
  v_actual_coins_used bigint := 0;
  v_coins_discount_cents bigint := 0;
  v_total int := 0;
  r record;
  v_price int;
  v_stock int;
  v_existing_order uuid;
  v_existing_hash text;
  v_lock_key bigint;
  v_coupon record;
  v_coupon_id uuid := null;
  v_coupon_code text := null;
  v_user_usage_count int := 0;
  v_shipping_cost int := 0;
  v_shipping_service text := coalesce(lower(trim(p_shipping_service)), 'reguler');
  v_user_coins record;
  v_new_coin_balance bigint;
begin
  -- 1. Verify caller authentication
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membuat pesanan';
  end if;

  -- 2. Validate non-empty cart
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  -- 3. Idempotency check with deterministic transaction advisory lock
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

  -- 4. Initialize draft order
  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  perform set_config('app.stock_change_reason', 'checkout', true);
  perform set_config('app.stock_change_order_id', v_order::text, true);

  -- 5. Lock product rows in deterministic order (ORDER BY product_id ASC FOR UPDATE)
  for r in
    select product_id, qty
    from jsonb_to_recordset(p_items) as (product_id bigint, qty int)
    order by product_id asc
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

    update public.products
    set stock = stock - r.qty
    where id = r.product_id;

    insert into public.order_items (order_id, product_id, qty, price_cents)
    values (v_order, r.product_id, r.qty, v_price);

    v_subtotal := v_subtotal + (v_price * r.qty);
  end loop;

  -- 6. Validate and calculate coupon discount if provided
  if p_coupon_code is not null and trim(p_coupon_code) <> '' then
    select * into v_coupon
    from public.coupons
    where upper(code) = upper(trim(p_coupon_code))
      and deleted_at is null
      and is_active = true
    for update;

    if not found then
      raise exception 'Kupon "%" tidak ditemukan atau sudah tidak aktif', p_coupon_code;
    end if;

    if v_coupon.starts_at is not null and now() < v_coupon.starts_at then
      raise exception 'Kupon "%" belum dapat digunakan', p_coupon_code;
    end if;

    if v_coupon.expires_at is not null and now() > v_coupon.expires_at then
      raise exception 'Kupon "%" sudah kedaluwarsa', p_coupon_code;
    end if;

    if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then
      raise exception 'Kuota kupon "%" telah habis', p_coupon_code;
    end if;

    if v_subtotal < v_coupon.min_purchase_cents then
      raise exception 'Minimum pembelian untuk kupon "%" adalah Rp %',
        p_coupon_code, (v_coupon.min_purchase_cents / 100);
    end if;

    if v_coupon.user_limit is not null then
      select count(*) into v_user_usage_count
      from public.coupon_usages
      where coupon_id = v_coupon.id
        and user_id = auth.uid()
        and deleted_at is null;

      if v_user_usage_count >= v_coupon.user_limit then
        raise exception 'Anda telah mencapai batas maksimum pemakaian kupon "%"', p_coupon_code;
      end if;
    end if;

    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;

    if v_coupon.discount_type = 'percentage' then
      v_discount := floor((v_subtotal * v_coupon.discount_value) / 100);
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
    set usage_count = usage_count + 1,
        updated_at = now()
    where id = v_coupon.id;

    insert into public.coupon_usages (
      coupon_id, user_id, order_id, discount_cents
    ) values (
      v_coupon.id, auth.uid(), v_order, v_discount
    );

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

  -- 7. Validate and apply loyalty coins (max 50% of post-coupon subtotal)
  if p_coins_used > 0 then
    v_max_coins := floor((v_subtotal_after_coupon * 0.5) / 100);

    select * into v_user_coins
    from public.user_coins
    where user_id = auth.uid()
    for update;

    if not found or v_user_coins.balance_coins < p_coins_used then
      raise exception 'Saldo koin tidak mencukupi (Saldo: %, Diminta: %)',
        coalesce(v_user_coins.balance_coins, 0), p_coins_used;
    end if;

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
        user_id, type, amount_coins, balance_after, order_id, description
      ) values (
        auth.uid(),
        'spent',
        v_actual_coins_used,
        v_new_coin_balance,
        v_order,
        'Pemotongan ' || v_actual_coins_used || ' Koin saat checkout pesanan'
      );
    end if;
  end if;

  -- 8. Calculate shipping cost
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

  v_total := greatest(0, v_subtotal_after_coupon - v_coins_discount_cents + v_shipping_cost);

  -- 9. Finalize order totals
  update public.orders
  set total_cents = v_total,
      subtotal_cents = v_subtotal,
      discount_cents = v_discount,
      coupon_id = v_coupon_id,
      coupon_code = v_coupon_code,
      coins_used = v_actual_coins_used,
      coins_discount_cents = v_coins_discount_cents,
      shipping_service = v_shipping_service,
      courier_code = p_courier_code,
      shipping_cost_cents = v_shipping_cost,
      updated_at = now()
  where id = v_order;

  -- 10. Persist idempotency key record when present
  if p_idempotency_key is not null and p_idempotency_key <> '' then
    insert into public.order_idempotency_keys (
      user_id, idempotency_key, order_id, request_hash
    ) values (
      auth.uid(), p_idempotency_key, v_order, p_request_hash
    );
  end if;

  return v_order;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text, text, text, text, text, bigint) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, text, text, text, text, text, bigint) to authenticated, service_role;


-- =========================================================================
-- 3. HARDENED RPC: CANCEL_ORDER (CONTEXT SOURCE + SOFT DELETE + COIN/VOUCHER ROLLBACK)
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
  v_new_coin_balance bigint;
begin
  if auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon') then
    raise exception 'Unauthorized: Sesi login tidak ditemukan';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pesanan tidak ditemukan';
  end if;

  if auth.uid() is not null and v_order.user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Forbidden: Hanya pemilik pesanan atau administrator yang dapat membatalkan pesanan';
  end if;

  if v_order.status <> 'pending' then
    raise exception 'Hanya pesanan pending yang dapat dibatalkan (status saat ini: %)', v_order.status;
  end if;

  -- Trusted state-machine transition context & stock ledger context
  perform set_config('app.order_transition_source', 'cancel_order_rpc', true);
  perform set_config('app.stock_change_reason', 'order_cancellation', true);
  perform set_config('app.stock_change_order_id', p_order_id::text, true);

  -- 1. Restock items in deterministic product_id order
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

  -- 2. Soft-delete coupon usage and restore coupon quota & user wallet
  if v_order.coupon_id is not null then
    update public.coupon_usages
    set deleted_at = now()
    where order_id = p_order_id
      and deleted_at is null;

    if found then
      update public.coupons
      set usage_count = greatest(0, usage_count - 1),
          updated_at = now()
      where id = v_order.coupon_id;

      update public.user_coupons
      set status = 'claimed',
          used_at = null,
          order_id = null,
          updated_at = now()
      where order_id = p_order_id;
    end if;
  end if;

  -- 3. Refund loyalty coins idempotently if coins were used
  if coalesce(v_order.coins_used, 0) > 0 and not exists (
    select 1 from public.coin_transactions
    where order_id = p_order_id and type = 'cancelled_order'
  ) then
    update public.user_coins
    set balance_coins = balance_coins + v_order.coins_used,
        lifetime_spent_coins = greatest(0, lifetime_spent_coins - v_order.coins_used),
        updated_at = now()
    where user_id = v_order.user_id
    returning balance_coins into v_new_coin_balance;

    if found then
      insert into public.coin_transactions (
        user_id, type, amount_coins, balance_after, order_id, description
      ) values (
        v_order.user_id,
        'cancelled_order',
        v_order.coins_used,
        v_new_coin_balance,
        p_order_id,
        'Pengembalian ' || v_order.coins_used || ' Koin dari pembatalan pesanan'
      );
    end if;
  end if;

  -- 4. Transition order state to cancelled
  update public.orders
  set
    status = 'cancelled',
    cancelled_at = coalesce(cancelled_at, now()),
    cancellation_reason = coalesce(nullif(trim(p_reason), ''), 'Dibatalkan oleh pelanggan'),
    updated_at = now()
  where id = p_order_id;

  -- 5. Record audit log
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
      'Pesanan dibatalkan: ' || coalesce(p_reason, 'Dibatalkan oleh pelanggan'),
      jsonb_build_object('order_id', p_order_id, 'status', v_order.status),
      jsonb_build_object('order_id', p_order_id, 'status', 'cancelled', 'reason', p_reason)
    );
  exception when others then
    null;
  end;

  return true;
end;
$$;

revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated, service_role;


-- =========================================================================
-- 4. HARDENED RPC: HANDLE_PAYMENT_WEBHOOK (EXPIRY & GATEWAY CANCEL PARITY)
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
  v_order record;
  v_current_status text;
  v_cancel_reason text;
  v_new_coin_balance bigint;
  r record;
begin
  -- 1. Lock order row exclusively FOR UPDATE
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return 'ORDER_NOT_FOUND';
  end if;

  v_current_status := v_order.status;

  -- 2. Terminal refunded state guard
  if v_current_status = 'refunded' then
    return 'IGNORED_ORDER_ALREADY_REFUNDED';
  end if;

  -- 3. Progressive / paid state guard
  if v_current_status in ('paid', 'shipped', 'completed') then
    if p_target_status = 'cancelled' then
      return 'IGNORED_STALE_CANCEL_ON_PAID_ORDER';
    end if;

    if p_target_status = 'paid' then
      return 'NO_CHANGE_ALREADY_' || upper(v_current_status);
    end if;

    return 'IGNORED_ORDER_ALREADY_PROGRESSING';
  end if;

  -- 4. Already cancelled state guard (phantom stock & late payment protection)
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

  -- 5. Canonical transitions from 'pending'
  if v_current_status = 'pending' then
    if p_target_status = 'paid' then
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
      perform set_config('app.order_transition_source', 'payment_webhook', true);
      perform set_config(
        'app.stock_change_reason',
        case when p_payment_type = 'auto_timeout' then 'order_expiry_restock' else 'webhook_expire_restock' end,
        true
      );
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

      -- 5a. Restock items in deterministic product_id order
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

      -- 5b. Soft-delete coupon usage and restore coupon quota & user wallet
      if v_order.coupon_id is not null then
        update public.coupon_usages
        set deleted_at = now()
        where order_id = p_order_id
          and deleted_at is null;

        if found then
          update public.coupons
          set usage_count = greatest(0, usage_count - 1),
              updated_at = now()
          where id = v_order.coupon_id;

          update public.user_coupons
          set status = 'claimed',
              used_at = null,
              order_id = null,
              updated_at = now()
          where order_id = p_order_id;
        end if;
      end if;

      -- 5c. Refund loyalty coins idempotently if coins were used
      if coalesce(v_order.coins_used, 0) > 0 and not exists (
        select 1 from public.coin_transactions
        where order_id = p_order_id and type = 'cancelled_order'
      ) then
        update public.user_coins
        set balance_coins = balance_coins + v_order.coins_used,
            lifetime_spent_coins = greatest(0, lifetime_spent_coins - v_order.coins_used),
            updated_at = now()
        where user_id = v_order.user_id
        returning balance_coins into v_new_coin_balance;

        if found then
          insert into public.coin_transactions (
            user_id, type, amount_coins, balance_after, order_id, description
          ) values (
            v_order.user_id,
            'cancelled_order',
            v_order.coins_used,
            v_new_coin_balance,
            p_order_id,
            case
              when p_payment_type = 'auto_timeout'
                then 'Pengembalian ' || v_order.coins_used || ' Koin dari pesanan kedaluwarsa otomatis'
              else 'Pengembalian ' || v_order.coins_used || ' Koin dari pembatalan pembayaran'
            end
          );
        end if;
      end if;

      v_cancel_reason := case
        when p_payment_type = 'auto_timeout'
          then 'Dibatalkan otomatis karena batas waktu pembayaran berakhir'
        else 'Dibatalkan atau kedaluwarsa oleh Payment Gateway'
      end;

      update public.orders
      set
        status = 'cancelled',
        cancelled_at = coalesce(cancelled_at, now()),
        cancellation_reason = v_cancel_reason,
        updated_at = now()
      where id = p_order_id;

      -- 5d. Dispatch in-app notification for automated expiry timeout
      if p_payment_type = 'auto_timeout' then
        begin
          insert into public.notifications (
            user_id,
            title,
            message,
            type,
            reference_id,
            reference_url,
            is_read
          ) values (
            v_order.user_id,
            'Pesanan Kedaluwarsa',
            'Pesanan ' || p_order_id::text || ' dibatalkan otomatis karena batas waktu pembayaran berakhir. Stok, kupon, dan koin yang digunakan telah dikembalikan.',
            'order_cancelled',
            p_order_id::text,
            '/orders/' || p_order_id::text,
            false
          );
        exception when others then
          null;
        end;
      end if;

      return 'CANCELLED_SUCCESS';
    end if;
  end if;

  return 'NO_CHANGE';
end;
$$;

revoke all on function public.handle_payment_webhook(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.handle_payment_webhook(uuid, text, text, text) to service_role;


-- =========================================================================
-- 5. HARDENED RPC: TRANSITION_ORDER_STATUS (ADMIN CANCEL PARITY + COIN REWARD)
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
  v_earned_coins bigint := 0;
  v_new_coin_balance bigint := 0;
  v_admin_reason text;
begin
  if (auth.uid() is not null and not public.is_admin())
     or (auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon')) then
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

  perform set_config('app.order_transition_source', 'admin_transition_rpc', true);

  if v_order.status = 'pending' then
    if p_target_status = 'paid' then
      raise exception 'ADMIN_PAYMENT_OVERRIDE_DISABLED: Perubahan status dari "pending" ke "paid" oleh admin dinonaktifkan. Status paid hanya dapat ditetapkan melalui konfirmasi resmi payment gateway (Midtrans).';
    elsif p_target_status = 'cancelled' then
      perform set_config('app.stock_change_reason', 'admin_order_cancellation', true);
      perform set_config('app.stock_change_order_id', p_order_id::text, true);

      -- Restock items in deterministic product_id order
      for r in
        select product_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc
      loop
        update public.products set stock = stock + r.qty where id = r.product_id;
      end loop;

      -- Soft-delete coupon usage and restore coupon quota & user wallet
      if v_order.coupon_id is not null then
        update public.coupon_usages
        set deleted_at = now()
        where order_id = p_order_id
          and deleted_at is null;

        if found then
          update public.coupons
          set usage_count = greatest(0, usage_count - 1),
              updated_at = now()
          where id = v_order.coupon_id;

          update public.user_coupons
          set status = 'claimed',
              used_at = null,
              order_id = null,
              updated_at = now()
          where order_id = p_order_id;
        end if;
      end if;

      -- Refund loyalty coins idempotently if coins were used
      if coalesce(v_order.coins_used, 0) > 0 and not exists (
        select 1 from public.coin_transactions
        where order_id = p_order_id and type = 'cancelled_order'
      ) then
        update public.user_coins
        set balance_coins = balance_coins + v_order.coins_used,
            lifetime_spent_coins = greatest(0, lifetime_spent_coins - v_order.coins_used),
            updated_at = now()
        where user_id = v_order.user_id
        returning balance_coins into v_new_coin_balance;

        if found then
          insert into public.coin_transactions (
            user_id, type, amount_coins, balance_after, order_id, description
          ) values (
            v_order.user_id,
            'cancelled_order',
            v_order.coins_used,
            v_new_coin_balance,
            p_order_id,
            'Pengembalian ' || v_order.coins_used || ' Koin dari pembatalan pesanan oleh Administrator'
          );
        end if;
      end if;

      v_admin_reason := coalesce(nullif(trim(p_reason), ''), 'Dibatalkan oleh Administrator');

      update public.orders
      set status = 'cancelled',
          cancelled_at = coalesce(cancelled_at, now()),
          cancellation_reason = v_admin_reason,
          updated_at = now()
      where id = p_order_id;

      begin
        insert into public.notifications (
          user_id,
          title,
          message,
          type,
          reference_id,
          reference_url,
          is_read
        ) values (
          v_order.user_id,
          'Pesanan Dibatalkan',
          'Pesanan ' || p_order_id::text || ' telah dibatalkan. Alasan: ' || v_admin_reason,
          'order_cancelled',
          p_order_id::text,
          '/orders/' || p_order_id::text,
          false
        );
      exception when others then
        null;
      end;
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
      if coalesce(v_order.coins_earned, 0) = 0 then
        v_earned_coins := greatest(0, floor(
          (coalesce(v_order.subtotal_cents, v_order.total_cents) - coalesce(v_order.discount_cents, 0) - coalesce(v_order.coins_discount_cents, 0)) * 0.01 / 100
        ));

        if v_earned_coins > 0 then
          insert into public.user_coins (
            user_id, balance_coins, lifetime_earned_coins, lifetime_spent_coins
          ) values (
            v_order.user_id, v_earned_coins, v_earned_coins, 0
          )
          on conflict (user_id) do update set
            balance_coins = public.user_coins.balance_coins + v_earned_coins,
            lifetime_earned_coins = public.user_coins.lifetime_earned_coins + v_earned_coins,
            updated_at = now()
          returning balance_coins into v_new_coin_balance;

          insert into public.coin_transactions (
            user_id, type, amount_coins, balance_after, order_id, description
          ) values (
            v_order.user_id,
            'earned',
            v_earned_coins,
            v_new_coin_balance,
            p_order_id,
            'Cashback ' || v_earned_coins || ' Koin dari penyelesaian pesanan'
          );
        end if;
      end if;

      update public.orders
      set status = 'completed',
          coins_earned = case when coalesce(v_order.coins_earned, 0) = 0 then v_earned_coins else coins_earned end,
          completed_at = coalesce(completed_at, now()),
          updated_at = now()
      where id = p_order_id;
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
    'coins_earned', v_earned_coins,
    'message', 'Status pesanan berhasil diperbarui menjadi ' || p_target_status
  );
end;
$$;

revoke all on function public.transition_order_status(uuid, text, text) from public, anon;
grant execute on function public.transition_order_status(uuid, text, text) to authenticated, service_role;

