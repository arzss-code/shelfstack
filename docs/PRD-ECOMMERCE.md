# Product Requirements Document (PRD)

## Project: Talenavi E-Commerce Platform

### 1. Tujuan Produk (Product Vision)

Membangun platform E-Commerce _Full-Stack_ yang berkinerja tinggi, skalabel, dan aman, yang menghubungkan katalog produk dengan pelanggan akhir, serta menyediakan _dashboard_ pengelolaan inventaris bagi tim internal (Admin).

### 2. Pengguna Sasaran (Target Audience)

1. **Pelanggan Publik (B2C)**: Pengguna internet yang ingin melihat katalog, mencari produk, dan melakukan pembelian secara daring.
2. **Administrator Toko**: Tim operasional Talenavi yang bertugas menambah produk, mengatur stok, dan memproses pesanan.

### 3. Ruang Lingkup Fitur (Scope)

#### Fase 1: Katalog & Autentikasi (MVP)

- Halaman etalase publik (Pencarian & Filter Produk).
- Detail produk (Gambar, Harga, Stok).
- Registrasi dan Login (Customer & Admin) menggunakan Supabase Auth.

#### Fase 2: Transaksi (Shopping Cart & Checkout)

- Keranjang belanja persisten (Pinia Store & LocalStorage).
- Proses _Checkout_ (Pengumpulan alamat pengiriman).
- Pembuatan Pesanan (_Order Creation_) di _database_.

#### Fase 3: Dashboard Admin

- Antarmuka khusus admin (`/admin`).
- CRUD Produk (dengan Kategori & Upload Gambar).
- Manajemen Pesanan (Ubah status dari _Pending_ ke _Shipped_).

### 4. Kriteria Penerimaan (Acceptance Criteria)

- Waktu muat halaman (LCP) di bawah 2.5 detik.
- Aplikasi harus _100% responsif_ di perangkat seluler.
- Data pelanggan dan pesanan dilindungi oleh _Row Level Security (RLS)_.
