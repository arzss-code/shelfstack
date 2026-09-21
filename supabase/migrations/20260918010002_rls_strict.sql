-- Sprint 2 / Fase 1: RLS strict. Mencabut policy terbuka `USING (true)`.
-- PENTING: setelah migrasi ini, tulis products/activity/storage HANYA bisa via user terautentikasi
-- (admin untuk products). Katalog baca tetap publik. Recovery darurat via SQL Editor dashboard
-- (service_role bypass RLS). Lihat docs/PHASE-1-AUTH-SECURITY.md §1.2 + docs/ADR/004.

-- ============ HELPER ANTI-REKURSI ============
-- Semua policy admin WAJIB pakai fungsi ini, bukan subquery langsung ke profiles.
-- Alasan: policy di tabel profiles ikut berlaku saat policy lain query profiles,
-- sehingga subquery langsung bisa rekursi. Fungsi SECURITY DEFINER bypass RLS (aman:
-- hanya baca role milik pemanggil, return boolean).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ============ PRODUCTS ============
drop policy if exists "Izinkan semua orang membaca data" on public.products;
drop policy if exists "Izinkan semua orang menambah data" on public.products;
drop policy if exists "Izinkan semua orang mengedit data" on public.products;
drop policy if exists "Izinkan semua orang menghapus data" on public.products;
-- Idempotent: boleh dijalankan ulang (drop dulu policy baru sebelum create).
drop policy if exists "public read active products" on public.products;
drop policy if exists "admin write products" on public.products;

-- Baca publik hanya yang aktif (soft-delete tetap tersembunyi)
create policy "public read active products"
on public.products for select to anon, authenticated
using (deleted_at is null);

-- Tulis hanya admin (cek role via profiles). Server API juga cek role (defense in depth).
create policy "admin write products"
on public.products for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============ PROFILES ============
alter table public.profiles enable row level security;

drop policy if exists "owner or admin read profiles" on public.profiles;
create policy "owner or admin read profiles"
on public.profiles for select to authenticated
using (user_id = auth.uid() or public.is_admin());

-- SENGAJA tidak ada policy "owner update": kolom role ada di baris yang sama,
-- sehingga update milik-sendiri = bisa self-promote jadi admin.
-- Perubahan profil (termasuk role) hanya via admin. UI edit profil menyusul
-- lewat endpoint server (otoritas di backend, bukan RLS). Lihat BACKLOG C-07 note.
drop policy if exists "owner update own profile" on public.profiles;
drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles"
on public.profiles for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ============ ACTIVITY LOGS ============
-- Tulis via server API membutuhkan user login (admin operasional). Anon tidak bisa tulis lagi.
drop policy if exists "Allow anyone to insert activity logs" on public.activity_logs;
drop policy if exists "Allow anyone to read activity logs" on public.activity_logs;

drop policy if exists "authenticated insert logs" on public.activity_logs;
create policy "authenticated insert logs"
on public.activity_logs for insert to authenticated
with check (true);

drop policy if exists "admin read logs" on public.activity_logs;
create policy "admin read logs"
on public.activity_logs for select to authenticated
using (public.is_admin());

-- ============ STORAGE: product-images ============
-- Bucket dibuat idempotent (abaikan jika sudah ada dari dashboard)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Baca publik (katalog butuh tampilkan gambar tanpa login)
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

-- Tulis (upload/update/hapus) hanya admin.
-- NOTE: batas 5MB + jpeg/png/webp tetap divalidasi client-side (app/utils/image.ts +
-- ProductForm) seperti sebelumnya; policy DB sengaja hanya batasi peran agar tidak
-- false-deny upload legit (metadata mime/size tidak selalu ada saat policy check).
drop policy if exists "admin write product images" on storage.objects;
create policy "admin write product images"
on storage.objects for all to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());
