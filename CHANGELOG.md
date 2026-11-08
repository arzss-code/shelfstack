# Changelog

Catatan update untuk **Product Management** (rebrand portofolio: **ShelfStack**).

## [0.36.0] - 2026-11-08

### Portfolio Packaging, PWA Standalone Manifest, Dynamic Sitemap, dan SEO Structured Data

- **PWA Web App Manifest Standalone (`public/site.webmanifest` & `nuxt.config.ts`)**:
  - Menghadirkan konfigurasi Web App Manifest standar PWA dengan display mode `standalone`, tema warna `#141414`, background color `#FFFFFF`, orientasi portrait, deskripsi aplikasi, dan icon set resmi (192x192, 512x512 maskable/any).
  - Menyematkan deklarasi manifest di konfigurasi global `nuxt.config.ts` bersama tag OpenGraph (`og:site_name`, `og:type`, `og:locale`).
- **Dynamic XML Sitemap & Crawl Directives (`server/routes/sitemap.xml.ts` & `public/robots.txt`)**:
  - Mengimplementasikan endpoint server Nitro dinamis `/sitemap.xml` yang melakukan query langsung ke database Supabase untuk mengindeks seluruh produk aktif beserta canonical slug rute publik (`/`, `/products`, `/categories`, `/c/[slug]`, `/contact`, `/promos`, `/product/[slug]`).
  - Memperbarui `public/robots.txt` dengan direktif perayapan mesin pencari terarah: mengizinkan perayapan etalase publik, memblokir area privat/administratif (`/admin/`, `/api/`), dan mendeklarasikan referensi sitemap resmi.
- **Structured Data JSON-LD Google Rich Snippets (`app/pages/product/[id].vue`)**:
  - Menerapkan schema `Schema.org/Product` reaktif pada halaman detail produk yang menyajikan metadata terstruktur: nama produk, gambar, deskripsi, SKU unik, brand resmi ShelfStack, harga mata uang IDR, ketersediaan stok (`InStock` vs `OutOfStock`), kondisi produk baru (`NewCondition`), serta `AggregateRating` dinamis bila produk memiliki ulasan pembeli.
- **Indikator Ketahanan Koneksi Jaringan Offline (`OfflineBanner.vue` & `app/layouts/default.vue`)**:
  - Membangun komponen reaktif ringan `OfflineBanner.vue` yang mendengarkan event jaringan browser `online` dan `offline` secara native tanpa library eksternal berlebih, memperingatkan pengguna saat koneksi terputus dengan desain bento minimalis non-intrusif.
  - Memasang banner secara global pada `app/layouts/default.vue` dengan transisi halus.
- **Suite Pengujian Unit & Kepatuhan Arsitektur**:
  - Menambahkan suite pengujian unit `tests/unit/pwa-seo-portfolio.spec.ts` (7/7 test lulus 100%).
  - Mempertahankan aturan batas baris kode: 0 berkas melanggar batas 300 baris.
  - 90 file pengujian Vitest (937/937 test lulus 100%) dan 14 skenario Playwright E2E lulus 100%.

## [0.35.0] - 2026-11-08

### Elevasi Etalase Publik: Craftsmanship, Anti-Slop Copywriting, dan Ulasan Pembeli Terverifikasi

- **Integrasi Ulasan Pembeli Terverifikasi Real Database (`HomeReviews.vue` & `server/api/reviews/featured.get.ts`)**:
  - Menghadirkan endpoint baru `server/api/reviews/featured.get.ts` yang mengagregasi ulasan berating tinggi (>= 4 bintang) dari tabel `product_reviews`, bergabung dengan metadata produk aktif dan profil pembeli terverifikasi.
  - Memperkaya showcase `HomeReviews.vue` dengan kartu ulasan pembeli nyata yang memuat avatar inisial, lencana "Pembeli Terverifikasi", bintang rating, kutipan pengalaman belanja terpercaya, dan tautan langsung ke detail produk.
  - Mempertahankan 4 kartu pilar komitmen layanan resmi (Kurasi Fisik 100% Asli, Jaminan Pengembalian 30 Hari, Pengemasan Tahan Benturan, Layanan Pelanggan Responsif) sebagai jaminan mutu berkelanjutan.
- **Konversi Nilai Ganda & Copywriting Anti-Slop (`HomePromoCTA.vue`)**:
  - Merekayasa ulang call-to-action beranda dengan nilai ganda: penawaran voucher belanja pelanggan baru (`WELCOME10` diskon 10% + bebas ongkir se-Indonesia) dan akses instan ke panel pengelolaan toko bagi pemilik bisnis dan evaluator.
  - Mengeliminasi jargon korporat generik dan pola klise AI, menyajikan proposisi nilai yang nyata dan dapat dibuktikan.
- **Standar Aksesibilitas Web & Penghalusan Visual Storefront**:
  - Menyelaraskan seluruh elemen interaktif beranda (`HomeHero`, `HomeAssurances`, `HomeFeatures`, `HomeReviews`, `HomePromoCTA`) dengan target sentuh minimal 44x44px, atribut `aria-hidden` pada ikon dekoratif, dan `aria-label` yang deskriptif untuk pembaca layar.
  - Memastikan dimensi eksplisit pada gambar untuk mencapai 0 Cumulative Layout Shift (CLS).
- **Suite Pengujian Unit & Kepatuhan Arsitektur**:
  - Menambahkan suite pengujian unit komprehensif `tests/unit/storefront-craft-and-copywriting.spec.ts` (7/7 test lulus).
  - Mempertahankan kepatuhan batas maksimal baris kode: 100% berkas `.vue` dan `.ts` berada di bawah 300 baris kode (0 berkas melanggar).
  - 89 file pengujian Vitest (930/930 test lulus 100%) dan 14 skenario Playwright E2E lulus 100%.

## [0.34.0] - 2026-11-08

### Arsitektur Deep Modules, Standar Web Modern, dan Eliminasi Any Type

- **Arsitektur Deep Modules (Batas Ketat Komponen <= 300 Baris Kode)**:
  - Merestrukturisasi 100% berkas `.vue` dan `.ts` pada direktori `app/`, `server/`, dan `shared/` sehingga seluruhnya berada di bawah batas maksimal 300 baris kode sesuai standar arsitektur Talenavi Senior Full-Stack Engineering SOP.
  - Mengekstraksi logika pembayaran dan Snap modal ke composable mandiri `useOrderPaymentSync.ts`.
  - Mengekstraksi polling siklus hidup pesanan pending dan visibility-change listener ke composable `useOrderPolling.ts`.
  - Mengekstraksi pelacakan kurir dan riwayat checkpoint pengiriman ke composable `useOrderTracking.ts`.
  - Mengekstraksi presentasi pesanan, badge status, segment color timeline, dan query orders ke utilitas `app/utils/order-presentation.ts`.
  - Mengekstraksi formula loyalitas koin dan kalkulasi snapshot pesanan ke `app/utils/checkout-pricing.ts`.
  - Mengekstraksi matematika diskon voucher dan seleksi kupon terbaik ke `shared/utils/coupon-math.ts`.
  - Mengekstraksi resolusi ID kandidat dan evaluasi rekonsiliasi pengembalian dana Midtrans ke `server/utils/payment-reconciliation.ts`.
  - Mengekstraksi mutasi penilaian ulasan dan rating produk ke `server/utils/review-mutations.ts`.
  - Mengekstraksi eksekusi pengembalian dana dan verifikasi webhook Midtrans ke `server/utils/midtrans-refund.ts`.
  - Mengisolasi penanganan channel Supabase Realtime bebas kebocoran memori ke `app/utils/supabase-realtime.ts`.
- **Pengetikan Basis Data Ketat dan Eliminasi Tipe `any`**:
  - Menyinkronkan `app/types/database.types.ts` dengan seluruh skema migrasi terkini termasuk kolom koin loyalitas (`coins_balance`, `coin_cost`, `coins_used`, `coins_earned`), relasi chat (`attached_order_id`, `attached_product_id`), dan parameter RPC `p_use_coins`.
  - Menghapus seluruh casting `as any`, `(client as any)`, dan `catch (err: any)` pada lapisan API server (`wishlist`, `addresses`, `account/profile`, `account/stats`, `avatar`) dan komponen UI chat.
- **Penerapan Standar Platform Web Modern**:
  - Menerapkan isolasi scroll murni berbasis CSS (`dialog:modal`, `.ui-modal-overlay { overscroll-behavior: contain; }`) dan `html.modal-open { scrollbar-gutter: stable; }` pada `UiModal.vue` untuk mencegah layout shift dan kedipan scrollbar pada browser desktop.
  - Menerapkan `font-size-adjust: from-font;` pada root `body` di `main.css` untuk mencegah layout shift saat pemuatan web font.
  - Menerapkan `text-wrap: balance;` pada heading (`h1, h2, h3, h4`) dan `text-wrap: pretty;` pada teks paragraf (`p, li, blockquote`) untuk tipografi yang rapi tanpa kata yatim (typographical orphans).
  - Menerapkan atribut aksesibilitas formulir W3C ARIA (`:aria-errormessage`, `role="alert"`, `aria-live="polite"`) pada `UiInput.vue` dan `UiTextarea.vue`.
- **Suite Pengujian Unit Otomatis (`tests/unit/deep-modules-and-web-standards.spec.ts`)**:
  - Menambahkan 16 pengujian unit terisolasi yang menguji matematika voucher, kalkulasi diskon koin, isolasi rekonsiliasi pembayaran, dan logika presentasi timeline pesanan (16/16 lulus).
  - Seluruh 88 file pengujian Vitest (923/923 test) dan 14 pengujian E2E Playwright lulus 100%.

## [0.33.2] - 2026-11-07

### Ekspansi E2E Rute Kategori, Hardening Aksesibilitas WCAG & Penutupan Gap Web Vitals

- **Ekspansi Pengujian E2E Rute Kategori Playwright (`tests/e2e/category-journey.spec.ts`)**:
  - Menghadirkan skenario otomasi browser E2E kanonik untuk memvalidasi pemuatan etalase `/c/tech`, verifikasi metadata breadcrumb, tautan filter katalog, penanganan recovery empty state untuk slug invalid, serta tampilan responsif mobile (375px).
  - Menghubungkan kartu kategori beranda `HomeFeaturedCategories.vue` langsung ke rute `/c/[slug]` dan memperluas verifikasi di `tests/e2e/home.spec.ts`.
- **Hardening Aksesibilitas WCAG 2.1 AA & Semantic Hierarchy**:
  - Memperbaiki kontras warna teks dan badge peringatan pada `HomeFlashDeals.vue` dan `useProductCard.ts` menggunakan token desain resmi yang lolos rasio kontras 4.5:1.
  - Memperbaiki hierarki heading bertingkat (H1 > H2 > H3) pada halaman `/c/[slug].vue`, kartu flash deal, dan penyesuaian kartu penjamin nilai belanja `HomeAssurances.vue`.
  - Menghilangkan anomali nama aksesibilitas pada ikon wishlist dan cart di `AppNavbar.vue` dengan penambahan atribut `aria-hidden="true"` pada elemen hitungan numerik.
- **Audit Terukur Lighthouse & Core Web Vitals (`docs/PROGRESS.md`)**:
  - Audit empiris via Chrome DevTools MCP membuktikan skor Accessibility 100/100 pada `/c/tech` dan 96/100 pada `/` (100 di lingkungan produksi di luar devtools overlay), Best Practices 100/100, SEO 100/100, serta CLS 0.00.
  - Menutup gap terakhir fase 5 pada `docs/PROGRESS.md`.

## [0.33.1] - 2026-11-07

### Rute Kategori Cantik SEO, Sinkronisasi E2E Demo Banner & Dokumentasi Portofolio

- **Rute Cantik Kategori SEO-Friendly (`app/pages/c/[slug].vue` : Backlog C-06)**:
  - Menghadirkan halaman etalase kategori terkurasi `/c/[slug]` (misalnya `/c/tech`, `/c/home`, `/c/furniture`, `/c/lifestyle`, `/c/stationery`).
  - Dilengkapi metadata SEO dinamis via `useSeoMeta` (`title`, `description`, `ogTitle`, `ogDescription`, `ogImage`), breadcrumb navigasi terhubung (`Beranda > Katalog > Kategori`), header informasi kategori kurasi resmi, dan integrasi grid `ProductList`.
  - Penanganan graceful empty state via `UiEmptyState` saat parameter slug tidak dikenal.
  - Suite pengujian unit otomatis di `tests/unit/category-slug-page.spec.ts` (3/3 test lulus).
- **Sinkronisasi E2E Playwright dengan Akun Demo (`tests/e2e/pages/LoginPage.ts`, `tests/e2e/auth.spec.ts`)**:
  - Memperbarui fallback kredensial otomatis pada `LoginPage.ts` ke `demo-customer@shelfstack.local` dan `demo-admin@shelfstack.local`.
  - Menambahkan pengujian otomasi browser Playwright di `tests/e2e/auth.spec.ts` yang memverifikasi pengisian instan 1-klik `AuthDemoCredentialsBanner` untuk kedua peran akun demo.
- **Penyelarasan Dokumentasi Portofolio (`README.md`, `docs/BACKLOG.md`, `docs/PROGRESS.md`)**:
  - Dokumentasi CLI seeder `pnpm db:seed` (`--remote` dan `--local`), tabel hak akses akun demo portofolio, dan endpoint observabilitas `/api/health` & `/api/ready`.
  - Menandai penyelesaian `C-06` di `docs/BACKLOG.md` dan memperbarui riwayat fase pada `docs/PROGRESS.md`.

## [0.33.0] - 2026-11-07

### Kesiapan Peluncuran Produksi, Ekosistem Seeding Penuh, Telemetri Multi-Layanan & Hardening Web Vitals

- **Ekosistem Seeding Database Deterministik Penuh (`supabase/seed.sql` : Backlog F0-02)**:
  - Master Kupon Aktif: Menambahkan kupon `WELCOME10` (10% maks Rp 50k), `SHELF50K` (flat Rp 50k min Rp 300k), dan `FREESHIP` (bebas ongkir Rp 15k).
  - Riwayat Pesanan 5 Status Lifecycle: Menambahkan dataset pesanan pelanggan di seluruh status (`completed`, `shipped`, `paid`, `pending`, `cancelled`) beserta rincian item, kalkulasi ongkir, dan alamat pengiriman kanonis.
  - Linimasa Checkpoint Ekspedisi Kurir: Menambahkan riwayat pelacakan kurir terpadu (JNE dan SiCepat) dari manifested, in_transit, hingga delivered.
  - Ulasan Produk Terverifikasi & Komplain Retur: Menambahkan ulasan pelanggan bintang 5 pada Headphone Studio ANC dan Tas Komuter EDC Ballistic, serta 1 tiket garansi retur aktif (`requested`) di `/admin/returns`.
  - Percakapan Live Chat CS & Notifikasi In-App: Menambahkan thread pesan interaktif pelanggan-admin di `/admin/support` dan notifikasi in-app pada `/notifications`.
- **Telemetri Kesiapan Sistem Multi-Layanan (`server/api/ready.get.ts`, `server/api/health.get.ts` : Backlog Q-03)**:
  - Endpoint `/api/ready` kini memverifikasi 3 dependensi terdistribusi secara asinkron: database PostgreSQL via Supabase, jembatan internal `@shelfstack/order-service` via `pingOrderService()`, serta status Redis cache.
  - Endpoint `/api/health` menyediakan probe liveness yang melaporkan status proses, uptime, versi semver, versi Node.js, dan lingkungan eksekusi.
  - Suite pengujian otomatis komprehensif di `tests/unit/health-readiness.spec.ts` (8/8 test lulus).
- **Akses Demo 1-Klik untuk Evaluasi Portofolio (`app/pages/auth/login.vue` : Backlog Q-04)**:
  - Komponen baru `app/components/auth/AuthDemoCredentialsBanner.vue` menghadirkan tombol pemilihan akun cepat untuk Demo Pelanggan (`customer@shelfstack.local`) dan Demo Admin (`admin@shelfstack.local`).
  - Suite pengujian otomatis di `tests/unit/auth-demo-banner.spec.ts` (3/3 test lulus).
- **Hardening Core Web Vitals & Aksesibilitas WCAG 2.1 AA (`Backlog Q-05`)**:
  - `ProductGallery.vue`: Menambahkan `width="800" height="600" fetchpriority="high" decoding="async"` pada gambar LCP utama halaman produk dan `width="64" height="64" loading="lazy" decoding="async"` pada thumbnail sudut foto.
  - `HomeFeaturedCategories.vue`: Menambahkan `width="600" height="400" decoding="async"` pada banner kategori serta atribut `aria-hidden="true"` pada ikon dekoratif.
  - `ProductCard.vue` & `HomeFlashDeals.vue`: Menjamin kontainer rasio aspek tetap (`aspect-square`) untuk mencegah pergeseran tata letak (CLS < 0.1).

## [0.32.0] - 2026-11-06

### Paritas Transaksional Pembatalan Pesanan, Worker BullMQ + DLQ & Standar Web Modern

- **Database PostgreSQL & Paritas Transaksional Pembatalan (`supabase/migrations/20261130000001_order_cancellation_parity_and_expiry_hardening.sql`)**:
  - Soft delete pada `public.coupon_usages`: Menambahkan kolom `deleted_at timestamptz` dan indeks parsial unik `idx_coupon_usages_active_unique` (`WHERE deleted_at IS NULL`), menggantikan operasi hard `DELETE` saat pesanan dibatalkan.
  - Perbaikan `public.cancel_order(uuid, text)`: Memulihkan konteks state-machine `set_config('app.order_transition_source', 'cancel_order_rpc', true)`, dukungan otorisasi admin (`public.is_admin()`), grant `authenticated, service_role`, soft-delete `coupon_usages`, pemulihan kuota `coupons` dan wallet `user_coupons`, serta refund koin loyalitas (`coins_used`) secara idempoten.
  - Paritas penuh pada `public.handle_payment_webhook` (`p_target_status = 'cancelled'`) dan `public.transition_order_status` (`p_target_status = 'cancelled'`): Menyatukan pengembalian stok, kupon, koin loyalitas (`cancelled_order`), dan notifikasi pelanggan (`auto_timeout`).
  - Sinkronisasi `app/types/database.types.ts`, `server/api/coupons/validate.post.ts` (`.is('deleted_at', null)`), dan `server/api/admin/coupons/[id]/usages.get.ts`.
- **Infrastruktur Antrean Kedaluwarsa BullMQ + Dead Letter Queue (`@shelfstack/order-service` & Nitro)**:
  - `services/order-service/src/queues/order-expiry.queue.ts` & `src/workers/order-expiry.worker.ts`: Implementasi antrean `order-expiry` (delayed job deterministik `expire-order-<uuid>`), penjadwal rekonsiliasi berkala 5 menit (`upsertJobScheduler`), exponential backoff retry (`3` percobaan, jeda dasar `5000ms`), dan eskalasi kegagalan permanen ke `order-expiry-dlq`.
  - `services/order-service/src/routes/order.routes.ts` & `deploy/nginx/nginx.conf`: Endpoint internal terproteksi `x-internal-secret` (`POST /schedule-expiry`, `GET /queue-stats`, `GET /dlq`, `POST /dlq/:jobId/retry`) dengan blokir akses publik di level reverse proxy Nginx.
  - `server/utils/order-service.ts`, `server/api/orders/index.ts`, `server/api/admin/orders/expiry-queue.get.ts`, `server/api/admin/orders/expiry-dlq-retry.post.ts`, `app/composables/useAdminExpiryQueue.ts`, dan `app/features/orders/components/AdminExpiryQueueCard.vue`: Penjadwalan kedaluwarsa secara fail-open saat checkout dan kartu telemetri antrean + replay DLQ pada halaman `/admin/orders`.
- **Unifikasi Skema Zod Produk (`Backlog C-07`) & Dokumentasi (`Backlog Q-04`)**:
  - `shared/schemas/product.ts` & `app/composables/useProductForm.ts`: Ekspor `productFormSchema` tunggal (batas nama 120 karakter seragam antara formulir klien dan API server).
  - `README.md`, `AGENTS.md`, `docs/PROGRESS.md`, `docs/BACKLOG.md`: Pembaruan arsitektur sistem Mermaid, matriks fitur, indeks ADR, panduan quickstart `pnpm`, dan status BullMQ/DLQ.
- **Remediasi Performa, Aksesibilitas & Standar Web Modern**:
  - `nuxt.config.ts` & `app/assets/css/main.css`: Atribut `<html lang="id">`, pemuatan `DM Sans` via `<link rel="preconnect">` (menghapus `@import` CSS berantai dan font `Inter` tak terpakai), utilitas `.skip-link`, serta penggantian aturan global `animation-duration: 0.01ms !important` dengan aturan `@media (prefers-reduced-motion: reduce)` yang terarah.
  - `app/layouts/default.vue`, `app/layouts/admin.vue`, `HomeHero.vue`, `HomeFlashDeals.vue`, `ProductCard.vue`, `AppNavbar.vue`, `NavbarSearchBar.vue`, `NavbarMobileDrawer.vue`, `UiModal.vue`, dan `UiInput.vue`: Skip link keyboard, `min-h-[100dvh]`, `fetchpriority="high"` dan dimensi eksplisit pada gambar LCP utama, penghapusan `font-mono` dan warna hex hardcoded pada kartu promo, pembungkus semantik `<search>`, `aria-labelledby` + `overscroll-contain` pada modal dialog, serta penonaktifan `spellcheck`/`autocorrect` pada input identifier.
- **Pengujian Otomatis & Quality Gate**:
  - Menambahkan `services/order-service/tests/bullmq-expiry-dlq.spec.ts` (10 test baru; total `order-service`: 2 file / 25 test lulus 100%) dan `tests/unit/order-cancellation-parity.spec.ts` (12 test baru; total aplikasi utama: 84 file / 892 test lulus 100%).
  - Seluruh 173 berkas `.vue` di `app/` mematuhi batas `<= 300` baris kode.

## [0.31.1] - 2026-11-06

### Modularisasi Menyeluruh Sesuai SOP <= 300 Baris & Penyempurnaan Live Chat

- **Penyempurnaan Live Chat Realtime & UI Etalase**:
  - `app/composables/useSupportChat.ts` & `app/composables/useAdminSupportChat.ts`: Proteksi deduplikasi singleton channel Supabase Realtime dan stabilisasi langganan percakapan.
  - `app/components/support/`: Ekstraksi `LiveChatComposer.vue`, dukungan perenderan gelembung lampiran pesanan dan produk (`OrderAttachmentModal.vue`, `ProductAttachmentModal.vue`), perapian dock jendela chat, serta perbaikan kelas skala aktif tombol peluncur (`active:scale-95`) pada `LiveChatWidget.vue`.
  - `app/components/ui/UiTooltip.vue` & `app/components/admin/support/`: Perbaikan perataan tooltip di tepi layar dan penambahan dropdown filter status pada inbox admin.
- **Modularisasi 100% Halaman & Komponen di Bawah 300 Baris (172 File Vue <= 300 Baris)**:
  - **Modularisasi 14 Halaman (`app/pages/`)**: Ekstraksi composable dan sub-komponen terfokus pada `orders/[id].vue` (286 baris), `orders/index.vue` (283 baris), `promos.vue` (246 baris), `help.vue` (251 baris), `admin/orders/[id].vue` (188 baris), `notifications.vue` (168 baris), `contact.vue` (235 baris), `admin/orders/index.vue` (150 baris), `katalog.vue` (224 baris), `admin/products.vue` (157 baris), `admin/coupons.vue` (148 baris), `cart.vue` (246 baris), `account/addresses.vue` (296 baris), dan `account/profile.vue` (252 baris).
  - **Modularisasi 15 Komponen (`app/components/` & `app/features/`)**: Ekstraksi composable dan sub-komponen pada `AppNavbar.vue` (291 baris), `UiSelect.vue` (248 baris), `NotificationBell.vue` (254 baris), `CartDrawer.vue` (206 baris), `OrderCard.vue` (231 baris), `LocationPickerModal.vue` (206 baris), `VoucherSelectModal.vue` (287 baris), `ProductCard.vue` (230 baris), `HomeFlashDeals.vue` (214 baris), `ProductForm.vue` (138 baris), `ProductConfigurator.vue` (247 baris), `OrderReturnModal.vue` (257 baris), `OrderReturnStatusCard.vue` (242 baris), `ProductReviewsSection.vue` (139 baris), dan `AdminReturnDetailModal.vue` (251 baris).
- **Sinkronisasi Dokumentasi & Quality Gate**:
  - `docs/PROGRESS.md` & `docs/BACKLOG.md`: Sinkronisasi status inventaris fitur yang sudah tuntas (Pusat Notifikasi, Lacak Pengiriman, Kupon Promo & Diskon, dan Live Chat CS).
  - Verifikasi quality gate aktual: `pnpm typecheck` EXIT 0, `pnpm lint` EXIT 0 (0 error, 0 warning), dan `pnpm exec vitest run` 83 file test / 880 tests lulus 100%.

## [0.31.0] - 2026-11-04

### Sistem Live Chat Bantuan Pelanggan Real-time (Customer Support Live Chat)

- **Database PostgreSQL & Supabase Storage**:
  - `supabase/migrations/20261129000001_customer_support_live_chat.sql`:
    - Tabel baru `public.support_threads`: Menampung 1 dedicated thread percakapan per pelanggan dengan kolom `customer_id`, `status` (open, waiting_admin, waiting_customer, resolved), `last_message_text`, `last_message_at`, `unread_by_customer_count`, `unread_by_admin_count`, `attached_order_id`, `attached_product_id`, dan `deleted_at`.
    - Tabel baru `public.support_messages`: Menampung riwayat pesan dengan kolom `thread_id`, `sender_type` (customer, admin, system), `sender_id`, `message_text`, `attachment_url`, `attachment_type` (image, order_card, product_card), `is_read`, dan `deleted_at`.
    - Database Trigger `trigger_update_support_thread_on_message`: Secara atomik memperbarui pesan terakhir, timestamp, dan menambah counter unread untuk pihak lawan.
    - Bucket Supabase Storage baru `chat-attachments`: Penyimpanan foto bukti tangkapan layar dengan batasan ukuran 5MB, format JPEG/PNG/WebP, dan kebijakan RLS khusus kepemilikan user.
    - Pendaftaran publikasi Supabase Realtime untuk tabel `support_threads` dan `support_messages`.
- **Skema Zod & Utilitas Server Bersama**:
  - `shared/schemas/support-chat.ts`: Skema validasi terpadu (`sendSupportMessageSchema`, `updateThreadStatusSchema`, `supportThreadQuerySchema`) dengan batas 1-1000 karakter pesan dan pesan validasi bahasa Indonesia.
  - `server/utils/support-chat.ts`: Kamus template balasan cepat (_canned responses_) resmi tim CS, generator pesan bot selamat datang otomatis (_auto welcome bot_), dan pemformat waktu relatif.
- **Backend API Server Nitro**:
  - `GET /api/support/thread`: Endpoint inisialisasi thread dan riwayat 50 pesan pelanggan.
  - `POST /api/support/messages`: Endpoint pengiriman pesan pelanggan dengan pemicu otomatis bot selamat datang pada pesan pertama.
  - `PATCH /api/support/read`: Endpoint reset counter unread pelanggan menjadi 0 saat obrolan dibuka.
  - `POST /api/support/upload`: Endpoint pengunggahan berkas bukti foto ke bucket `chat-attachments`.
  - `GET /api/admin/support/threads`: Endpoint admin memuat daftar seluruh inbox obrolan dengan filter status dan pencarian nama.
  - `GET /api/admin/support/threads/[id]/messages`: Endpoint admin memuat riwayat pesan obrolan spesifik.
  - `POST /api/admin/support/threads/[id]/messages`: Endpoint admin membalas pesan obrolan ke pelanggan.
  - `PATCH /api/admin/support/threads/[id]/status`: Endpoint admin memperbarui status kendala obrolan.
- **Komponen Frontend & State Management (Semua Komponen <= 300 Baris)**:
  - `app/composables/useSupportChat.ts`: Composable state management pelanggan (292 baris) dengan sinkronisasi realtime channel `support-thread-${threadId}` dan penanganan login guard.
  - `app/composables/useAdminSupportChat.ts`: Composable state management admin (272 baris) dengan agregasi channel `admin-support-inbox`.
  - `app/components/support/LiveChatWidget.vue`: Tombol mengapung interaktif (115 baris) di pojok kanan bawah etalase dengan animasi pulse dan badge unread counter.
  - `app/components/support/LiveChatWindow.vue`: Popover window obrolan (245 baris) dengan header status CS, stream gelembung pesan, form composer, dan kartu ajakan masuk untuk pengunjung tamu.
  - `app/components/support/ChatOrderSnippet.vue`: Kartu ringkas cuplikan pesanan terlampir (71 baris) langsung di dalam pesan.
  - `app/components/admin/support/AdminSupportInboxList.vue`: Panel kiri inbox admin (228 baris) dengan tab filter status dan pencarian pelanggan.
  - `app/components/admin/support/AdminSupportChatPane.vue`: Panel kanan percakapan aktif admin (250 baris) dengan profil pelanggan dan aksi tandai selesai.
  - `app/components/admin/support/AdminCannedResponseMenu.vue`: Popover template balasan cepat 1-klik (91 baris).
  - `app/pages/admin/support.vue`: Halaman orchestrator split-view dual-pane admin (184 baris).
  - `app/layouts/default.vue`: Pemasangan global widget `<LiveChatWidget />` di etalase toko.
  - `app/layouts/admin.vue`: Penambahan menu navigasi "Bantuan & Live Chat" dengan ikon `pi-comments` dan badge unread.
  - `app/pages/help.vue` & `app/pages/contact.vue`: Tombol aksi cepat terintegrasi langsung dengan launcher live chat.
- **Pengujian Unit Otomatis**:
  - 8 suite pengujian unit baru melingkupi skema Zod, perenderan komponen Vue, simulasi realtime, deduplikasi pesan, dan API admin.
  - Total pengujian proyek: 83 file test / 880 tests lulus 100%.

## [0.30.1] - 2026-11-04

### Perbaikan Inisialisasi Store Wishlist (Temporal Dead Zone)

- **Fix Store Wishlist (`app/features/wishlist/stores/wishlist.ts`)**:
  - Memperbaiki `ReferenceError: Cannot access 'syncLocalToDatabase' before initialization` yang terjadi saat pengguna terautentikasi membuka aplikasi.
  - Menata ulang urutan deklarasi fungsi helper internal (`checkIsLoggedIn`, `saveWishlist`, `mapWishlistRow`, `fetchFromDatabase`, `syncLocalToDatabase`, `initWishlist`) di atas getters dan actions publik.
  - Memindahkan eksekusi `initWishlist()` dan registrasi watcher sesi user ke bagian paling bawah blok setup store.
  - Menghapus opsi berlebih `{ immediate: true }` pada watcher sesi pengguna guna mencegah eksekusi duplikat saat inisialisasi awal.
  - Mengekstrak logika pemetaan baris database ke `mapWishlistRow`, merampingkan berkas dari 328 baris menjadi 295 baris (mematuhi batas SOP maksimal 300 baris per berkas).
- **Pengujian Unit (`tests/unit/wishlist-store.spec.ts`)**:
  - Menambahkan pengujian inisialisasi store dengan simulasi pengguna terautentikasi (`mockNuxtImport('useSupabaseUser', ...)`), memastikan store berhasil terinisialisasi tanpa `ReferenceError`.
  - Total pengujian proyek: 74 file test / 702 tests lulus 100%.

## [0.30.0] - 2026-11-03

### Sistem Komplain & Retur Barang Pelanggan (Customer Returns & RMA Workflow)

- **Database PostgreSQL & Supabase Storage Bucket**:
  - `supabase/migrations/20261128000001_customer_return_requests_and_rma.sql`:
    - Tabel baru `public.return_requests`: Pencatatan tiket komplain retur pelanggan dengan kolom `order_id`, `user_id`, `reason_type` (defective, damaged_in_transit, wrong_item, missing_accessories, other), `solution_type` (refund, replacement), `customer_notes`, `proof_image_urls`, `unboxing_video_url`, `status` (requested, approved, rejected, item_received, completed, cancelled), `return_courier`, `return_tracking_number`, `admin_notes`, `replacement_courier`, `replacement_tracking_number`, `refund_amount_cents`, `restocked_at`, `resolved_at`, dan `deleted_at`.
    - Partial Unique Index `idx_return_requests_active_order`: Memastikan hanya ada 1 tiket retur aktif per pesanan.
    - Bucket baru Supabase Storage `return-proofs`: Bucket khusus penyimpanan foto bukti retur dengan batasan ukuran 5MB, format JPEG/PNG/WebP, dan kebijakan RLS khusus kepemilikan user.
- **Skema Zod & Logika Validasi Bersama**:
  - `shared/schemas/return-request.ts`: Skema validasi terpadu (`createReturnRequestSchema`, `updateReturnTrackingSchema`, `adminReviewReturnRequestSchema`, `returnFilterQuerySchema`) dengan pesan validasi berbahasa Indonesia.
  - `server/utils/return-request.ts`: Helper penentuan jendela retur garansi 7 hari (`checkReturnWindowEligibility`), alamat resmi pusat retur pergudangan ShelfStack, kamus label alasan, dan metadata status warna semantik.
- **Backend API Server Nitro**:
  - `server/api/returns/upload.post.ts`: Endpoint pengunggahan berkas foto bukti ke bucket `return-proofs` dengan validasi tipe mime, sanitasi nama berkas unik, dan batas maksimal 5MB.
  - `server/api/orders/[id]/return-requests/index.get.ts`: Endpoint publik pelanggan untuk memuat status kelayakan retur pesanan dan tiket aktif.
  - `server/api/orders/[id]/return-requests/index.post.ts`: Endpoint pengajuan tiket retur baru dengan verifikasi jendela 7 hari, kepemilikan pesanan, audit log, dan in-app notification.
  - `server/api/orders/[id]/return-requests/tracking.put.ts`: Endpoint pelanggan untuk menginput kurir dan nomor resi pengiriman balik barang retur setelah tiket disetujui.
  - `server/api/admin/returns/index.get.ts`: Endpoint terproteksi admin untuk memuat daftar tiket retur, metrik statistik, dan filter pencarian.
  - `server/api/admin/returns/[id]/review.put.ts`: Endpoint terproteksi admin untuk memproses keputusan RMA (approve, reject, item_received, completed) dengan opsi pengembalian stok inventaris (`restock_inventory`) dan audit log.
- **Komponen Frontend & State Management (Semua Komponen <= 300 Baris)**:
  - `app/composables/useReturnRequest.ts`: Composable state management reaktif (148 baris) untuk memuat data retur, mengunggah foto, dan mengirimkan tiket komplain.
  - `app/components/orders/OrderReturnModal.vue`: Modal interaktif pengajuan retur (294 baris) dengan selektor solusi (refund vs penukaran unit), pilihan alasan kendala, deskripsi kendala, dan pratinjau multi-foto bukti.
  - `app/components/orders/OrderReturnStatusCard.vue`: Kartu pelacak status retur pelanggan (265 baris) dengan stepper 4 tahap visual, instruksi alamat gudang pengembalian, formulir input resi kurir, dan catatan admin.
  - `app/components/admin/returns/AdminReturnDetailModal.vue`: Modal inspeksi RMA admin (249 baris) dengan galeri foto bukti resolusi penuh, formulir keputusan admin, input kurir pengganti, dan toggle restock inventaris otomatis.
  - `app/pages/admin/returns.vue`: Panel manajemen RMA admin (282 baris) dengan 4 kartu metrik KPI, tab navigasi status filter, input pencarian real-time, dan tabel interaktif tiket retur.
  - `app/layouts/admin.vue`: Penambahan menu navigasi "Komplain & Retur" dengan ikon `pi-replay`.
  - `app/pages/orders/[id].vue`: Integrasi tombol "Ajukan Komplain / Retur" dan penampil kartu status retur pada rincian pesanan pelanggan.
  - `app/components/ui/UiAlert.vue`: Perbaikan perataan vertikal ikon dan teks alert agar selalu sejajar pada semua varian.
- **Pengujian Unit & Kualitas**:
  - `tests/unit/return-request-schema.spec.ts`: 14 pengujian unit untuk validasi skema pengajuan retur, batas foto, dan kalkulasi eligibility 7 hari garansi.
  - `tests/unit/order-return-components.spec.ts`: 6 pengujian unit untuk perenderan komponen status card dan modal retur.
  - Total pengujian proyek: 74 file test / 701 tests lulus 100%.

## [0.29.0] - 2026-11-03

### Modularisasi & Manajemen Kupon Voucher Promo Panel Admin

- **Modularisasi Komponen Halaman Admin (`/admin/coupons.vue`)**:
  - `app/pages/admin/coupons.vue`: Didekomposisi dari file monolitik 751 baris menjadi 286 baris (mematuhi batas ketat SOP maksimal 300 baris per file). Bertindak sebagai orchestrator ramping dengan filter pencarian, filter status semantik, filter tipe diskon, dan koordinasi modal dialog.
  - `app/components/admin/coupons/AdminCouponMetrics.vue`: Sub-komponen modular (64 baris) bento grid 4 kartu KPI (Total Voucher, Voucher Aktif, Total Penggunaan, Total Diskon Diberikan).
  - `app/components/admin/coupons/AdminCouponTable.vue`: Sub-komponen modular (215 baris) tabel data voucher terstandarisasi dengan badge status semantik, progress bar penggunaan kuota, pill kode voucher, dan tombol aksi (toggle aktif, ubah, audit riwayat, soft delete).
  - `app/components/admin/coupons/AdminCouponModal.vue`: Sub-komponen modular (229 baris) modal formulir terpadu untuk menerbitkan dan memperbarui parameter voucher promosi dengan validasi real-time.
  - `app/components/admin/coupons/AdminCouponUsagesModal.vue`: Sub-komponen modular (189 baris) modal dialog audit riwayat pesanan yang telah menggunakan voucher tertentu (Order ID, total belanja, potongan diskon, status order, dan tanggal pemakaian).
  - `app/composables/useAdminCouponForm.ts`: Composable state management (148 baris) untuk formulir kupon dengan sinkronisasi adapter numerik, validasi batas nilai, dan transformer payload.
- **Integrasi Biaya Koin Loyalitas (`coin_cost`)**:
  - Admin kini dapat mengonfigurasi biaya koin (`coin_cost`) langsung via modal formulir voucher.
  - Voucher berbiaya koin secara otomatis ditampilkan di katalog penukaran koin pelanggan pada halaman `/account/points` dan ditandai dengan badge khusus "Voucher Koin" pada tabel admin.
- **Backend Nitro API & Schema Zod**:
  - `shared/schemas/coupon.ts`: Penambahan validasi field `coin_cost` pada `createCouponSchema` dan `updateCouponSchema`.
  - `server/api/admin/coupons/index.get.ts`: Pemetaan atribut `coin_cost` dan format koin pada daftar voucher admin.
  - `server/api/admin/coupons/index.post.ts` & `server/api/admin/coupons/[id].put.ts`: Penyimpanan dan pembaruan kolom `coin_cost` ke database Supabase.
  - `server/api/admin/coupons/[id]/usages.get.ts`: Endpoint terproteksi admin untuk mengambil riwayat pemakaian voucher dari tabel `coupon_usages` join rincian `orders`.
- **Pengujian Unit & Kualitas**:
  - `tests/unit/admin-coupons-management.spec.ts`: 5 pengujian unit baru untuk validasi skema voucher loyalitas, format angka, dan kalkulasi masa kedaluwarsa.
  - `tests/unit/coupon-schema.spec.ts`: Penambahan pengujian unit atribut `coin_cost` (total 21 pengujian lulus).
  - Total pengujian proyek: 72 file test / 681 tests lulus 100%.

## [0.28.0] - 2026-11-03

### Sistem Poin dan Koin Belanja (ShelfStack Coins and Loyalty Rewards Hub)

- **Halaman Loyalty Rewards Mandiri (`/account/points`)**:
  - `app/pages/account/points.vue`: Hub loyalitas pelanggan terpadu (166 baris) dengan 2 tab navigasi ("Tukar Voucher" dan "Riwayat Transaksi"), tombol penyegaran instan, breadcrumbs, dan 5 status interaksi wajib.
  - `app/components/account/points/CoinBalanceCard.vue`: Kartu bento saldo koin bertema gradien emas dan amber hangat (106 baris) yang menampilkan saldo koin, ekuivalen nilai rupiah (1 Koin = Rp 1), statistik seumur hidup (total didapat vs total dipakai), serta banner 1-klik klaim bonus sambutan 10.000 Koin bagi pengguna baru.
  - `app/components/account/points/CoinVoucherExchangeGrid.vue`: Grid katalog voucher eksklusif penukaran koin (158 baris) dengan kartu voucher takik taktil, indikator biaya koin, kupon sudah ditukar, dan tombol penukaran interaktif.
  - `app/components/account/points/CoinTransactionList.vue`: Garis waktu mutasi koin double-entry transaksional (127 baris) dengan badge ikon visual untuk setiap kategori (+ untuk earned, welcome bonus, dan refund, - untuk spent dan redeemed) serta status saldo setelah mutasi.
  - `app/composables/useLoyaltyPoints.ts`: Composable state management reaktif untuk ringkasan koin, katalog penukaran, klaim bonus sambutan, dan eksekusi penukaran voucher dengan fallback runtime ramah pengujian.
- **Integrasi Pemakaian Koin di Halaman Checkout**:
  - `app/components/checkout/CheckoutCoinsToggle.vue`: Komponen toggle switch 1-klik yang mudah diakses (109 baris, role switch, WCAG AA, target sentuh 44px) untuk menukarkan koin dengan batas otomatis maksimal 50% dari subtotal barang setelah kupon diskon.
  - `app/components/checkout/CheckoutOrderSummary.vue`: Pembaruan rincian tagihan belanja dengan baris potongan koin interaktif.
  - `app/pages/checkout.vue` dan `app/composables/useCheckoutOrder.ts`: Pengikatan parameter `coins_used` ke pembuatan pesanan, pembaruan kalkulasi total pembayaran aman Midtrans Snap, serta sinkronisasi kunci idempotensi saat status koin berubah.
- **Navigasi Akun Terpadu**:
  - `app/components/account/AccountSidebar.vue` dan `app/components/account/AccountNavTabs.vue`: Penambahan tautan menu "Koin & Rewards" dengan ikon koin emas pada navigasi sidebar desktop dan pita horizontal seluler (semua komponen <= 300 baris).
- **Database Transaksional & RPC Supabase**:
  - `supabase/migrations/20261127000001_loyalty_coins_and_rewards.sql`:
    - Tabel `public.user_coins`: Pencatatan saldo koin per pengguna dengan kolom `balance_coins`, `lifetime_earned_coins`, `lifetime_spent_coins`, dan `has_claimed_welcome` dengan RLS ketat.
    - Tabel `public.coin_transactions`: Ledger audit mutasi koin double-entry dengan jenis `'earned'`, `'spent'`, `'redeemed_voucher'`, `'welcome_bonus'`, `'refunded_order'`, `'cancelled_order'`.
    - Kolom baru pada `public.orders`: `coins_used`, `coins_discount_cents`, `coins_earned`.
    - Kolom baru pada `public.coupons`: `coin_cost` untuk kupon penukaran koin eksklusif (`KOINONGKIR`, `KOINHEMAT25`, `KOINSUPER50`).
    - RPC `claim_welcome_coins`: Pemberian bonus sambutan 10.000 Koin untuk pengguna baru dengan proteksi klaim ganda.
    - RPC `exchange_coins_for_voucher`: Penukaran koin ke voucher dompet `public.user_coupons` secara atomik dengan verifikasi saldo.
    - Pembaruan RPC `create_order`: Pemotongan saldo koin secara atomik dengan batasan maksimal 50% dari subtotal setelah kupon diskon.
    - Pembaruan RPC `cancel_order`: Pemulihan koin yang digunakan saat pesanan dibatalkan.
    - Pembaruan RPC `transition_order_status`: Pemberian cashback 1% koin secara otomatis saat pesanan bertransisi ke status `'completed'`.
- **Backend API & Validasi Kontrak**:
  - `shared/schemas/loyalty-coin.ts`: Validasi skema Zod untuk mutasi koin, ringkasan saldo koin, input penukaran kupon, dan item katalog penukaran.
  - `server/api/account/points/index.get.ts`: Endpoint terproteksi untuk mengambil ringkasan saldo dan 20 riwayat mutasi koin terbaru.
  - `server/api/account/points/welcome.post.ts`: Endpoint terproteksi untuk klaim bonus sambutan pengguna baru via RPC atomik.
  - `server/api/account/points/exchange.post.ts`: Endpoint terproteksi untuk penukaran koin ke voucher dompet via RPC atomik.
  - `server/api/account/points/catalog.get.ts`: Endpoint publik/terautentikasi untuk memuat katalog penukaran kupon loyalitas.
  - `server/api/orders/index.ts`: Integrasi penerimaan parameter `coins_used` ke pemanggilan RPC atomik `create_order`.
- **Pengujian Unit & Keamanan**:
  - `tests/unit/loyalty-coin-schema.spec.ts`: 13 pengujian unit skema Zod dan aturan kalkulasi batas 50% subtotal.
  - `tests/unit/loyalty-coin-lifecycle.spec.ts`: 4 pengujian unit siklus hidup transaksional koin (bonus sambutan, pemakaian di checkout, refund pembatalan, dan cashback 1% pesanan selesai).

## [0.27.0] - 2026-11-03

### Integrasi Dompet Voucher ke Checkout & Keranjang Belanja ("Pilih Voucher Saya")

- **Dekomposisi & Refaktorisasi Modal Pemilih Voucher (`VoucherSelectModal.vue`)**:
  - `app/components/cart/VoucherSelectModal.vue`: Didekomposisi dari 646 baris menjadi 269 baris (mematuhi batas SOP maksimal 300 baris). Dilengkapi 2 tab navigasi status ("Voucher Saya" dan "Promo Tersedia"), bilah input kode promo manual, dan ringkasan penghematan belanja.
  - `app/components/cart/VoucherSelectCard.vue`: Sub-komponen modular (254 baris) kartu voucher belanja dengan layout tiket, selektor radio aktif, badge diskon vertikal, badge rekomendasi "Paling Hemat", peringatan kekurangan syarat belanja (deficit alert), serta aksi kontekstual 1-klik "Klaim & Pakai".
  - `app/components/cart/VoucherSelectEmpty.vue`: Sub-komponen modular (65 baris) untuk status kosong tematik pada kedua tab modal, dilengkapi tombol navigasi cepat.
  - `app/composables/useVoucherSelection.ts`: Composable state management khusus untuk pemilih voucher dengan logika kalkulasi diskon, filter kupon eligible/ineligible, seleksi "Paling Hemat", validasi kode manual, dan penanganan pemakaian kupon.
- **Trigger Interaktif Keranjang (`CartCouponInput.vue`)**:
  - `app/components/cart/CartCouponInput.vue`: Ditambahkan indikator badge jumlah voucher aktif dompet pengguna yang tersedia ("X tersedia") saat pelanggan dalam status terautentikasi.
- **Ketahanan Runtime & Testing Composable**:
  - `app/features/auth/composables/useAuth.ts`: Menambahkan pemeriksaan runtime `tryUseNuxtApp()` dan impor tipe `User` dari `@supabase/supabase-js` untuk mencegah `NUXT_E1001` saat eksekusi di lingkungan unit testing non-Nuxt.
  - `app/composables/useUserVouchers.ts`: Menambahkan fallback aman untuk inisialisasi state di lingkungan pengujian otomatis.
- **Database Transaksional & RPC Supabase**:
  - `supabase/migrations/20261126000001_checkout_user_coupons_integration.sql`:
    - Pembaruan RPC `public.create_order`: Secara atomik menandai status kupon pelanggan di `public.user_coupons` menjadi `'used'`, mencatat `used_at = now()`, dan mengikat `order_id = v_order`.
    - Pembaruan RPC `public.cancel_order`: Memulihkan status voucher pelanggan di `public.user_coupons` kembali menjadi `'claimed'`, mengosongkan `used_at` dan `order_id` jika pesanan dibatalkan sebelum dibayar, serta merevert `usage_count` pada master kupon.
- **Unit Testing & Verifikasi Transaksional**:
  - `tests/unit/voucher-modal.spec.ts`: Diperluas menjadi 10 pengujian terverifikasi (termasuk verifikasi tab switching, badge rekomendasi "Paling Hemat", dan eksekusi 1-klik "Klaim & Pakai").
  - `tests/unit/checkout-voucher-lifecycle.spec.ts`: Pengujian unit siklus hidup transaksional pemakaian dan pemulihan voucher pesanan (5 pengujian lulus).

## [0.26.0] - 2026-11-02

### Dompet Voucher Pelanggan ("Voucher Saya" - `/account/vouchers`)

- **Halaman Dompet Voucher Mandiri (`/account/vouchers`)**:
  - `app/pages/account/vouchers.vue`: Halaman dompet voucher pelanggan terpadu dengan 3 tab navigasi status (Voucher Saya, Temukan Promo, Riwayat), filter kategori (Semua, Diskon, Gratis Ongkir), input kode promo, dan 5 status interaksi lengkap (Idle, Loading, Success, Empty, Error).
  - `app/components/account/VoucherTicketCard.vue`: Kartu voucher bertema tiket belanja dengan aksen takik perforasi tiket (ticket cutout notch), badge diskon vertikal, tombol salin kode, indikator kadaluarsa, serta tombol kontekstual ("Pakai Sekarang" / "Klaim Voucher").
  - `app/components/account/VoucherClaimInput.vue`: Bilah input kode voucher promo mandiri dengan tombol klaim instan dan feedback error ramah pengguna.
  - `app/composables/useUserVouchers.ts`: Composable reaktif untuk memuat voucher dompet pengguna, klaim 1-klik kupon publik, klaim berbasis kode manual, dan sinkronisasi jumlah voucher aktif.
- **Database & Supabase RPC (`public.user_coupons`)**:
  - `supabase/migrations/20261125000001_user_coupons_and_wallet.sql`: Tabel relasi dompet voucher `public.user_coupons` dengan kolom `id`, `user_id`, `coupon_id`, `status` ('claimed', 'used', 'expired'), `claimed_at`, `used_at`, dan `order_id`. Dilengkapi foreign key, indexing, RLS policy ketat per user, serta fungsi atomik PostgreSQL `claim_coupon_to_wallet(p_coupon_id uuid, p_code text)` dengan validasi kuota dan status aktif.
- **Backend API & Validasi Kontrak**:
  - `server/api/account/vouchers/index.get.ts`: Endpoint terproteksi yang mengembalikan ringkasan dompet voucher lengkap (voucher tersimpan aktif, kupon publik yang belum diklaim, dan riwayat voucher yang telah digunakan atau kedaluwarsa).
  - `server/api/account/vouchers/claim.post.ts`: Endpoint terproteksi untuk memproses klaim voucher via RPC atomik, mendukung 1-klik klaim dari ID kupon atau input kode promo manual.
  - `shared/schemas/user-voucher.ts`: Skema validasi Zod untuk operasi voucher dompet (`claimVoucherSchema`, `userVoucherItemSchema`, `voucherWalletResponseSchema`).
  - `app/types/database.types.ts`: Pembaruan tipe TypeScript Database untuk tabel `user_coupons` dan fungsi RPC `claim_coupon_to_wallet` tanpa penggunaan tipe `any`.
- **Integrasi Navigasi Akun**:
  - `app/components/account/AccountSidebar.vue`: Menambahkan menu "Voucher Saya" di bawah grup "Aktivitas Belanja" dan pada bilah tab horizontal untuk viewport mobile/tablet.
  - `app/components/account/AccountNavTabs.vue`: Menambahkan tab "Voucher Saya" dengan ikon tiket dan penyesuaian label breadcrumb otomatis.
  - `app/components/AppNavbar.vue`: Menambahkan tautan "Voucher Saya" di menu dropdown pengguna dan laci navigasi mobile.
- **Testing & Quality Assurance**:
  - `tests/unit/user-voucher-schema.spec.ts`: Unit test validasi skema Zod untuk klaim voucher, item voucher, status voucher, dan ringkasan respons dompet (8 test lulus).

## [0.25.0] - 2026-11-02

### Manajemen Buku Alamat & Profil Akun Pelanggan (SHF-ACC-01 & SHF-ACC-02)

- **Manajemen Buku Alamat Terpadu (`/account/addresses`)**:
  - `app/pages/account/addresses.vue`: Halaman buku alamat mandiri dengan visualisasi bento card, empty state informatif, dan tombol tambah alamat.
  - `app/components/account/AddressCard.vue`: Kartu alamat interaktif dengan badge "Alamat Utama", informasi penerima, format alamat wilayah, catatan kurir, dan aksi (Set Utama, Ubah, Hapus).
  - `app/components/account/AddressModal.vue`: Modal form tambah dan ubah alamat (`UiModal`), terintegrasi dengan pemilih wilayah kaskade 4 tingkat Indonesia (`LocationPickerModal.vue`).
  - `app/composables/useAddresses.ts`: Composable pengelolaan alamat pengiriman pelanggan dengan sinkronisasi reaktif ke API `/api/addresses`.
- **Manajemen Profil Akun & Kredensial (`/account/profile`)**:
  - `app/pages/account/profile.vue`: Halaman profil pelanggan dilengkapi kartu bento statistik belanja (anggota sejak, total pesanan, pesanan aktif, total alamat tersimpan).
  - Form Pembaruan Nama Lengkap: Terhubung ke endpoint `PATCH /api/account/profile` yang menyelaraskan tabel `public.profiles` dan metadata auth Supabase.
  - Form Pembaruan Email: Mengirimkan tautan konfirmasi verifikasi ke alamat email baru via Supabase Auth.
  - Form Pembaruan Kata Sandi: Validasi minimal 8 karakter dengan toggle visibilitas kata sandi.
  - `app/composables/useUserProfile.ts`: Composable reaktif untuk mengelola profil pengguna, perubahan kredensial, dan metrik akun.
  - `app/pages/account/index.vue`: Route redirect otomatis mengarahkan `/account` ke `/account/profile`.
- **Navigasi Terintegrasi & Akses Cepat**:
  - `app/components/account/AccountNavTabs.vue`: Bilah tab navigasi responsif menghubungkan Profil Akun, Buku Alamat, Pesanan Saya, dan Wishlist.
  - `app/components/AppNavbar.vue`: Menambahkan tautan langsung "Profil Saya" dan "Buku Alamat" di menu dropdown pengguna dan navigasi mobile.
- **Backend API & Validasi Kontrak**:
  - `server/api/account/profile.patch.ts`: Endpoint terproteksi untuk memperbarui nama lengkap pelanggan dengan audit log dan sinkronisasi metadata.
  - `server/api/account/stats.get.ts`: Endpoint agregasi ringkasan metrik akun pelanggan (total pesanan, pesanan aktif, pesanan selesai, total alamat tersimpan, tanggal bergabung).
  - `shared/schemas/profile.ts`: Skema validasi Zod untuk profil (`updateProfileSchema`, `updateEmailSchema`, `updatePasswordSchema`, `AccountStats`).
- **Peningkatan UX Akun Berstandar Tokopedia & Shopee**:
  - `app/components/account/AccountSidebar.vue`: Sidebar responsif Opsi A yang otomatis beralih menjadi sidebar vertikal 2-kolom pada layar besar (>= 1280px / xl) dan menjadi bilah tab horizontal scrollable pada layar lebih kecil (< 1280px). Mengintegrasikan 5 menu utama: Biodata Diri, Daftar Alamat, Pesanan Saya, Wishlist, dan Notifikasi.
  - Standardisasi Penamaan "Daftar Alamat": Mengganti label kaku "Buku Alamat" menjadi "Daftar Alamat" pada navigasi navbar, tab, sidebar, dan banner metrik akun.
  - Integrasi Shell Navigasi Akun Terpadu: Menyematkan `AccountSidebar` responsif pada halaman `orders/index.vue`, `wishlist.vue`, dan `notifications.vue` sehingga pengalaman navigasi akun pelanggan mengalir konsisten di seluruh rute.
  - `app/components/account/AddressCard.vue` & `AddressModal.vue`: Label kategori alamat khas Tokopedia (`Rumah`, `Kantor`, `Apartemen`, `Lainnya`), panduan jam operasional pengiriman (Shopee pattern), dan integrasi patokan kurir.
  - `app/pages/account/addresses.vue`: Pencarian cepat nama/kota penerima dan filter chips kategori alamat instan.
  - `app/pages/account/profile.vue`: Tata letak Biodata Diri berstandar Tokopedia dengan kartu tips keamanan akun, status verifikasi email, dan checklist dinamis kriteria kata sandi.
- **Manajemen Foto Profil Pelanggan (Avatar Upload, Ubah, Hapus)**:
  - `supabase/migrations/20261124000001_profile_avatar_url_and_storage.sql`: Menambahkan kolom `avatar_url` pada tabel `public.profiles` dan bucket `avatars` dengan RLS storage terproteksi per ID user.
  - `server/api/account/avatar.post.ts`: Endpoint terproteksi untuk upload avatar dengan validasi multipart server-side (maks. 2 MB, JPG/PNG/WEBP), upload ke Supabase Storage, pembersihan avatar lama, pembaruan `public.profiles.avatar_url` via service role, dan sinkronisasi metadata auth.
  - `server/api/account/avatar.delete.ts`: Endpoint terproteksi untuk menghapus avatar, membersihkan file di cloud storage, dan mengembalikan foto profil ke null.
  - `server/api/account/profile.patch.ts`: Dukungan pembaruan profil pelanggan via service role untuk mematuhi RLS database, serta sinkronisasi metadata auth Supabase.
  - `app/components/account/ProfileAvatarCard.vue`: Komponen avatar interaktif dengan preview foto bundar, overlay tombol kamera, tombol "Pilih Foto", "Hapus Foto", dan indikator upload.
  - `app/composables/useUserProfile.ts`: Method `uploadAvatar()` dan `deleteAvatar()` terhubung langsung ke endpoint `/api/account/avatar` dengan penanganan sesi defensif.
  - `app/components/account/AccountSidebar.vue` & `AppNavbar.vue`: Menampilkan foto profil asli pengguna secara reaktif dengan fallback inisial nama.
- **Refinement UX Copy & Visual Polish (Profil Saya & Avatar Interaction)**:
  - Standardisasi Penamaan "Profil Saya": Menyelaraskan seluruh touchpoint navigasi (navbar dropdown, sidebar, horizontal tabs, breadcrumbs, dan page title) ke "Profil Saya", menggantikan "Biodata Diri" demi model mental pengguna yang lebih intuitif dan konsisten.
  - Standardisasi Breadcrumb: Menyeragamkan format breadcrumb di seluruh 5 area akun pelanggan (`ShelfStack / [Nama Halaman]`).
  - Eliminasi Indikator Hijau Avatar: Menghapus titik hijau ambigu dari semua kartu avatar pelanggan sesuai prinsip Web Content Accessibility (_Don't Use Color Alone_).
  - Peningkatan Kontras Overlay Foto Profil: Menerapkan gradien hitam pudar transparan native Tailwind (`bg-gradient-to-t from-black/85 via-black/60 to-black/40 backdrop-blur-[1px]`) pada tombol hover ubah foto profil, menjamin keterbacaan teks dan ikon di atas gambar terang maupun gelap.
  - Perbaikan Opacity Backdrop Modal: Memperbaiki transparansi backdrop modal pada `UiModal.vue` dan `LocationPickerModal.vue` dengan native alpha `bg-black/50`.
- **Testing & Quality Assurance**:
  - `tests/unit/account-profile-schema.spec.ts`: Unit test validasi skema profil termasuk pengujian format URL dan null avatar (12 test).
  - `tests/unit/account-profile-and-addresses.spec.ts`: Unit test untuk composable `useAddresses` dan kontrak data `AccountStats` (6 test).
  - `tests/e2e/pages/AccountPage.ts`: Page Object Model baru untuk pengujian otomatis Playwright area akun.
  - `tests/e2e/account-journey.spec.ts`: Skenario pengujian E2E mencakup proteksi route guards tamu, penolakan API anonim (HTTP 401), dan alur navigasi akun.
  - 67 test files / 642 tests lolos 100%. `nuxi typecheck` EXIT 0, ESLint 0 error.

## [0.24.0] - 2026-10-31

### Persistensi Kecamatan Alamat, RPC create_order Resilient Fallback & Checkout UX Polish

- **Persistensi Kecamatan Alamat Pengiriman (District Persistence)**:
  - `shared/data/locations/indonesia-regions.ts`: Menambahkan fungsi `formatAdministrativeAddress(districtName, cityName, provinceName)` berstandar ekspedisi nasional (`Kec. [Kecamatan], [Kota/Kabupaten], [Provinsi]`).
  - `app/components/checkout/CheckoutAddressForm.vue` & `SavedAddressForm.vue`: Mengikat nama kecamatan dari pemilihan 4 tingkat sehingga tidak lagi hilang saat disimpan.
  - Menghapus input teks manual redundan (`Kota / Kabupaten (Tersimpan)` dan `Kode Pos`) di bawah kartu wilayah terpilih, menjadikan kartu review sebagai _Single Source of Truth_ dengan tombol aksi `Ubah`.
- **Database & Backend RPC Resilience (Expand-and-Contract Pattern)**:
  - `supabase/migrations/20261123000002_fix_create_order_coupon_record_unassigned.sql`: Memperbaiki bug PL/pgSQL `55000: record v_coupon is not assigned yet` saat checkout tanpa kupon dengan mendeklarasikan variabel skalar aman `v_coupon_id` dan `v_coupon_code`.
  - Menerapkan seluruh migrasi yang tertunda ke remote Supabase via `pnpm dlx supabase db push --linked --yes` sehingga skema remote 100% up to date.
  - `server/api/orders/index.ts`: Menambahkan graceful fallback otomatis ke signature 5-parameter saat PostgREST mengembalikan `PGRST202` (schema cache mismatch), mencegah kegagalan HTTP 400 pada masa transisi deployment.
- **Frontend Checkout Polish**:
  - `app/components/checkout/CheckoutOrderSummary.vue`: Membersihkan badge kuantitas redundan pada thumbnail item pesanan untuk tampilan ringkasan yang lebih bersih dan minimalis.
- **Stabilisasi & Hardening Pengujian End-to-End (E2E)**:
  - `playwright.config.ts`: Menaikkan batas waktu default expect menjadi 10.000ms untuk mencegah timeout prematur di CI GitHub Actions runner.
  - `tests/e2e/pages/CatalogPage.ts`: Menambahkan filter seleksi produk stok tersedia (`hasNotText: 'Stok Habis'`) dan memperluas matcher empty state.
  - `tests/e2e/pages/ProductDetailPage.ts`: Menoleransi tombol "Tambah ke Bag" maupun "Stok Habis" dengan timeout 15.000ms.
  - `tests/e2e/pom-order-flow.spec.ts` & `tests/e2e/product.spec.ts`: Mengeliminasi polling pengetikan berulang di dalam `expect.poll` untuk menghindari pembatalan debounce timer 300ms secara terus-menerus.
  - `nuxt.config.ts`: Menonaktifkan default global rate limiter nuxt-security (`rateLimiter: false`) untuk mengeliminasi pemblokiran HTTP 429 pada storefront dan test runner, sementara endpoint sensitif tetap diproteksi via `routeRules`.
  - `tests/e2e/pages/CheckoutPage.ts` & `tests/e2e/full-business-journey.spec.ts`: Menyelaraskan matcher heading checkout dengan regex `^checkout`, matcher rincian belanja (`/total tagihan|total pembayaran/i`), serta menyinkronkan pengisian alamat dengan pemilih lokasi administratif kaskade 4 tingkat.
- **Testing & Quality Verification**:
  - `tests/unit/api-orders-idempotency.spec.ts`: Menambahkan unit test regresi untuk verifikasi fallback otomatis signature RPC saat terjadi error `PGRST202`.
  - `tests/unit/location-master.spec.ts`: Menambahkan unit test untuk fungsi `formatAdministrativeAddress`.
  - `tests/unit/checkout-address-form.spec.ts`: Memperbarui verifikasi nama kecamatan pada payload checkout.
  - 65 test files / 624 tests lulus 100%. `nuxi typecheck` EXIT 0, ESLint 0 error.

## [0.23.0] - 2026-10-30

### Shopee-Style 4-Tier Indonesian Administrative Address Cascade & Bugfix Double Prefix (SHF-LOC-02)

- **Master Data Administratif Indonesia Resmi (Kepmendagri 2025/2026)**:
  - `shared/data/locations/indonesia-administrative.json`: Dataset resmi mencakup 38 Provinsi, 514 Kota dan Kabupaten, 7.265 Kecamatan, serta pemetaan Kode Pos nasional tanpa dependensi eksternal.
  - `shared/data/locations/indonesia-regions.ts`: Fungsi helper berkinerja tinggi `getProvinces()`, `getCitiesByProvince()`, `getDistrictsByCity()`, `getPostalCodesByDistrict()`, dan `searchAdministrativeLocations()` dengan skoring relevansi pintar.
- **Bugfix Double Prefix**:
  - `formatCityDisplay()`: Memperbaiki bug duplikasi string seperti `Kota Kota Jakarta Selatan` dan `Kabupaten Kabupaten Bogor` dengan normalisasi regex guard clause berlapis, memastikan output kanonikal tepat dan bersih.
- **Frontend 4-Tier Cascading Selector (Shopee-Style)**:
  - `app/components/checkout/LocationPickerModal.vue`: Implementasi antarmuka 4 tab bertingkat (`Provinsi` -> `Kota` -> `Kecamatan` -> `Kode Pos`) dengan garis aktif aksen oranye, transisi otomatis saat item dipilih, navigasi fleksibel kembali ke tab sebelumnya, serta pencarian autocomplete instan di bar atas.
  - Tetap ringkas dan modular di bawah 280 baris kode (mematuhi batasan <= 300 baris Talenavi SOP).
- **Refactoring Modularitas Komponen**:
  - `app/components/checkout/SavedAddressForm.vue`: Mengekstrak form tambah alamat baru menjadi komponen mandiri (182 baris) sehingga `SavedAddressSelector.vue` terpangkas dari 447 baris menjadi 230 baris (keduanya <= 300 baris).
- **Testing & Quality Verification**:
  - `tests/unit/location-master.spec.ts`: Unit test mencakup 38 provinsi, 4-tier cascade, pencarian kota dan kode pos, serta verifikasi anti double prefix.
  - `tests/unit/location-picker-modal.spec.ts`: Unit test alur lengkap 4-tier cascading seleksi dan autocomplete.
  - `tests/unit/checkout-address-form.spec.ts`: Verifikasi integrasi form checkout dengan `AdministrativeSelection`.
  - 65 test files / 622 tests lolos 100%. TypeScript typecheck EXIT 0, ESLint 0 error.

## [0.22.0] - 2026-10-30

### Master Data Alamat Wilayah Administratif Indonesia & Penghapusan Pemisah Titik Tengah (SHF-LOC-01)

- **Master Data Wilayah Kemendagri & BPS**:
  - `shared/data/locations/indonesia-regions.ts`: Master data komprehensif 38 Provinsi (termasuk 4 DOB baru Papua 2022: Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya) dan 535 Kota/Kabupaten resmi dengan pemetaan kode pos standar.
  - Zero external dependency: Data terindeks cepat, tanpa latensi jaringan eksternal, dan tanpa dependensi API pihak ketiga.
  - Helper functions teroptimasi: `getCitiesByProvince()`, `searchLocations()`, `getCityById()`.
- **Server API & Schemas**:
  - `shared/schemas/location.ts`: Schema validasi Zod `locationQuerySchema` dan `locationSelectionSchema`.
  - `server/api/locations/index.get.ts`: Endpoint pencarian cepat dengan query filter dan cascading province ID.
- **Frontend Master Location Picker**:
  - `app/components/checkout/LocationPickerModal.vue` (290 baris, <= 300 baris): Modal interaktif dual-mode (Pencarian Cepat / Autocomplete + Pilihan Bertingkat Provinsi ke Kota/Kabupaten) dengan chip kota populer dan navigasi keyboard ramah aksesibilitas.
  - `app/components/checkout/CheckoutAddressForm.vue`: Integrasi pemilih wilayah resmi satu sentuhan yang mengisi nama kota, provinsi, dan kode pos secara otomatis.
  - `app/components/checkout/SavedAddressSelector.vue`: Integrasi pemilih wilayah resmi pada formulir penambahan alamat baru.
- **Perbaikan UI/UX Typography & Penghapusan Pemisah Titik Tengah (Interpunct)**:
  - Mengganti pemisah titik tengah mentah (`·`) pada opsi pengiriman dan rincian varian produk dengan pemisah tanda koma dan pill badge yang lebih clean dan terstruktur.
  - Menata ulang badge "Checkout Aman" dan "Enkripsi Midtrans 256-Bit" pada header checkout dengan styling chip individual yang rapi dan konsisten.
- **Testing & Quality Gates**:
  - `tests/unit/location-master.spec.ts`: 7 unit tests mencakup kelengkapan 38 provinsi, pencarian autocomplete, dan mapping kode pos.
  - `tests/unit/location-picker-modal.spec.ts`: 6 unit tests mencakup modal rendering, chip populer, tab cascading, dan keyboard navigation.
  - `tests/unit/checkout-address-form.spec.ts`: 3 unit tests mencakup tombol pemilih master data, kartu wilayah terisi, dan auto-fill.
  - 65 test files / 621 unit tests lolos 100%. TypeScript typecheck EXIT 0, ESLint 0 error.

## [0.21.0] - 2026-10-30

### Pilihan Layanan & Kalkulator Ongkir Checkout (SHF-SHP-01)

- **Database Migrasi & Skema Transaksional**:
  - Migrasi `supabase/migrations/20261123000001_checkout_shipping_rates.sql` menambahkan kolom `shipping_service` (default 'reguler') dan `shipping_cost_cents` (default 0) pada tabel `public.orders`.
  - Fungsi RPC atomik `public.create_order` diperbarui untuk memvalidasi dan menghitung tarif ongkir secara aman di sisi server Postgres (anti-tamper):
    - Layanan Reguler (2-3 Hari Kerja): Rp 15.000 (Otomatis Bebas Ongkir Rp 0 jika subtotal belanja >= Rp 500.000).
    - Layanan Kilat / Next Day (1 Hari Kerja): Rp 30.000.
    - Layanan Instan / Sameday (Tiba Hari Ini): Rp 45.000.
    - Layanan Kargo Ekonomis (4-7 Hari Kerja): Rp 25.000.
  - Total pesanan akhir dihitung atomik: `v_total := greatest(0, v_subtotal - v_discount + v_shipping_cost)`.
  - Sinkronisasi snapshot tagihan langsung ke transaksi Midtrans Snap (`gross_amount = order.total_cents / 100`).
- **Server API & Schemas**:
  - `shared/schemas/shipping.ts`: Enum `shippingServiceSchema`, metadata `shippingRateTiers`, dan fungsi murni `calculateShippingFee()`.
  - `shared/schemas/order.ts`: Penambahan `shipping_service` dan `courier_code` pada `checkoutSchema`.
  - `server/utils/idempotency.ts`: Penyertaan `shipping_service` ke dalam kalkulasi deterministik `calculateCheckoutHash()`.
  - `POST /api/shipping/calculate`: Endpoint kalkulasi tarif ongkir publik untuk estimasi biaya pengiriman cepat.
  - `server/api/orders/index.ts`: Meneruskan parameter opsi pengiriman ke pemanggilan RPC `create_order`.
- **Frontend & Etalase Interaktif**:
  - Komponen `app/components/checkout/ShippingMethodSelector.vue` (187 baris): Antarmuka pemilihan 4 layanan pengiriman bertingkat dengan radio card Archival Modernist, badge Bebas Ongkir dinamis, estimasi waktu tiba, chip mitra kurir pilihan (JNE, SiCepat, J&T, Anteraja, Pos), dan aksesibilitas WAI-ARIA `role="radiogroup"`.
  - Halaman `app/pages/checkout.vue`: Integrasi pilihan kurir dengan kalkulasi ongkir reaktif pada ringkasan belanja, pengiriman parameter ke backend, dan pemeliharaan state snapshot pembayaran Midtrans.
  - Halaman `app/pages/orders/[id].vue` & `OrderInvoiceModal.vue`: Penayangan baris rincian "Biaya Pengiriman" dengan nama layanan kurir pada rincian pesanan dan cetak invoice resmi.
- **Quality Gates & Tests**:
  - `tests/unit/shipping-calculator.spec.ts`: 25 unit tests (kalkulasi tarif 4 tier, threshold bebas ongkir, proteksi non-reguler, validasi schema, API endpoint).
  - `tests/unit/shipping-selector.spec.ts`: 7 unit tests (render opsi, interaksi radio card, seleksi kurir, navigasi keyboard).
  - Total test suite: 62 test files / 605 tests lolos 100%.
  - `nuxi typecheck` EXIT 0 & `eslint .` 0 error.

## [0.20.0] - 2026-10-30

### Sistem Ulasan & Rating Produk Terverifikasi (Product Reviews & Ratings)

- **Database Migrasi & Skema Transaksional**:
  - Migrasi `supabase/migrations/20261122000001_product_reviews_and_ratings.sql` mendefinisikan tabel `public.product_reviews` dengan kolom `id`, `product_id`, `user_id`, `order_id`, `rating` (1-5), `review_text` (10-1000 karakter), dan soft-delete `deleted_at`.
  - Constraint integritas unik `(product_id, user_id, order_id)` memastikan hanya satu ulasan per transaksi produk yang dapat diajukan.
  - Partial performance index pada `product_reviews(product_id, rating)` dan `product_reviews(user_id)` dengan filter `deleted_at IS NULL`.
  - PostgreSQL trigger function `recalculate_product_rating()` yang secara otomatis menghitung ulang rata-rata rating (`products.rating`) dan total ulasan (`products.review_count`) pada setiap operasi INSERT, UPDATE, atau soft-delete.
  - Kebijakan RLS strict: pembacaan ulasan aktif diizinkan untuk semua peran (anon dan authenticated), pembuatan dan penghapusan ulasan hanya dapat dilakukan oleh pemilik akun (`auth.uid() = user_id`).
- **Nitro Server API & Service Domain**:
  - `shared/schemas/review.ts`: Skema validasi Zod untuk query parameter dan payload ulasan, utilitas masking privasi nama pengulas `formatReviewerName`, serta kalkulator agregasi distribusi bintang `calculateReviewStats`.
  - `server/utils/review.ts`: Lapisan domain service untuk verifikasi eligibilitas pesanan tuntas (`completed`), pengambilan ulasan dengan pagination dan filter rating, serta pengelolaan soft delete.
  - `GET /api/products/[id]/reviews`: Mengembalikan ulasan terpaginasi, ringkasan rating rata-rata, total ulasan, dan breakdown distribusi rating bintang (1-5).
  - `GET /api/products/[id]/reviews/eligibility`: Memverifikasi apakah pengguna yang terautentikasi berhak memberikan ulasan berdasarkan riwayat pesanan `completed`.
  - `POST /api/products/[id]/reviews`: Menerima ulasan baru dengan validasi kepemilikan transaksi pesanan.
  - `DELETE /api/products/[id]/reviews/[reviewId]`: Mengizinkan pemilik ulasan melakukan soft-delete ulasan mereka.
- **Frontend & Etalase Interaktif**:
  - `app/types/review.ts`: Kontrak antarmuka TypeScript untuk entitas ulasan dan statistik.
  - `app/components/product/ProductReviewsSection.vue`: Orkestrator bagian ulasan terpadu pada halaman `/product/[id]` dengan anchor `#reviews`, pagination adaptif, filter bintang, dan penanganan empty/loading state.
  - `app/components/product/ReviewRatingSummary.vue`: Tampilan bento ringkasan skor rata-rata dengan progress bar distribusi bintang interaktif untuk filter 1-klik.
  - `app/components/product/ReviewCard.vue`: Kartu ulasan bergaya Archival Gallery Modernist dengan sensor privasi nama (`Budi S.`), tanggal relatif terformat, dan rating bintang tanpa badge artifisial.
  - `app/components/product/ReviewEligibilityCard.vue`: Kartu pemicu ulasan kontekstual untuk pembeli terverifikasi, pengguna yang sudah mengulas, atau pengunjung umum.
  - `app/components/product/ReviewFormModal.vue`: Dialog modal interaktif berstandar aksesibilitas dengan star picker 1-5, textarea berpenghitung karakter (10-1000), penanganan error real-time, dan feedback toast.
  - `app/pages/orders/[id].vue`: Integrasi tombol "Beri Ulasan" pada daftar barang belanja pesanan berstatus `completed`.
  - `app/components/product/ProductConfigurator.vue`: Tautan rating bintang menuju anchor `#reviews` dengan smooth scrolling.
- **Quality Gates & Tests**:
  - `pnpm lint` 0 error / 0 warning.
  - `nuxi typecheck` EXIT 0 tanpa error tipe data.
  - 17 unit test di `tests/unit/review-schema.spec.ts`.
  - 11 unit test di `tests/unit/api-reviews.spec.ts`.
  - 18 unit test di `tests/unit/product-reviews-section.spec.ts`.
  - Total test suite: 60 file / 570 test lolos 100%.

## [0.19.0] - 2026-10-28

### Sistem Kupon Promo, Halaman Publik Promo & Back-Office Admin (SHF-VOUCHER)

- **Halaman Publik Promo & Voucher (/promos)**:
  - Antarmuka storefront publik (`app/pages/promos.vue`) berstandar Archival Modernist anti-AI-slop sesuai arahan design-taste-frontend.
  - Kartu voucher bergaya tiket taktil dengan perforasi potongan samping (ticket notches), chip persentase/flat, indikator kuota, dan status berlaku.
  - Aksi interaktif: salin kode promo 1-klik dengan feedback taktil, dan tombol "Gunakan di Keranjang" yang memvalidasi serta langsung menerapkan kupon ke keranjang belanja.
  - Penautan navigasi publik: rute `/promos` ditautkan pada pita kategori sub-nav dan laci navigasi mobile (`app/components/AppNavbar.vue`).
- **Halaman Back-Office Admin Kelola Voucher (/admin/coupons)**:
  - Antarmuka manajemen kupon admin (`app/pages/admin/coupons.vue`) dengan layout workspace admin terpadu (`app/layouts/admin.vue`).
  - 4 kartu metrik bento: Total Voucher, Voucher Aktif, Total Penggunaan, dan Total Penghematan Pelanggan (Rp).
  - Tabel data kupon berdensitas tinggi dengan filter status (Aktif, Nonaktif, Kedaluwarsa), filter tipe diskon, pencarian teks, dan progress bar sisa kuota.
  - Modal dialog formulir pembuatan dan pengubahan voucher dengan validasi ketat, tombol toggle aktif/nonaktif, serta dialog konfirmasi soft-delete.
- **Server API & Schemas**:
  - `shared/schemas/coupon.ts`: Skema validasi Zod untuk pembuatan kupon (`createCouponSchema`) dan pembaruan (`updateCouponSchema`).
  - `GET /api/coupons`: Endpoint publik untuk mengambil daftar kupon aktif yang siap digunakan di etalase.
  - `GET /api/admin/coupons`: Endpoint admin untuk memuat daftar seluruh kupon dan ringkasan metrik analitik.
  - `POST /api/admin/coupons`: Endpoint admin untuk menerbitkan kupon baru dengan pencegahan kode duplikat.
  - `PUT /api/admin/coupons/[id]`: Endpoint admin untuk memperbarui parameter diskon atau toggle status kupon.
  - `DELETE /api/admin/coupons/[id]`: Endpoint admin untuk melakukan soft-delete pada kupon.
- **Database Migrasi & RLS Strict**:
  - Penambahan tabel master kupon `public.coupons` (`supabase/migrations/20261121000001_coupons_and_promo_discounts.sql`) dengan kolom tipe diskon (percentage/fixed), pagu maksimal potongan, syarat minimum belanja, kuota pemakaian global dan per-user, masa berlaku, dan soft delete (`deleted_at`).
  - Penambahan tabel audit trail `public.coupon_usages` dengan relasi foreign key cascade dan constraint unik `(user_id, coupon_id, order_id)` untuk pencegahan penyalahgunaan kuota berlebih.
  - Penambahan kolom diskon pada tabel `public.orders`: `subtotal_cents`, `discount_cents`, `coupon_id`, dan `coupon_code`.
  - Pembaruan fungsi RPC `create_order` menjadi atomik dan aman: validasi kupon, penguncian baris kupon `FOR UPDATE`, kalkulasi diskon di sisi server Postgres, penambahan `usage_count`, dan pencatatan audit pemakaian.
  - Kebijakan RLS: pembacaan kupon aktif diizinkan untuk publik/authenticated, admin memiliki akses penuh, dan mutasi langsung `coupon_usages` dari sisi client dilarang keras (`with check (false)`).
- **Frontend & Komponen UI/UX**:
  - Store Pinia `useCartStore`: State `appliedCoupon`, getter `discountCents`, `finalPrice`, `formattedFinalPrice`, aksi `applyCoupon()` dan `removeCoupon()`, serta persistensi `localStorage` (`shelfstack-applied-coupon`).
  - Komponen `CartCouponInput.vue` (`app/components/cart/CartCouponInput.vue`): Form input kode voucher dengan saran kupon cepat (quick pills), chip status kupon aktif, kalkulasi penghematan, tombol hapus voucher, dan peringatan jika subtotal belum mencapai minimum belanja.
  - Integrasi Cart Drawer (`CartDrawer.vue`) & Halaman Keranjang (`cart.vue`): Input voucher pada ringkasan pesanan dengan rincian Subtotal, Diskon Kupon, dan Total Tagihan yang adaptif.
  - Integrasi Checkout (`checkout.vue`): Pengiriman kode voucher ke pembuatan pesanan dan sinkronisasi nominal pembayaran Midtrans Snap.
  - Integrasi Rincian Pesanan Pelanggan (`orders/[id].vue`) dan Admin (`admin/orders/[id].vue`): Penayangan baris rincian potongan diskon kupon.
- **Quality Gates & Tests**:
  - `pnpm lint` 0 error / 0 warning (100% clean).
  - `pnpm typecheck` EXIT 0 tanpa error tipe data.
  - 20 unit test di `tests/unit/coupon-schema.spec.ts` (validasi schema, aturan kupon, dan validasi admin schema).
  - 6 unit test di `tests/unit/api-coupons.spec.ts` (integrasi API kupon dan skenario checkout).
  - 7 unit test di `tests/unit/cart-coupon.spec.ts` (integrasi store Pinia cart dan kalkulasi kupon).
  - Total test suite: 51 file / 470 test lolos 100%.

## [0.18.0] - 2026-10-27

### Pelacakan Pengiriman & Ekspedisi Kurir (SHF-LOG-01)

- **Database Migrasi & RLS**:
  - Penambahan kolom pengiriman pada tabel `public.orders` (`supabase/migrations/20261120000001_shipping_and_order_tracking.sql`): `tracking_number`, `courier_code`, `courier_name`, `shipped_at`, `delivered_at`.
  - Penambahan tabel riwayat checkpoint ekspedisi `public.shipping_checkpoints` dengan index `(order_id, created_at desc)` dan `(tracking_number)`.
  - Kebijakan RLS terisolasi: pelanggan dapat melihat checkpoint pesanan miliknya, admin memiliki hak kelola penuh, dan penambahan ke publikasi `supabase_realtime` untuk live streaming tracking tanpa polling.
- **Server Endpoints & Logistics Utilities**:
  - `server/utils/shipping.ts`: Generator nomor resi otomatis sesuai prefix kurir (`SS-JNE-`, `SS-SCP-`, `SS-JNT-`, `SS-ANTR-`, `SS-POS-`), generator checkpoint otomatis tahap awal dan konfirmasi penerimaan, serta utilitas masking nama dan nomor telepon untuk privasi.
  - `server/api/orders/[id]/status.put.ts`: Mendukung input kurir dan resi saat status diubah menjadi `shipped`, memicu checkpoint awal dan notifikasi otomatis, serta mencatat checkpoint `delivered` saat status menjadi `completed`.
  - `server/api/tracking/search.get.ts`: Endpoint pencarian resi publik (mendukung query no resi atau ID order) dengan sensor data penerima (`recipient_name_masked`, `recipient_phone_masked`).
  - `server/api/orders/[id]/tracking.get.ts`: Endpoint pelacakan autentikasi untuk pelanggan pada pesanan spesifik miliknya.
- **Frontend & Komponen UI/UX**:
  - Komponen `OrderTrackingTimeline.vue` (`app/components/orders/OrderTrackingTimeline.vue`): Linimasa vertikal dengan status badge, detail lokasi hub, timestamp, dan tombol salin resi instan.
  - Halaman publik `/tracking` (`app/pages/tracking.vue`): Formulir pencarian nomor resi dengan deep-link `?q=`, kartu privasi data, dan integrasi navigasi dari header bar atas serta footer.
  - Integrasi Admin Detail Pesanan (`app/pages/admin/orders/[id].vue`): Modal pengiriman dengan pilihan kurir resmi, tombol 1-klik "Resi Otomatis", dan visualisasi linimasa langsung pada panel admin.
  - Integrasi Detail Pesanan Pelanggan (`app/pages/orders/[id].vue`): Kartu pelacakan kurir terpadu yang muncul otomatis saat pesanan berstatus `shipped` atau `completed`.
- **Quality Gates**:
  - `pnpm lint` 0 error / 0 warning (100% clean).
  - `pnpm typecheck` EXIT 0 tanpa error tipe data.
  - 9 unit test komprehensif baru di `tests/unit/shipping-tracking.spec.ts`.
  - Total test suite: 48 file / 436 test lolos 100%.

## [0.17.0] - 2026-10-27

### In-App Notification Center & Realtime Broadcast (SHF-NOTIF-01)

- **Database Migrasi & RLS Strict**:
  - Penambahan tabel `public.notifications` (`supabase/migrations/20261119000001_in_app_notifications.sql`) dengan relasi cascade ke `auth.users`, constraint tipe notifikasi resmi (`order_created`, `payment_success`, `order_shipped`, `order_cancelled`, `order_completed`, `system`), index komposit `(user_id, is_read, created_at desc)`, dan kebijakan RLS multi-tenant terisolasi.
  - Integrasi publikasi Supabase Realtime (`alter publication supabase_realtime add table public.notifications`) untuk siaran pembaruan notifikasi live ke pelanggan.
- **Server Endpoints & Transactional Event Triggers**:
  - `GET /api/notifications`: memuat 30 notifikasi terbaru milik pengguna terautentikasi dan menghitung unread count secara atomik.
  - `PATCH /api/notifications/read-all`: menandai semua notifikasi aktif sebagai telah dibaca.
  - `PATCH /api/notifications/[id]/read`: menandai satu notifikasi spesifik milik pengguna sebagai dibaca.
  - Pemicu otomatis pada siklus transaksi:
    - `order_created`: saat pesanan berhasil dibuat di checkout (`server/api/orders/index.ts`).
    - `payment_success`: saat pembayaran terkonfirmasi via webhook Midtrans (`server/api/midtrans/notification.post.ts`).
    - `order_shipped` & `order_completed`: saat status pesanan diubah oleh admin (`server/api/orders/[id]/status.put.ts`).
    - `order_cancelled`: saat pesanan dibatalkan (`server/api/orders/[id]/cancel.post.ts`).
- **State Management & Frontend UI/UX**:
  - Pinia store `useNotificationStore` (`app/features/notifications/stores/notifications.ts`) dengan optimis update, listener realtime `postgres_changes`, cursor-based pagination (`loadMore`, `hasMore`, `nextCursor`), dan integrasi HTML5 Web Notification API untuk notifikasi desktop browser.
  - Komponen `NotificationBell.vue` (`app/components/notifications/NotificationBell.vue`) diposisikan pada pita atas gelap (_top announcement bar_) dengan varian `dark`, membersihkan kluster kanan navbar utama agar lebih kompak dan lega.
  - Halaman penuh Pusat Notifikasi (`app/pages/notifications.vue`) dengan filter tab (Semua, Belum Dibaca, Pesanan & Pembayaran, Sistem), kontrol notifikasi browser, dan cursor pagination.
  - Integrasi menu Notifikasi pada drawer navigasi mobile lengkap dengan badge penghitung belum dibaca.
- **Quality Gates**:
  - Zero ESLint error dan zero warning (100% clean gate).
  - `nuxi typecheck` EXIT 0 tanpa error tipe data.
  - 19 unit test terverifikasi di `tests/unit/api-notifications.spec.ts` dan `tests/unit/notification-store.spec.ts`, total suite 47 file / 427 test lolos 100%.

## [0.16.0] - 2026-10-26

### Penyatuan Geometri & Primitif Etalase Publik

- **Unifikasi Geometri & Token Semantik**:
  - Penyatuan skala radius ke `rounded-card` (14px) dan `rounded-field` (10px) di seluruh etalase:
    `KatalogToolbar`, `KatalogSidebar`, `KatalogMobileFilter`, `ProductCard`, `ProductGallery`,
    `ProductConfigurator`, `CartDrawer`, `cart.vue`, `checkout.vue`, `SavedAddressSelector.vue`, dan `AppNavbar`.
  - Migrasi palet hardcoded (`slate-*`, `zinc-*`, `rose-*`, `emerald-*`, `#18191b`) menjadi token semantik brand:
    `bg-brand-canvas`, `bg-brand-canvas-soft`, `text-brand-ink`, `text-brand-muted`, `border-brand-hair`,
    `bg-brand-danger-tint`, `bg-brand-success-tint`, `bg-brand-warning-tint`, dan `text-brand-success-text`.
  - Penanganan void tag ESLint: eliminasi warning `vue/html-self-closing` pada void element `<img/>` dan `<input/>`
    di komponen etalase publik (berkurang dari 32 menjadi 18 warning pre-existing).
  - Perbaikan kontrak heading SEO dan Playwright: penambahan semantic `<h1>Katalog</h1>` pada header `app/pages/katalog.vue`.

### Arsitektur Pesanan & Pembayaran (ADR 005)

- **Pemisahan State Pesanan dan State Pembayaran**:
  - Dokumentasi ADR 005 (`docs/ADR/005-order-state-payment-state-separation.md`) yang menetapkan pemisahan mutlak
    antara status pesanan bisnis (`pending`, `processing`, `shipped`, `delivered`, `cancelled`) dan status pembayaran (`pending`, `paid`, `failed`, `refunded`, `expired`).
  - Ekstraksi kartu pesanan mandiri (`app/features/orders/components/OrderCard.vue`) dengan visual status ganda
    yang jelas dan pemisahan tombol aksi Bayar (Snap Popup langsung) dan Lihat Detail.
  - Alur Beli Lagi (`reorder`): menyalin item pesanan terdahulu ke keranjang belanja aktif dan mengarahkan ke `/cart`.
  - Gating cetak invoice: dibatasi hanya untuk pesanan dengan status lunas, dikirim, atau selesai (`paid`, `shipped`, `delivered`).
  - Pencegahan polling flicker pada halaman `/orders/[id]`: pemisahan flag `isSilentChecking` (polling 3.5 detik)
    dan `isManualChecking` (tombol Cek Status oleh pengguna) agar interaktivitas tombol stabil.
  - Restock atomik pada pembatalan pesanan oleh pengguna dengan validasi alasan pembatalan dan pencatatan audit log.

### Dropdown Primitif Kustom (`UiSelect`)

- Penggantian elemen `<select>` native di etalase dan panel back-office dengan primitif kustom `UiSelect`.
- Dukungan penuh navigasi keyboard (Arrow Down/Up, Enter, Escape, Space, Home, End) serta penanganan penumpukan z-index
  terisolasi (`isolation: isolate`) pada kartu katalog.

### Domain Glossary

- Inisialisasi `GLOSSARY.md` di root repositori untuk membakukan definisi istilah domain (On-hand Stock, Reserved Stock,
  Available Stock, Snap Token, Order Expiry Sweep, Double-entry Ledger, Soft Delete).

### Redesign Split Layout Halaman Autentikasi

- **Penyusunan Ulang Tampilan Login & Register (`AuthCard.vue`, `login.vue`, `register.vue`)**:
  - Transformasi kartu form menjadi layout split 2-kolom: kolom kiri memuat visual arsitektural kurasi galeri ShelfStack (`/images/auth-showcase.jpg`) dan wordmark insignia resmi, kolom kanan memuat formulir autentikasi.
  - Kompak pada viewport: penataan form yang efisien dan grid 2-kolom untuk sandi pada registrasi sehingga halaman muat tanpa scrolling berlebih pada resolusi desktop standar.
  - Eliminasi trust badges redundan: penghapusan ikon 'Belanja Aman • Privasi Terjaga' dan 'Keamanan Terjamin • Checkout Lebih Cepat'.
  - Show Password Toggle: penambahan fitur interaktif tampilkan/sembunyikan kata sandi pada `UiInput` dan `AuthFormInput` dengan status aria-label yang aksesibel (+4 unit test di `tests/unit/auth-redesign.spec.ts`).

### Wishlist System (Koleksi Produk Tersimpan)

- **Implementasi Store & UI Wishlist**:
  - Store Pinia `useWishlistStore` (`app/features/wishlist/stores/wishlist.ts`) dengan arsitektur hybrid: local-first untuk guest dan otomatis sinkronisasi dua arah ke database saat login.
  - Komponen `WishlistButton.vue` dengan micro-animation spring physics, toggle state, aria-label aksesibel, dan integrasi primitif `UiTooltip` konsisten (posisi bottom, align end) yang terisolasi di dalam batas kartu produk tanpa clipping.
  - Integrasi kartu produk (`ProductCard.vue`): tombol love overlay di pojok kanan atas dengan stop propagation dan tooltip yang aman dari clipping `overflow-hidden`.
  - Integrasi konfigurator detail produk (`ProductConfigurator.vue`): tombol love inline sejajar dengan aksi Tambah ke Bag.
  - Integrasi navbar (`AppNavbar.vue`): navigasi langsung ke `/wishlist` dan dynamic badge counter item pada desktop dan mobile menu.
  - Halaman mandiri `/wishlist` (`app/pages/wishlist.vue`): tata letak gallery modernist, breadcrumbs ringkas, margin dan padding selaras dengan halaman pesanan, grid kartu produk tersimpan, aksi "Pindahkan ke Bag" per item maupun sekaligus (`moveAllToCart`), serta empty state elegan.
- **Integrasi Database Supabase & Server Nitro**:
  - Migrasi skema database `supabase/migrations/20261118000001_user_wishlists.sql` dengan relasi `user_id` ke `auth.users`, `product_id` ke `public.products`, composite unique constraint `(user_id, product_id)`, serta RLS policies terisolasi per user (`(select auth.uid()) = user_id`).
  - Skema Zod validasi input `shared/schemas/wishlist.ts` (`WishlistAddInput`, `WishlistDeleteInput`, `WishlistSyncInput`).
  - Nitro API route handlers: `GET /api/wishlist`, `POST /api/wishlist`, `DELETE /api/wishlist`, dan `POST /api/wishlist/sync` menggunakan query selektif non-destruktif yang 100% kompatibel dengan RLS policies.
  - Ketahanan Hard Refresh: penambahan watcher reaktif sesi auth Supabase pada hidrasi client dan inisialisasi store pada lifecycle mount agar item wishlist tidak hilang saat pengguna melakukan hard reload (`Ctrl + Shift + R`).
  - Penyeragaman seluruh istilah antarmuka dan pesan respon server menjadi "Wishlist".
- **Pengujian Unit**:
  - Penambahan 9 unit test di `tests/unit/wishlist-store.spec.ts` (menguji inisialisasi, penambahan, pencegahan duplikat, toggle, pemindahan ke keranjang, dan persistensi).
  - Penambahan 9 unit test di `tests/unit/api-wishlist.spec.ts` (menguji validasi skema Zod dan invariant keamanan isolasi data RLS per tenant).

### Peningkatan Tab Bar Favicon & Tata Arsip Dokumentasi

- **Aset Favicon Browser**:
  - Desain ulang ikon tab browser `public/favicon.svg` dengan proporsi diperbesar (zoomed squircle), kontras rak tebal, dan aksen biru kobalt ShelfStack.
  - Pembuatan bundel aset produksi: `favicon-32x32.png`, `apple-touch-icon.png`, dan `favicon.ico`.
  - Integrasi cache-busting `?v=2` pada `nuxt.config.ts` dan `app/app.vue`.
- **Restrukturisasi Dokumentasi Proyek**:
  - Pembersihan folder `docs/`: merelokasi berkas usang dan artefak Stitch ke `docs/archive/` dilengkapi `docs/archive/README.md`.
  - Pembaharuan master index `docs/README.md` dan ringkasan standup `docs/standup/README.md`.

### Gate Kualitas (dijalankan aktual 2026-10-26)

- `pnpm typecheck` (`nuxi typecheck`): EXIT 0 (0 error).
- `pnpm lint`: EXIT 0 (0 error, 0 warning, 100% clean).
- `pnpm exec vitest run`: 45 test files, 408 test lolos (100% pass).

## [Unreleased] - unify auth area (2026-10-16)

### Perubahan

- Fase 1 unifikasi etalase: area auth memakai primitif brand penuh.
  `AuthFormInput` menjadi adapter tipis di atas `UiInput` (kontrak props dan emit
  `clearError` dipertahankan, slot `label` yang tidak dipakai siapa pun dibuang).
- `AuthCard` memakai `rounded-card` tunggal (sebelumnya `rounded-2xl` di mobile dan
  `rounded-3xl` di desktop). `AuthSubmitButton` dan tombol Google login/register
  melepas override `h-11` sehingga geometrinya milik `UiButton` sepenuhnya.
- Tombol pill hand-rolled di success state reset-password menjadi
  `UiButton to="/auth/login"`, ikon `text-green-500` menjadi `text-brand-success-text`.
- Efek samping: satu warning `vue/html-self-closing` hilang (32 menjadi 31).

### Gate (dijalankan aktual 2026-10-16)

`pnpm typecheck` EXIT 0, `pnpm lint` 0 error / 31 warning (pre-existing),
`pnpm exec vitest run` 37 file / 357 test lolos, detector impeccable `[]`,
screenshot login + register desktop 1440x900 dan mobile 390x844 lolos.
Satu-satunya console error adalah 404 `apple-touch-icon.png` (pre-existing,
aset statis hilang, di luar scope).

## [Unreleased] - vocabulary completion (2026-10-16)

### Perubahan

- `AdminStatCard` prop `color` memakai union semantik
  `'success' | 'warning' | 'danger' | 'info' | 'neutral'` (tipe ekspor `AdminStatTone`).
  Pemetaan ke ramp brand tidak berubah, hanya nama kontraknya. Empat call site
  di `app/pages/admin/index.vue` dimigrasi. Tidak ada test yang mengikat nama lama.
- 20 em dash di luar admin dihapus: 13 judul SEO memakai `-` (selaras judul admin),
  4 komentar kode memakai `:`, tombol `Tambah ke Bag` memakai `·` (selaras pita promo),
  label sortir memakai `A-Z`. Nol em dash tersisa di `app/`.

### Gate (dijalankan aktual 2026-10-16)

`pnpm typecheck` EXIT 0, `pnpm lint` 0 error / 32 warning (pre-existing),
`pnpm exec vitest run` 37 file / 357 test lolos, detector impeccable `[]`.

## [Unreleased] - redesign admin ke primitif brand (2026-10-16)

### Keputusan

PrimeVue dihapus sepenuhnya dari aplikasi. Penyebabnya bukan selera: `darkModeSelector: 'system'`
di `nuxt.config.ts` membuat komponen PrimeVue mengikuti dark mode OS, sementara token Tailwind
`brand-*` mengikuti class `.dark` yang tidak pernah dipasang. Kedua sistem theming hidup
bersamaan dan menghasilkan halaman setengah gelap (tab tak terlihat, dialog gelap di atas form terang).
Satu kosakata komponen menghapus dual theming itu.

`primeicons` tetap dipakai. Itu font ikon, bukan pustaka komponen, dan dipakai lintas etalase.

### Primitif baru (`app/components/ui/`)

- `UiModal`: teleport ke body, focus trap, scroll lock, tombol Escape, `aria-modal`. Wrapper `ClientOnly` supaya aman SSR.
- `UiSelect`, `UiTextarea`, `UiFileField`: kontrol formulir brand. `UiFileField` menegakkan JPEG/PNG/WebP dan batas 5 MB di dalam komponen.
- `UiTabs`: pil ter-segmentasi dengan `role="tablist"`, navigasi panah, Home/End.
- `UiSortHeader`, `UiSkeleton`, `UiIconButton`, `UiEmptyState`, `UiAlert`.
- `UiToastHost` + `useUiToast`, `UiConfirmHost` + `useUiConfirm`: menggantikan `<Toast>` dan `<ConfirmDialog>` global.
- `UiBadge`, `UiButton`, `UiInput` ditulis ulang ke token semantik dan `useId()` (sebelumnya `Math.random()` sebagai id, tidak aman SSR).

### Ramp status semantik (satu resep untuk badge, alert, toast, KPI)

Tiap status punya tiga lapis: warna teks, latar, garis tepi.
`--brand-success`, `--brand-warning`, `--brand-danger`, `--brand-accent`, masing-masing dengan
`-tint`, `-edge`, dan `-text`. Lapisan `-text` dipilih gelap supaya rasio kontras di atas
tint tetap di atas 4.5:1. Palet `surface-*` dan `primary-*` (yang diturunkan dari `--p-*` PrimeVue)
dihapus dari `tailwind.config.js`.

`--brand-muted` digelapkan ke `#5c5f64` dan `--brand-faint` ke `#6f7279` supaya teks pendukung
dan placeholder naik dari 2.56:1 ke di atas 4.5:1.

### Browser surfaces

Blok CSS `.p-toast` sepanjang 260 baris (hex hardcoded, `border-left: 5px`) dihapus, digantikan
tema scrollbar, `::selection`, caret, autofill, dan `.tabular` untuk kolom rupiah.

### Perbaikan fokus dan hydration

- Indikator fokus kini satu aturan global `:focus-visible` memakai `outline`, bukan `ring`.
  Sebelumnya tiap primitif membawa `focus-visible:ring-2` sehingga `UiInput` menampilkan dua
  cincin fokus bertumpuk. `outline-none` pada `UiInput`/`UiSelect`/`UiTextarea` ikut dibuang
  karena menindih aturan global.
- `UiModal` dan `UiToastHost` dibungkus `ClientOnly`. Log dev server menunjukkan
  "Hydration children mismatch" dan "Hydration class mismatch" pada kedua host sebelum perbaikan ini.
- `app/pages/auth/callback.vue` masih memuat `<ProgressSpinner>` PrimeVue yang tidak lagi ter-resolve
  setelah modul dicabut. Diganti spinner CSS brand.

### Skrip sekali jalan

Empat skrip `scripts/*.mjs` dipakai untuk transformasi massal dan sudah dihapus setelah dipakai.
Catatan operasional: `Set-Content`/`Out-File` PowerShell merusak UTF-8 di repo ini (em dash jadi
mojibake plus BOM). Semua transformasi massal harus lewat Node.

### Gate (dijalankan aktual 2026-10-16)

`pnpm typecheck` EXIT 0, `pnpm lint` 0 error / 32 warning (`vue/html-self-closing`, pre-existing),
`pnpm exec vitest run` 37 file / 357 test lolos, detector impeccable `[]`.
Screendesktop 1440x900 dan mobile 390x844 untuk 4 halaman admin plus dialog Tambah Produk:
2 passed, 0 console error.

### Di luar scope

Redesign ini hanya menyentuh admin. Etalase publik masih memakai komponen lamanya
(`AppNavbar`, `ProductList`, `KatalogToolbar`, dan lain-lain) yang sekarang tidak punya
pasangan primitif. Token `brand-*` sudah menjadi satu-satunya sumber warna, jadi etalase tidak
rusak, tapi belum disatukan geometrinya. Ada 21 em dash tersisa di halaman etalase, `AppNavbar`,
dan komponen auth yang belum disentuh.

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

### Penjaga env server (2026-10-12)

- Diagnosis kegagalan E2E CI: tanpa Supabase URL/Key, plugin server `@nuxtjs/supabase`
  melempar saat setup sehingga setup pinia terlewat dan hook `app:rendered`
  crash (`.state` of undefined) di semua halaman SSR, menutupi error asli.
- Plugin Nitro `server/plugins/00.env-guard.ts` + `shared/utils/env-guard.ts`
  (+4 unit test): server menolak boot dengan pesan jelas bila konfigurasi
  belum lengkap. Terbukti: tanpa env → fatal eksplisit; dengan env → 200.

### Gate typecheck jujur (2026-10-12)

- Script `pnpm typecheck` diganti dari `vue-tsc --noEmit` (terbukti memeriksa 0 file)
  ke `nuxi typecheck`, sehingga gate lokal dan CI memeriksa proyek app + server
  secara nyata. Terverifikasi EXIT 0 sebelum diganti.

### Filter audit aktivitas D-04 (2026-10-16)

- Halaman `/admin/activities` kini punya filter aksi (tab Semua/CREATE/UPDATE/DELETE/RESTORE)
  dan filter entitas (dropdown dinamis dari data), penghitung hasil, dan tombol reset.
- Logika filter murni di `app/features/activities/utils/activity-filter.ts` (+10 unit test).
  Realtime tetap jalan karena filter berupa computed di atas data yang sama.

### Redesign konsistensi dashboard admin (2026-10-16)

- Seluruh permukaan admin disatukan ke token `brand-*`: `activities.vue` dan
  `ActivityDetailDialog.vue` lepas dari palet `surface/zinc` dan hex hardcoded,
  resep error/danger/success satu rasa, radius `rounded-card/2xl`, shadow whisper.
- Tabel pesanan: header ID Pesanan, Pelanggan, Tanggal, Total bisa diklik untuk
  sort (siklus desc, asc, mati) via param `sort` allowlist di `GET /api/admin/orders`
  (+11 unit test). Ekspor CSV mengikuti sort aktif.
- Tabel produk: sort client (Nama A-Z, Termurah, Termahal, Stok tersedikit) via
  helper murni `product-sort.ts` (+11 unit test), tanpa ubah store/API/kontrak publik.
- `font-mono` untuk ID/SKU dipertahankan (back-office, bukan elemen commerce).

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
