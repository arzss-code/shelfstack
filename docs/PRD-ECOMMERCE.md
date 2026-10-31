# Product Requirements Document (PRD)

# ShelfStack — Curated Archival Department Store

> **Document Status:** Official Reference (Living Document)  
> **Version:** 2.0.0 (Updated: 22 September 2026)  
> **Author:** AA (Full-Stack Engineer & Tech Lead Pair)  
> **Target Audience:** Engineering Team, Product Owner, QA Team, Mentor Magang Talenavi

---

## 1. Ikhtisar Eksekutif & Visi Produk (Executive Summary)

### 1.1 Visi Produk

**ShelfStack** adalah platform _e-commerce full-stack_ kurasi premium (_modernist department store_) yang berfokus pada penyediaan instrumen kerja berpresisi tinggi, perangkat audio taktil, furnitur ruang kerja ergonomis, serta pakaian dan aksesoris terkurasi.

Platform ini dirancang dengan pendekatan arsitektur modern (_clean code_, _atomic component system_, dan _type-safe data layer_), menjamin performa tinggi, pengalaman berbelanja tanpa hambatan (_frictionless_), serta transparansi manajemen inventaris bagi tim internal toko.

### 1.2 Model Bisnis

- **Model:** **Single-Vendor Curated Store** (Bukan multi-seller marketplace). Seluruh produk dijual, dijamin, dan dikirimkan langsung oleh ShelfStack dari gudang kurasi resmi.
- **Mata Uang:** Indonesian Rupiah (IDR / Rp) dengan format penulisan angka presisi (_tabular-nums_).
- **Target Pembeli:** Profesional teknologi, desainer, _remote worker_, dan konsumen digital yang mengutamakan kualitas rancang bangun, estetika minimalis (_Gallery Modernist_), dan keaslian produk bergaransi resmi.

---

## 2. Pengguna Sasaran & Personas (Target Audience)

| Persona                                       | Profil & Karakteristik                                                                     | Kebutuhan Utama                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **The Discerning Professional** (B2C)         | Software engineer / desainer (usia 22–40) yang membangun ruang kerja estetik & fungsional. | Pencarian cepat, visual produk jernih & jujur, spesifikasi teknis mendalam per kategori, checkout 1-klik tanpa ribet.                 |
| **Studio / Office Procurements** (B2B/Studio) | Pengelola studio kreatif atau startup yang membeli inventaris kantor/perkakas tim.         | Informasi garansi resmi terpercaya, kepastian stok, invoice resmi, dan pengiriman aman berproteksi.                                   |
| **Store Administrator** (Internal)            | Tim operasional ShelfStack pengelola katalog dan pesanan.                                  | Dashboard cepat untuk manajemen stok real-time, audit trail (activity log), update status pesanan, dan soft-delete perlindungan data. |

---

## 3. Arsitektur Sistem & Keputusan Teknologi

```
+---------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                    |
|   Nuxt 4 (Vue 3 Composition API, Vite, Tailwind CSS, Brand Primitives, Pinia)  |
+---------------------------------------------------------------------------------+
                                        | (HTTPS / REST / WebSocket)
+---------------------------------------------------------------------------------+
|                                SERVER LAYER                                     |
|   Nuxt Server Engine (Nitro Server Routes, Zod Validation, Midtrans SDK)        |
+---------------------------------------------------------------------------------+
                         |                                 |
+----------------------------------+     +----------------------------------------+
|      DATABASE & AUTH LAYER       |     |        PAYMENT GATEWAY LAYER           |
|  Supabase (PostgreSQL 15)        |     |  Midtrans Sandbox                      |
|  - Row Level Security (RLS)      |     |  - Snap Popup / Redirect               |
|  - PostgreSQL Atomic RPC         |     |  - Webhook HTTP Notification           |
|  - Realtime WebSocket Channels   |     |                                        |
+----------------------------------+     +----------------------------------------+
```

### Keputusan Kunci:

1. **Frontend & Server:** Nuxt 4 Full-Stack dengan _feature-driven directory structure_ (`app/features/`).
2. **Database & Realtime:** Supabase PostgreSQL dengan _Strict Row Level Security (RLS)_ dan channel _Supabase Realtime_ (`postgres_changes`).
3. **Payment Gateway:** Midtrans Sandbox via protokol Snap (mendukung QRIS, GoPay, dan Virtual Account Bank) dengan integrasi _Webhook Callback_.
4. **Deployment:** Docker Multi-stage + Nginx (`deploy/docker-compose.prod.yml`).

---

## 4. Skema Data & Spesifikasi Atribut Produk Dinamis (Dynamic Schema)

Sesuai kebutuhan bisnis, setiap kategori produk memiliki karakteristik informasi teknis yang **berbeda secara signifikan**. Untuk menjaga integritas skema tanpa melakukan _over-engineering_ atau relasi tabel berlebih (_EAV anti-pattern_), ShelfStack menggunakan kolom **`specs (JSONB)`** di PostgreSQL yang divalidasi oleh Zod di layer aplikasi.

### 4.1 Skema Tabel Inti (Data Dictionary)

#### A. Tabel `categories`

Menyimpan departemen utama kurasi toko.

```sql
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  created_at timestamptz default now()
);
```

#### B. Tabel `products` (Dengan Atribut Dinamis `specs`)

```sql
create table public.products (
  id bigint generated always as identity primary key,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text unique,
  price numeric(15,2) not null check (price >= 0),
  price_cents bigint not null check (price_cents >= 0),
  stock int not null default 0 check (stock >= 0),
  description text,
  image_url text,
  gallery_urls text[] default '{}',
  specs jsonb not null default '{}'::jsonb,  -- ATRIBUT DINAMIS PER KATEGORI
  link text,
  created_at timestamptz default now(),
  deleted_at timestamptz default null       -- SOFT DELETE
);

-- GIN Index untuk pencarian filter JSONB berkecepatan tinggi
create index idx_products_specs on public.products using gin (specs);
create index idx_products_category on public.products(category_id);
create index idx_products_deleted on public.products(deleted_at);
```

---

### 4.2 Spesifikasi Atribut Dinamis per Kategori (`specs JSONB`)

Berikut adalah kontrak skema JSON untuk masing-masing kategori produk:

#### 1. Kategori: **Tech & Gadget** (`tech`)

Spesifikasi berfokus pada kapabilitas elektronik, daya, dan koneksi:

```json
{
  "specs_type": "tech",
  "connectivity": "Bluetooth 5.3 / USB-C Fast Charging",
  "battery_life": "45 Jam Playtime",
  "charging_time": "1.5 Jam (Quick Charge 10 menit = 4 jam)",
  "weight_grams": 280,
  "compatibility": ["macOS", "Windows", "iOS", "Android"],
  "driver_size": "40mm Custom Beryllium Driver",
  "noise_cancellation": "Active Noise Cancelling (ANC) Hybrid 4-Mic",
  "warranty_months": 24
}
```

#### 2. Kategori: **Furnitur & Ruang Kerja** (`furniture`)

Spesifikasi berfokus pada dimensi spasial, material konstruksi, dan ergonomi:

```json
{
  "specs_type": "furniture",
  "dimensions": {
    "length_cm": 140,
    "width_cm": 70,
    "height_cm": 75,
    "weight_kg": 28.5
  },
  "primary_material": "Solid American Walnut Wood",
  "frame_material": "Powder-coated Aerospace 6063 Aluminum",
  "max_load_kg": 120,
  "assembly_required": true,
  "estimated_assembly_time_mins": 15,
  "cable_management": "Integrated Under-desk Steel Tray",
  "warranty_months": 36
}
```

#### 3. Kategori: **Rumah & Dapur** (`home`)

Spesifikasi berfokus pada kapasitas volume, daya listrik, dan keamanan pangan:

```json
{
  "specs_type": "home",
  "capacity_liters": 0.9,
  "power_wattage": 1200,
  "voltage": "220V - 50Hz",
  "material_grade": "Food-grade SUS304 Stainless Steel",
  "temperature_control": "Digital Precision 1°C Variable (40°C - 100°C)",
  "auto_shutoff": true,
  "cord_length_meters": 1.0,
  "warranty_months": 24
}
```

#### 4. Kategori: **Pakaian & Aksesoris** (`lifestyle`)

Spesifikasi berfokus pada ukuran fisik, ketahanan bahan, dan material tekstil:

```json
{
  "specs_type": "lifestyle",
  "capacity_liters": 6.5,
  "outer_fabric": "Cordura® 500D Ballistic Waterproof Nylon",
  "zipper_type": "YKK® AquaGuard Weatherproof",
  "hardware_buckle": "Fidlock® V-Buckle Magnetic Anodized",
  "compartments": "Kompartemen tablet hingga 11 inci + saku dokumen rahasia",
  "strap_adjustable_cm": "80 - 135 cm",
  "warranty_months": 24
}
```

#### 5. Kategori: **Alat Tulis & Kerajinan** (`stationery`)

Spesifikasi berfokus pada presisi mekanikal, bahan bodi, dan standar refill:

```json
{
  "specs_type": "stationery",
  "pen_mechanism": "Bolt-Action Precision Track",
  "body_material": "Grade 5 Titanium (Ti-6Al-4V) Stonewashed",
  "refill_standard": "Schmidt EasyFlow 9000 / G2 Parker Standard",
  "nib_size_mm": 0.5,
  "weight_grams": 42,
  "length_mm": 132,
  "diameter_mm": 10.5,
  "warranty_months": 60
}
```

---

### 4.3 Skema Transaksi & Pesanan

#### C. Tabel `orders`

```sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  order_number text not null unique,
  total_cents bigint not null check (total_cents >= 0),
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')
  ),
  shipping_address jsonb not null,
  payment_method text,
  snap_token text,
  payment_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);
```

#### D. Tabel `order_items`

```sql
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  qty int not null check (qty > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  item_specs_snapshot jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

#### E. Fungsi Atomik Transaksi (`create_order` RPC)

Untuk mencegah _race-condition_ saat beberapa pengguna membeli barang yang sama secara bersamaan, transaksi dienkapsulasi dalam Stored Procedure PostgreSQL:

1. Memvalidasi keranjang tidak kosong.
2. Mengunci baris produk (`SELECT ... FOR UPDATE`).
3. Memastikan `stock >= qty`, lalu memotong stok secara otomatis (`stock = stock - qty`).
4. Menyimpan data ke `orders` dan `order_items` dalam satu transaksi atomik. Jika stok kurang, transaksi otomatis di-_rollback_ total (_anti-overselling_).

---

## 5. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

### Modul 1: Autentikasi, Profil & Keamanan (Selesai ✅)

- **FR-1.1 Register & Login:** Autentikasi berbasis Supabase Auth dengan email & password terenkripsi.
- **FR-1.2 Reset Password:** Alur pemulihan sandi via tautan email resmi (`/auth/forgot-password` dan `/auth/reset-password`).
- **FR-1.3 Role Guards:** Role terisolasi di `profiles` (`admin` vs `customer`). Customer dilarang keras mengakses endpoint `/admin/*`.
- **FR-1.4 Row Level Security (RLS):** Pelanggan hanya berhak membaca data pesanan dan profil miliknya sendiri.

### Modul 2: Etalase Publik & Katalog Pro (Selesai ✅)

- **FR-2.1 Faceted Filtering:** Pencarian kata kunci dengan _debounce_, filter kategori, filter ketersediaan stok (_Hanya yang Tersedia_), dan filter rentang harga.
- **FR-2.2 URL Syncing:** Seluruh status filter otomatis tersinkronisasi dua arah dengan parameter URL (`?q=...&category=...&price=...`).
- **FR-2.3 Tampilan Fleksibel:** Pengatur kepadatan grid (3 kolom luas vs 4 kolom kompak).

### Modul 3: Halaman Detail Produk & Tampilan Spesifikasi Dinamis (Tahap Aktif 🔄)

- **FR-3.1 Visual Gallery:** Gambar produk resolusi tinggi dengan perlakuan rasio 1:1, hover zoom halus, dan proteksi gambar kosong (_fallback_).
- **FR-3.2 Dynamic Specification Table:** Menampilkan blok informasi spesifik berdasarkan nilai `product.specs`:
  - Jika kategori _Tech_ -> tampilkan panel Baterai, Konektivitas, Berat.
  - Jika kategori _Furnitur_ -> tampilkan panel Dimensi, Material, Beban Maksimal.
  - Jika kategori _Dapur_ -> tampilkan panel Kapasitas, Daya Watt, Material Food-Grade.
- **FR-3.3 Stock Awareness Stepper:** Tombol penambah jumlah barang otomatis dibatasi sesuai stok fisik gudang (`product.stock`). Jika stok 0, tombol berubah menjadi _"Stok Habis"_ dan dinonaktifkan.
- **FR-3.4 SEO Metadata:** Meta tag Open Graph dinamis (`og:title`, `og:description`, `og:image`) agar tautan produk tampil menarik saat dibagikan ke media sosial.

### Modul 4: Keranjang Belanja (Shopping Cart & Drawer)

- **FR-4.1 Pinia Cart Store:** Menyimpan daftar item belanja dengan persistensi otomatis ke `localStorage`.
- **FR-4.2 Slide-over Cart Drawer:** Laci interaktif dari sisi kanan layar saat mengklik ikon tas di navbar. Memungkinkan pengguna menambah/mengurangi jumlah atau menghapus item tanpa meninggalkan halaman.
- **FR-4.3 Global Counter Badge:** Indikator jumlah barang di navbar ter-update secara reaktif.

### Modul 5: Alur Checkout & Integrasi Midtrans Snap

- **FR-5.1 Validasi Formulir Alamat:** Mengumpulkan data penerima (Nama, Nomor WhatsApp/Telepon, Alamat Pengiriman, Kota, Kode Pos) yang divalidasi ketat dengan Zod.
- **FR-5.2 Snap Token Generator:** Endpoint backend `/server/api/orders` berkomunikasi dengan API Midtrans untuk mendapatkan token transaksi.
- **FR-5.3 Snap Popup Modal:** Menampilkan pop-up pembayaran resmi Midtrans Snap langsung di layar tanpa me-redirect paksa pembeli ke halaman luar (mendukung simulasi QRIS & Virtual Account).
- **FR-5.4 Webhook Handler:** Endpoint `/server/api/midtrans/notification` menerima payload notifikasi dari Midtrans, memverifikasi tanda tangan SHA-512, dan memperbarui status pesanan menjadi `paid`.

### Modul 6: Riwayat Pesanan & Realtime Status Tracking

- **FR-6.1 Daftar Pesanan Pengguna:** Halaman `/orders` yang menampilkan seluruh riwayat transaksi pembeli yang sedang login.
- **FR-6.2 Pelacakan Realtime:** Halaman `/orders/[id]` mendengarkan pembaruan status transaksi via Supabase Realtime channel `orders:id=eq.<order_id>`. Status otomatis berubah hijau (_Lunas_) detik itu juga saat simulator Midtrans diselesaikan.

### Modul 7: Dashboard Admin & Operasional Toko

- **FR-7.1 Overview Metrik:** Total pendapatan, volume pesanan, dan jumlah produk aktif.
- **FR-7.2 CRUD Produk Lengkap:** Formulir input produk yang mendukung pengisian spesifikasi dinamis per kategori, upload gambar ke Supabase Storage, dan soft-delete (`deleted_at`).
- **FR-7.3 Manajemen Status Pesanan:** Antarmuka bagi admin untuk mengubah status pesanan dari `paid` menjadi `processing` atau `shipped`.
- **FR-7.4 Activity Audit Log:** Rekam jejak seluruh aksi CREATE, UPDATE, DELETE, dan RESTORE oleh admin.

---

## 6. Kebutuhan Non-Fungsional & Standar SOP Talenavi

1. **Clean Code & Modularitas (SOP Wajib):**
   - Panjang baris per file Vue **tidak boleh melebihi ~300 baris**. File besar wajib dipecah menjadi sub-komponen terisolasi.
   - Wajib menggunakan komponen Design System global: `<UiButton>`, `<UiInput>`, `<UiBadge>`, `<UiCard>`.
2. **Kinerja & Web Vitals:**
   - Largest Contentful Paint (LCP) < 2.5 detik.
   - First Input Delay (FID) / INP < 100 ms.
   - Cumulative Layout Shift (CLS) < 0.1.
3. **Keamanan (Security):**
   - Perlindungan menyeluruh dari XSS, SQL Injection, dan IDOR (Insecure Direct Object References) via Supabase RLS.
   - Tidak ada kredensial atau API Secret Key yang terekspos di bundle klien (seluruh secret Midtrans hanya ada di sisi server Nitro).
4. **Git Protocol:**
   - Format pesan commit: `<type>: [AA] short description in English`.
   - Dilarang keras melakukan bypass git hook (`--no-verify` dilarang total).

---

## 7. Roadmap Rilis & Milestone Pelaksanaan (Sprint Plan)

```
Minggu 1-2 (Sprint 1) : Fase 0 — Foundation, Base Types & Product CRUD [SELESAI ✅]
Minggu 3-4 (Sprint 2) : Fase 1 — Supabase Auth, Strict RLS & Dynamic Categories [SELESAI ✅]
Minggu 5-6 (Sprint 3) : Fase 2 — Redesign Storefront, Katalog Pro & UI Components [SELESAI ✅]
Minggu 7-8 (Sprint 4) : Fase 3 — Dynamic Specs, Cart Drawer, Checkout & Midtrans [SEDANG BERJALAN 🔄]
Minggu 9-10 (Sprint 5): Fase 4 — Admin Dashboard, Order Processing & Realtime Log [BERIKUTNYA ⏳]
Minggu 11-12 (Sprint 6): Fase 5 — QA End-to-End, Production Hardening & Vercel Launch [FINAL 🎯]
```
