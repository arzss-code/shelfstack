-- Sprint 7 / Fase 3: Sistem Kupon Promo & Voucher Diskon (SHF-VOUCHER)
-- 1. Tabel public.coupons (Master Kupon Diskon)
-- 2. Tabel public.coupon_usages (Audit Trail Pemakaian per User & Order)
-- 3. Kolom diskon pada public.orders (subtotal_cents, discount_cents, coupon_id, coupon_code)
-- 4. RPC create_order Atomik & Transaksional dengan Kunci Validasi Kupon
-- 5. Data Seed Kupon Kanonis (SHELF10, HEMAT50K, SUPERDEAL)

-- 1. TABEL PUBLIC.COUPONS
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value int not null check (discount_value > 0),
  max_discount_cents int check (max_discount_cents is null or max_discount_cents >= 0),
  min_purchase_cents int not null default 0 check (min_purchase_cents >= 0),
  usage_limit int check (usage_limit is null or usage_limit > 0),
  usage_count int not null default 0 check (usage_count >= 0),
  user_limit int default 1 check (user_limit is null or user_limit > 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ck_coupon_percentage_limit check (
    discount_type <> 'percentage' or (discount_value > 0 and discount_value <= 100)
  )
);

create unique index if not exists idx_coupons_code_upper 
on public.coupons (upper(code)) 
where deleted_at is null;

create index if not exists idx_coupons_active 
on public.coupons (is_active, deleted_at);

-- 2. TABEL PUBLIC.COUPON_USAGES
create table if not exists public.coupon_usages (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  discount_cents int not null check (discount_cents >= 0),
  created_at timestamptz not null default now(),
  constraint uq_coupon_user_order unique (user_id, coupon_id, order_id)
);

create index if not exists idx_coupon_usages_user_coupon 
on public.coupon_usages (user_id, coupon_id);

create index if not exists idx_coupon_usages_order_id 
on public.coupon_usages (order_id);

-- 3. KOLOM TAMBAHAN PADA PUBLIC.ORDERS
alter table public.orders
  add column if not exists subtotal_cents int not null default 0 check (subtotal_cents >= 0),
  add column if not exists discount_cents int not null default 0 check (discount_cents >= 0),
  add column if not exists coupon_id uuid references public.coupons(id) on delete set null,
  add column if not exists coupon_code text;

create index if not exists idx_orders_coupon_code on public.orders (coupon_code);

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.coupons enable row level security;
alter table public.coupon_usages enable row level security;

-- Kupon: publik/authenticated dapat membaca kupon aktif untuk pengecekan validasi
drop policy if exists "allow read active coupons" on public.coupons;
create policy "allow read active coupons"
on public.coupons for select
using (is_active = true and deleted_at is null);

-- Kupon: Admin memiliki kontrol penuh
drop policy if exists "admin all coupons" on public.coupons;
create policy "admin all coupons"
on public.coupons for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "service role coupons" on public.coupons;
create policy "service role coupons"
on public.coupons for all to service_role
using (true)
with check (true);

-- Coupon Usages: Pemilik hanya membaca histori miliknya
drop policy if exists "owner read coupon usages" on public.coupon_usages;
create policy "owner read coupon usages"
on public.coupon_usages for select to authenticated
using ((select auth.uid()) = user_id);

-- Coupon Usages: Admin membaca seluruh histori
drop policy if exists "admin read coupon usages" on public.coupon_usages;
create policy "admin read coupon usages"
on public.coupon_usages for select to authenticated
using (public.is_admin());

-- Coupon Usages: Cegah insert langsung dari client (hanya via RPC create_order)
drop policy if exists "deny direct insert coupon usages" on public.coupon_usages;
create policy "deny direct insert coupon usages"
on public.coupon_usages for insert to authenticated
with check (false);

drop policy if exists "service role coupon usages" on public.coupon_usages;
create policy "service role coupon usages"
on public.coupon_usages for all to service_role
using (true)
with check (true);

-- 5. ATOMIC RPC CREATE_ORDER DENGAN DUKUNGAN KUPON (SECURITY DEFINER)
drop function if exists public.create_order(jsonb, jsonb, text, text);
drop function if exists public.create_order(jsonb, jsonb, text, text, text);

create or replace function public.create_order(
  p_items jsonb,
  p_address jsonb,
  p_idempotency_key text default null,
  p_request_hash text default null,
  p_coupon_code text default null
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
  v_user_usage_count int := 0;
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

  v_total := greatest(0, v_subtotal - v_discount);

  -- 7. Update total akhir pesanan dengan metadata diskon
  update public.orders
  set total_cents = v_total,
      subtotal_cents = v_subtotal,
      discount_cents = v_discount,
      coupon_id = case when v_coupon.id is not null then v_coupon.id else null end,
      coupon_code = case when v_coupon.code is not null then v_coupon.code else null end
  where id = v_order;

  -- 8. Simpan Idempotency Record (jika key disediakan)
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

grant execute on function public.create_order(jsonb, jsonb, text, text, text) to authenticated;

-- 6. SEED DATA KUPON KANONIS DEMO
insert into public.coupons (
  code,
  name,
  description,
  discount_type,
  discount_value,
  max_discount_cents,
  min_purchase_cents,
  usage_limit,
  user_limit,
  is_active
) values
  ('SHELF10', 'Diskon Spesial 10%', 'Potongan 10% hingga Rp 100.000 dengan minimal belanja Rp 200.000', 'percentage', 10, 10000000, 20000000, 1000, 1, true),
  ('HEMAT50K', 'Hemat Rp 50.000', 'Potongan langsung Rp 50.000 dengan minimal belanja Rp 300.000', 'fixed', 5000000, null, 30000000, 500, 1, true),
  ('SUPERDEAL', 'Promo Super 20%', 'Potongan 20% hingga Rp 250.000 dengan minimal belanja Rp 500.000', 'percentage', 20, 25000000, 50000000, 200, 1, true)
on conflict (code) do nothing;
