-- =========================================================================
-- Sprint 7 / Task 07: Remediate Supabase Security Advisor Findings
-- Date: 2026-10-09
-- Author: Developer [AA]
-- 
-- Remediations:
-- 1. public.activity_logs:
--    - Drop permissive policy "authenticated insert logs" (WITH CHECK (true))
--    - Restrict INSERT to authenticated admins only (WITH CHECK (public.is_admin()))
--    - Revoke table INSERT, UPDATE, DELETE from anon and public
-- 2. public.products:
--    - Drop lingering legacy/unrestricted policies:
--      "Izinkan hapus publik", "Izinkan tambah publik", "Izinkan ubah publik",
--      "Izinkan semua orang menambah data", "Izinkan semua orang mengedit data",
--      "Izinkan semua orang menghapus data"
--    - Revoke direct INSERT, UPDATE, DELETE from anon and public
--    - Enforce public read for active products (deleted_at is null) and admin-only write
-- 3. storage.objects (product-images):
--    - Drop broad SELECT policy "public read product images" that allowed directory listing
--    - Restrict SELECT (listing) to authenticated admins (bucket remains public in storage.buckets
--      so public image GET by URL continues to work without RLS listing exposure)
-- 4. SECURITY DEFINER function EXECUTE grants:
--    - cancel_order(uuid, text): Revoke from public, anon; Grant to authenticated, service_role
--    - create_order: Drop legacy (jsonb, jsonb); Revoke (jsonb, jsonb, text, text) from public, anon;
--      Grant to authenticated, service_role
--    - handle_new_user(): Revoke from public, anon, authenticated (trigger-only)
--    - handle_payment_webhook(uuid, text, text, text): Revoke from public, anon, authenticated;
--      Grant to service_role only
--    - is_admin(): Revoke from public, anon; Grant to authenticated, service_role
--    - trg_record_product_initial_stock(): Revoke from public, anon, authenticated (trigger-only)
--    - trg_record_stock_movement(): Revoke from public, anon, authenticated (trigger-only)
-- =========================================================================

-- =========================================================================
-- 1. PUBLIC.ACTIVITY_LOGS POLICY & PRIVILEGE HARDENING
-- =========================================================================
drop policy if exists "authenticated insert logs" on public.activity_logs;
drop policy if exists "Allow anyone to insert activity logs" on public.activity_logs;
drop policy if exists "Allow anyone to read activity logs" on public.activity_logs;

-- Revoke all mutation privileges from anonymous and public callers
revoke insert, update, delete on public.activity_logs from anon, public;

-- Grant minimal necessary table privileges to authenticated role (RLS guarded)
grant select, insert on public.activity_logs to authenticated;

drop policy if exists "admin insert logs" on public.activity_logs;
create policy "admin insert logs"
on public.activity_logs for insert to authenticated
with check (public.is_admin());

drop policy if exists "admin read logs" on public.activity_logs;
create policy "admin read logs"
on public.activity_logs for select to authenticated
using (public.is_admin());


-- =========================================================================
-- 2. PUBLIC.PRODUCTS POLICY & PRIVILEGE HARDENING
-- =========================================================================
drop policy if exists "Izinkan hapus publik" on public.products;
drop policy if exists "Izinkan tambah publik" on public.products;
drop policy if exists "Izinkan ubah publik" on public.products;
drop policy if exists "Izinkan semua orang membaca data" on public.products;
drop policy if exists "Izinkan semua orang menambah data" on public.products;
drop policy if exists "Izinkan semua orang mengedit data" on public.products;
drop policy if exists "Izinkan semua orang menghapus data" on public.products;

-- Revoke mutation privileges from anonymous and public callers
revoke insert, update, delete on public.products from anon, public;

-- Grant read to anon and authenticated; grant write to authenticated (RLS guarded)
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

alter table public.products enable row level security;

drop policy if exists "public read active products" on public.products;
create policy "public read active products"
on public.products for select to anon, authenticated
using (deleted_at is null);

drop policy if exists "admin write products" on public.products;
create policy "admin write products"
on public.products for all to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================================================
-- 3. STORAGE.OBJECTS (PRODUCT-IMAGES) LISTING RESTRICTION
-- =========================================================================
-- Drop the broad SELECT policy that allowed anonymous and non-admin users to list all bucket objects
drop policy if exists "public read product images" on storage.objects;

-- Grant select on storage.objects to authenticated (RLS guarded)
grant select on storage.objects to authenticated;

-- Only admins may list files in product-images bucket via Storage API
drop policy if exists "admin read product images" on storage.objects;
create policy "admin read product images"
on storage.objects for select to authenticated
using (bucket_id = 'product-images' and public.is_admin());

-- Maintain admin write (upload/update/delete) policy
drop policy if exists "admin write product images" on storage.objects;
create policy "admin write product images"
on storage.objects for all to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());


-- =========================================================================
-- 4. FUNCTION EXECUTE PRIVILEGES HARDENING
-- =========================================================================

-- 4a. cancel_order(uuid, text)
revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated, service_role;

-- 4b. create_order
-- Drop stale 2-argument signature if present
drop function if exists public.create_order(jsonb, jsonb);
-- Restrict canonical 4-argument signature to authenticated and service_role
revoke all on function public.create_order(jsonb, jsonb, text, text) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, text, text) to authenticated, service_role;

-- 4c. handle_new_user() (Trigger function)
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- 4d. handle_payment_webhook(uuid, text, text, text) (Server webhook only)
revoke all on function public.handle_payment_webhook(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.handle_payment_webhook(uuid, text, text, text) to service_role;

-- 4e. is_admin() (RLS evaluation helper)
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- 4f. trg_record_product_initial_stock() (Trigger function)
revoke all on function public.trg_record_product_initial_stock() from public, anon, authenticated;

-- 4g. trg_record_stock_movement() (Trigger function)
revoke all on function public.trg_record_stock_movement() from public, anon, authenticated;
