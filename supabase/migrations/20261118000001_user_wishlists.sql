-- Sprint 5 / Fase 4: Persisted User Wishlists & RLS
-- Tabel public.wishlists untuk menyimpan daftar keinginan pelanggan secara persisten di database
-- Dilengkapi relasi cascade, constraint unik per (user_id, product_id), index performa, dan RLS strict.

-- 1. TABEL USER_WISHLISTS
create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_user_product_wishlist unique (user_id, product_id)
);

-- Indexing untuk query performa tinggi
create index if not exists idx_wishlists_user_id on public.wishlists(user_id);
create index if not exists idx_wishlists_product_id on public.wishlists(product_id);
create index if not exists idx_wishlists_user_created on public.wishlists(user_id, created_at desc);

-- 2. ROW LEVEL SECURITY (RLS)
alter table public.wishlists enable row level security;

-- Policy Select: Pengguna hanya dapat membaca wishlist miliknya sendiri
drop policy if exists "Users can view own wishlists" on public.wishlists;
create policy "Users can view own wishlists"
on public.wishlists
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Policy Insert: Pengguna hanya dapat menambahkan item untuk akunnya sendiri
drop policy if exists "Users can insert own wishlists" on public.wishlists;
create policy "Users can insert own wishlists"
on public.wishlists
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Policy Delete: Pengguna hanya dapat menghapus item dari wishlist miliknya
drop policy if exists "Users can delete own wishlists" on public.wishlists;
create policy "Users can delete own wishlists"
on public.wishlists
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- 3. PERMISSION GRANTS
grant select, insert, delete on public.wishlists to authenticated;
