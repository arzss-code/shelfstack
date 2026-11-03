-- Sprint 9: Integrasi Dompet Voucher Pelanggan ke Alur Checkout & Pembatalan Pesanan
-- 1. Update RPC create_order untuk mengupdate status user_coupons menjadi 'used'
-- 2. Update RPC cancel_order untuk memulihkan status user_coupons kembali menjadi 'claimed' jika order dibatalkan

-- =========================================================================
-- 1. CANONICAL RPC: CREATE_ORDER DENGAN INTEGRASI USER_COUPONS
-- =========================================================================
create or replace function public.create_order(
  p_items jsonb,
  p_address jsonb,
  p_idempotency_key text default null,
  p_request_hash text default null,
  p_coupon_code text default null,
  p_shipping_service text default 'reguler',
  p_courier_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_subtotal int := 0;
  v_discount int := 0;
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
begin
  -- 1. Pastikan pemanggil terautentikasi
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membuat pesanan';
  end if;

  -- 2. Validasi keranjang tidak kosong
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  -- 3. Pengecekan Idempotensi & Kunci Transaksi Deterministik
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

  -- 4. Inisialisasi draft order
  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  -- Set session variables untuk audit trigger
  perform set_config('app.stock_change_reason', 'checkout', true);
  perform set_config('app.stock_change_order_id', v_order::text, true);

  -- 5. Kunci baris produk dengan urutan deterministik (ORDER BY product_id ASC FOR UPDATE)
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

  -- 6. Validasi & Kalkulasi Kupon Promo di Sisi Server (Anti-Tamper)
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

    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;

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
      where user_id = auth.uid() and coupon_id = v_coupon.id;

      if v_user_usage_count >= v_coupon.user_limit then
        raise exception 'Anda telah mencapai batas maksimal penggunaan kupon "%"', v_coupon.code;
      end if;
    end if;

    -- Kalkulasi nilai diskon
    if v_coupon.discount_type = 'percentage' then
      v_discount := (v_subtotal * v_coupon.discount_value) / 100;
      if v_coupon.max_discount_cents is not null and v_discount > v_coupon.max_discount_cents then
        v_discount := v_coupon.max_discount_cents;
      end if;
    else
      v_discount := v_coupon.discount_value;
    end if;

    if v_discount > v_subtotal then
      v_discount := v_subtotal;
    end if;

    -- Update kuota pemakaian kupon
    update public.coupons
    set usage_count = usage_count + 1,
        updated_at = now()
    where id = v_coupon.id;

    -- Catat histori audit pemakaian
    insert into public.coupon_usages (
      coupon_id,
      user_id,
      order_id,
      discount_cents
    ) values (
      v_coupon.id,
      auth.uid(),
      v_order,
      v_discount
    );

    -- Sinkronisasi ke dompet voucher pelanggan (public.user_coupons)
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
        user_id,
        coupon_id,
        status,
        claimed_at,
        used_at,
        order_id
      ) values (
        auth.uid(),
        v_coupon_id,
        'used',
        now(),
        now(),
        v_order
      );
    end if;
  end if;

  -- 7. Kalkulasi Biaya Pengiriman di Sisi Server (Anti-Tamper)
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

  -- Total pesanan: subtotal - diskon + ongkir
  v_total := greatest(0, v_subtotal - v_discount + v_shipping_cost);

  -- 8. Finalisasi pesanan
  update public.orders
  set 
    total_cents = v_total,
    subtotal_cents = v_subtotal,
    discount_cents = v_discount,
    coupon_id = v_coupon_id,
    coupon_code = v_coupon_code,
    shipping_service = v_shipping_service,
    shipping_cost_cents = v_shipping_cost,
    courier_code = p_courier_code,
    updated_at = now()
  where id = v_order;

  -- 9. Rekam Idempotensi jika Key Disediakan
  if p_idempotency_key is not null and p_idempotency_key <> '' then
    insert into public.order_idempotency_keys (
      user_id,
      idempotency_key,
      order_id,
      request_hash
    ) values (
      auth.uid(),
      p_idempotency_key,
      v_order,
      coalesce(p_request_hash, '')
    );
  end if;

  return v_order;
end;
$$;


-- =========================================================================
-- 2. CANONICAL RPC: CANCEL_ORDER DENGAN PEMULIHAN USER_COUPONS
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

  -- Rollback pemakaian kupon jika pesanan menggunakan kupon
  if v_order.coupon_id is not null then
    -- Revert usage_count pada master kupon
    update public.coupons
    set usage_count = greatest(0, usage_count - 1),
        updated_at = now()
    where id = v_order.coupon_id;

    -- Hapus catatan audit pemakaian kupon untuk order ini
    delete from public.coupon_usages
    where order_id = p_order_id;

    -- Pulihkan status voucher di dompet pelanggan kembali ke 'claimed'
    update public.user_coupons
    set status = 'claimed',
        used_at = null,
        order_id = null,
        updated_at = now()
    where order_id = p_order_id;
  end if;

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
