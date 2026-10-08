-- Sprint 4: Add sold_count column and enrich social proof data (ratings, reviews, sold count)
alter table public.products
  add column if not exists sold_count int not null default 0 check (sold_count >= 0);

-- Update sample products with realistic social proof
update public.products
set 
  rating = 4.90,
  review_count = 18,
  sold_count = 24,
  is_featured = true
where id = 12;

update public.products
set 
  rating = 4.80,
  review_count = 32,
  sold_count = 45,
  is_featured = false
where id = 11;

update public.products
set 
  rating = 5.00,
  review_count = 12,
  sold_count = 19,
  is_featured = true
where id = 10;

update public.products
set 
  rating = 4.90,
  review_count = 27,
  sold_count = 38,
  is_featured = false
where id = 8;
