-- Sprint 6 / Fase 5: Tabel Product Reviews and Ratings, Trigger Agregasi, dan RLS
-- Sistem ulasan produk berbasis riwayat pesanan (verified purchase constraint)
-- Mendukung rating 1-5 bintang, review_text 10-1000 karakter, soft delete (deleted_at),
-- dan trigger otomatis untuk menghitung ulang rating dan review_count pada tabel products.

-- 1. TABEL PRODUCT_REVIEWS
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating int not null check (rating >= 1 and rating <= 5),
  review_text text not null check (char_length(review_text) >= 10 and char_length(review_text) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint unique_review_per_order unique (product_id, user_id, order_id)
);

-- Indeks performa untuk lookup produk, user, dan filter rating
create index if not exists idx_product_reviews_product_id
  on public.product_reviews(product_id)
  where deleted_at is null;

create index if not exists idx_product_reviews_user_id
  on public.product_reviews(user_id)
  where deleted_at is null;

create index if not exists idx_product_reviews_product_rating
  on public.product_reviews(product_id, rating)
  where deleted_at is null;

create index if not exists idx_product_reviews_order_id
  on public.product_reviews(order_id);

-- 2. TRIGGER FUNCTION UNTUK REKALKULASI RATING & REVIEW_COUNT PADA PRODUCTS
create or replace function public.recalculate_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_pid bigint;
  calculated_avg numeric(3,2);
  calculated_count int;
begin
  for target_pid in
    select distinct p
    from unnest(array[coalesce(new.product_id, old.product_id), old.product_id]) as p
    where p is not null
  loop
    select
      coalesce(round(avg(rating)::numeric, 2), 5.00),
      count(*)
    into
      calculated_avg,
      calculated_count
    from public.product_reviews
    where product_id = target_pid
      and deleted_at is null;

    update public.products
    set
      rating = calculated_avg,
      review_count = calculated_count
    where id = target_pid;
  end loop;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recalculate_product_rating on public.product_reviews;
create trigger trg_recalculate_product_rating
after insert or update or delete on public.product_reviews
for each row
execute function public.recalculate_product_rating();

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.product_reviews enable row level security;

-- Policy Select: Publik dapat membaca ulasan aktif (deleted_at is null)
drop policy if exists "Public can view active product reviews" on public.product_reviews;
create policy "Public can view active product reviews"
on public.product_reviews
for select
to anon, authenticated
using (deleted_at is null);

-- Policy Insert: Pengguna terautentikasi dapat menambah ulasan miliknya
drop policy if exists "Authenticated users can insert own reviews" on public.product_reviews;
create policy "Authenticated users can insert own reviews"
on public.product_reviews
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Policy Update: Pengguna terautentikasi dapat memperbarui ulasan miliknya (termasuk soft delete)
drop policy if exists "Authenticated users can update own reviews" on public.product_reviews;
create policy "Authenticated users can update own reviews"
on public.product_reviews
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- 4. PERMISSION GRANTS
grant select on public.product_reviews to anon, authenticated;
grant insert, update on public.product_reviews to authenticated;
