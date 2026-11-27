-- =========================================================================
-- Migration: 20261205000001_sync_curated_catalog_studio_images.sql
-- Description: Menyelaraskan image_url kategori, produk kurasi, gallery_urls,
--              dan matrix varian SKU ke aset studio lokal (/images/products/).
--              Idempoten dan mempertahankan stok/harga live varian yang sudah ada.
-- =========================================================================

set search_path = public, pg_temp;

-- 1. Sinkronisasi image_url 5 kategori kanonik ke aset studio lokal
update public.categories c
set image_url = v.image_url
from (values
  ('tech', '/images/products/keyboard-75-black.jpg'),
  ('home', '/images/products/dripper-v60-white.jpg'),
  ('furniture', '/images/products/desk-oak-natural.jpg'),
  ('lifestyle', '/images/products/backpack-edc-black.jpg'),
  ('stationery', '/images/products/journal-grid-green.jpg')
) as v(slug, image_url)
where c.slug = v.slug
  and c.image_url is distinct from v.image_url;

-- 2. Sinkronisasi image_url & gallery_urls seluruh 25 produk kurasi aktif
update public.products p
set
  image_url = v.image_url,
  gallery_urls = v.gallery_urls
from (values
  ('Headphone Studio ANC', '/images/products/headphone-anc-black.jpg', array['/images/products/headphone-anc-black.jpg', '/images/products/headphone-anc-silver.jpg']),
  ('Keyboard Mekanikal Nirkabel 75%', '/images/products/keyboard-75-black.jpg', array['/images/products/keyboard-75-black.jpg', '/images/products/keyboard-75-white.jpg', '/images/products/keyboard-75-angle.jpg']),
  ('Tetikus Ergonomis Nirkabel Precision', '/images/products/mouse-ergonomic-gray.jpg', array['/images/products/mouse-ergonomic-gray.jpg']),
  ('Pengisi Daya GaN 100W Multi-Port', '/images/products/charger-gan-black.jpg', array['/images/products/charger-gan-black.jpg']),
  ('Stand Laptop Ergonomis Aluminium', '/images/products/laptop-stand-silver.jpg', array['/images/products/laptop-stand-silver.jpg']),
  ('Lampu Meja Task Aluminium', '/images/products/lamp-task-black.jpg', array['/images/products/lamp-task-black.jpg', '/images/products/lamp-task-white.jpg']),
  ('Meja Kerja Modular Solid Oak', '/images/products/desk-oak-natural.jpg', array['/images/products/desk-oak-natural.jpg']),
  ('Kursi Ergonomis Mesh Pro', '/images/products/chair-mesh-black.jpg', array['/images/products/chair-mesh-black.jpg']),
  ('Tatakan Monitor Kayu Walnut', '/images/products/monitor-stand-walnut.jpg', array['/images/products/monitor-stand-walnut.jpg', '/images/products/monitor-stand-oak.jpg']),
  ('Desk Mat Kulit Vegan Minimalis', '/images/products/desk-mat-black.jpg', array['/images/products/desk-mat-black.jpg']),
  ('Ketel Leher Angsa Matte Black', '/images/products/kettle-gooseneck-black.jpg', array['/images/products/kettle-gooseneck-black.jpg']),
  ('Dripper Kopi Keramik Pour-Over V60', '/images/products/dripper-v60-white.jpg', array['/images/products/dripper-v60-white.jpg']),
  ('Penggiling Kopi Manual Stainless Steel', '/images/products/coffee-grinder-silver.jpg', array['/images/products/coffee-grinder-silver.jpg']),
  ('Gelas Kaca Borosilikat Double-Wall 350ml', '/images/products/glass-borosilicate-clear.jpg', array['/images/products/glass-borosilicate-clear.jpg']),
  ('Wadah Biji Kopi Kedap Udara Vakum', '/images/products/coffee-canister-black.jpg', array['/images/products/coffee-canister-black.jpg']),
  ('Tas Komuter EDC Ballistic', '/images/products/backpack-edc-black.jpg', array['/images/products/backpack-edc-black.jpg', '/images/products/backpack-edc-green.jpg']),
  ('Dompet Kartu Kulit Nabati Slim', '/images/products/wallet-leather-tan.jpg', array['/images/products/wallet-leather-tan.jpg']),
  ('Jam Tangan Lapangan Otomatis Field Watch', '/images/products/field-watch-black.jpg', array['/images/products/field-watch-black.jpg', '/images/products/field-watch-olive.jpg', '/images/products/field-watch-angle.jpg']),
  ('Kaus Katun Organik Heavyweight 240gsm', '/images/products/tshirt-heavyweight-white.jpg', array['/images/products/tshirt-heavyweight-white.jpg']),
  ('Topi Baseball Katun Washed Unstructured', '/images/products/cap-baseball-black.jpg', array['/images/products/cap-baseball-black.jpg']),
  ('Pena Gel Presisi Titanium', '/images/products/pen-titanium-black.jpg', array['/images/products/pen-titanium-black.jpg', '/images/products/pen-titanium-raw.jpg']),
  ('Jurnal Grid Hardcover Kertas 120gsm', '/images/products/journal-grid-green.jpg', array['/images/products/journal-grid-green.jpg']),
  ('Penggaris Segitiga Arsitek Aluminium', '/images/products/ruler-architect-black.jpg', array['/images/products/ruler-architect-black.jpg']),
  ('Tempat Pensil Kulit Gulung Handcrafted', '/images/products/pencil-roll-brown.jpg', array['/images/products/pencil-roll-brown.jpg', '/images/products/pencil-roll-tan.jpg']),
  ('Klip Kertas Kuningan Solid Vintage (Set 10)', '/images/products/clips-brass-vintage.jpg', array['/images/products/clips-brass-vintage.jpg'])
) as v(name, image_url, gallery_urls)
where p.name = v.name
  and p.deleted_at is null
  and (
    p.image_url is distinct from v.image_url
    or p.gallery_urls is distinct from v.gallery_urls
  );

-- 3. Sinkronisasi 48 varian SKU (perbaiki attributes.image_url & sisipkan SKU yang belum ada)
insert into public.product_variants (product_id, sku, name, attributes, price_cents, stock, is_active, deleted_at)
select
  p.id,
  v.sku,
  v.name,
  v.attributes::jsonb,
  v.price_cents,
  v.stock,
  true,
  null
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
  product_id = excluded.product_id,
  name = excluded.name,
  attributes = excluded.attributes,
  is_active = true,
  deleted_at = null;
