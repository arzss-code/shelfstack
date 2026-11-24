-- Seed Lokal ShelfStack (Fase 1 - E-Commerce Platform)
-- Dipakai via: supabase db reset --local (atau run manual di dashboard SQL Editor)
-- Skema: categories, products (dengan category_id, stock, price, image_url)

-- 0. Konfigurasi Lingkungan & Ekstensi Kriptografi
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
set search_path = public, extensions, auth;

-- 1. Seed 5 Kategori Kanonik
insert into public.categories (name, slug, description, image_url, display_order) values
  ('Tech & Gadget', 'tech', 'Audio resolusi tinggi, perangkat pintar nirkabel, keyboard mekanikal, dan adaptor daya presisi.', '/images/products/keyboard-75-black.jpg', 1),
  ('Rumah & Dapur', 'home', 'Peralatan seduh kopi manual, gelas kaca borosilikat tahan panas, dan keramik meja makan minimalis.', '/images/products/dripper-v60-white.jpg', 2),
  ('Furnitur & Ruang Kerja', 'furniture', 'Kursi ergonomis, meja modular solid, dan sistem rak penyimpanan terorganisir untuk ruang kerja.', '/images/products/desk-oak-natural.jpg', 3),
  ('Pakaian & Aksesoris', 'lifestyle', 'Tas selempang harian, kaus katun organik combed, dan jam tangan fungsional berdaya tahan tinggi.', '/images/products/backpack-edc-black.jpg', 4),
  ('Alat Tulis & Kerajinan', 'stationery', 'Pena presisi berbobot mantap, buku catatan bergaris halus, dan penggaris segitiga arsitektural.', '/images/products/journal-grid-green.jpg', 5)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  display_order = excluded.display_order;

-- 2.a Pembersihan Duplikasi & Data Dummy Produk dari Eksekusi Seeder Sebelumnya
-- Menonaktifkan (soft delete) produk duplikat atau dummy yang memiliki nama sama atau ID demo lama.
-- Soft delete menjaga keutuhan foreign key pada riwayat order_items lama.
update public.products
set deleted_at = now()
where id in (8, 10, 11, 12) or name in ('Tambah baru', 'test edit lagi', 'tambah edit', 'Produk baru lagi');

with duplicates as (
  select id,
         row_number() over (partition by name order by id asc) as rn
  from public.products
  where deleted_at is null
)
update public.products
set deleted_at = now()
where id in (
  select id from duplicates where rn > 1
);

-- 2.b Seed Produk Kurasi ShelfStack
-- Idempoten: Hanya insert jika produk aktif dengan nama yang sama belum ada di database
insert into public.products (name, price, stock, description, image_url, category_id, weight_grams, specs, rating, review_count, sold_count, is_featured)
select
  v.name, v.price, v.stock, v.description, v.image_url, v.category_id, v.weight_grams, v.specs, v.rating, v.review_count, v.sold_count, v.is_featured
from (values
  -- 1. Tech & Gadget
  (
    'Headphone Studio ANC',
    2680000,
    25,
    'Headphone nirkabel resolusi tinggi dengan peredam bising aktif hibrida, driver 40mm berdiafragma berilium, dan bantalan telinga busa memori.',
    '/images/products/headphone-anc-black.jpg',
    (select id from public.categories where slug = 'tech'),
    500,
    '{"driver": "40mm Beryllium", "anc": "Hybrid ANC -40dB", "battery": "38 Hours"}'::jsonb,
    5.00,
    1,
    0,
    false
  ),
  (
    'Keyboard Mekanikal Nirkabel 75%',
    1450000,
    32,
    'Keyboard mekanikal nirkabel 75% dengan sasis aluminium CNC anodized, hot-swappable switches, keycap PBT dye-sublimated, dan peredam suara gasket ganda.',
    '/images/products/keyboard-75-black.jpg',
    (select id from public.categories where slug = 'tech'),
    850,
    '{"konektivitas": "Bluetooth 5.2 / 2.4GHz / Type-C", "layout": "75% Compact (82 Keys)", "baterai": "4000mAh"}'::jsonb,
    4.95,
    24,
    58,
    true
  ),
  (
    'Tetikus Ergonomis Nirkabel Precision',
    890000,
    28,
    'Mouse ergonomis presisi dengan sensor optik 26.000 DPI, roda putar logam elektromagnetik, dan daya tahan baterai hingga 70 hari.',
    '/images/products/mouse-ergonomic-gray.jpg',
    (select id from public.categories where slug = 'tech'),
    140,
    '{"sensor": "Darkfield 26K DPI", "baterai": "500mAh", "konektivitas": "USB / Bluetooth LE"}'::jsonb,
    4.88,
    19,
    42,
    false
  ),
  (
    'Pengisi Daya GaN 100W Multi-Port',
    499000,
    50,
    'Adaptor daya cepat GaN III 100W dengan 3 port USB-C dan 1 port USB-A, mendukung pengisian daya laptop dan smartphone secara simultan.',
    '/images/products/charger-gan-black.jpg',
    (select id from public.categories where slug = 'tech'),
    220,
    '{"daya_maksimal": "100W Power Delivery 3.0", "port": "3x USB-C + 1x USB-A"}'::jsonb,
    4.92,
    36,
    85,
    false
  ),
  (
    'Stand Laptop Ergonomis Aluminium',
    320000,
    4,
    'Dudukan laptop berbahan aluminium aeronautika dengan sirkulasi udara optimal dan kemiringan ergonomis untuk mengurangi ketegangan leher.',
    '/images/products/laptop-stand-silver.jpg',
    (select id from public.categories where slug = 'tech'),
    650,
    '{"material": "Anodized Aircraft Aluminum", "kompatibilitas": "Laptop 11-17 inci"}'::jsonb,
    4.85,
    15,
    34,
    false
  ),

  -- 2. Furnitur & Ruang Kerja
  (
    'Lampu Meja Task Aluminium',
    850000,
    18,
    'Lampu meja fleksibel berbahan aluminium anodized dengan kontrol sentuh peredupan halus dan temperatur cahaya alami.',
    '/images/products/lamp-task-black.jpg',
    (select id from public.categories where slug = 'furniture'),
    1200,
    '{"material": "Anodized Aluminum", "temperature": "2700K - 6500K", "cct": "Stepless Dimming"}'::jsonb,
    4.90,
    14,
    26,
    false
  ),
  (
    'Meja Kerja Modular Solid Oak',
    3250000,
    8,
    'Meja kerja minimalis permukaan kayu solid oak berperekat ramah lingkungan, rangka baja kokoh berlapis powder coating, dan tray manajemen kabel.',
    '/images/products/desk-oak-natural.jpg',
    (select id from public.categories where slug = 'furniture'),
    24000,
    '{"dimensi": "140cm x 70cm x 75cm", "material_top": "Solid White Oak Wood", "kapasitas": "120 kg"}'::jsonb,
    5.00,
    11,
    18,
    true
  ),
  (
    'Kursi Ergonomis Mesh Pro',
    2890000,
    14,
    'Kursi kerja ergonomis dengan sandaran punggung jaring elastis, penopang lumbar adaptif 3D, dan mekanisme sinkronisasi multi-posisi.',
    '/images/products/chair-mesh-black.jpg',
    (select id from public.categories where slug = 'furniture'),
    18500,
    '{"sandaran": "Korean Breathable Mesh", "lumbar": "Dynamic 3D Adaptive", "gaslift": "Class-4"}'::jsonb,
    4.90,
    28,
    45,
    false
  ),
  (
    'Tatakan Monitor Kayu Walnut',
    680000,
    22,
    'Stand monitor ganda berbahan kayu walnut alami dengan rak bawah aluminium untuk menyimpan keyboard dan perlengkapan meja kerja.',
    '/images/products/monitor-stand-walnut.jpg',
    (select id from public.categories where slug = 'furniture'),
    2800,
    '{"dimensi": "105cm x 23cm x 11cm", "material": "American Solid Walnut Wood"}'::jsonb,
    4.88,
    20,
    39,
    false
  ),
  (
    'Desk Mat Kulit Vegan Minimalis',
    210000,
    3,
    'Alas meja kerja kulit vegan premium tahan tumpahan air, permukaan halus untuk pergerakan mouse presisi, dan lapisan dasar suede anti-slip.',
    '/images/products/desk-mat-black.jpg',
    (select id from public.categories where slug = 'furniture'),
    480,
    '{"dimensi": "80cm x 40cm", "material": "PU Vegan Leather + Cork Backing"}'::jsonb,
    4.82,
    14,
    51,
    false
  ),

  -- 3. Rumah & Dapur
  (
    'Ketel Leher Angsa Matte Black',
    780000,
    15,
    'Ketel seduh pour-over presisi dengan cerat leher angsa, termometer terintegrasi, dan pegangan kayu walnut ergonomis.',
    '/images/products/kettle-gooseneck-black.jpg',
    (select id from public.categories where slug = 'home'),
    800,
    '{"kapasitas": "1000 ml", "material": "Stainless Steel 304", "finishing": "Matte Powder Coating"}'::jsonb,
    4.90,
    19,
    33,
    false
  ),
  (
    'Dripper Kopi Keramik Pour-Over V60',
    285000,
    35,
    'Alat seduh kopi keramik manual dengan alur spiral internal untuk laju aliran air seimbang dan ekstraksi aroma kopi yang kaya.',
    '/images/products/dripper-v60-white.jpg',
    (select id from public.categories where slug = 'home'),
    420,
    '{"material": "Arita Ceramic Porcelain", "kapasitas": "1-4 Cups", "perawatan": "Dishwasher Safe"}'::jsonb,
    4.94,
    31,
    72,
    false
  ),
  (
    'Penggiling Kopi Manual Stainless Steel',
    460000,
    20,
    'Penggiling biji kopi tangan dengan mata pisau kerucut stainless 420 presisi dan poros ganda untuk keseragaman gilingan espresso hingga pour-over.',
    '/images/products/coffee-grinder-silver.jpg',
    (select id from public.categories where slug = 'home'),
    580,
    '{"mata_burr": "CNC 420 Stainless Steel", "kapasitas": "30g Beans"}'::jsonb,
    4.90,
    22,
    48,
    false
  ),
  (
    'Gelas Kaca Borosilikat Double-Wall 350ml',
    125000,
    60,
    'Cangkir kopi kaca dinding ganda tahan panas borosilikat, menjaga suhu minuman hangat atau dingin tanpa kondensasi pada dinding luar.',
    '/images/products/glass-borosilicate-clear.jpg',
    (select id from public.categories where slug = 'home'),
    210,
    '{"kapasitas": "350 ml", "material": "Borosilicate Glass (-20°C to 150°C)"}'::jsonb,
    4.86,
    42,
    110,
    false
  ),
  (
    'Wadah Biji Kopi Kedap Udara Vakum',
    240000,
    45,
    'Toples penyimpanan kopi dengan katup pelepas gas CO2 satu arah dan segel silikon rapat untuk menjaga kesegaran roasted beans.',
    '/images/products/coffee-canister-black.jpg',
    (select id from public.categories where slug = 'home'),
    390,
    '{"kapasitas": "500 gram (1.2L)", "material": "Stainless Steel 304"}'::jsonb,
    4.88,
    18,
    36,
    false
  ),

  -- 4. Pakaian & Aksesoris
  (
    'Tas Komuter EDC Ballistic',
    1120000,
    12,
    'Tas komuter harian berkapasitas 20L dengan material nilon Cordura 1000D anti air, ritsleting YKK AquaGuard, dan kompartemen laptop 16 inci empuk.',
    '/images/products/backpack-edc-black.jpg',
    (select id from public.categories where slug = 'lifestyle'),
    850,
    '{"material": "Cordura 1000D Nylon", "kapasitas": "20 Liter", "ritsleting": "YKK AquaGuard"}'::jsonb,
    4.90,
    21,
    35,
    false
  ),
  (
    'Dompet Kartu Kulit Nabati Slim',
    295000,
    30,
    'Dompet kartu saku tipis berbahan kulit sapi nabati dengan lapisan pemblokir RFID, 6 slot kartu, dan kompartemen uang tunai lipat.',
    '/images/products/wallet-leather-tan.jpg',
    (select id from public.categories where slug = 'lifestyle'),
    85,
    '{"material": "Vegetable Tanned Leather", "fitur": "RFID Blocking Protection"}'::jsonb,
    4.91,
    27,
    64,
    false
  ),
  (
    'Jam Tangan Lapangan Otomatis Field Watch',
    1850000,
    10,
    'Jam tangan bergaya militer dengan kaca kristal safir anti gores, mesin otomatis 24 permata, jarum berpendar superluminova, dan strap kanvas tahan air.',
    '/images/products/field-watch-black.jpg',
    (select id from public.categories where slug = 'lifestyle'),
    160,
    '{"diameter": "38 mm", "kaca": "Sapphire Crystal AR", "water_resistance": "100m / 10 ATM"}'::jsonb,
    4.96,
    16,
    29,
    true
  ),
  (
    'Kaus Katun Organik Heavyweight 240gsm',
    195000,
    50,
    'Kaus oblong kasual berbahan 100% serat katun organik pilihan dengan gramasi padat 240gsm, berpotongan santai dan tahan susut.',
    '/images/products/tshirt-heavyweight-white.jpg',
    (select id from public.categories where slug = 'lifestyle'),
    280,
    '{"gramasi": "240 GSM Heavyweight Cotton", "sertifikasi": "GOTS Organic"}'::jsonb,
    4.84,
    38,
    95,
    false
  ),
  (
    'Topi Baseball Katun Washed Unstructured',
    165000,
    40,
    'Topi 6-panel klasik berbahan katun twill washed yang lembut dengan gesper pengatur kuningan antik di bagian belakang.',
    '/images/products/cap-baseball-black.jpg',
    (select id from public.categories where slug = 'lifestyle'),
    95,
    '{"material": "100% Washed Cotton Twill", "penutup": "Antique Brass Slider"}'::jsonb,
    4.80,
    21,
    47,
    false
  ),

  -- 5. Alat Tulis & Kerajinan
  (
    'Pena Gel Presisi Titanium',
    340000,
    40,
    'Pena berbahan bodi titanium padat dengan mekanisme bolt-action tahan banting dan isi ulang standar internasional Schmidt EasyFlow.',
    '/images/products/pen-titanium-black.jpg',
    (select id from public.categories where slug = 'stationery'),
    65,
    '{"material": "Grade 5 Titanium", "mekanisme": "Bolt-Action", "refill": "Schmidt EasyFlow 9000"}'::jsonb,
    4.95,
    28,
    62,
    false
  ),
  (
    'Jurnal Grid Hardcover Kertas 120gsm',
    175000,
    55,
    'Buku catatan bersampul kain linen hardcover dengan 192 halaman kertas dot grid 120gsm bebas asam yang ramah terhadap tinta pena basah.',
    '/images/products/journal-grid-green.jpg',
    (select id from public.categories where slug = 'stationery'),
    410,
    '{"ukuran": "A5 (148 x 210 mm)", "kertas": "120 GSM Acid-Free", "halaman": "192 Pages Dot Grid"}'::jsonb,
    4.93,
    35,
    88,
    false
  ),
  (
    'Penggaris Segitiga Arsitek Aluminium',
    135000,
    70,
    'Penggaris skala drafting arsitektural paduan aluminium padat dengan grafir angka laser tahan luntur dan kode warna pada setiap sisinya.',
    '/images/products/ruler-architect-black.jpg',
    (select id from public.categories where slug = 'stationery'),
    130,
    '{"panjang": "30 cm", "material": "Solid Anodized Aluminum Alloy"}'::jsonb,
    4.89,
    19,
    53,
    false
  ),
  (
    'Tempat Pensil Kulit Gulung Handcrafted',
    240000,
    25,
    'Gulungan tempat alat tulis berbahan kulit asli samak nabati dengan 5 slot elastis untuk pena favorit dan tali pengikat kulit melingkar.',
    '/images/products/pencil-roll-brown.jpg',
    (select id from public.categories where slug = 'stationery'),
    145,
    '{"material": "Crazy Horse Genuine Leather", "kapasitas": "5-6 Pens"}'::jsonb,
    4.87,
    17,
    39,
    false
  ),
  (
    'Klip Kertas Kuningan Solid Vintage (Set 10)',
    85000,
    90,
    'Set 10 klip penjepit berkas dari kuningan murni tanpa lapisan cat yang akan menua membentuk patina anggun seiring waktu pemakaian.',
    '/images/products/clips-brass-vintage.jpg',
    (select id from public.categories where slug = 'stationery'),
    90,
    '{"material": "Solid Brass", "isi": "10 Pcs Klip", "finishing": "Brushed Patina"}'::jsonb,
    4.85,
    29,
    76,
    false
  )
) as v(name, price, stock, description, image_url, category_id, weight_grams, specs, rating, review_count, sold_count, is_featured)
where not exists (
  select 1 from public.products p
  where p.name = v.name and p.deleted_at is null
);

-- 2.c Seed Varian Produk Dinamis (Product Variants)
insert into public.product_variants (product_id, sku, name, attributes, price_cents, stock)
select
  p.id,
  v.sku,
  v.name,
  v.attributes::jsonb,
  v.price_cents,
  v.stock
from (values
  ('Keyboard Mekanikal Nirkabel 75%', 'SS-KBD-75-BLK', 'Matte Obsidian', '{"color": "Matte Obsidian", "colorClass": "bg-[#18181b]", "image_url": "/images/products/keyboard-75-black.jpg"}', 145000000, 16),
  ('Keyboard Mekanikal Nirkabel 75%', 'SS-KBD-75-WHT', 'Chalk White', '{"color": "Chalk White", "colorClass": "bg-[#f4f4f5]", "image_url": "/images/products/keyboard-75-white.jpg"}', 145000000, 10),
  ('Keyboard Mekanikal Nirkabel 75%', 'SS-KBD-75-NVY', 'Midnight Navy', '{"color": "Midnight Navy", "colorClass": "bg-[#1e293b]", "image_url": "/images/products/keyboard-75-navy.jpg"}', 149000000, 6),
  ('Headphone Studio ANC', 'SS-HD-ANC-BLK', 'Midnight Black', '{"color": "Midnight Black", "colorClass": "bg-[#141414]", "image_url": "/images/products/headphone-anc-black.jpg"}', 268000000, 15),
  ('Headphone Studio ANC', 'SS-HD-ANC-SLV', 'Silver Titanium', '{"color": "Silver Titanium", "colorClass": "bg-[#d4d4d8]", "image_url": "/images/products/headphone-anc-silver.jpg"}', 278000000, 10),
  ('Tetikus Ergonomis Nirkabel Precision', 'SS-MOU-PRC-GRY', 'Space Gray', '{"color": "Space Gray", "colorClass": "bg-[#3f3f46]", "image_url": "/images/products/mouse-ergonomic-gray.jpg"}', 89000000, 16),
  ('Tetikus Ergonomis Nirkabel Precision', 'SS-MOU-PRC-WHT', 'Off White', '{"color": "Off White", "colorClass": "bg-[#f5f5f4]", "image_url": "/images/products/mouse-ergonomic-white.jpg"}', 89000000, 12),
  ('Pengisi Daya GaN 100W Multi-Port', 'SS-CHG-GAN-BLK', 'Stealth Black', '{"color": "Stealth Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/charger-gan-black.jpg"}', 49900000, 28),
  ('Pengisi Daya GaN 100W Multi-Port', 'SS-CHG-GAN-WHT', 'Arctic White', '{"color": "Arctic White", "colorClass": "bg-[#fafafa]", "image_url": "/images/products/charger-gan-white.jpg"}', 49900000, 22),
  ('Stand Laptop Ergonomis Aluminium', 'SS-LST-ALM-SLV', 'Space Silver', '{"color": "Space Silver", "colorClass": "bg-[#e2e8f0]", "image_url": "/images/products/laptop-stand-silver.jpg"}', 32000000, 2),
  ('Stand Laptop Ergonomis Aluminium', 'SS-LST-ALM-DGR', 'Space Gray', '{"color": "Space Gray", "colorClass": "bg-[#475569]", "image_url": "/images/products/laptop-stand-gray.jpg"}', 32000000, 2),
  ('Meja Kerja Modular Solid Oak', 'SS-DSK-OAK-NAT', 'Natural Oak', '{"color": "Natural Oak", "colorClass": "bg-[#d97706]", "image_url": "/images/products/desk-oak-natural.jpg"}', 325000000, 5),
  ('Meja Kerja Modular Solid Oak', 'SS-DSK-OAK-WLN', 'Deep Walnut', '{"color": "Deep Walnut", "colorClass": "bg-[#451a03]", "image_url": "/images/products/desk-oak-walnut.jpg"}', 345000000, 3),
  ('Kursi Ergonomis Mesh Pro', 'SS-CHR-MSH-BLK', 'All Black', '{"color": "All Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/chair-mesh-black.jpg"}', 289000000, 8),
  ('Kursi Ergonomis Mesh Pro', 'SS-CHR-MSH-GRY', 'Slate Gray', '{"color": "Slate Gray", "colorClass": "bg-[#9ca3af]", "image_url": "/images/products/chair-mesh-gray.jpg"}', 299000000, 6),
  ('Lampu Meja Task Aluminium', 'SS-LMP-ALM-BLK', 'Matte Black', '{"color": "Matte Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/lamp-task-black.jpg"}', 85000000, 10),
  ('Lampu Meja Task Aluminium', 'SS-LMP-ALM-WHT', 'Pure White', '{"color": "Pure White", "colorClass": "bg-[#f8fafc]", "image_url": "/images/products/lamp-task-white.jpg"}', 85000000, 8),
  ('Tatakan Monitor Kayu Walnut', 'SS-MNT-STN-WLN', 'American Walnut', '{"color": "American Walnut", "colorClass": "bg-[#451a03]", "image_url": "/images/products/monitor-stand-walnut.jpg"}', 68000000, 12),
  ('Tatakan Monitor Kayu Walnut', 'SS-MNT-STN-OAK', 'White Oak', '{"color": "White Oak", "colorClass": "bg-[#d97706]", "image_url": "/images/products/monitor-stand-oak.jpg"}', 68000000, 10),
  ('Desk Mat Kulit Vegan Minimalis', 'SS-MAT-DSK-BLK', 'Carbon Black', '{"color": "Carbon Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/desk-mat-black.jpg"}', 21000000, 2),
  ('Desk Mat Kulit Vegan Minimalis', 'SS-MAT-DSK-BRN', 'Cognac Brown', '{"color": "Cognac Brown", "colorClass": "bg-[#78350f]", "image_url": "/images/products/desk-mat-brown.jpg"}', 21000000, 1),
  ('Ketel Leher Angsa Matte Black', 'SS-KTL-GSN-BLK', 'Matte Black', '{"color": "Matte Black", "colorClass": "bg-[#1c1917]", "image_url": "/images/products/kettle-gooseneck-black.jpg"}', 78000000, 15),
  ('Dripper Kopi Keramik Pour-Over V60', 'SS-DRP-V60-WHT', 'Chalk White', '{"color": "Chalk White", "colorClass": "bg-[#f8fafc]", "image_url": "/images/products/dripper-v60-white.jpg"}', 28500000, 20),
  ('Dripper Kopi Keramik Pour-Over V60', 'SS-DRP-V60-BLK', 'Matte Black', '{"color": "Matte Black", "colorClass": "bg-[#1c1917]", "image_url": "/images/products/dripper-v60-black.jpg"}', 28500000, 15),
  ('Gelas Kaca Borosilikat Double-Wall 350ml', 'SS-GLS-BWL-350', 'Clear Borosilicate', '{"color": "Clear Glass", "colorClass": "bg-[#e2e8f0]", "image_url": "/images/products/glass-borosilicate-clear.jpg"}', 12500000, 40),
  ('Gelas Kaca Borosilikat Double-Wall 350ml', 'SS-GLS-BWL-AMB', 'Warm Amber', '{"color": "Warm Amber", "colorClass": "bg-[#d97706]", "image_url": "/images/products/glass-borosilicate-amber.jpg"}', 13500000, 20),
  ('Penggiling Kopi Manual Stainless Steel', 'SS-GRN-MNL-SLV', 'Brushed Silver', '{"color": "Brushed Silver", "colorClass": "bg-[#cbd5e1]", "image_url": "/images/products/coffee-grinder-silver.jpg"}', 46000000, 12),
  ('Penggiling Kopi Manual Stainless Steel', 'SS-GRN-MNL-BLK', 'Matte Obsidian', '{"color": "Matte Obsidian", "colorClass": "bg-[#1c1917]", "image_url": "/images/products/coffee-grinder-black.jpg"}', 46000000, 8),
  ('Wadah Biji Kopi Kedap Udara Vakum', 'SS-CAN-VKM-BLK', 'Matte Black', '{"color": "Matte Black", "colorClass": "bg-[#1c1917]", "image_url": "/images/products/coffee-canister-black.jpg"}', 24000000, 25),
  ('Wadah Biji Kopi Kedap Udara Vakum', 'SS-CAN-VKM-SLV', 'Stainless Steel', '{"color": "Stainless Steel", "colorClass": "bg-[#cbd5e1]", "image_url": "/images/products/coffee-canister-silver.jpg"}', 24000000, 20),
  ('Tas Komuter EDC Ballistic', 'SS-BAG-EDC-BLK', 'Tactical Black', '{"color": "Tactical Black", "colorClass": "bg-[#09090b]", "image_url": "/images/products/backpack-edc-black.jpg"}', 112000000, 8),
  ('Tas Komuter EDC Ballistic', 'SS-BAG-EDC-GRN', 'Olive Green', '{"color": "Olive Green", "colorClass": "bg-[#3f4e38]", "image_url": "/images/products/backpack-edc-green.jpg"}', 112000000, 4),
  ('Dompet Kartu Kulit Nabati Slim', 'SS-WLT-VGT-BRN', 'Cognac Tan', '{"color": "Cognac Tan", "colorClass": "bg-[#92400e]", "image_url": "/images/products/wallet-leather-tan.jpg"}', 29500000, 18),
  ('Dompet Kartu Kulit Nabati Slim', 'SS-WLT-VGT-BLK', 'Tactical Black', '{"color": "Tactical Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/wallet-leather-black.jpg"}', 29500000, 12),
  ('Jam Tangan Lapangan Otomatis Field Watch', 'SS-WTC-FLD-OLV', 'Olive Drab', '{"color": "Olive Drab", "colorClass": "bg-[#3f4e38]", "image_url": "/images/products/field-watch-olive.jpg"}', 185000000, 6),
  ('Jam Tangan Lapangan Otomatis Field Watch', 'SS-WTC-FLD-BLK', 'Stealth Black', '{"color": "Stealth Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/field-watch-black.jpg"}', 185000000, 4),
  ('Kaus Katun Organik Heavyweight 240gsm', 'SS-TSH-HVY-WHT', 'Off White', '{"color": "Off White", "colorClass": "bg-[#f4f4f5]", "image_url": "/images/products/tshirt-heavyweight-white.jpg"}', 19500000, 28),
  ('Kaus Katun Organik Heavyweight 240gsm', 'SS-TSH-HVY-BLK', 'Deep Black', '{"color": "Deep Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/tshirt-heavyweight-black.jpg"}', 19500000, 22),
  ('Topi Baseball Katun Washed Unstructured', 'SS-CAP-BSB-BLK', 'Washed Black', '{"color": "Washed Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/cap-baseball-black.jpg"}', 16500000, 24),
  ('Topi Baseball Katun Washed Unstructured', 'SS-CAP-BSB-KHK', 'Vintage Khaki', '{"color": "Vintage Khaki", "colorClass": "bg-[#d4b996]", "image_url": "/images/products/cap-baseball-khaki.jpg"}', 16500000, 16),
  ('Jurnal Grid Hardcover Kertas 120gsm', 'SS-JRN-GRD-GRN', 'Forest Green', '{"color": "Forest Green", "colorClass": "bg-[#14532d]", "image_url": "/images/products/journal-grid-green.jpg"}', 17500000, 30),
  ('Jurnal Grid Hardcover Kertas 120gsm', 'SS-JRN-GRD-BLK', 'Stonewashed Black', '{"color": "Stonewashed Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/journal-grid-black.jpg"}', 17500000, 25),
  ('Pena Gel Presisi Titanium', 'SS-PEN-TTN-RAW', 'Raw Titanium', '{"color": "Raw Titanium", "colorClass": "bg-[#71717a]", "image_url": "/images/products/pen-titanium-raw.jpg"}', 34000000, 25),
  ('Pena Gel Presisi Titanium', 'SS-PEN-TTN-BLK', 'DLC Matte Black', '{"color": "DLC Matte Black", "colorClass": "bg-[#18181b]", "image_url": "/images/products/pen-titanium-black.jpg"}', 36000000, 20),
  ('Tempat Pensil Kulit Gulung Handcrafted', 'SS-PNC-RLL-BRN', 'Crazy Horse Brown', '{"color": "Crazy Horse Brown", "colorClass": "bg-[#78350f]", "image_url": "/images/products/pencil-roll-brown.jpg"}', 24000000, 15),
  ('Tempat Pensil Kulit Gulung Handcrafted', 'SS-PNC-RLL-TAN', 'Natural Tan', '{"color": "Natural Tan", "colorClass": "bg-[#b45309]", "image_url": "/images/products/pencil-roll-tan.jpg"}', 24000000, 10),
  ('Penggaris Segitiga Arsitek Aluminium', 'SS-RLR-ARC-BLK', 'Matte Black Anodized', '{"color": "Matte Black Anodized", "colorClass": "bg-[#18181b]", "image_url": "/images/products/ruler-architect-black.jpg"}', 13500000, 70),
  ('Klip Kertas Kuningan Solid Vintage (Set 10)', 'SS-CLP-BRS-VNT', 'Brushed Brass', '{"color": "Brushed Brass", "colorClass": "bg-[#ca8a04]", "image_url": "/images/products/clips-brass-vintage.jpg"}', 8500000, 90)
) as v(prod_name, sku, name, attributes, price_cents, stock)
join public.products p on p.name = v.prod_name and p.deleted_at is null
on conflict (sku) do update set
  name = excluded.name,
  attributes = excluded.attributes,
  price_cents = excluded.price_cents,
  stock = excluded.stock;

-- 3. Seed Akun Demo Deterministik untuk Pengujian & Evaluasi Portofolio
-- PERINGATAN: Akun demo ini HANYA untuk lingkungan pengujian/portofolio lokal & staging.
-- Password default: Password123!

-- 3.a Bersihkan identitas auth lama untuk akun demo agar provider_id diperbaiki ke UUID valid
delete from auth.identities
where user_id in (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000099'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000098'::uuid
);

-- 3.b Insert/Update Akun Pengguna auth.users
-- PENTING: GoTrue mewajibkan kolom bertipe string (confirmation_token, recovery_token, email_change,
-- email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
-- bernilai string kosong ('') dan BUKAN NULL agar sql.Scan Go tidak melempar "Database error querying schema".
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token
) values
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'demo-customer@shelfstack.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Demo Customer", "email_verified": true}'::jsonb,
    now(),
    now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000099'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'demo-admin@shelfstack.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Demo Admin", "role": "admin", "email_verified": true}'::jsonb,
    now(),
    now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'customer@shelfstack.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Customer (Legacy)", "email_verified": true}'::jsonb,
    now(),
    now(),
    '', '', '', '', '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000098'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'admin@shelfstack.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Admin (Legacy)", "role": "admin", "email_verified": true}'::jsonb,
    now(),
    now(),
    '', '', '', '', '', '', '', ''
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  confirmation_token = coalesce(auth.users.confirmation_token, ''),
  recovery_token = coalesce(auth.users.recovery_token, ''),
  email_change = coalesce(auth.users.email_change, ''),
  email_change_token_new = coalesce(auth.users.email_change_token_new, ''),
  email_change_token_current = coalesce(auth.users.email_change_token_current, ''),
  phone_change = coalesce(auth.users.phone_change, ''),
  phone_change_token = coalesce(auth.users.phone_change_token, ''),
  reauthentication_token = coalesce(auth.users.reauthentication_token, ''),
  updated_at = now();

-- 4. Seed Identitas GoTrue (auth.identities) dengan provider_id UUID yang benar
-- Catatan teknis: GoTrue mencocokkan provider_id dengan user.id (UUID string) untuk email provider
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '{"sub": "00000000-0000-0000-0000-000000000001", "email": "demo-customer@shelfstack.local", "email_verified": true, "phone_verified": false}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000001',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000099',
    '00000000-0000-0000-0000-000000000099'::uuid,
    '{"sub": "00000000-0000-0000-0000-000000000099", "email": "demo-admin@shelfstack.local", "email_verified": true, "phone_verified": false}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000099',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002'::uuid,
    '{"sub": "00000000-0000-0000-0000-000000000002", "email": "customer@shelfstack.local", "email_verified": true, "phone_verified": false}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000002',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000098',
    '00000000-0000-0000-0000-000000000098'::uuid,
    '{"sub": "00000000-0000-0000-0000-000000000098", "email": "admin@shelfstack.local", "email_verified": true, "phone_verified": false}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000098',
    now(),
    now(),
    now()
  )
on conflict (id) do update set
  provider_id = excluded.provider_id,
  identity_data = excluded.identity_data,
  updated_at = now();

-- 5. Sinkronisasi Data Profil & Role Otorisasi
insert into public.profiles (user_id, full_name, role)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Demo Customer', 'customer'),
  ('00000000-0000-0000-0000-000000000099'::uuid, 'Demo Admin', 'admin'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'Customer (Legacy)', 'customer'),
  ('00000000-0000-0000-0000-000000000098'::uuid, 'Admin (Legacy)', 'admin')
on conflict (user_id) do update set
  role = excluded.role,
  full_name = excluded.full_name;

-- 6. Seed Kupon Promo & Voucher Diskon (SHF-VOUCHER)
insert into public.coupons (
  id,
  code,
  name,
  description,
  discount_type,
  discount_value,
  max_discount_cents,
  min_purchase_cents,
  usage_limit,
  usage_count,
  user_limit,
  is_active
) values
  (
    'c0000000-0000-0000-0000-000000000001'::uuid,
    'WELCOME10',
    'Diskon Pengguna Baru 10%',
    'Potongan 10% maksimum Rp 50.000 untuk transaksi belanja pertama.',
    'percentage',
    10,
    5000000,
    10000000,
    1000,
    1,
    1,
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000002'::uuid,
    'SHELF50K',
    'Potongan Belanja Rp 50.000',
    'Diskon potongan langsung Rp 50.000 dengan minimal belanja Rp 300.000.',
    'fixed',
    5000000,
    5000000,
    30000000,
    500,
    0,
    1,
    true
  ),
  (
    'c0000000-0000-0000-0000-000000000003'::uuid,
    'FREESHIP',
    'Voucher Bebas Ongkir',
    'Potongan ongkos kirim hingga Rp 15.000 untuk pengiriman reguler.',
    'fixed',
    1500000,
    1500000,
    15000000,
    1000,
    0,
    2,
    true
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  discount_value = excluded.discount_value,
  is_active = excluded.is_active;

-- 7. Seed Riwayat Pesanan 5 Status Lifecycle & Rincian Item (Fase 3 & 4)
-- Menggunakan alamat pelanggan kanonis:
-- Demo Customer, 081234567890, Jl. MH Thamrin No. 28, Menteng, Jakarta Pusat 10350
insert into public.orders (
  id,
  user_id,
  total_cents,
  subtotal_cents,
  discount_cents,
  shipping_cost_cents,
  shipping_service,
  status,
  address,
  snap_token,
  payment_type,
  tracking_number,
  courier_code,
  courier_name,
  paid_at,
  shipped_at,
  delivered_at,
  cancelled_at,
  cancellation_reason,
  created_at,
  updated_at
) values
  (
    'e0000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    380000000,
    380000000,
    0,
    0,
    'reguler',
    'completed',
    '{"name": "Demo Customer", "phone": "081234567890", "street": "Jl. MH Thamrin No. 28, Menteng", "city": "Jakarta Pusat", "postal": "10350", "note": "Titip di resepsionis lobi utama"}'::jsonb,
    'demo-snap-token-completed-01',
    'bank_transfer',
    'SS-JNE-1731000001',
    'jne',
    'JNE Express',
    now() - interval '5 days',
    now() - interval '4 days',
    now() - interval '2 days',
    null,
    null,
    now() - interval '5 days',
    now() - interval '2 days'
  ),
  (
    'e0000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    86500000,
    85000000,
    0,
    1500000,
    'reguler',
    'shipped',
    '{"name": "Demo Customer", "phone": "081234567890", "street": "Jl. MH Thamrin No. 28, Menteng", "city": "Jakarta Pusat", "postal": "10350", "note": "Kamar 402"}'::jsonb,
    'demo-snap-token-shipped-02',
    'gopay',
    'SS-SICEPAT-1731000002',
    'sicepat',
    'SiCepat Ekspres',
    now() - interval '2 days',
    now() - interval '1 day',
    null,
    null,
    null,
    now() - interval '2 days',
    now() - interval '1 day'
  ),
  (
    'e0000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    35500000,
    34000000,
    0,
    1500000,
    'reguler',
    'paid',
    '{"name": "Demo Customer", "phone": "081234567890", "street": "Jl. MH Thamrin No. 28, Menteng", "city": "Jakarta Pusat", "postal": "10350"}'::jsonb,
    'demo-snap-token-paid-03',
    'qris',
    null,
    null,
    null,
    now() - interval '6 hours',
    null,
    null,
    null,
    null,
    now() - interval '8 hours',
    now() - interval '6 hours'
  ),
  (
    'e0000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    113500000,
    112000000,
    0,
    1500000,
    'reguler',
    'pending',
    '{"name": "Demo Customer", "phone": "081234567890", "street": "Jl. MH Thamrin No. 28, Menteng", "city": "Jakarta Pusat", "postal": "10350"}'::jsonb,
    'demo-snap-token-pending-04',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    now() - interval '15 minutes',
    now() - interval '15 minutes'
  ),
  (
    'e0000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    79500000,
    78000000,
    0,
    1500000,
    'reguler',
    'cancelled',
    '{"name": "Demo Customer", "phone": "081234567890", "street": "Jl. MH Thamrin No. 28, Menteng", "city": "Jakarta Pusat", "postal": "10350"}'::jsonb,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    now() - interval '1 day',
    'Permintaan pembeli: Ingin mengubah metode pengiriman ekspedisi',
    now() - interval '2 days',
    now() - interval '1 day'
  )
on conflict (id) do nothing;

-- 7.b Seed Item Barang Pesanan (Order Items)
insert into public.order_items (id, order_id, product_id, qty, price_cents)
values
  -- Item Order 1 (Headphone Studio ANC + Tas Komuter)
  (
    'f0000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Headphone Studio ANC' and deleted_at is null order by id asc limit 1),
    1,
    268000000
  ),
  (
    'f0000000-0000-0000-0000-000000000002'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Tas Komuter EDC Ballistic' and deleted_at is null order by id asc limit 1),
    1,
    112000000
  ),
  (
    'f0000000-0000-0000-0000-000000000010'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Keyboard Mekanikal Nirkabel 75%' and deleted_at is null order by id asc limit 1),
    1,
    145000000
  ),
  (
    'f0000000-0000-0000-0000-000000000011'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Tetikus Ergonomis Nirkabel Precision' and deleted_at is null order by id asc limit 1),
    1,
    89000000
  ),
  (
    'f0000000-0000-0000-0000-000000000012'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Meja Kerja Modular Solid Oak' and deleted_at is null order by id asc limit 1),
    1,
    325000000
  ),
  (
    'f0000000-0000-0000-0000-000000000013'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Kursi Ergonomis Mesh Pro' and deleted_at is null order by id asc limit 1),
    1,
    289000000
  ),
  (
    'f0000000-0000-0000-0000-000000000014'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Dripper Kopi Keramik Pour-Over V60' and deleted_at is null order by id asc limit 1),
    1,
    28500000
  ),
  (
    'f0000000-0000-0000-0000-000000000015'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Gelas Kaca Borosilikat Double-Wall 350ml' and deleted_at is null order by id asc limit 1),
    1,
    12500000
  ),
  (
    'f0000000-0000-0000-0000-000000000016'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Dompet Kartu Kulit Nabati Slim' and deleted_at is null order by id asc limit 1),
    1,
    29500000
  ),
  (
    'f0000000-0000-0000-0000-000000000017'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Jam Tangan Lapangan Otomatis Field Watch' and deleted_at is null order by id asc limit 1),
    1,
    185000000
  ),
  (
    'f0000000-0000-0000-0000-000000000018'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Jurnal Grid Hardcover Kertas 120gsm' and deleted_at is null order by id asc limit 1),
    1,
    17500000
  ),
  -- Item Order 2 (Lampu Meja Task Aluminium)
  (
    'f0000000-0000-0000-0000-000000000003'::uuid,
    'e0000000-0000-0000-0000-000000000002'::uuid,
    (select id from public.products where name = 'Lampu Meja Task Aluminium' and deleted_at is null order by id asc limit 1),
    1,
    85000000
  ),
  -- Item Order 3 (Pena Gel Presisi Titanium)
  (
    'f0000000-0000-0000-0000-000000000004'::uuid,
    'e0000000-0000-0000-0000-000000000003'::uuid,
    (select id from public.products where name = 'Pena Gel Presisi Titanium' and deleted_at is null order by id asc limit 1),
    1,
    34000000
  ),
  -- Item Order 4 (Tas Komuter EDC Ballistic)
  (
    'f0000000-0000-0000-0000-000000000005'::uuid,
    'e0000000-0000-0000-0000-000000000004'::uuid,
    (select id from public.products where name = 'Tas Komuter EDC Ballistic' and deleted_at is null order by id asc limit 1),
    1,
    112000000
  ),
  -- Item Order 5 (Ketel Leher Angsa)
  (
    'f0000000-0000-0000-0000-000000000006'::uuid,
    'e0000000-0000-0000-0000-000000000005'::uuid,
    (select id from public.products where name = 'Ketel Leher Angsa Matte Black' and deleted_at is null order by id asc limit 1),
    1,
    78000000
  )
on conflict (id) do nothing;

-- 8. Seed Linimasa Checkpoint Ekspedisi (Shipping Checkpoints)
insert into public.shipping_checkpoints (
  id,
  order_id,
  tracking_number,
  status,
  title,
  description,
  location,
  created_at
) values
  -- Checkpoint Order 1 (Terkirim / Delivered)
  (
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'SS-JNE-1731000001',
    'manifested',
    'Pengiriman Dibuat',
    'Pesanan telah terdaftar di sistem pengiriman JNE Express oleh penjual.',
    'Jakarta Barat',
    now() - interval '4 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000002'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'SS-JNE-1731000001',
    'in_transit',
    'Dalam Perjalanan',
    'Paket sedang dalam perjalanan menuju hub transit logistik Jakarta Pusat.',
    'Hub Transit Jakarta Pusat',
    now() - interval '3 days'
  ),
  (
    'b0000000-0000-0000-0000-000000000003'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'SS-JNE-1731000001',
    'out_for_delivery',
    'Kurir Mengantar Paket',
    'Paket dibawa oleh kurir menuju alamat penerima.',
    'Jakarta Pusat',
    now() - interval '2 days' - interval '4 hours'
  ),
  (
    'b0000000-0000-0000-0000-000000000004'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    'SS-JNE-1731000001',
    'delivered',
    'Paket Diterima',
    'Paket telah diterima oleh penerima (Demo Customer) di lobi utama.',
    'Jakarta Pusat',
    now() - interval '2 days'
  ),
  -- Checkpoint Order 2 (Sedang Dalam Perjalanan / In Transit)
  (
    'b0000000-0000-0000-0000-000000000005'::uuid,
    'e0000000-0000-0000-0000-000000000002'::uuid,
    'SS-SICEPAT-1731000002',
    'manifested',
    'Resi Diterbitkan',
    'Penjual telah menyiapkan paket dan menerbitkan label resi SiCepat Ekspres.',
    'Jakarta Barat',
    now() - interval '1 day' - interval '6 hours'
  ),
  (
    'b0000000-0000-0000-0000-000000000006'::uuid,
    'e0000000-0000-0000-0000-000000000002'::uuid,
    'SS-SICEPAT-1731000002',
    'picked_up',
    'Paket Diambil Kurir',
    'Paket telah diserahterimakan kepada kurir penjemput SiCepat.',
    'Jakarta Barat Drop Point',
    now() - interval '1 day'
  ),
  (
    'b0000000-0000-0000-0000-000000000007'::uuid,
    'e0000000-0000-0000-0000-000000000002'::uuid,
    'SS-SICEPAT-1731000002',
    'in_transit',
    'Transit Sortir Wilayah',
    'Paket sedang diproses di fasilitas sortir utama Jakarta Barat.',
    'Fasilitas Sortir Jakarta',
    now() - interval '10 hours'
  )
on conflict (id) do nothing;

-- 9. Seed Ulasan Produk Terverifikasi (Product Reviews)
insert into public.product_reviews (
  id,
  product_id,
  user_id,
  order_id,
  rating,
  review_text,
  created_at
) values
  (
    'd0000000-0000-0000-0000-000000000001'::uuid,
    (select id from public.products where name = 'Headphone Studio ANC' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Kualitas audio headphone sangat luar biasa detail dan fitur active noise cancellation bekerja optimal meredam kebisingan saat fokus bekerja di kafe.',
    now() - interval '1 day'
  ),
  (
    'd0000000-0000-0000-0000-000000000002'::uuid,
    (select id from public.products where name = 'Tas Komuter EDC Ballistic' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Material nilon Cordura sangat tebal, tahan percikan air hujan deras, dan kompartemen laptop 16 inci empuk aman untuk mobilitas harian.',
    now() - interval '1 day'
  ),
  (
    'd0000000-0000-0000-0000-000000000010'::uuid,
    (select id from public.products where name = 'Keyboard Mekanikal Nirkabel 75%' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Sasis aluminiumnya sangat kokoh dan berat saat ditaruh di meja. Gasket mount-nya bikin suara ketikan empuk dan thock tanpa getaran kopong. Koneksi Bluetooth ke MacBook dan PC mulus berganti.',
    now() - interval '2 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000011'::uuid,
    (select id from public.products where name = 'Tetikus Ergonomis Nirkabel Precision' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Sudut ergonomisnya pas di tangan kanan, ketegangan pergelangan tangan berkurang drastis setelah pemakaian seminggu penuh. Roda scroll logam elektromagnetik sangat presisi untuk navigasi spreadsheet panjang.',
    now() - interval '2 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000012'::uuid,
    (select id from public.products where name = 'Meja Kerja Modular Solid Oak' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Finishing kayu solid oak-nya sangat halus dengan serat alami yang terlihat mewah. Rangka baja sangat stabil tanpa goyangan sama sekali walau menopang dua monitor dan PC berat. Manajemen kabel di kolong meja rapi.',
    now() - interval '3 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000013'::uuid,
    (select id from public.products where name = 'Kursi Ergonomis Mesh Pro' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Jaring mesh-nya sejuk tidak panas di ruangan ber-AC sedang. Penopang lumbar 3D bisa diatur pas di lekukan tulang belakang bawah, duduk 8 jam kerja tetap nyaman.',
    now() - interval '3 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000014'::uuid,
    (select id from public.products where name = 'Dripper Kopi Keramik Pour-Over V60' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Keramik tebal menjaga suhu seduhan air tetap stabil selama proses pour-over. Alur spiralnya mengalirkan air dengan kecepatan yang konsisten. Hasil seduhan bersih dan aroma kopi terekstraksi maksimal.',
    now() - interval '4 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000015'::uuid,
    (select id from public.products where name = 'Gelas Kaca Borosilikat Double-Wall 350ml' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Kaca dinding ganda benar-benar menahan panas dengan sempurna, dipegang tidak panas dan saat diisi es batu tidak ada embun kondensasi di meja kerja.',
    now() - interval '4 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000016'::uuid,
    (select id from public.products where name = 'Dompet Kartu Kulit Nabati Slim' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Kulit nabatinya beraroma alami dan jahitannya rapi sekali. Muat 6 kartu utama dan beberapa lembar uang darurat tanpa membuat kantong celana menggembung.',
    now() - interval '4 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000017'::uuid,
    (select id from public.products where name = 'Jam Tangan Lapangan Otomatis Field Watch' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Kaca kristal safirnya benar-benar tahan gores dan jarum superluminova terbaca jelas di kondisi gelap. Akurasi movement otomatisnya sangat baik untuk pemakaian harian.',
    now() - interval '5 days'
  ),
  (
    'd0000000-0000-0000-0000-000000000018'::uuid,
    (select id from public.products where name = 'Jurnal Grid Hardcover Kertas 120gsm' and deleted_at is null order by id asc limit 1),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    5,
    'Kertas 120gsm sangat tebal, saya tes dengan pena fountain pen tinta basah sama sekali tidak tembus (no bleed-through). Jilid sampul kainnya estetik dan rapi.',
    now() - interval '5 days'
  )
on conflict (product_id, user_id, order_id) do nothing;

-- 10. Seed Pengajuan Komplain & Garansi Retur Pelanggan (Customer RMA)
insert into public.return_requests (
  id,
  order_id,
  user_id,
  reason_type,
  solution_type,
  status,
  customer_notes,
  proof_image_urls,
  refund_amount_cents,
  created_at
) values
  (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'e0000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'defective',
    'replacement',
    'requested',
    'Bantalan telinga kanan sedikit longgar saat unboxing pertama kali. Mohon bantuan penukaran unit baru.',
    array['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80'],
    null,
    now() - interval '1 day'
  )
on conflict (id) do nothing;

-- 11. Seed Percakapan Live Chat Bantuan CS (Support Threads & Messages)
insert into public.support_threads (
  id,
  customer_id,
  status,
  last_message_text,
  last_message_at,
  unread_by_customer_count,
  unread_by_admin_count,
  attached_product_id,
  created_at,
  updated_at
) values
  (
    '90000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'open',
    'Halo CS ShelfStack, apakah Tas Komuter EDC Ballistic muat laptop 16 inci MacBook Pro?',
    now() - interval '30 minutes',
    0,
    1,
    (select id from public.products where name = 'Tas Komuter EDC Ballistic' and deleted_at is null order by id asc limit 1),
    now() - interval '2 hours',
    now() - interval '30 minutes'
  )
on conflict (id) do nothing;

insert into public.support_messages (
  id,
  thread_id,
  sender_type,
  sender_id,
  message_text,
  created_at
) values
  (
    '80000000-0000-0000-0000-000000000001'::uuid,
    '90000000-0000-0000-0000-000000000001'::uuid,
    'system',
    null,
    'Selamat datang di Layanan Pelanggan ShelfStack. Tim representatif kami siap membantu pertanyaan produk dan pesanan Anda.',
    now() - interval '2 hours'
  ),
  (
    '80000000-0000-0000-0000-000000000002'::uuid,
    '90000000-0000-0000-0000-000000000001'::uuid,
    'customer',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Halo CS ShelfStack, apakah Tas Komuter EDC Ballistic muat laptop 16 inci MacBook Pro?',
    now() - interval '30 minutes'
  )
on conflict (id) do nothing;

-- 12. Seed Notifikasi Pelanggan In-App (Notifications)
insert into public.notifications (
  id,
  user_id,
  title,
  message,
  type,
  reference_id,
  reference_url,
  is_read,
  created_at
) values
  (
    '70000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Pesanan Telah Dikirim',
    'Pesanan #E0000002 sedang diantar oleh SiCepat Ekspres dengan nomor resi SS-SICEPAT-1731000002.',
    'order_shipped',
    'e0000000-0000-0000-0000-000000000002',
    '/orders/e0000000-0000-0000-0000-000000000002',
    false,
    now() - interval '1 day'
  ),
  (
    '70000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Pembayaran Pesanan Dikonfirmasi',
    'Pembayaran untuk pesanan #E0000003 telah berhasil diverifikasi.',
    'payment_success',
    'e0000000-0000-0000-0000-000000000003',
    '/orders/e0000000-0000-0000-0000-000000000003',
    true,
    now() - interval '6 hours'
  ),
  (
    '70000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Selamat Datang di ShelfStack',
    'Gunakan kode promo WELCOME10 untuk mendapatkan potongan belanja 10% pada transaksi pertama Anda.',
    'system',
    null,
    '/promos',
    true,
    now() - interval '5 days'
  )
on conflict (id) do nothing;

-- 13. Seed Flash Deals Aktif (Flash Sale Engine Synchronization)
insert into public.flash_deals (
  id,
  product_id,
  promo_price_cents,
  discount_percentage,
  quota,
  claimed,
  starts_at,
  ends_at,
  is_active
)
select
  ('f0000000-0000-0000-0000-00000000000' || p.row_num)::uuid as id,
  p.id as product_id,
  round(coalesce(p.price_cents, (p.price * 100)) * (1 - (15 + ((p.id * 7 + p.row_num * 5) % 21))::numeric / 100)) as promo_price_cents,
  (15 + ((p.id * 7 + p.row_num * 5) % 21)) as discount_percentage,
  20 as quota,
  3 as claimed,
  now() - interval '1 hour' as starts_at,
  now() + interval '23 hours' as ends_at,
  true as is_active
from (
  select id, price, price_cents, row_number() over (order by id asc) as row_num
  from public.products
  where deleted_at is null
  limit 5
) p
on conflict (id) do update set
  promo_price_cents = excluded.promo_price_cents,
  discount_percentage = excluded.discount_percentage,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  is_active = excluded.is_active;
