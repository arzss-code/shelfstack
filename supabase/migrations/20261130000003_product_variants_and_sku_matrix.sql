-- =========================================================================
-- Migration: 20261130000003_product_variants_and_sku_matrix.sql
-- Description: Tabel public.product_variants, varian SKU matrix, penyesuaian
--              RPC create_order dan cancel_order untuk dukungan varian produk.
-- Standard: Talenavi SOP (Soft delete, deterministic locks, zero direct delete)
-- =========================================================================

set search_path = public, pg_temp;

-- 1. Tabel public.product_variants
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  sku text not null unique,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  price_cents integer,
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_product_variants_product_id
  on public.product_variants(product_id)
  where deleted_at is null;

create index if not exists idx_product_variants_sku
  on public.product_variants(sku)
  where deleted_at is null;

-- 2. Tambah kolom variant_id pada tabel order_items
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

create index if not exists idx_order_items_variant_id
  on public.order_items(variant_id);

-- 3. Row Level Security (RLS) pada product_variants
alter table public.product_variants enable row level security;

drop policy if exists "Public read active product variants" on public.product_variants;
create policy "Public read active product variants"
  on public.product_variants for select
  using (deleted_at is null and is_active = true);

drop policy if exists "Admin manage product variants" on public.product_variants;
create policy "Admin manage product variants"
  on public.product_variants for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. Perbarui RPC create_order dengan dukungan variant_id
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

    -- Validasi dan kunci varian jika disediakan
    if r.variant_id is not null then
      select price_cents, stock into v_variant_price, v_variant_stock
      from public.product_variants
      where id = r.variant_id and product_id = r.product_id and deleted_at is null and is_active = true
      for update;

      if not found then
        raise exception 'Varian produk tidak ditemukan atau sudah tidak aktif (Varian ID: %)', r.variant_id;
      end if;

      if v_variant_stock < r.qty then
        raise exception 'Stok varian tidak mencukupi untuk produk ID % (sisa: %, diminta: %)', r.product_id, v_variant_stock, r.qty;
      end if;

      update public.product_variants
      set stock = stock - r.qty,
          updated_at = now()
      where id = r.variant_id;

      if v_variant_price is not null and v_variant_price > 0 then
        v_item_price := v_variant_price;
      end if;
    end if;

    -- Potong stok produk master
    update public.products
    set stock = stock - r.qty
    where id = r.product_id;

    insert into public.order_items (order_id, product_id, variant_id, qty, price_cents)
    values (v_order, r.product_id, r.variant_id, r.qty, v_item_price);

    v_subtotal := v_subtotal + (v_item_price * r.qty);
  end loop;

  -- 6. Validasi kupon promo jika ada
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

    v_coupon_id := v_coupon.id;
    v_coupon_code := v_coupon.code;

    update public.coupons
    set usage_count = usage_count + 1,
        updated_at = now()
    where id = v_coupon.id;

    insert into public.coupon_usages (coupon_id, user_id, order_id, discount_applied_cents)
    values (v_coupon.id, auth.uid(), v_order, v_discount);

    update public.user_coupons
    set status = 'used',
        used_at = now(),
        order_id = v_order,
        updated_at = now()
    where id = (
      select id from public.user_coupons
      where user_id = auth.uid()
        and coupon_id = v_coupon.id
        and status = 'claimed'
      limit 1
    );
  end if;

  -- 7. Kalkulasi biaya pengiriman resmi
  case v_shipping_service
    when 'instant' then
      v_shipping_cost := 4500000;
    when 'next_day', 'express' then
      v_shipping_cost := 3000000;
    when 'cargo' then
      v_shipping_cost := 2500000;
    when 'reguler' then
      if v_subtotal >= 50000000 then
        v_shipping_cost := 0;
      else
        v_shipping_cost := 1500000;
      end if;
    else
      v_shipping_service := 'reguler';
      if v_subtotal >= 50000000 then
        v_shipping_cost := 0;
      else
        v_shipping_cost := 1500000;
      end if;
  end case;

  -- 8. Validasi dan pemotongan koin loyalitas
  v_subtotal_after_coupon := greatest(0, v_subtotal - v_discount);
  v_max_coins := v_subtotal_after_coupon;

  if p_coins_used is not null and p_coins_used > 0 then
    select * into v_user_coins
    from public.user_coins
    where user_id = auth.uid()
    for update;

    if not found or v_user_coins.balance <= 0 then
      raise exception 'Saldo koin loyalitas tidak mencukupi atau akun koin belum terdaftar';
    end if;

    if p_coins_used > v_user_coins.balance then
      raise exception 'Jumlah koin yang ditukarkan (% koin) melebihi saldo aktif (% koin)',
        p_coins_used, v_user_coins.balance;
    end if;

    if p_coins_used > v_max_coins then
      v_actual_coins_used := v_max_coins;
    else
      v_actual_coins_used := p_coins_used;
    end if;

    v_coins_discount_cents := v_actual_coins_used;
    v_new_coin_balance := v_user_coins.balance - v_actual_coins_used;

    update public.user_coins
    set balance = v_new_coin_balance,
        lifetime_spent = v_user_coins.lifetime_spent + v_actual_coins_used,
        updated_at = now()
    where user_id = auth.uid();

    insert into public.coin_transactions (
      user_id,
      order_id,
      type,
      amount,
      balance_after,
      description
    ) values (
      auth.uid(),
      v_order,
      'redeemed_checkout',
      -v_actual_coins_used,
      v_new_coin_balance,
      'Penukaran ' || v_actual_coins_used::text || ' koin untuk potongan pesanan #' || substr(v_order::text, 1, 8)
    );
  else
    v_actual_coins_used := 0;
    v_coins_discount_cents := 0;
  end if;

  -- 9. Finalisasi total transaksi
  v_total := greatest(0, v_subtotal_after_coupon - v_coins_discount_cents) + v_shipping_cost;

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
      shipping_cost_cents = v_shipping_cost
  where id = v_order;

  -- 10. Catat idempotency key jika disediakan
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
      p_request_hash
    );
  end if;

  return v_order;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text, text, text, text, text, bigint) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, text, text, text, text, text, bigint) to authenticated, service_role;

-- 5. Perbarui cancel_order untuk pemulihan stok varian
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

  -- 1. Restock items: produk master & varian
  for r in
    select product_id, variant_id, qty
    from public.order_items
    where order_id = p_order_id
    order by product_id asc
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

  -- 3. Refund koin loyalitas jika ada
  if v_order.coins_used is not null and v_order.coins_used > 0 then
    update public.user_coins
    set balance = balance + v_order.coins_used,
        lifetime_spent = greatest(0, lifetime_spent - v_order.coins_used),
        updated_at = now()
    where user_id = v_order.user_id
    returning balance into v_new_coin_balance;

    insert into public.coin_transactions (
      user_id,
      order_id,
      type,
      amount,
      balance_after,
      description
    ) values (
      v_order.user_id,
      p_order_id,
      'cancelled_order',
      v_order.coins_used,
      v_new_coin_balance,
      'Pengembalian ' || v_order.coins_used::text || ' koin karena pembatalan pesanan #' || substr(p_order_id::text, 1, 8)
    );
  end if;

  -- 4. Mutasi status pesanan menjadi cancelled
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

-- 6. Seed varian awal untuk produk kurasi resmi (idempoten)
insert into public.product_variants (product_id, sku, name, attributes, price_cents, stock)
select
  p.id,
  v.sku,
  v.name,
  v.attributes::jsonb,
  v.price_cents,
  v.stock
from (values
  ('Headphone Studio ANC', 'SS-HD-ANC-BLK', 'Midnight Black', '{"color": "Hitam", "edition": "Standar"}', 268000000, 15),
  ('Headphone Studio ANC', 'SS-HD-ANC-SLV', 'Silver Titanium', '{"color": "Perak", "edition": "Premium"}', 278000000, 10),
  ('Lampu Meja Task Aluminium', 'SS-LMP-ALM-BLK', 'Matte Black', '{"color": "Hitam"}', 85000000, 10),
  ('Lampu Meja Task Aluminium', 'SS-LMP-ALM-WHT', 'Pure White', '{"color": "Putih"}', 85000000, 8)
) as v(prod_name, sku, name, attributes, price_cents, stock)
join public.products p on p.name = v.prod_name and p.deleted_at is null
on conflict (sku) do update set
  name = excluded.name,
  attributes = excluded.attributes,
  price_cents = excluded.price_cents,
  stock = excluded.stock;
