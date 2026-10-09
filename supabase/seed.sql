-- Seed Lokal ShelfStack (Fase 1 - E-Commerce Platform)
-- Dipakai via: supabase db reset --local (atau run manual di dashboard SQL Editor)
-- Skema: categories, products (dengan category_id, stock, price, image_url)

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

-- 2. Seed Produk Kurasi ShelfStack
insert into public.products (name, price, stock, description, image_url, category_id) values
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
on conflict do nothing;

-- 3. Seed Akun Demo Deterministik untuk Pengujian & Local Onboarding
-- PERINGATAN: Akun demo ini HANYA untuk lingkungan lokal / CI testing, DILARANG untuk produksi!
-- Password default: Password123!
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
  email_change_token_new,
  email_change_token_current
) values
  (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'customer@shelfstack.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Demo Customer"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000099'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'admin@shelfstack.local',
    crypt('Password123!', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Demo Admin", "role": "admin"}'::jsonb,
    now(),
    now(),
    '', '', '', ''
  )
on conflict (id) do nothing;

-- 4. Seed Identitas GoTrue (auth.identities) agar signInWithPassword Supabase Auth berfungsi normal
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
    '{"sub": "00000000-0000-0000-0000-000000000001", "email": "customer@shelfstack.local"}'::jsonb,
    'email',
    'customer@shelfstack.local',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000099',
    '00000000-0000-0000-0000-000000000099'::uuid,
    '{"sub": "00000000-0000-0000-0000-000000000099", "email": "admin@shelfstack.local"}'::jsonb,
    'email',
    'admin@shelfstack.local',
    now(),
    now(),
    now()
  )
on conflict (id) do nothing;

-- 5. Pastikan role admin aktif di tabel profiles
insert into public.profiles (user_id, full_name, role)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Demo Customer', 'customer'),
  ('00000000-0000-0000-0000-000000000099'::uuid, 'Demo Admin', 'admin')
on conflict (user_id) do update set
  role = excluded.role,
  full_name = excluded.full_name;
