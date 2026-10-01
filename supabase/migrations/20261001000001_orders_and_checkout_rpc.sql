-- Sprint 4 / Fase 3: Tabel Orders, Order Items, RLS, RPC Checkout Atomik, dan Realtime
-- Referensi: docs/superpowers/specs/2026-10-01-cart-orders-midtrans-design.md & docs/PHASE-3-CART-ORDERS.md

-- 1. TABEL ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  total_cents int not null check (total_cents >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
  address jsonb not null,
  snap_token text,
  payment_type text,
  midtrans_id text,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexing untuk query riwayat dan foreign key
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- 2. TABEL ORDER_ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  qty int not null check (qty > 0),
  price_cents int not null check (price_cents >= 0)
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Customer: Baca miliknya sendiri
drop policy if exists "owner read orders" on public.orders;
create policy "owner read orders"
on public.orders for select to authenticated
using (user_id = auth.uid());

drop policy if exists "owner read items" on public.order_items;
create policy "owner read items"
on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Admin: Akses penuh
drop policy if exists "admin read orders" on public.orders;
create policy "admin read orders"
on public.orders for select to authenticated
using (public.is_admin());

drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders"
on public.orders for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin all items" on public.order_items;
create policy "admin all items"
on public.order_items for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- CATATAN KEAMANAN:
-- Sengaja TIDAK ADA policy "owner insert orders" atau "owner insert items".
-- Pembuatan order hanya dapat dilakukan melalui fungsi RPC SECURITY DEFINER `create_order`.
-- Ini mencegah customer memanipulasi total harga atau status order secara langsung dari client.

-- 4. RPC CREATE_ORDER (ATOMIC & SECURITY DEFINER)
create or replace function public.create_order(p_items jsonb, p_address jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order uuid;
  v_total int := 0;
  r record;
  v_price int;
  v_stock int;
begin
  -- Pastikan pemanggil terautentikasi
  if auth.uid() is null then
    raise exception 'Unauthorized: Pengguna harus login untuk membuat pesanan';
  end if;

  -- Validasi keranjang tidak kosong
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  -- 1. Inisialisasi draft order
  insert into public.orders (user_id, total_cents, address)
  values (auth.uid(), 0, p_address) returning id into v_order;

  -- 2. Iterasi dan kunci baris produk untuk mencegah race condition stok
  for r in select * from jsonb_to_recordset(p_items) as (product_id bigint, qty int) loop
    if r.qty <= 0 then
      raise exception 'Kuantitas tidak valid untuk produk ID %', r.product_id;
    end if;

    -- Kunci baris produk FOR UPDATE
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

    -- Kurangi stok produk secara atomik
    update public.products
    set stock = stock - r.qty
    where id = r.product_id;

    -- Simpan item pesanan dengan snapshot harga saat transaksi dibuat
    insert into public.order_items (order_id, product_id, qty, price_cents)
    values (v_order, r.product_id, r.qty, v_price);

    -- Akumulasi total biaya di server
    v_total := v_total + (v_price * r.qty);
  end loop;

  -- 3. Update total akhir pesanan
  update public.orders
  set total_cents = v_total
  where id = v_order;

  return v_order;
end;
$$;

-- Beri izin eksekusi ke authenticated user
grant execute on function public.create_order(jsonb, jsonb) to authenticated;

-- 5. REALTIME PUBLICATION
alter publication supabase_realtime add table public.orders;
