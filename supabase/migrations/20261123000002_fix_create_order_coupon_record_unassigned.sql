-- Sprint 8 Patch: Perbaikan Error "record v_coupon is not assigned yet" pada RPC create_order
-- Saat p_coupon_code bernilai NULL / kosong, variabel record v_coupon tidak pernah di-assign sehingga
-- akses terhadap v_coupon.id di statement UPDATE orders menyebabkan runtime error PostgreSQL 55000.
-- Perbaikan: Menggunakan variabel skalar v_coupon_id dan v_coupon_code yang diinisialisasi NULL.

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

  -- 8. Update total akhir pesanan dengan metadata diskon dan ongkir
  update public.orders
  set total_cents = v_total,
      subtotal_cents = v_subtotal,
      discount_cents = v_discount,
      coupon_id = v_coupon_id,
      coupon_code = v_coupon_code,
      shipping_service = v_shipping_service,
      shipping_cost_cents = v_shipping_cost,
      courier_code = p_courier_code
  where id = v_order;

  -- 9. Simpan Idempotency Record (jika key disediakan)
  if p_idempotency_key is not null and p_idempotency_key <> '' then
    insert into public.order_idempotency_keys (
      user_id,
      idempotency_key,
      request_hash,
      order_id
    ) values (
      auth.uid(),
      p_idempotency_key,
      coalesce(p_request_hash, ''),
      v_order
    );
  end if;

  return v_order;
end;
$$;

grant execute on function public.create_order(jsonb, jsonb, text, text, text, text, text) to authenticated;

