-- Sprint 7 / Fase Lanjutan: In-App Notifications Center & Realtime Broadcast
-- Tabel public.notifications untuk menyimpan notifikasi pelanggan di database Supabase
-- Dilengkapi relasi cascade ke auth.users, index performa, RLS strict, dan integrasi Supabase Realtime.

-- 1. TABEL NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('order_created', 'payment_success', 'order_shipped', 'order_cancelled', 'order_completed', 'system')),
  reference_id text,
  reference_url text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexing untuk query cepat unread badge dan daftar notifikasi per pengguna
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- 2. ROW LEVEL SECURITY (RLS)
alter table public.notifications enable row level security;

-- Policy Select: Pengguna hanya dapat membaca notifikasi miliknya sendiri
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Policy Update: Pengguna hanya dapat mengubah status baca notifikasi miliknya sendiri
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Policy Insert: Pengguna atau service role dapat menyisipkan notifikasi
drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications"
on public.notifications
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Policy Delete: Pengguna hanya dapat menghapus notifikasi miliknya sendiri
drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
on public.notifications
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- 3. PERMISSION GRANTS
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

-- 4. REALTIME PUBLICATION
-- Daftarkan tabel notifications ke publikasi supabase_realtime agar event INSERT disiarkan live
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
