-- Sprint 2 / Fase 1: fondasi auth + katalog (profiles, categories, kolom baru products).
-- Aman dijalankan berulang (idempotent) via `supabase db push`.
-- Lihat docs/PHASE-1-AUTH-SECURITY.md §1.1

-- 1. Profiles (1-1 ke auth.users, role untuk RBAC)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz default now()
);

-- 2. Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

-- 3. Kolom baru products (Fase 2 butuh stock + category; ADR-003 butuh price_cents)
alter table public.products
  add column if not exists stock int not null default 0,
  add column if not exists category_id uuid references public.categories(id),
  add column if not exists price_cents int;

-- Backfill sekali untuk baris lama (kolom price numeric masih sumber kebenaran di Fase 1-2)
update public.products set price_cents = round((price::numeric) * 100)::int
where price_cents is null;

-- 4. Trigger: sinkronkan price_cents otomatis selama app masih tulis kolom price.
-- Dihapus di Fase 3 saat app menulis price_cents langsung (lihat ADR/003).
create or replace function public.sync_price_cents()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' or new.price is distinct from old.price then
    new.price_cents := round((new.price::numeric) * 100)::int;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_price_cents on public.products;
create trigger sync_price_cents
before insert or update of price on public.products
for each row execute function public.sync_price_cents();

-- 5. Trigger: auto-insert profiles saat user baru daftar (termasuk OAuth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'customer'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 6. Seed kategori dasar (idempotent)
insert into public.categories (name, slug) values
  ('Minuman', 'minuman'),
  ('Makanan', 'makanan'),
  ('Merch', 'merch'),
  ('Aksesoris', 'aksesoris')
on conflict (slug) do nothing;
