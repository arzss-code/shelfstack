-- Sprint 27: Flash Deals Engine & Promotional Pricing Synchronization
-- 1. Tabel public.flash_deals untuk persistensi promo terbatas
-- 2. Integrasi harga promo flash sale pada RPC atomik create_order
-- 3. RLS & Policy aksesibilitas katalog publik

create table if not exists public.flash_deals (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  promo_price_cents int not null check (promo_price_cents > 0),
  discount_percentage int not null check (discount_percentage > 0 and discount_percentage < 100),
  quota int not null check (quota > 0),
  claimed int not null default 0 check (claimed >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint ck_flash_deal_dates check (ends_at > starts_at)
);

create index if not exists idx_flash_deals_active 
on public.flash_deals (product_id, is_active, starts_at, ends_at);

-- RLS Policies
alter table public.flash_deals enable row level security;

drop policy if exists "allow read active flash deals" on public.flash_deals;
create policy "allow read active flash deals"
on public.flash_deals for select
using (is_active = true);

drop policy if exists "admin full access flash deals" on public.flash_deals;
create policy "admin full access flash deals"
on public.flash_deals for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service role flash deals" on public.flash_deals;
create policy "service role flash deals"
on public.flash_deals for all to service_role
using (true)
with check (true);

-- Perbarui RPC create_order untuk mengenali harga promo flash sale secara atomik
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
  -- 1. Verifikasi autentikasi pemanggil
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membuat pesanan';
  end if;

  -- 2. Validasi keranjang belanja tidak kosong
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

  -- 4. Inisialisasi draft pesanan
  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  perform set_config('app.stock_change_reason', 'checkout', true);
  perform set_config('app.stock_change_order_id', v_order::text, true);

  -- 5. Kunci baris produk & varian secara deterministik (ORDER BY product_id ASC)
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

    -- Validasi varian jika disediakan
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
      set stock = stock - r.qty
      where id = r.variant_id;
    end if;

    -- Sinkronisasi Harga Promo Flash Deal Aktif (Authoritative Server Check)
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

  -- 6. Validasi kupon promo
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
      where user_id = auth.uid() and coupon_id = v_coupon.id;

      if v_user_usage_count >= v_coupon.user_limit then
        raise exception 'Anda telah mencapai batas maksimal penggunaan kupon "%"', v_coupon.code;
      end if;
    end if;

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

    update public.coupons
    set usage_count = usage_count + 1, updated_at = now()
    where id = v_coupon.id;

    insert into public.coupon_usages (coupon_id, user_id, order_id, discount_cents)
    values (v_coupon.id, auth.uid(), v_order, v_discount);

    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;
  end if;

  v_subtotal_after_coupon := greatest(0, v_subtotal - v_discount);

  -- 7. Koin loyalitas
  if p_coins_used is not null and p_coins_used > 0 then
    select * into v_user_coins
    from public.user_coins
    where user_id = auth.uid()
    for update;

    if not found or v_user_coins.balance_coins < p_coins_used then
      raise exception 'Saldo koin tidak mencukupi untuk pemotongan belanja';
    end if;

    v_max_coins := (v_subtotal_after_coupon * 50) / 10000;
    if p_coins_used > v_max_coins then
      v_actual_coins_used := v_max_coins;
    else
      v_actual_coins_used := p_coins_used;
    end if;

    v_coins_discount_cents := v_actual_coins_used * 100;
    v_new_coin_balance := v_user_coins.balance_coins - v_actual_coins_used;

    update public.user_coins
    set balance_coins = v_new_coin_balance, updated_at = now()
    where user_id = auth.uid();

    insert into public.coin_transactions (
      user_id, order_id, amount_coins, transaction_type, description, balance_after
    )
    values (
      auth.uid(), v_order, -v_actual_coins_used, 'redeemed',
      'Pemotongan koin pada pesanan ' || v_order::text, v_new_coin_balance
    );
  else
    v_actual_coins_used := 0;
    v_coins_discount_cents := 0;
  end if;

  -- 8. Biaya Pengiriman
  if v_subtotal >= 50000000 and v_shipping_service = 'reguler' then
    v_shipping_cost := 0;
  elsif v_shipping_service = 'express' then
    v_shipping_cost := 3500000;
  elsif v_shipping_service = 'instant' then
    v_shipping_cost := 5000000;
  elsif v_shipping_service = 'cargo' then
    v_shipping_cost := 4500000;
  else
    v_shipping_cost := 2000000;
  end if;

  v_total := greatest(0, v_subtotal_after_coupon - v_coins_discount_cents) + v_shipping_cost;

  -- 9. Update final pesanan
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
      coins_discount_cents = v_coins_discount_cents
  where id = v_order;

  -- 10. Audit idempotensi
  if p_idempotency_key is not null and p_idempotency_key <> '' then
    insert into public.order_idempotency_keys (user_id, idempotency_key, order_id, request_hash)
    values (auth.uid(), p_idempotency_key, v_order, p_request_hash);
  end if;

  return v_order;
end;
$$;
