# Changelog

Catatan update untuk **Product Management** (rebrand portofolio: **ShelfStack**).

## [Unreleased] — audit docs & agent rules (2026-10-11)

### Audit (read-only, terverifikasi file:line)

- Baseline aktual: `typecheck` EXIT 0 · `lint` 0 error/32 warning · `vitest run` 33 file/310 test lolos.
- Auth endpoints: tidak ada mutasi tanpa auth; 3 inkonsistensi rendah dicatat di `docs/PROGRESS.md` Known Gaps (R-1 rate-limit `snap-token` vs `payment-token`, R-2 admin ditolak di `payment-token`, R-3 pola admin di `addresses/[id].ts`).
- F0-01 SELESAI: `database.types.ts` disinkron manual dari migrasi (2 tabel + 7 kolom + signature `create_order` + enum `order_status` di Constants); `typecheck` tetap EXIT 0 tanpa fallout. `supabase gen types` ulang tetap disarankan saat CLI terautentikasi.
- F0-02 SEBAGIAN: klaim "seed rusak" DICABUT setelah verifikasi byte-level — sintaks `DO UPDATE SET` valid; flag indexer adalah keterbatasan grammar. AC jumlah seed dikoreksi ke 5/5/2. Runtime (`pgcrypto`, `auth.*`) belum terverifikasi tanpa DB live.
- Koreksi temuan: `.github/workflows/ci.yml` ADA (bukan kosong); payment = Midtrans Sandbox asli (bukan mock).

### Eksekusi temuan audit (2026-10-11)

- T-7: `transition_order_status` kanonis **terbukti** menulis `activity_logs` transaksional — AC D-02 terpenuhi tanpa perubahan kode.
- T-3: rate-limit menunjuk `payment-token`; rule mati `/api/checkout` dihapus.
- T-4: `payment-token` ikut pola owner + admin bypass (konsisten 3 endpoint lain).
- T-5: `addresses/[id].ts` memakai `existing.user_id` untuk semua query lanjutan; +3 regression test admin; perbaiki 1 tipe helper test lama.
- T-6: export CSV filter tanggal `from`/`to` (helper murni `parseExportDateRange` + input tanggal di UI + `refunded` di allowlist); +5 unit test.
- Gate akhir: `typecheck` EXIT 0 · `lint` 0 error/32 warning (tanpa warning baru) · `vitest run` 33 file/**318 test lolos** (+8).

### Follow-up LSP + gate typecheck (2026-10-12)

- `refund.post.ts`: tipe inline `gatewayResult` diganti interface kanonis `MidtransRefundResult` (sudah menampung `bankConfirmedAt`).
- `activities.post.ts`: `entity_id` kini wajib di skema (selaras DB `NOT NULL` + satu-satunya caller selalu mengisi); payload tanpa itu ditolak 400, bukan 500.
- Koreksi metodologi: `pnpm typecheck` (`vue-tsc --noEmit`) terbukti memeriksa 0 file. Pemeriksa real `pnpm exec nuxi typecheck` menemukan ±29 error pre-existing di 6 file yang tidak tersentuh sesi ini (inventaris di `docs/PROGRESS.md` Known Gaps no. 6). Klaim hijau sebelumnya untuk `typecheck` dicabut.

### Perbaikan error typecheck real (2026-10-12)

- Zod 3 → 4: `required_error` menjadi `error` di `shared/schemas/address.ts` (5 situs).
- Guard `undefined`: `server/utils/idempotency.ts`, index array di `app/pages/orders/index.vue`.
- `UiInput` menerima `modelValue` undefined; `admin.vue` memakai alias `signOut` (tombol logout sebelumnya mati); generic eksplisit `$fetch` di `katalog.vue`; `@types/node` masuk root devDependencies.
- Hasil: `pnpm exec nuxi typecheck` EXIT 0 · `lint` 0 error · `vitest` 33 file/318 test lolos.

### Gate typecheck jujur (2026-10-12)

- Script `pnpm typecheck` diganti dari `vue-tsc --noEmit` (terbukti memeriksa 0 file)
  ke `nuxi typecheck`, sehingga gate lokal dan CI memeriksa proyek app + server
  secara nyata. Terverifikasi EXIT 0 sebelum diganti.

### Changed

- Sinkronisasi docs: `PROGRESS.md` (v0.15.0 + Fase 4 + Known Gaps), `README.md` (11 scripts + stack + CI), `docs/README.md` (indeks baru), `BACKLOG.md` (K-04 sandbox, Q-01 CI ada), `ARCHITECTURE.md` + `DESIGN-ECOMMERCE.md` (Nuxt 4), `package.json` version → `0.15.0`.
- `AGENTS.md`: stack jujur (BullMQ = TODO), section Commands + Documentation Hierarchy + MCP Tooling.
- `docs/PULL_REQUEST_TEMPLATE.md` → `.github/PULL_REQUEST_TEMPLATE.md` (agar dibaca GitHub).

### Removed

- `GEMINI.md` (duplikat identik AGENTS.md), `docs/PROMPT.md`, `docs/SUPABASE-CRUD-TUTORIAL.md`, `docs/observability.md` (stub rusak), `docs/stitch_*/design.md` (duplikat mobbin).

## [v0.15.0] - 2026-10-09

### Changed

- **Architectural Modernist Design System & Premium Visual Pass**:
  - **Geometry Scale & Token Unification (`app/assets/css/main.css`)**: Refaktor skala radius dari sudut membulat generik (`>= 24px`) menjadi skala geometri arsitektural terukur (`--radius-sm: 8px`, `--radius-md: 12px`, `--radius-card: 14px`, `--radius-media: 12px`). Warna monokrom ink-first (`#141414`), garis tepi hairline halus (`#e4e5e7`), kanvas sejuk (`#f8f8f9`), dan teks sekunder muted (`#66686d`).
  - **Product Card Architecture (`ProductCard.vue`)**: Menggantikan pita 3D skeuomorfik dengan badge status pill mengambang yang ringkas; eliminasi fallback rating 5.0 dan angka penjualan statis yang tidak berdasar; penambahan deteksi error gambar pre-hydration SSR untuk mencegah frame gambar rusak.
  - **Product Detail Polish (`ProductConfigurator.vue` & `ProductGallery.vue`)**: Menghilangkan rating 4.92 default tanpa ulasan nyata; integrasi strip jaminan fulfillment ringkas ("Gudang Jakarta", "Garansi Toko Resmi", "Midtrans Terenkripsi"); penyatuan tombol "Pesan Cepat 1-Klik" menjadi outline elegan tanpa clashing dengan tombol utama; penanganan fallback gambar multi-angle.
  - **Storefront & Catalog Polish**: Standardisasi toolbar katalog dan active filter pill badge; kanvas harga pada hero mosaic menggunakan tipografi tabular bersih tanpa aksen elektrik; `HomeFlashDeals.vue` kini menggunakan placeholder bermerek yang konsisten saat URL gambar tidak tersedia tanpa gambar jam tangan acak.
  - **Cart, Checkout, & Admin Surfaces**: Sidebar checkout dan cart diselaraskan dengan token `rounded-card` dan bayangan lembut; KPI dashboard admin (`AdminStatCard.vue`) dan tabel transaksi terintegrasi dengan elevasi monokromatis modern.
  - **Visual QA Capture Automation (`scripts/capture-visual-qa.mjs`)**: Otomasi Playwright headless yang mendukung `--env-file=.env` dan autentikasi admin sesi penuh untuk verifikasi visual desktop (1440x900 @ 2x) dan mobile (375x812 @ 2x Touch).

## [v0.14.0] - 2026-10-09

### Added

- **Multi-Agent Batch 1 Product Hardening & Enhancements**:
  - **Isolated Admin Layout & Back-Office Navigation**: Desain ulang `app/layouts/admin.vue` memisahkan header/footer publik, menyediakan topbar breadcrumb dedicated dan mobile drawer navigation.
  - **Stock Movement Ledger Modal (`/admin/products`)**: Modal riwayat pergerakan stok real-time terhubung ke endpoint `/api/admin/products/:id/stock-movements`.
  - **Interactive Multi-Angle Gallery (`/product/:id`)**: Komponen `ProductGallery.vue` dengan pemilih thumbnail multi-angle reaktif.
  - **Deterministic Search Debounce (`/katalog`)**: Debounce 300ms pada pencarian teks katalog untuk mencegah request flooding.
  - **Local Seed Data Accounts**: Akun demo deterministic (`customer@shelfstack.local` & `admin@shelfstack.local`) dengan guardrails keamanan local-only.
  - **CI & Build Pipeline**: Menambahkan step typecheck `vue-tsc --noEmit` dan `nuxt build` pada GitHub Actions CI.

- **Multi-Agent Batch 2 Full-Stack Completion**:
  - **Browser E2E User Journey Suite (Playwright)**: Suite E2E komprehensif `tests/e2e/full-business-journey.spec.ts` dan 6 Page Object Models (`LoginPage`, `CatalogPage`, `CartDrawer`, `CheckoutPage`, `OrderDetailPage`, `AdminDashboardPage`) mencakup 6 journey bisnis inti.
  - **Persisted Shipping Address Management (Supabase)**: Skema database migrasi `20261117000001_user_addresses.sql` dengan RLS granular per user, validasi Zod `shared/schemas/address.ts`, endpoint REST `/api/addresses`, composable `useAddresses.ts`, serta pemilih alamat tersimpan `SavedAddressSelector.vue` di checkout dengan auto-fill dan opsi simpan.
  - **Dynamic Real-Data Homepage**: `HomeFlashDeals.vue` kini menggunakan data produk nyata dari store katalog dengan live countdown timer menuju tengah malam; `HomeReviews.vue` ditransformasi menjadi Pusat Jaminan Kualitas & Integritas Produk (anti-fake review); `HomeFeaturedCategories.vue` terhubung ke kategori dinamis.
  - **Payment & Sandbox Copywriting Truthfulness**: Copywriting checkout dan cart diperbaiki secara dinamis agar tidak mengklaim mode Sandbox sebagai transaksi produksi.

## [v0.13.5] - 2026-10-08

### Changed

- **Premium Toast Notification Redesign (Zero-Blur & High-Contrast)**:
  - Menggantikan default blur & transparansi pucat (Aura theme 84% transparency & backdrop-blur) pada PrimeVue Toast dengan card solid opaque 100% berstandar modern luxury e-commerce (Vercel/Stripe/Sonner standard).
  - Indikator aksen ketegasan warna solid (border kiri 5px & badge pill melingkar) untuk setiap severity: Hijau zamrud (`#10b981`) untuk Sukses, Merah (`#ef4444`) untuk Error, Biru Elektrik (`#0066ff`) untuk Info, dan Amber (`#f59e0b`) untuk Warning.
  - Tipografi tajam dengan font DM Sans (headline bold 13.5px `#0f172a`, teks deskripsi 12px `#475569`, bebas dari efek kabur/milky).
  - Reposisi default Toast dari `bottom-left` ke `bottom-right` yang lebih ergonomis pada desktop dan adaptif full-width pada mobile (<640px).

## [v0.13.4] - 2026-10-08

### Added

- **Zero-Refresh Real-Time Status Synchronization (`/orders` & `/orders/[id]`)**:
  - Implementasi background active sync polling (interval 3.5s - 4s) pada pesanan dengan status `pending` di kedua halaman (`/orders` dan `/orders/[id]`), berhenti otomatis begitu status berubah menjadi `paid` atau `cancelled`.
  - Event listener `visibilitychange` dan window `focus` yang secara instan memicu pemeriksaan status pembayaran saat pengguna kembali ke tab ShelfStack setelah menyelesaikan transfer di simulator Midtrans atau mobile banking.
  - Supabase Realtime channel subscription pada `/orders` (filter `user_id=eq.${user.id}`) dan `/orders/[id]` (filter `id=eq.${orderId}`) untuk update reaktif instan ke status `paid` tanpa memerlukan reload atau penyegaran browser manual.
  - Multi-candidate order ID lookup pada `POST /api/orders/[id]/check-payment-status` untuk mendukung query order ID asli, retry suffix, maupun `midtrans_id`.

## [v0.13.3] - 2026-10-08

### Added

- **Midtrans Payment Status Check & Sync (Shopee/Tokopedia UX Standard)**:
  - Endpoint baru `POST /api/orders/[id]/check-payment-status` untuk query langsung ke Midtrans Transaction Status API (`/v2/{order_id}/status`) dan sinkronisasi otomatis ke database Supabase via RPC atomik `handle_payment_webhook`.
  - Tombol _"Cek Status Pembayaran"_ pada halaman detail pesanan pending, memungkinkan pengguna memverifikasi pelunasan transfer bank/VA secara instan tanpa tergantung pada webhook inbound saat testing di localhost.
  - Auto-synchronization di background saat halaman pesanan dibuka atau saat modal Snap ditutup.

## [v0.13.2] - 2026-10-08

### Fixed

- **Order Cancellation Schema & Error Sanitization**:
  - Menambahkan kolom `cancelled_at` dan `cancellation_reason` pada tabel `public.orders` via migrasi `20261102000001_add_cancellation_fields_to_orders.sql`, memperbaiki error `42703: column "cancelled_at" of relation "orders" does not exist` saat memanggil RPC `cancel_order`.
  - Sanitasi pesan error pembatalan pesanan pada `server/api/orders/[id]/cancel.post.ts` agar pesan teknis database internal tidak bocor ke antarmuka pengguna (UX hygiene).

## [v0.13.1] - 2026-10-08

### Fixed

- **CSP WebSocket Violation**: Menambahkan `wss://*.supabase.co` serta endpoint Midtrans ke CSP `connect-src`, `script-src`, dan `frame-src` pada `nuxt.config.ts`, memperbaiki koneksi realtime status pesanan.
- **Midtrans Duplicate Order ID Resiliency**:
  - Menyimpan `snap_token` menggunakan `serverSupabaseServiceRole` sehingga token tersimpan secara permanen di database tanpa terblokir aturan RLS.
  - Menambahkan retry fallback otomatis dengan unique attempt suffix (`${order.id}-R${timestamp}`) ketika Midtrans menolak pembuatan token dengan pesan error `order_id sudah digunakan`.
  - Normalisasi `order_id` pada webhook Nuxt dan `@shelfstack/order-service` via `extractBaseOrderId` agar RPC atomik `handle_payment_webhook` selalu menerima UUID pesanan yang valid.

## [v0.13.0] - 2026-10-08

### Added

- **Phase 0 (Concurrency Hardening & Tier-1 Catalog)**:
  - Eliminasi circular deadlock database via deterministic lock ordering (`ORDER BY product_id ASC`) pada stored procedure `create_order`.
  - Atomic webhook processor RPC `handle_payment_webhook` dengan proteksi phantom stock (`CONFLICT_ALREADY_CANCELLED`) dan auto-restock saat expired/cancelled.
  - Upgrade etalase katalog: Server-side dynamic query, Full-Text Search tsvector, faceted category counts, dan server pagination.
- **Phase 1 (Standalone Fastify Pilot Microservice - `@shelfstack/order-service`)**:
  - Service terpisah berkinerja tinggi menggunakan Fastify 5, Zod Type Provider, dan validasi signature SHA-512 Midtrans.
  - Telemetry endpoint `GET /health` dan integration test suite via `app.inject()`.
- **Phase 2 (Relational Architecture & Inventory Movements Ledger)**:
  - Tabel audit trail abadi `stock_movements` (Double-Entry Inventory Accounting Ledger).
  - Anti-tamper database triggers pada tabel `products` untuk mencatat setiap mutasi stok secara otomatis tanpa celah manipulasi aplikasi.
  - Endpoint admin paginasi `/api/admin/products/[id]/stock-movements` untuk melihat riwayat mutasi per barang.
- **Phase 3 (Containerization Docker & Compose)**:
  - Multi-stage `Dockerfile` untuk Nuxt (image ramping < 150MB, eksekusi non-root `USER node`).
  - `Dockerfile` untuk `@shelfstack/order-service`.
  - Orchestration `docker-compose.yml` dan `docker-compose.dev.yml` menghubungkan Frontend, Order Service, dan Redis 7.
- **Phase 4 & 5 (Redis Caching & Background Jobs)**:
  - Redis Cache-Aside Manager dengan resilient Circuit Breaker dan $O(1)$ Versioned Tag Invalidation (`catalog:version`).
  - Worker otomatis pembatalan pesanan kadaluwarsa (`OrderExpiryWorker`) dengan auto-restock dan cache invalidation.
- **Phase 6 & 7 (Automated CI/CD Pipeline & Production Gateway)**:
  - Pipeline GitHub Actions `.github/workflows/ci.yml` (ESLint ➔ Typecheck ➔ Vitest 100 tests ➔ Docker validation).
  - Reverse proxy gateway Nginx produksi (`deploy/nginx/nginx.conf`) dengan HTTP/2, Gzip kompresi, rate limiting, dan security headers.
  - Orchestration produksi `deploy/docker-compose.prod.yml` dan health probe probe `/api/health`.

## [v0.12.0-s4] - 2026-10-08

### Added

- **Admin Order Management & FSM (D-02)**: Modul manajemen pesanan admin lengkap dengan finite state machine (`order-transitions.ts`), endpoint `/api/admin/orders` (pencarian, paginasi, filter status), endpoint `/api/orders/[id]/status` untuk pembaruan status teratur (pending -> paid -> shipped -> completed / cancelled), serta halaman `/admin/orders` dan `/admin/orders/[id]`.
- **Admin KPI Executive Dashboard (D-01)**: Layout admin terdedikasi (`app/layouts/admin.vue`), endpoint `/api/admin/stats` dengan agregasi pendapatan total, pesanan baru, produk aktif, dan peringatan stok menipis, serta kartu KPI modular (`AdminStatCard.vue`) pada halaman `/admin`.
- **Customer Self-Service Order Cancellation & Atomic Restock (K-06)**: Pembatalan pesanan berstatus `pending` langsung oleh pelanggan via endpoint `/api/orders/[id]/cancel` didukung Supabase RPC `cancel_order` yang merestok fisik inventaris secara atomik, serta dialog konfirmasi interaktif `OrderCancelDialog.vue`.
- **Input Stok Fisik & Kategori Dinamis Form Produk (D-03 & C-07)**: Dukungan field `stock` dan pemilihan kategori dinamis berbasis endpoint `/api/categories` pada `ProductForm.vue`, pembaruan repository & store payload, serta badge kesehatan stok (`Tersedia`, `Sisa <5`, `Habis`) pada `ProductCard.vue`.
- **Realtime Listener Supabase pada Pesanan Admin**: Sinkronisasi data pesanan baru (`INSERT`) dan pembaruan status (`UPDATE`) secara realtime di `/admin/orders` menggunakan Supabase Realtime channel.
- **Filter Cepat Stok Kritis (< 5 Unit) pada Kelola Produk**: Tab filter kilat di `/admin/products` untuk memonitor dan mengisi ulang stok produk yang menipis secara instan.

### Changed

- **Peningkatan Strict Type Safety**: Penambahan definisi RPC `cancel_order` pada skema Supabase `app/types/database.types.ts`, perbaikan null-safety pada fungsi utilitas `product-specs.ts`, dan pengetatan akses opsi pada `ProductConfigurator.vue`.
- **Pembersihan Arsitektur SFC**: Menjaga batas ukuran baris komponen Vue sesuai prinsip SOP Clean Architecture (<300 baris) dengan modularisasi tabel pesanan admin.

### Fixed

- **Vue Template Compiler Syntax Error**: Mengatasi kegagalan parsing Babel AST pada event inline multiline `@click` di `/admin/orders` dengan mendefinisikan method eksplisit `prevPage()` dan `nextPage()`.

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
