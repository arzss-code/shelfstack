-- Sprint 7: Skema Pelacakan Logistik & Nomor Resi Ekspedisi (SHF-LOG-01)
-- Menambahkan kolom nomor resi pada tabel orders dan tabel shipping_checkpoints

-- 1. Penambahan Kolom Pengiriman pada Tabel public.orders
alter table public.orders
  add column if not exists tracking_number text,
  add column if not exists courier_code text,
  add column if not exists courier_name text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

create index if not exists idx_orders_tracking_number on public.orders(tracking_number);

-- 2. Pembuatan Tabel Riwayat Checkpoint Ekspedisi
create table if not exists public.shipping_checkpoints (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  tracking_number text not null,
  status text not null check (status in ('manifested', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned')),
  title text not null,
  description text not null,
  location text not null,
  created_at timestamptz not null default now()
);

-- Indeks untuk pencarian cepat
create index if not exists idx_shipping_checkpoints_order_id on public.shipping_checkpoints(order_id);
create index if not exists idx_shipping_checkpoints_tracking_number on public.shipping_checkpoints(tracking_number);
create index if not exists idx_shipping_checkpoints_created_at on public.shipping_checkpoints(created_at asc);

-- 3. Row Level Security (RLS)
alter table public.shipping_checkpoints enable row level security;

-- Pemilik pesanan dapat membaca checkpoints pengirimannya
drop policy if exists "owner read shipping checkpoints" on public.shipping_checkpoints;
create policy "owner read shipping checkpoints"
on public.shipping_checkpoints for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Admin memiliki akses penuh (SELECT, INSERT, UPDATE, DELETE)
drop policy if exists "admin all shipping checkpoints" on public.shipping_checkpoints;
create policy "admin all shipping checkpoints"
on public.shipping_checkpoints for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Service role bypass untuk endpoint server Nitro
drop policy if exists "service role shipping checkpoints" on public.shipping_checkpoints;
create policy "service role shipping checkpoints"
on public.shipping_checkpoints for all to service_role
using (true)
with check (true);

-- 4. Publikasi Supabase Realtime untuk Perubahan Checkpoint
alter publication supabase_realtime add table public.shipping_checkpoints;
