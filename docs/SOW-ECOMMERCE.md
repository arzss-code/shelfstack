# Statement of Work (SOW)

## Project: Talenavi E-Commerce Transformation

### 1. Ringkasan Proyek

Proyek ini bertujuan untuk mengkonversi repositori `product-management` yang ada saat ini (Vue 3, Nuxt, PrimeVue, Supabase) menjadi sistem _E-Commerce_ yang skalabel dan siap produksi sesuai dengan standar _Enterprise_ Talenavi.

### 2. Tanggung Jawab (Deliverables)

- **Tim AI (Agent)**: Menganalisis kebutuhan, mendesain skema _database_, menulis kode UI/UX, merancang integrasi logika (_Pinia/Supabase_), dan menyiapkan kerangka pengujian (QA).
- **Developer / Tech Lead (Manusia)**: Memberikan visi arah proyek, meninjau hasil kode (Code Review), dan menyetujui implementasi strategis (_Design Decisions_).

### 3. Timeline / Fase Eksekusi

- **Fase 1 (Design & Setup)**: Penulisan dokumen spesifikasi (PRD, SOW, DESIGN), migrasi skema tabel Supabase, dan setup Tipe TypeScript. _(Estimasi: Tahap Awal)_.
- **Fase 2 (Frontend Storefront)**: Pembuatan halaman publik (Katalog, Pencarian, Keranjang Belanja). _(Estimasi: Sisi Klien / Customer)_.
- **Fase 3 (Admin Panel & Ops)**: Isolasi rute `/admin`, pembuatan UI manajemen order, proteksi Auth RLS. _(Estimasi: Sisi Internal)_.
- **Fase 4 (QA & CI/CD)**: Validasi melalui _Vitest/Playwright_ dan _deployment_ melalui Vercel.

### 4. Kriteria Penyelesaian Proyek (Definition of Done)

Proyek ini dinyatakan selesai apabila:

1. Pelanggan dapat membuat akun, login, dan berhasil "Check-out" produk hingga menjadi sebuah _Order_ di _database_.
2. Admin dapat login, melihat _Order_ tersebut, dan mengubah statusnya.
3. Seluruh _pipeline CI/CD_ (Linter & Testing) pada GitHub berjalan hijau (berhasil).
