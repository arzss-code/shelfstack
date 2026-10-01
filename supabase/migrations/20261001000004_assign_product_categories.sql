-- Sprint 4: Assign realistic categories to sample products
-- Memastikan produk sampel terhubung dengan kategori yang valid di tabel categories

update public.products
set category_id = (select id from public.categories where slug = 'tech' limit 1)
where id = 12 and category_id is null;

update public.products
set category_id = (select id from public.categories where slug = 'home' limit 1)
where id = 11 and category_id is null;

update public.products
set category_id = (select id from public.categories where slug = 'furniture' limit 1)
where id = 10 and category_id is null;

update public.products
set category_id = (select id from public.categories where slug = 'lifestyle' limit 1)
where id = 8 and category_id is null;
