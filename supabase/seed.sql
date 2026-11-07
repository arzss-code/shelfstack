-- Seed Lokal ShelfStack (Fase 1 - E-Commerce Platform)
-- Dipakai via: supabase db reset --local (atau run manual di dashboard SQL Editor)
-- Skema: categories, products (dengan category_id, stock, price, image_url)

-- 0. Konfigurasi Lingkungan & Ekstensi Kriptografi
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
set search_path = public, extensions, auth;

-- 1. Seed 5 Kategori Kanonik
insert into public.categories (name, slug, description, image_url, display_order) values
  ('Tech & Gadget', 'tech', 'Audio resolusi tinggi, perangkat pintar nirkabel, keyboard mekanikal, dan adaptor daya presisi.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmvA8rTc663X0aMY0i5AsRtnJWHHEMBE15l26ff2OBzeQ4YDMUc2bIfeMkM1wTrGpE8S1YpwKD1VFVOTPX83GWEoIoe_Wa5MeCsuOmxDtwLGsMeIlQpoOx_MrCo-cewC9QSL9DbpyFqpGe5CRkiClgbq2Ky9rCJ0x0lVhK8dgvYyfzRf9uFB-43LAqvdnR3zkN9hNg27b6fzEk8dmLSQTX2fxG3PRKyc-Ag1IX7VVNaYXvISjMYLi4', 1),
  ('Rumah & Dapur', 'home', 'Peralatan seduh kopi manual, gelas kaca borosilikat tahan panas, dan keramik meja makan minimalis.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDdnlKb3T3WJuD42WKCuYWlCi4su1XSA6opLKqIdBufFf2I89pgRHDlMhA-UQF8FA_W3JOC97K0Q67vQxjw_-tNPtI8Emhlv4itv2QxeDnZLfXVHK1pvqKMf3q_32bMom_wtTevyGn9RDkAPGYTJQyVapwhGLWNqs0sM8vT8WYthdz-1U1PIzS4aiuVS1jCvjsJtrrE3FBMRl_xhjHgG0XQOOBR7eT595CX28mslcd4ewk9ikvHvjQ', 2),
  ('Furnitur & Ruang Kerja', 'furniture', 'Kursi ergonomis, meja modular solid, dan sistem rak penyimpanan terorganisir untuk ruang kerja.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc4XLDPg-9mRKQs1TlWbx1Sb6XRiOWWni_U00DefHZgPir91Sh9rS7GKOm0M2z7-S_5MPydGZ4snKfV2T-45YtfmX164d7iygok6Xq5dDum6OvvemCbgkUxAQ5UejU182htov0POdSz3dv8rCbDOIL8RdpkpYwK8qlbeuhBv98GLCvxB8t7BKzw5Yw2aMy-fX1H5itwB8_gTE1ZqTCstf34P3WDCDvrtao2RT1FG0WniZroxgjAw0i', 3),
  ('Pakaian & Aksesoris', 'lifestyle', 'Tas selempang harian, kaus katun organik combed, dan jam tangan fungsional berdaya tahan tinggi.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmK-nhltzS02RWfXj2Rx0Z8IvcV4TaPXHuYYeWMUhax_zC2LYbpNt--0RSd434mVakffTmk5s3va6NmCFXP32mL8xAUGwVx2oxYnYz_MI8jzlChs_vH53-QpQZQN9HgXIrNIxEUh-Gqko7SDdTs-v0pIb9qEn65QsCAFwAPLeEveKSsEmDVLW9YfSvaX7Q_HkhaHpfmUVv35TntI0JCNP3GnMk9WRyV4KVSnNZt_4xLlROZJMms7kg', 4),
  ('Alat Tulis & Kerajinan', 'stationery', 'Pena presisi berbobot mantap, buku catatan bergaris halus, dan penggaris segitiga arsitektural.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPUa0JzIOqwWaWZqIgu4I0PA1v7YbfFltproG-m3AwYxCiPhIouH_GwoAtPLqA3FnGnU-OMudyp3jajkJzdlcRAWIpVL0-paLzRvVRqx_L1jA73N31qDSXEo2y5pCl1pUeK734CTQrN5Eg_3ZGqZpnALspE46_3lMJDtkCoUBQC7202e3hqxG0XYEjKXtFPoKfZt_EtUzxp1sujWSSVRhcd1F4Kw9OTlD8ICNKKBY46ME_8Zpbu1K5', 5)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  display_order = excluded.display_order;

-- 2.a Pembersihan Duplikasi Produk dari Eksekusi Seeder Sebelumnya
-- Menonaktifkan (soft delete) produk duplikat yang memiliki nama sama (pertahankan id terkecil yang aktif).
-- Soft delete menjaga keutuhan foreign key pada riwayat order_items lama.
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
insert into public.products (name, price, stock, description, image_url, category_id)
select
  v.name, v.price, v.stock, v.description, v.image_url, v.category_id
from (values
  (
    'Headphone Studio ANC',
    2680000,
    25,
    'Headphone nirkabel resolusi tinggi dengan peredam bising aktif hibrida, driver 40mm berdiafragma berilium, dan bantalan telinga busa memori.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDwVY6_XJIJ--I5tlVeVHvg6ErT_oBXt2avwd8dlAuTVukdzmLAppAhyNQAGXm3rQFEX1mHUEJ1GZ0wxvknebBIyNihYqTnXUswGHZuBSXpTUJrW6irkYFSwJUdz3lXaf3SIaU32wSKZaVrV6lC7Krf-diQ9YtZ80tMZPN0gDm7158w3dT3TGRm9DJY3Zr0K4RKBXS_5cVnFyD0hA50xpvdjViEWoa2fQmCh6xzjHcub1jp-D9HREja',
    (select id from public.categories where slug = 'tech')
  ),
  (
    'Lampu Meja Task Aluminium',
    850000,
    18,
    'Lampu meja fleksibel berbahan aluminium anodized dengan kontrol sentuh peredupan halus dan temperatur cahaya alami.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBhuBSFbEmAvUs-dIR2YRW-AgUpd_FXgqc62yOMrFXAqiJxphILJy3g73g9zMSiczWs5C_QAJAN1CjOVg_pzST382d0uUBGS5pFhsCPOFK1nOrZaHe-97eQ5JqcvSwsi3UzEkT3yFNe2vkYGKvByoxn2fF4xlojiv56WR8B1rwrUZFxLT-WZVzHWHvp1T17Fqfe44ym_WRhnIIM_2T_g3dkxEIvLv9oyO86-o48wqWDKZfPrK2obggw',
    (select id from public.categories where slug = 'furniture')
  ),
  (
    'Tas Komuter EDC Ballistic',
    1120000,
    12,
    'Tas komuter harian berkapasitas 20L dengan material nilon Cordura 1000D anti air, ritsleting YKK AquaGuard, dan kompartemen laptop 16 inci empuk.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCaW1aKJlLR-zy1At4XWYvwZTHyVzcedxmF5czH_xXSLAw5u-HsTZgUrlfag8Lcz8Wy41SeSwYS-HeeyVsHZK3HIKWSVxEmb50sDQgwEwzPqy8Tk7DfzdvdVw4uC3VyiWSo8w_SV806yxW6xxj4tygQ5PGNzL4_0kdeany5eVB7SlX4r2_9T2mzzvz4Eqy6YNr5Hqd0-C230EfZJntIcrv_ptSdiTpKbYG9ESr-91MiSkickFdwXSq7',
    (select id from public.categories where slug = 'lifestyle')
  ),
  (
    'Ketel Leher Angsa Matte Black',
    780000,
    15,
    'Ketel seduh pour-over presisi dengan cerat leher angsa, termometer terintegrasi, dan pegangan kayu walnut ergonomis.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD9s-kQe4Pj_sE28_vB6v6-tA775o0T8tQnF9-4_kL_o21s3eA7xG9bT9hG8r_3v_m231_2o_pL4r5-w2k7qE9n_vL3k2x0_vB6',
    (select id from public.categories where slug = 'home')
  ),
  (
    'Pena Gel Presisi Titanium',
    340000,
    40,
    'Pena berbahan bodi titanium padat dengan mekanisme bolt-action tahan banting dan isi ulang standar internasional Schmidt EasyFlow.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCtGtrTCVBPJytnec8yoiKZ2iY9yzFgcAGMVbDl8vffvV6ZEoNZFfgeDAQvYGDQ9PHSAAxfVK2j8hKUAZ8b8VxmoAnLrSjVNR8ihTPjQ6pP4gUAImGZd2tG7Lzf12mjzZ9daMM6X8wl7uLjiCTNo0sgJqsJX1aqeuE6NGKVIOcdjxjMbFEaL7kqquFVa0SMIXQWDpPCysw4-xUBBBhXrgB7_alEgVQ5G1N_PIViWD7Wd3vqGT2JE6cr',
    (select id from public.categories where slug = 'stationery')
  )
) as v(name, price, stock, description, image_url, category_id)
where not exists (
  select 1 from public.products p
  where p.name = v.name and p.deleted_at is null
);

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
