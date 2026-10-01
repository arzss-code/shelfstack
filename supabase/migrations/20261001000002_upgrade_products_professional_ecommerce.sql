-- Sprint 4 / Fase 3: Upgrade Skema Products Standar E-Commerce Profesional
-- Menambahkan: slug, sku, weight_grams, specs (JSONB), gallery_urls (text[]), rating, review_count, is_featured
-- Serta indeks pencarian B-Tree & GIN.

-- 1. Tambahkan kolom standar e-commerce
alter table public.products
  add column if not exists slug text,
  add column if not exists sku text,
  add column if not exists weight_grams int not null default 500 check (weight_grams > 0),
  add column if not exists specs jsonb not null default '{}'::jsonb,
  add column if not exists gallery_urls text[] not null default '{}'::text[],
  add column if not exists rating numeric(3,2) not null default 5.00 check (rating >= 0 and rating <= 5),
  add column if not exists review_count int not null default 0 check (review_count >= 0),
  add column if not exists is_featured boolean not null default false;

-- 2. Backfill slug otomatis dari name jika masih null
update public.products
set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || id
where slug is null or slug = '';

-- Pastikan kolom slug unique untuk produk aktif (partial unique index)
create unique index if not exists idx_products_slug_active on public.products(slug) where deleted_at is null;

-- 3. Backfill SKU unik untuk setiap produk
update public.products
set sku = 'SHLF-' || upper(substring(coalesce(name, 'PRD') from 1 for 3)) || '-' || lpad(id::text, 4, '0')
where sku is null or sku = '';

create unique index if not exists idx_products_sku on public.products(sku);

-- 4. Backfill gallery_urls dengan image_url utama jika array masih kosong
update public.products
set gallery_urls = array[image_url]
where (gallery_urls is null or array_length(gallery_urls, 1) is null) and image_url is not null;

-- 5. Indeks Performa Tambahan (B-Tree & GIN)
create index if not exists idx_products_category_id on public.products(category_id) where deleted_at is null;
create index if not exists idx_products_price_cents on public.products(price_cents) where deleted_at is null;
create index if not exists idx_products_is_featured on public.products(is_featured) where deleted_at is null;
create index if not exists idx_products_rating on public.products(rating desc) where deleted_at is null;
create index if not exists idx_products_specs_gin on public.products using gin (specs);

-- 6. Trigger auto-slug saat produk baru dibuat tanpa slug
create or replace function public.handle_product_slug()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.slug is null or trim(new.slug) = '' then
    new.slug := lower(regexp_replace(regexp_replace(new.name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || floor(extract(epoch from now()));
  end if;

  if new.sku is null or trim(new.sku) = '' then
    new.sku := 'SHLF-' || upper(substring(new.name from 1 for 3)) || '-' || floor(extract(epoch from now()) % 10000)::text;
  end if;

  return new;
end;
$$;

drop trigger if exists on_product_before_insert on public.products;
create trigger on_product_before_insert
before insert on public.products
for each row execute function public.handle_product_slug();
