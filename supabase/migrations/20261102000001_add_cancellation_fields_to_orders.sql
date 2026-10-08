-- Sprint 4: Menambahkan kolom cancelled_at dan cancellation_reason ke tabel public.orders
alter table public.orders
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;
