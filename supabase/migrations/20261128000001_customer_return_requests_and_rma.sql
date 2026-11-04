-- =========================================================================
-- MIGRATION: 20261128000001_customer_return_requests_and_rma.sql
-- DESCRIPTION: Modul Pengajuan Retur, Komplain & Garansi Pelanggan (Customer RMA)
--              Dilengkapi tabel return_requests, storage bucket return-proofs,
--              dan RLS multi-tenant terisolasi.
-- AUTHOR: AA (Talenavi Engineering Standard)
-- =========================================================================

-- 1. Buat Tabel return_requests
create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  reason_type text not null check (reason_type in ('defective', 'damaged_in_transit', 'wrong_item', 'missing_accessories', 'other')),
  solution_type text not null check (solution_type in ('refund', 'replacement')),
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'item_received', 'completed', 'cancelled')),
  customer_notes text not null,
  proof_image_urls text[] not null default '{}'::text[],
  unboxing_video_url text,
  return_courier text,
  return_tracking_number text,
  replacement_courier text,
  replacement_tracking_number text,
  admin_notes text,
  refund_amount_cents int check (refund_amount_cents is null or refund_amount_cents >= 0),
  restocked_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 2. Indexes untuk performa kueri
create index if not exists idx_return_requests_order_id on public.return_requests(order_id);
create index if not exists idx_return_requests_user_id on public.return_requests(user_id);
create index if not exists idx_return_requests_status on public.return_requests(status);
create index if not exists idx_return_requests_created_at on public.return_requests(created_at desc);

-- 3. Mencegah duplikasi tiket retur aktif untuk pesanan yang sama
create unique index if not exists idx_unique_active_return_per_order
on public.return_requests(order_id)
where deleted_at is null and status not in ('rejected', 'cancelled');

-- 4. Enable Row Level Security (RLS)
alter table public.return_requests enable row level security;

-- 4.a Policy SELECT: Pelanggan membaca miliknya, Admin membaca semua
drop policy if exists "owners and admins can read return_requests" on public.return_requests;
create policy "owners and admins can read return_requests"
on public.return_requests for select to authenticated
using (user_id = auth.uid() or public.is_admin());

-- 4.b Policy INSERT: Pelanggan dapat membuat tiket retur untuk pesanannya sendiri
drop policy if exists "owners can insert return_requests" on public.return_requests;
create policy "owners can insert return_requests"
on public.return_requests for insert to authenticated
with check (user_id = auth.uid());

-- 4.c Policy UPDATE: Pelanggan hanya boleh update saat approved (mengisi resi balik), Admin update semua
drop policy if exists "owners can update tracking when approved" on public.return_requests;
create policy "owners can update tracking when approved"
on public.return_requests for update to authenticated
using (
  (user_id = auth.uid() and status = 'approved')
  or public.is_admin()
)
with check (
  (user_id = auth.uid() and status = 'approved')
  or public.is_admin()
);

-- 5. Konfigurasi Bucket Storage: return-proofs (BARU)
insert into storage.buckets (id, name, public)
values ('return-proofs', 'return-proofs', true)
on conflict (id) do nothing;

-- 6. Storage RLS Policies untuk return-proofs
-- Pelanggan mengunggah file bukti ke path: return-proofs/{user_id}/{filename}
drop policy if exists "users manage own return proofs" on storage.objects;
create policy "users manage own return proofs"
on storage.objects for all to authenticated
using (bucket_id = 'return-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
with check (bucket_id = 'return-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Akses publik untuk membaca bukti gambar
drop policy if exists "public view return proofs" on storage.objects;
create policy "public view return proofs"
on storage.objects for select to public
using (bucket_id = 'return-proofs');
