# Changelog

Catatan update untuk **Product Management** (rebrand portofolio: **ShelfStack**).

## [v0.11.0-s3] - 2026-09-21

### Added

- **Aset Fotografi Kurasi Stitch**: Menghubungkan aset fotografi studio otentik dari spesifikasi Stitch `shelfstack_homepage_multi_category_department_store` untuk 5 kartu Kategori Pilihan (Tech & Gadget, Rumah & Dapur, Furnitur & Meja, Pakaian & EDC, Alat Tulis & Kerajinan), Hero Mosaic, dan Flash Deals.
- **Konfigurasi Content Security Policy (CSP)**: Memperbarui daftar domain gambar yang diizinkan (`img-src`) di `nuxt.config.ts` untuk mendukung host gambar terkurasi.
- **Official ShelfStack Logo**: Implementasi SVG logo 3 tingkat rak geometris (2 rak atas putih + 1 rak bawah electric blue) dan komponen `AppLogo.vue`.
- **Aturan Copywriting Bebas Jargon**: Penambahan `.agents/rules/copywriting-rules.md` yang mewajibkan copywriting 100% humanis, bahasa Indonesia natural, dan bebas istilah internal developer di etalase publik.
- **Global UI Design System (`app/components/ui/`)**: Library komponen antarmuka terstandarisasi mencakup `<UiButton>` (multi-varian, auto-NuxtLink, loading state), `<UiInput>` (label, ikon, validasi error), `<UiBadge>` (indikator status konsisten), dan `<UiCard>` (kontainer modular dengan shadow whisper).
- **Komponen Kartu Produk Reusable (`ProductCard.vue`)**: Kartu etalase independen dengan badge stok dinamis (`Habis`, `Sisa <5`, `Tersedia`), integrasi `formatRupiah`, dan aksi detail terstandarisasi.
- **Shared Formatting Utility (`app/utils/format.ts`)**: Fungsi terpusat `formatRupiah()` untuk format mata uang IDR di seluruh aplikasi.
- **Alur Pemulihan Sandi Lengkap**: Halaman `/auth/forgot-password` dan `/auth/reset-password` dengan integrasi Supabase Auth dan komponen form ber-kontras tinggi.
- **Faceted Product Filtering**: Fitur filter dinamis di `/katalog` mencakup kategori cepat, rentang harga, live search dengan tombol clear, pengurutan (Termurah, Termahal, Nama A-Z), dan density toggle (grid 3 vs 4 kolom).

### Changed

- **Modularisasi Arsitektur Clean Code (SOP Talenavi)**:
  - `app/pages/index.vue`: Direfaktor dari monolit 720 baris menjadi ~36 baris orkestrator dengan 8 sub-komponen terisolasi di `app/components/home/`.
  - `app/pages/katalog.vue`: Direfaktor dari 545 baris menjadi ~290 baris dengan 4 sub-komponen di `app/components/katalog/` (`KatalogToolbar`, `KatalogActiveFilters`, `KatalogSidebar`, `KatalogMobileFilter`).
  - `app/pages/product/[id].vue`: Direfaktor dari 445 baris menjadi ~140 baris dengan 2 sub-komponen di `app/components/product/` (`ProductGallery`, `ProductConfigurator`) serta penambahan metadata Open Graph untuk SEO.
  - Halaman Autentikasi (`login.vue`, `register.vue`): Direfaktor menjadi bersih (~100 baris) menggunakan komponen `AuthCard`, `AuthFormInput`, `AuthSubmitButton`.
- **Harmonisasi Layout Hero Mosaic (`index.vue`)**: Menyatukan tata letak dan tinggi antara kartu utama kiri dengan tumpukan 2 baris kartu kanan (`Lampu Meja Task` dan `Tas Komuter EDC`). Menghapus badge ink/white asimetris yang acak dan menerapkan desain _bottom pill overlay_ kaca seragam (`bg-white/95 backdrop-blur-md rounded-full`) lengkap dengan judul produk, sub-label kurasi, dan harga IDR yang sejajar presisi dari atas hingga bawah.
- **Pembersihan Redundansi & Peningkatan Informatif Hero**: Menghilangkan baris trust points inline duplikat di bawah tombol Hero dan menggantikannya dengan metrik skala toko dan bukti sosial kuantitatif (`1.300+ Produk Pilihan`, `5 Kategori Kerja & Rumah`, `4.9★ 18rb+ Ulasan`) yang langsung memberi kredibilitas tanpa menduplikasi kartu manfaat di bawahnya.
- **Modernisasi Bilah Manfaat Belanja (Section 2)**: Merefaktor boks abu-abu monoton menjadi kartu putih bersih modern bernuansa e-commerce (`bg-white border border-brand-hair rounded-card shadow-whisper`) dengan pembatas halus dan detail kebijakan konkret (`100% Produk Original`, `Gratis Ongkir Se-Indonesia`, `Garansi Retur 30 Hari`, `Layanan Bantuan 24/7`).
- **Pembersihan Header UI/UX (`AppNavbar.vue`)**: Menghapus tautan redundant "Katalog" di bilah aksi kanan (navigasi katalog sudah diakomodasi oleh pita kategori dan search bar), merapikan tombol selector kategori di input pencarian agar tidak terpotong atau wrap menjadi 2 baris, dan menyeimbangkan proporsi search bar serta tombol aksi belanja.
- **Eliminasi Badge AI-Slop & Desain Bebas Gimmick**: Menghilangkan seluruh badge pill melayang dengan pulsing dot buatan AI (seperti `Koleksi Terverifikasi`, `Katalog Pilihan 2026`, badge uppercase `ETALASE TERVERIFIKASI`, `KEUNGGULAN LAYANAN`, `TESTIMONI`, dan `Dashboard Pemilik Toko`). Judul section kini tampil lugas dan percaya diri.
- **Restrukturisasi Kategori Pilihan**: Menghapus penomoran pseudo-militer AI (`Divisi 01` - `Divisi 05`), menghapus deretan mini-tile redundant "Pilih Kategori Cepat" di Hero, dan menghubungkan kartu kategori langsung ke filter katalog yang relevan (`/katalog?category=...`).
- **Penyempurnaan Copywriting Customer-Centric (`product/[id].vue` & `copywriting-rules.md`)**: Mengganti teks teknis berlebihan (seperti `±0.05mm Toleransi Presisi`, `Eco Vault`, `Precision Milled`) menjadi bahasa Indonesia yang ramah konsumen (`100% Asli Terverifikasi`, `Kemasan Aman Proteksi Ekstra`, `Pilihan Material`).
- **Redesign Halaman Beranda (`/`)**: Desain ulang penuh berlandaskan spesifikasi Stitch `shelfstack_homepage_multi_category_department_store` dengan kanvas putih bersih permanen, hero banner modern, 4 trust cards, 5 kategori utama terkurasi, flash sale 24 jam dengan countdown, dan kurasi produk unggulan.
- **Redesign Halaman Autentikasi (`/auth/login` & `/auth/register`)**: Modernisasi kartu login dan register bernuansa e-commerce bersih, badge keamanan enkripsi data, Google OAuth 1-klik, dan validasi Zod interaktif.
- **Redesign Etalase Katalog (`/katalog` & `ProductList.vue`)**: Tampilan katalog modular dengan breadcrumb terstruktur, faceted sidebar, dan kartu produk responsif dengan hover micro-interactions.
- **Perbaikan Mode Gelap & Kanvas**: Menghapus `@media (prefers-color-scheme: dark)` di `main.css` dan mengunci `darkMode: 'class'` di `tailwind.config.js` sehingga etalase tetap putih bersih modern terlepas dari preferensi dark mode OS.
- **Stabilisasi Playwright E2E**: Mengatur `workers: 2` untuk eksekusi lokal pada `playwright.config.ts` demi mencegah resource starvation pada server pengembangan Vite saat menjalankan 14 tes end-to-end.

### Changed (IA restructure 2026-09-18)

- Beranda `/` ditulis ulang jadi landing publik (hero, kategori, produk unggulan, value props, CTA admin) — tidak lagi CRUD langsung.
- Etalase publik pindah ke `/katalog` (search + `ProductList` mode `hideActions` baru, klik kartu ke detail).
- CRUD lengkap pindah ke `/admin/products` (guard `admin`, layout admin).
- Navbar: tambah link Katalog + Kelola (admin). Sidebar admin: tambah Produk.
- API baru `GET /api/categories` (defensif: landing tetap jalan walau tabel belum ada).
- Tes E2E disesuaikan: `home.spec` (landing), `product.spec` (katalog publik + guard admin).
- Redesign landing (`/`): hero split dengan visual produk asli + kartu harga real (fallback picsum),
  pills kategori scroll-snap, grid unggulan, value props format editorial rows (bukan 3 kartu kembar),
  satu label CTA "Masuk" untuk semua intent login, footer ringkas. Nol em-dash, dual light/dark.
- Bahasa visual storefront (adaptasi pola DESIGN.md, bukan jiplak brand): foto produk di depan,
  radius 16px untuk permukaan foto/kartu + full-pill untuk tombol/tab/badge, satu aksen emerald,
  strip promo gelap sebagai satu-satunya momen kontras, tanpa shadow dekoratif lebar.
- Iterasi DESIGN.md: Montserrat (display+body, scope `.storefront`, admin tetap Inter), kanvas putih
  - ink `#0a1317`, CTA pil hitam marketing + cobalt `#0064e0` untuk aksi/link commerce, tab pil aktif
    gelap, kartu foto 32px tanpa shadow, search-pill `#f1f4f7`, breadcrumb + galeri detail 32px.
    Catatan: radius 32px adalah keputusan sadar mengikuti DESIGN.md (melewati batas 16px default).
- Sistem token tunggal: warna brand hidup sebagai CSS variable di `main.css` + class `brand-*`
  (tailwind.config), dark-mode ikut OS di semua lapis (Tailwind `darkMode: 'media'`, PrimeVue `system`,
  media query CSS). Perbaikan nyata: sebelumnya dark Tailwind tidak ikut sehingga navbar putih
  di halaman hitam. Diverifikasi via production build + screenshot light/dark.
- Audit konsistensi token: seluruh hex di permukaan publik kini hanya dari palet DESIGN.md
  (ink, cobalt, hairline, surface-soft); bocoran emerald di login/register diganti pil hitam
  `contrast` + link cobalt; heading auth ke weight 500. Emerald dipertahankan hanya di register
  admin (layout/sidebar/activities) sebagai bahasa terpisah yang disengaja.

## [v0.10.0-s2] - 2026-09-18

### Added

- Auth email+password + Google OAuth (`useAuth`, `/auth/login`, `/auth/register`, `/auth/callback`).
- Middleware `auth` + `admin`, layout `admin.vue` (shell, diisi penuh Fase 4), guard `/admin/activities`.
- Migrasi `20260918010001` (profiles, categories, kolom stock/category_id/price_cents, trigger auto-profiles + sync price_cents) dan `20260918010002` (RLS strict products/profiles/activity/storage).
- Fix keamanan pre-push: semua cek admin lewat `is_admin()` SECURITY DEFINER (anti-rekursi RLS);
  policy owner-update dihapus karena memungkinkan self-promote (`SET role='admin'` ke baris sendiri).
- Server guard `requireUser/requireAdmin` (`server/utils/auth.ts`) dipasang di semua endpoint tulis products + baca sampah; endpoint `GET /api/auth/me`.
- E2E `tests/e2e/auth.spec.ts` (guard redirect, validasi form, 401 anon, katalog publik) + helper `waitForHydration`.

### Changed

- Navbar: rebrand ShelfStack + state login/logout + link Admin kondisional; judul tab app.
- Perbaikan flaky E2E pre-existing: tunggu hidrasi + locator dialog + scope main + poll-retry klik.
- `nuxt.config.ts`: Vite watcher abaikan `.kilo/**`.

### Note (belum dieksekusi, butuh aksi manusia)

- Migrasi SQL ditulis tapi **belum di-push ke Supabase Cloud** (butuh `supabase link` + `db push` + akun admin pertama via dashboard). Sampai itu dilakukan, RLS lama (`USING true`) masih aktif di cloud.
- Akun admin pertama dibuat manual: daftar via UI lalu `update profiles set role='admin'` di SQL Editor.

## [v0.9.0-s1] - 2026-09-18

### Added

- Skema validasi bersama **Zod** di `shared/schemas/product.ts` dipakai client + server.
- Unit test `tests/unit/product-schema.spec.ts` (9 case, termasuk kasus negatif PRD-1-02).
- `supabase/seed.sql` (8 produk) untuk `supabase db reset --local`.
- DevDependency `vue-tsc` untuk gate typecheck.
- Dokumentasi rencana portofolio 12 minggu di `docs/` (`PORTFOLIO-PLAN`, `SPRINT-PLAN`, `BACKLOG`, `PHASE-0..5`, `ADR/`, `PORTFOLIO-PACKAGING`).

### Changed

- Migrasi FSD-lite: `app/stores/product.ts` + `app/repository/product.ts` pindah ke `app/features/products/` (file lama jadi alias, dihapus Sprint 2).
- Typed Supabase client (`useSupabaseClient<Database>()`, interface `ActivityLog`) — tidak ada `any` lagi di product/activity flow kecuali `catch`.
- Validasi server `POST/PUT /api/products` via Zod → `400` konsisten (tidak lagi insert body mentah).
- `eslint.config.mjs` + `vitest.config.ts` mengabaikan `.kilo/**` (nested worktree merusak lint/test).
- README: koreksi Nuxt 3 → Nuxt 4, rebrand ShelfStack.

## [v0.8.0-beta.1] - 2026-08-18

### Added

- Implementasi sistem **Realtime Activity Log** terintegrasi menggunakan WebSocket (`public:activity_logs`) untuk memantau perubahan data.
- Menambahkan **AppNavbar** sebagai komponen navigasi global yang premium dan _anti-slop_ dengan fungsionalitas indikator menu aktif.
- Panduan arsitektur _Feature-Scoped Development (FSD-lite)_ dalam bentuk dokumentasi.

### Changed

- Memindahkan (`refactor`) `useActivities.ts` dan `ActivityDetailDialog.vue` ke struktur isolasi modular di `app/features/activities/` untuk menjaga kode tetap bersih dan mudah diskalakan.
- Standardisasi CSS menggunakan warna-warna semantik dari _PrimeVue Aura theme_ yang dipetakan langsung ke _utility classes_ `tailwind.config.js` untuk perbaikan _Dark Mode_ secara menyeluruh dan menghilangkan _glitch_ warna (menghapus _inline_ CSS variable).

## [v0.7.0] - 2026-08-10

### Added

- Setup **Tailwind CSS** buat mempermudah styling (menggantikan inline styles yang kepanjangan).
- Validasi form sekarang pakai **Zod** biar lebih _type-safe_ dan terpusat.
- Auto-cleanup di `product.ts` (store): kalau kita hapus produk atau ganti gambar, gambar lama di Supabase Storage sekarang otomatis dihapus biar nggak menuh-menuhin storage.

### Changed

- Ekstrak interface `Product` ke `types/product.ts` biar lebih rapi.
- Pindahin fungsi `compressImage` ke `utils/image.ts` (separation of concerns).
- Refactor semua template UI (`index.vue`, `ProductForm.vue`, `ProductList.vue`) ke utility classes Tailwind.

## [v0.6.0] - 2026-08-10

### Added

- Dark Mode support (ngikutin system preference).
- Global Error Handling via `product.ts` + Toast Notification.

### Changed

- Refactor layout utama pakai standar **Impeccable** biar keliatan lebih profesional dan anti-slop.
- Beralih ke **Semantic Tokens** (`--p-content-background`, dll) buat fixing bug warna di Dark Mode.
- Ganti bawaan `<Card>` PrimeVue jadi custom grid card di `ProductList.vue`.
- Max-width container di-set ke `1200px` biar enak dilihat di monitor ultrawide.

## [v0.5.0] - 2026-08-10

### Added

- Halaman **Detail Produk** (`/product/[id]`) untuk menampilkan data produk secara utuh.
- Fungsi `fetchProductById` pada `product.ts` untuk melayani _routing_ dinamis.

### Changed

- Mengubah judul proyek di layout utama menjadi **Product Manager**.
- Merapikan tata letak (_layout_) beranda (`index.vue`) dan `ProductList.vue` yang ditambahkan tombol (mata/detail).

## [v0.4.0] - 2026-08-10

### Added

- Penambahan atribut data produk lengkap (`description` dan `link`) pada `ProductForm.vue`, `ProductList.vue`, antarmuka `product.ts`, dan dokumentasi panduan SQL.

### Changed

- Penyelarasan UI komponen ke desain _B2B Anti-Slop_ sesuai mandat `DESIGN.md`.
- Menonaktifkan secara paksa `box-shadow` PrimeVue Card dan menggantinya dengan `border` solid bersudut kaku maksimal 12px.
- Sinkronisasi CSS root variable dengan profil warna utama `oklch(0.45 0.16 250)` (Talenavi Blue).

## [v0.3.0-beta.1] - 2026-08-10

### Added

- Implementasi sistem **Toast Notification** global menggunakan PrimeVue di `app.vue`.
- Validasi unggahan gambar (maksimal 5MB dan hanya menerima format `jpeg`, `png`, `webp`) sesuai `SOP-SUPABASE`.
- **Kompresi Gambar Sisi Klien** (Client-side Compression) menggunakan HTML5 Canvas API untuk mengubah ukuran (resize) menjadi max lebar 1200px dan mengonversi gambar menjadi format `WebP` berkualitas 70% demi penghematan kuota penyimpanan.

## [v0.2.0-beta.3] - 2026-08-10

### Fixed

- Menurunkan versi (downgrade) `@pinia/nuxt` dari `1.0.1` ke `0.11.0` untuk mengatasi _bug compatibility_ antara `nuxtApp.payload.pinia` dengan Nuxt 4 yang menyebabkan gagal _render_ SSR.

## [v0.2.0-beta.2] - 2026-08-10

### Fixed

- Perbaikan _crash_ saat render SSR (`TypeError: Cannot read properties of undefined (reading 'state')`) dengan menginstal dependensi inti `pinia` yang sebelumnya belum terpasang.

## [v0.2.0-beta.1] - 2026-08-10

### Added

- Integrasi module `@nuxtjs/supabase` untuk konektivitas basis data.
- Refaktor arsitektur halaman produk menggunakan _Vue Best Practices_ (memisahkan `index.vue` menjadi _Container_, `ProductList.vue`, dan `ProductForm.vue`).
- Implementasi fungsionalitas CRUD Produk sepenuhnya menggunakan Supabase.
- Fungsionalitas unggah gambar (_image upload_) ke Supabase Storage.
- Penambahan file `/docs/SUPABASE-CRUD-TUTORIAL.md` sebagai modul tutorial tahap demi tahap.

## [v0.1.0-beta.1] - 2026-08-10

### Added

- Inisialisasi proyek Nuxt 3 dengan integrasi PrimeVue dan Pinia.
- Setup layout global `default.vue` dengan PrimeIcons.
- Implementasi Pinia store untuk simulasi data produk.
- Pembuatan endpoint API `/version` untuk mematuhi SOP Talenavi.
- Standardisasi repository (README, folder docs, .env.example) sesuai SOP Coding Repo.
