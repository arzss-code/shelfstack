-- Seed lokal ShelfStack (Fase 0).
-- Dipakai via: supabase db reset --local  (atau copy manual ke dashboard untuk cloud dev)
-- Skema mengikuti tabel products SAAT INI (price numeric, belum ada stock/category).
-- Fase 1 akan menambah seed categories + profiles + mengisi stock.

insert into public.products (name, price, description, link, image_url) values
  ('Kopi Susu 250ml', 18000, 'Kopi susu gula aren, best seller.', null, null),
  ('Croissant Butter', 25000, 'Renyah, buttery, cocok untuk demo badge sisa stok.', null, null),
  ('Tumbler 500ml', 99000, 'Tumbler matte hitam, dipakai untuk demo stok habis di Fase 2.', null, null),
  ('Teh Melati 500ml', 12000, 'Teh melati dingin less sugar.', null, null),
  ('Roti Abon Ayam', 15000, 'Roti lembut isi abon ayam.', null, null),
  ('Topi Bordir Shelf', 75000, 'Topi merch untuk demo kategori di Fase 1.', null, null),
  ('Stiker Pack (5pcs)', 20000, 'Stiker vinyl waterproof.', null, null),
  ('Kopi Tubruk 200gr', 45000, 'Biji kopi tubruk sangrai medium.', null, null)
on conflict do nothing;
