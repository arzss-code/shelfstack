-- =========================================================================
-- MIGRATION: 20261202000001_audit_remediation_transactions_and_privacy.sql
-- DESCRIPTION: Corrective migration for audit remediation:
--   1. Enforce private storage buckets (chat-attachments, return-proofs)
--   2. Restrict customer UPDATE on support_messages strictly to read receipts
--   3. Align create_order / cancel_order loyalty coins columns & types
--   4. Align create_order shipping fees with shared/schemas/shipping.ts
--   5. Guard paid -> shipped against pending refunds; validate paid status in finalize_refund
--   6. Unify variant stock restoration across cancel, expiry, refund, & return
--   7. Add atomic & idempotent RPC admin_review_return_request
-- =========================================================================

-- =========================================================================
-- 1. PRIVATE STORAGE BUCKETS & AUTHENTICATED ACCESS POLICIES
-- =========================================================================
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id in ('chat-attachments', 'return-proofs');

drop policy if exists "public view chat attachments" on storage.objects;
drop policy if exists "authenticated owners and admins view chat attachments" on storage.objects;
create policy "authenticated owners and admins view chat attachments"
on storage.objects for select to authenticated
using (
  bucket_id = 'chat-attachments'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "public view return proofs" on storage.objects;
drop policy if exists "authenticated owners and admins view return proofs" on storage.objects;
create policy "authenticated owners and admins view return proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'return-proofs'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- =========================================================================
-- 2. SUPPORT_MESSAGES UPDATE HARDENING (READ RECEIPT ONLY FOR CUSTOMERS)
-- =========================================================================
drop policy if exists "thread participants and admins can update support_messages" on public.support_messages;
create policy "thread participants and admins can update support_messages"
on public.support_messages for update to authenticated
using (
  public.is_admin()
  or (
    sender_type in ('admin', 'system')
    and deleted_at is null
    and exists (
      select 1 from public.support_threads t
      where t.id = support_messages.thread_id
        and t.customer_id = auth.uid()
        and t.deleted_at is null
    )
  )
)
with check (
  public.is_admin()
  or (
    sender_type in ('admin', 'system')
    and deleted_at is null
    and exists (
      select 1 from public.support_threads t
      where t.id = support_messages.thread_id
        and t.customer_id = auth.uid()
        and t.deleted_at is null
    )
  )
);

create or replace function public.trg_guard_support_message_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if current_setting('role', true) = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.thread_id is distinct from old.thread_id
     or new.sender_type is distinct from old.sender_type
     or new.sender_id is distinct from old.sender_id
     or new.message_text is distinct from old.message_text
     or new.attachment_url is distinct from old.attachment_url
     or new.attachment_type is distinct from old.attachment_type
     or new.attached_order_id is distinct from old.attached_order_id
     or new.attached_product_id is distinct from old.attached_product_id
     or new.created_at is distinct from old.created_at
     or new.deleted_at is distinct from old.deleted_at then
    raise exception 'FORBIDDEN_IMMUTABLE_SUPPORT_MESSAGE: Pelanggan hanya diizinkan menandai status terbaca pesan dukungan';
  end if;

  if old.is_read = true and new.is_read = false then
    raise exception 'INVALID_READ_RECEIPT_TRANSITION: Status terbaca tidak dapat dibalikkan';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_support_message_update on public.support_messages;
create trigger trg_guard_support_message_update
before update on public.support_messages
for each row
execute function public.trg_guard_support_message_update();

-- =========================================================================
-- 3. CORRECTED CREATE_ORDER (LOYALTY SCHEMA, SHIPPING RATES, VARIANTS, FLASH)
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
  v_variant_price int;
  v_variant_stock int;
  v_item_price int;
  v_flash_promo_price int;
  v_flash_deal_id uuid;
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

    v_subtotal := v_subtotal + (v_item_price * r.qty);
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

  -- Loyalty coins deduction matching schema (type = 'spent', amount_coins > 0)
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

  -- Shipping fees aligned 100% with shared/schemas/shipping.ts calculateShippingFee
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

-- =========================================================================
-- 4. CORRECTED CANCEL_ORDER (VARIANT RESTOCK + CORRECT COIN SCHEMA COLUMNS)
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

  perform set_config('app.order_transition_source', 'cancel_order_rpc', true);
  perform set_config('app.stock_change_reason', 'order_cancellation', true);
  perform set_config('app.stock_change_order_id', p_order_id::text, true);

  for r in
    select product_id, variant_id, qty
    from public.order_items
    where order_id = p_order_id
    order by product_id asc, variant_id nulls last
  loop
    update public.products
    set stock = stock + r.qty
    where id = r.product_id;

    if r.variant_id is not null then
      update public.product_variants
      set stock = stock + r.qty,
          updated_at = now()
      where id = r.variant_id;
    end if;
  end loop;

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
        user_id, order_id, type, amount_coins, balance_after, description
      ) values (
        v_order.user_id,
        p_order_id,
        'cancelled_order',
        v_order.coins_used,
        v_new_coin_balance,
        'Pengembalian ' || v_order.coins_used::text || ' Koin karena pembatalan pesanan #' || substr(p_order_id::text, 1, 8)
      );
    end if;
  end if;

  update public.orders
  set status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = p_reason,
      updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated, service_role;

-- =========================================================================
-- 5. CORRECTED HANDLE_PAYMENT_WEBHOOK (VARIANT STOCK PARITY ON EXPIRY/CANCEL)
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
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return 'ORDER_NOT_FOUND';
  end if;

  v_current_status := v_order.status;

  if v_current_status = 'refunded' then
    return 'IGNORED_ORDER_ALREADY_REFUNDED';
  end if;

  if v_current_status in ('paid', 'shipped', 'completed') then
    if p_target_status = 'cancelled' then
      return 'IGNORED_STALE_CANCEL_ON_PAID_ORDER';
    end if;

    if p_target_status = 'paid' then
      return 'NO_CHANGE_ALREADY_' || upper(v_current_status);
    end if;

    return 'IGNORED_ORDER_ALREADY_PROGRESSING';
  end if;

  if v_current_status = 'cancelled' then
    if p_target_status = 'paid' then
      begin
        insert into public.activity_logs (
          action, entity_type, entity_id, description, new_data
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

  if v_current_status = 'pending' then
    if p_target_status = 'paid' then
      perform set_config('app.order_transition_source', 'payment_webhook', true);

      update public.orders
      set status = 'paid',
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

      for r in
        select product_id, variant_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc, variant_id nulls last
      loop
        update public.products
        set stock = stock + r.qty
        where id = r.product_id;

        if r.variant_id is not null then
          update public.product_variants
          set stock = stock + r.qty,
              updated_at = now()
          where id = r.variant_id;
        end if;
      end loop;

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
      set status = 'cancelled',
          cancelled_at = coalesce(cancelled_at, now()),
          cancellation_reason = v_cancel_reason,
          updated_at = now()
      where id = p_order_id;

      if p_payment_type = 'auto_timeout' then
        begin
          insert into public.notifications (
            user_id, title, message, type, reference_id, reference_url, is_read
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
-- 6. CORRECTED TRANSITION_ORDER_STATUS (REFUND PENDING GUARD + VARIANT RESTOCK)
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

      for r in
        select product_id, variant_id, qty
        from public.order_items
        where order_id = p_order_id
        order by product_id asc, variant_id nulls last
      loop
        update public.products set stock = stock + r.qty where id = r.product_id;

        if r.variant_id is not null then
          update public.product_variants
          set stock = stock + r.qty,
              updated_at = now()
          where id = r.variant_id;
        end if;
      end loop;

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
          user_id, title, message, type, reference_id, reference_url, is_read
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
      -- Guard fulfillment against concurrent pending refund processing
      if exists (
        select 1 from public.refunds
        where order_id = p_order_id and status = 'pending'
      ) then
        raise exception 'REFUND_PENDING_CONFLICT: Pesanan tidak dapat dikirim karena terdapat pengajuan refund yang masih menunggu konfirmasi pembayaran';
      end if;

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
      entity_type, entity_id, action, description, old_data, new_data
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

-- =========================================================================
-- 7. CORRECTED FINALIZE_REFUND (STATE CHECK, VARIANT RESTOCK, COINS REFUND)
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
  v_new_coin_balance bigint;
  r record;
begin
  if (auth.uid() is not null and not public.is_admin())
     or (auth.uid() is null and current_setting('role', true) in ('authenticated', 'anon')) then
    raise exception 'FORBIDDEN_NOT_ADMIN: Hanya administrator yang berhak menyelesaikan refund';
  end if;

  select * into v_refund
  from public.refunds
  where id = p_refund_id
  for update;

  if not found then
    raise exception 'REFUND_NOT_FOUND: Record refund tidak ditemukan';
  end if;

  if v_refund.status in ('succeeded', 'failed') then
    return jsonb_build_object(
      'refund_id', p_refund_id,
      'order_id', v_refund.order_id,
      'status', v_refund.status,
      'already_finalized', true
    );
  end if;

  select * into v_order
  from public.orders
  where id = v_refund.order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND: Pesanan terkait refund tidak ditemukan';
  end if;

  if p_success then
    if v_order.status = 'refunded' then
      return jsonb_build_object(
        'refund_id', p_refund_id,
        'order_id', v_refund.order_id,
        'status', 'succeeded',
        'order_status', 'refunded',
        'already_finalized', true
      );
    end if;

    if v_order.status <> 'paid' then
      raise exception 'INVALID_ORDER_STATE_FOR_REFUND: Pesanan dalam status % tidak dapat difinalisasi menjadi refunded', v_order.status;
    end if;

    update public.refunds
    set status = 'succeeded',
        gateway_refund_id = coalesce(p_gateway_refund_id, gateway_refund_id),
        bank_confirmed_at = coalesce(p_bank_confirmed_at, now()),
        processed_at = now(),
        updated_at = now()
    where id = p_refund_id;

    perform set_config('app.order_transition_source', 'finalize_refund_rpc', true);

    update public.orders
    set status = 'refunded',
        refunded_at = now(),
        updated_at = now()
    where id = v_refund.order_id;

    perform set_config('app.stock_change_reason', 'order_refund_restock', true);
    perform set_config('app.stock_change_order_id', v_refund.order_id::text, true);

    for r in
      select product_id, variant_id, qty
      from public.order_items
      where order_id = v_refund.order_id
      order by product_id asc, variant_id nulls last
    loop
      select sold_count into v_current_sold
      from public.products
      where id = r.product_id
      for update;

      if v_current_sold < r.qty then
        raise exception 'DATA_INCONSISTENCY_SOLD_COUNT: sold_count (%) kurang dari qty order (%) untuk produk %', v_current_sold, r.qty, r.product_id;
      end if;

      update public.products
      set stock = stock + r.qty,
          sold_count = sold_count - r.qty
      where id = r.product_id;

      if r.variant_id is not null then
        update public.product_variants
        set stock = stock + r.qty,
            updated_at = now()
        where id = r.variant_id;
      end if;
    end loop;

    if coalesce(v_order.coins_used, 0) > 0 and not exists (
      select 1 from public.coin_transactions
      where order_id = v_refund.order_id and type = 'refunded_order'
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
          'refunded_order',
          v_order.coins_used,
          v_new_coin_balance,
          v_refund.order_id,
          'Pengembalian ' || v_order.coins_used::text || ' Koin dari refund pesanan #' || substr(v_refund.order_id::text, 1, 8)
        );
      end if;
    end if;

    begin
      insert into public.activity_logs (
        entity_type, entity_id, action, description, old_data, new_data
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
    update public.refunds
    set status = 'failed',
        failure_reason = coalesce(p_failure_reason, 'Refund ditolak oleh payment gateway'),
        processed_at = now(),
        updated_at = now()
    where id = p_refund_id;

    begin
      insert into public.activity_logs (
        entity_type, entity_id, action, description, old_data, new_data
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
      'already_finalized', false
    );
  end if;
end;
$$;

revoke all on function public.finalize_refund(uuid, boolean, text, text, timestamptz) from public, anon;
grant execute on function public.finalize_refund(uuid, boolean, text, text, timestamptz) to authenticated, service_role;

-- =========================================================================
-- 8. ATOMIC & IDEMPOTENT RPC ADMIN_REVIEW_RETURN_REQUEST
-- =========================================================================
create or replace function public.admin_review_return_request(
  p_return_id uuid,
  p_status text,
  p_admin_notes text default null,
  p_replacement_courier text default null,
  p_replacement_tracking_number text default null,
  p_refund_amount_cents int default null,
  p_restock_inventory boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket public.return_requests%rowtype;
  v_updated public.return_requests%rowtype;
  v_now timestamptz := now();
  v_restocked_at timestamptz;
  v_resolved_at timestamptz;
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

  v_restocked_at := v_ticket.restocked_at;
  if p_status = 'completed' and p_restock_inventory and v_ticket.restocked_at is null then
    perform set_config('app.stock_change_reason', 'return_restock', true);
    perform set_config('app.stock_change_order_id', v_ticket.order_id::text, true);

    for r in
      select product_id, variant_id, qty
      from public.order_items
      where order_id = v_ticket.order_id
      order by product_id asc, variant_id nulls last
    loop
      update public.products
      set stock = stock + r.qty
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

revoke all on function public.admin_review_return_request(uuid, text, text, text, text, int, boolean) from public, anon;
grant execute on function public.admin_review_return_request(uuid, text, text, text, text, int, boolean) to authenticated, service_role;
