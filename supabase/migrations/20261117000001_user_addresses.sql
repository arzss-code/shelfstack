-- Sprint 5 / Fase 4: Persisted User Shipping Addresses & RLS
-- Tabel public.user_addresses untuk menyimpan alamat pengiriman pelanggan
-- Menyediakan fitur penyimpanan alamat, pemilihan alamat utama (is_default), dan soft delete.

-- 1. TABEL USER_ADDRESSES
create table if not exists public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  street text not null,
  city text not null,
  postal text not null,
  note text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- Indexing untuk query performa tinggi
create index if not exists idx_user_addresses_user_id on public.user_addresses(user_id);
create index if not exists idx_user_addresses_deleted_at on public.user_addresses(deleted_at);
create index if not exists idx_user_addresses_user_is_default on public.user_addresses(user_id, is_default) where deleted_at is null;

-- 2. ROW LEVEL SECURITY (RLS)
alter table public.user_addresses enable row level security;

-- Policy Select: Pengguna hanya dapat membaca alamat aktif miliknya sendiri
drop policy if exists "Users can view own non-deleted addresses" on public.user_addresses;
create policy "Users can view own non-deleted addresses"
on public.user_addresses
for select
to authenticated
using (auth.uid() = user_id and deleted_at is null);

-- Policy Insert: Pengguna hanya dapat menambahkan alamat dengan ID miliknya
drop policy if exists "Users can insert own addresses" on public.user_addresses;
create policy "Users can insert own addresses"
on public.user_addresses
for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy Update: Pengguna hanya dapat memperbarui alamat miliknya
drop policy if exists "Users can update own addresses" on public.user_addresses;
create policy "Users can update own addresses"
on public.user_addresses
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policy Delete: Pengguna hanya dapat menghapus (soft-delete / delete) alamat miliknya
drop policy if exists "Users can delete own addresses" on public.user_addresses;
create policy "Users can delete own addresses"
on public.user_addresses
for delete
to authenticated
using (auth.uid() = user_id);

-- 3. PERMISSION GRANTS
grant select, insert, update, delete on public.user_addresses to authenticated;
