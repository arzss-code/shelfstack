# Progress Tracker — ShelfStack (Product Management)

> **Catatan Status Proyek:** Dokumen ini adalah sumber kebenaran terkini mengenai progress implementasi fitur, status sprint, dan milestone yang telah dicapai. **Setiap agen AI WAJIB membaca dokumen ini sebelum mulai bekerja.**

---

## 📌 Status Terkini

- **Sprint Aktif:** **Sprint 16 (Portfolio Packaging, PWA Standalone Manifest, Dynamic Sitemap & SEO Structured Data)**
- **Versi Rilis:** `v0.36.0` (`version.json`, `CHANGELOG.md` : sinkron 2026-11-08)
- **Baseline Quality Gate (2026-11-08, dijalankan aktual):** `pnpm lint` 0 error / 0 warning · `nuxi typecheck` EXIT 0 · `vitest run` 90 file / 937 test lolos 100% · Playwright E2E 14/14 test lolos 100% · 0 file `.vue` atau `.ts` di `app/`, `server/`, `shared/` melampaui 300 baris (100% patuh SOP).
- **Keputusan Arsitektur:**
  - Model Bisnis: **Single-Vendor E-Commerce** (ShelfStack sebagai penjual kurasi resmi)
  - Payment Gateway: **Midtrans Sandbox** (metode Snap Popup/Redirect; BUKAN mock — tidak ada lapisan mock di kode)
  - UI Language: **Bahasa Indonesia** konsisten di seluruh etalase publik
  - Realtime Engine: **Supabase Realtime** (Postgres Changes untuk order tracking) + polling sync 3.5–4s untuk order `pending`
  - Deployment Target: **Docker + Nginx** (multi-stage build, `deploy/docker-compose.prod.yml`; Vercel tidak lagi jadi target)
  - PWA / SEO: **PWA Standalone Manifest** (`site.webmanifest`), dynamic XML sitemap (`/sitemap.xml`), robots crawl directives, `Schema.org/Product` JSON-LD rich snippets, dan offline resilience banner.

---

## 🚀 Riwayat Kemajuan per Fase

### ✅ Fase 0: Foundation & Hygiene (Sprint 1)

- [x] Konfigurasi Nuxt 4, TypeScript, Tailwind CSS, PrimeVue, dan Vitest.
- [x] Database types Supabase terintegrasi (`app/types/database.types.ts`).
- [x] Migrasi FSD: repositori dan store terpusat di `app/features/products/`.
- [x] Validasi server produk menggunakan Zod schema dengan unit test lengkap (`tests/unit/`).

### ✅ Redesign Admin: PrimeVue ke Primitif Brand (2026-10-16)

- [x] **PrimeVue dihapus dari aplikasi.** `primevue`, `@primevue/nuxt-module`, dan `@primeuix/themes`
      dicabut dari `package.json` dan `nuxt.config.ts`. Penyebab: `darkModeSelector: 'system'`
      membuat komponen PrimeVue ikut dark mode OS sementara token `brand-*` mengikuti class `.dark`
      yang tidak pernah dipasang, sehingga halaman tercampur terang dan gelap.
- [x] **11 primitif baru di `app/components/ui/`**: `UiModal`, `UiSelect`, `UiTextarea`,
      `UiFileField`, `UiTabs`, `UiSortHeader`, `UiSkeleton`, `UiIconButton`, `UiEmptyState`,
      `UiAlert`, plus `UiToastHost`/`UiConfirmHost` dan composable `useUiToast`/`useUiConfirm`.
- [x] **Ramp status semantik**: `--brand-{success,warning,danger,accent}` masing-masing dengan
      `-tint`, `-edge`, `-text`. Satu resep dipakai badge, alert, toast, kartu KPI, dan badge tabel.
      Palet `surface-*` dan `primary-*` dihapus dari `tailwind.config.js`.
- [x] **Kontras teks pendukung dinaikkan**: `--brand-muted` ke `#5c5f64`, `--brand-faint` ke
      `#6f7279`. `--brand-faint` sebelumnya 2.56:1, di bawah ambang 4.5:1.
- [x] **Seluruh permukaan admin dikonversi**: 4 halaman admin, layout `admin.vue`,
      `ProductForm`, `StockMovementsModal`, `ActivityDetailDialog`, `OrderCancelDialog`,
      `OrderInvoiceModal`, `AdminOrderTable`, `AdminStatCard`. Tabel memakai satu resep geometri
      yang sama di semua halaman.
- [x] **Browser surface bertema**: scrollbar, `::selection`, autofill, `.tabular` untuk kolom
      rupiah. Blok `.p-toast` 260 baris dengan hex hardcoded dihapus.
- [x] **Indikator fokus tunggal**: satu aturan `:focus-visible` global memakai `outline`.
      `UiInput` sebelumnya menampilkan dua cincin fokus bertumpuk.
- [x] **Hydration mismatch diperbaiki**: `UiModal` dan `UiToastHost` dibungkus `ClientOnly`.
- [x] **Gate**: `pnpm typecheck` EXIT 0, `pnpm lint` 0 error / 32 warning (pre-existing),
      `pnpm exec vitest run` 37 file / 357 test lolos, detector impeccable `[]`,
      screenshot desktop 1440x900 + mobile 390x844 (4 halaman + dialog) 2 passed / 0 console error.

### Known Gap baru (admin)

- **Etalase belum disatukan geometrinya.** Primitive baru hanya dipakai admin. Halaman publik masih
  memakai komponen lama. Token warnanya sudah satu, jadi tidak rusak, tapi geometri (radius,
  ukuran kontrol) belum konsisten antara admin dan etalase.
- [x] **Em dash repo-wide selesai (2026-10-16).** 20 em dash di luar admin diganti: judul SEO memakai
      `-` (selaras `Kelola Pesanan - Admin ShelfStack`), komentar kode memakai `:`, tombol
      `Tambah ke Bag` memakai `·` (selaras pita promo), label sortir memakai `A-Z`. Nol em dash tersisa
      di `app/`, satu-satunya assertion judul E2E (`/ShelfStack/`) tetap lolos.
- [x] **`AdminStatCard` memakai union semantik (2026-10-16).** Prop `color` kini
      `'success' | 'warning' | 'danger' | 'info' | 'neutral'` dengan tipe ekspor `AdminStatTone`.
      Kelas ramp brand tidak berubah, hanya nama kontraknya. Empat call site di `admin/index.vue`
      dimigrasi, tidak ada test yang mengikat nama lama.

### Fase 1 unifikasi etalase: area auth (2026-10-16)

- [x] `AuthFormInput` menjadi adapter tipis di atas `UiInput`. Pola ini sudah diuji dua model
      (Muse Spark 1.3 vs Space Bunny, hasil seri di semua gate) sebelum diimplementasikan.
- [x] Radius kartu, tinggi tombol, dan status sukses disatukan ke token brand.
- [x] Gate: typecheck EXIT 0, lint 0 error / 31 warning, vitest 357 lolos, detector `[]`,
      screenshot login + register desktop dan mobile lolos (satu 404 pre-existing
      `apple-touch-icon.png`, dicatat sebagai follow-up aset statis).

### ✅ Fase 1: Auth & Security (Sprint 2)

- [x] Autentikasi Supabase: Register, Login, Logout, Session persist, dan role guard.
- [x] Alur Reset Password: Halaman `/auth/forgot-password` dan `/auth/reset-password`.
- [x] Komponen Autentikasi Bersih: Diekstrak ke `AuthCard.vue`, `AuthFormInput.vue`, `AuthSubmitButton.vue`, `AuthDivider.vue`.
- [x] Skema Kategori Dinamis: Migrasi SQL `20260921000001_sync_shelfstack_categories.sql` (5 kategori resmi ShelfStack) dan composable `useCategories.ts`.
- [x] Perbaikan Kontras Input: Menggunakan input native Tailwind berborder tegas (`border-zinc-300`) yang aman di mode terang/gelap.

### ✅ Fase 2: Storefront & Katalog Pro (Sprint 3)

- [x] **Redesign Total Halaman Beranda (`app/pages/index.vue`)**:
  - Disederhanakan dari monolit 720 baris menjadi ~36 baris orchestrator.
  - Diekstrak menjadi 8 komponen modular: `HomeHero`, `HomeAssurances`, `HomeFeaturedCategories`, `HomeFlashDeals`, `HomeFeaturedProducts`, `HomeFeatures`, `HomeReviews`, `HomePromoCTA`.
- [x] **Global UI Design System (`app/components/ui/`)**:
  - `UiButton.vue`: Dukungan varian (primary, secondary, accent, outline, ghost), ukuran, loading state, dan otomatis menjadi `<NuxtLink>` jika memiliki prop `to`.
  - `UiInput.vue`: Form input terstandarisasi dengan label, icon kiri/kanan, dan validasi error.
  - `UiBadge.vue`: Chip status terstandarisasi (success, warning, danger, info, default).
  - `UiCard.vue`: Kontainer modular dengan shadow whisper dan border brand.
- [x] **Standardisasi Card Produk (`ProductCard.vue`)**:
  - Kartu produk terisolasi dengan status ketersediaan stok dinamis (`Habis`, `Sisa <5`, `Tersedia`).
  - Mengintegrasikan helper bersama `app/utils/format.ts` (`formatRupiah`).
- [x] **Modularisasi Halaman Katalog (`app/pages/katalog.vue`)**:
  - Disederhanakan dari 545 baris menjadi ~290 baris.
  - Diekstrak menjadi 4 sub-komponen: `KatalogToolbar`, `KatalogActiveFilters`, `KatalogSidebar`, `KatalogMobileFilter`.
  - Sinkronisasi URL query (`q`, `category`, `price`, `sort`).
- [x] **Modularisasi Halaman Detail Produk (`app/pages/product/[id].vue`)**:
  - Disederhanakan dari 445 baris menjadi ~140 baris.
  - Diekstrak menjadi 2 sub-komponen: `ProductGallery` dan `ProductConfigurator`.
  - Dilengkapi `useSeoMeta` dengan Open Graph tags (`ogTitle`, `ogDescription`, `ogImage`), breadcrumb, dan quantity stepper yang sadar batas stok.

---

### 🔄 Fase 3: Cart, Checkout & Midtrans Sandbox (Sprint 4)

- [x] **Database & Atomic RPC (`supabase/migrations/20261001000001_orders_and_checkout_rpc.sql`)**:
  - Tabel `orders` dan `order_items` dengan RLS ketat (direct insert dilarang, hanya via RPC).
  - PL/pgSQL function `create_order()` dengan row lock `FOR UPDATE`, decrement stok, dan anti-tamper total.
  - Supabase Realtime publication untuk tabel `orders`.
- [x] **Shared Schema & Type Definitions**:
  - `shared/schemas/order.ts`: Zod schema untuk item keranjang dan alamat pengiriman dengan unit test lengkap (`tests/unit/order-schema.spec.ts`).
  - `app/types/database.types.ts` dan `app/types/order.ts`.
- [x] **State Cart (Pinia)**:
  - `app/features/cart/stores/cart.ts` dengan persistensi `localStorage` (`shelfstack-cart`).
  - Unit test lengkap di `tests/unit/cart-store.spec.ts`.
- [x] **Storefront & Cart UI Integration**:
  - `CartDrawer.vue` (slide-over panel interaktif dari kanan) terpasang di `app/layouts/default.vue`.
  - Navbar `AppNavbar.vue` terhubung ke counter item dan total harga belanja realtime.
  - Detail Produk `app/pages/product/[id].vue` terhubung ke `cartStore.addItem` (Tambah ke Bag & Beli Sekarang).
  - Halaman keranjang penuh `app/pages/cart.vue`.
- [x] **Checkout & Midtrans Sandbox Integration**:
  - Halaman `app/pages/checkout.vue` dengan form alamat Zod dan trigger popup Midtrans Snap via `useMidtransSnap.ts`.
  - Endpoint `server/api/orders/index.ts` (POST create_order RPC, GET list riwayat).
  - Endpoint `server/api/orders/[id]/index.ts` (GET detail pesanan + relasi produk).
  - Endpoint `server/api/orders/[id]/payment-token.post.ts` (generate Snap Token Midtrans Sandbox).
  - Webhook handler `server/api/midtrans/notification.post.ts` dengan verifikasi signature SHA-512 (`tests/unit/midtrans-webhook.spec.ts`).
- [x] **Order History & Realtime Tracking**:
  - Halaman riwayat `app/pages/orders/index.vue`.
  - Halaman detail `app/pages/orders/[id].vue` dengan timeline visual dan langganan Supabase Realtime channel `order-realtime-<id>` untuk pembaruan status live.

---

### ✅ Fase 4: Admin Ops (Sprint 5) — selesai fungsional ~90%, 2 parsial

Terverifikasi dari kode (audit 2026-10-11), bukan dari klaim dokumen:

- [x] **KPI Dashboard (`app/pages/admin/index.vue`, `server/api/admin/stats.get.ts`)**:
  - Revenue, order pending, low-stock (<5), total customers, 8 recent orders.
- [x] **Manajemen Order + FSM (`app/pages/admin/orders/`, `server/api/orders/[id]/status.put.ts`, `shared/constants/order-transitions.ts`)**:
  - Hanya transisi legal via RPC `transition_order_status`; admin `pending→paid` dilarang.
  - Ekstra di luar spek: refund (`server/api/orders/[id]/refund.post.ts`), `check-payment-status`, refund-webhook.
- [x] **CRUD Produk + Ledger Stok (`app/pages/admin/products.vue`, `server/api/admin/products/[id]/stock-movements.get.ts`)**:
  - Tabel `stock_movements` (double-entry ledger), modal riwayat per produk.
- [x] **Audit Aktivitas (`app/pages/admin/activities.vue`, channel `public:activity_logs`)**:
  - ✅ Terverifikasi 2026-10-11: `transition_order_status` kanonis (`20261115000001:411-429`) menulis `activity_logs` transaksional (fail-safe) — `status.put.ts` memang tidak perlu insert langsung.
- [x] **Export CSV (`server/api/admin/orders/export.get.ts`, tombol di `app/pages/admin/orders/index.vue`)**:
  - ✅ Filter tanggal + status selesai 2026-10-11: param `from`/`to` (YYYY-MM-DD, 400 jika invalid), batas akhir inklusif, input tanggal di filter bar, +5 unit test. Status `refunded` ditambahkan ke allowlist filter.

### 🔄 Fase 5: Quality & Launch (Sprint 6) — berjalan

- [x] **CI (`/.github/workflows/ci.yml`)**: lint → typecheck (root + order-service) → build → vitest (root + order-service) → validasi docker compose.
- [x] **E2E Suite Playwright** (`tests/e2e/full-business-journey.spec.ts` + 12 Page Object Models).
- [x] **Deployment Docker+Nginx** (`Dockerfile`, `deploy/docker-compose.prod.yml`, `deploy/nginx/nginx.conf`).
- [x] **Packaging portofolio** (README terstruktur, diagram Mermaid, indeks ADR, pnpm db:seed CLI runner, tabel kredensial demo, 1-klik banner di `/auth/login`, dan template Pull Request Gitmore profesional).
- [x] **Lighthouse ≥90 & Core Web Vitals** (terverifikasi 2026-11-07 via Chrome DevTools MCP): Beranda (`/`) Accessibility 96 (100 di luar devtools overlay), Best Practices 100, SEO 100, CLS 0.00; Etalase Kategori (`/c/tech`) Accessibility 100, Best Practices 100, SEO 100, CLS 0.00.

---

## ⚠️ Known Gaps (sisa setelah eksekusi 2026-10-11 — yang selesai dicoret)

1. ~~**F0-01: `database.types.ts` basi**~~ ✅ **SELESAI 2026-10-11** — sinkron manual dari migrasi (tabel `order_idempotency_keys` + `user_addresses`, 7 kolom, signature `create_order`, enum `order_status` di Constants); `typecheck` EXIT 0 tanpa fallout. `supabase gen types` ulang tetap disarankan saat CLI terautentikasi (tidak ada token di sesi ini).
2. **F0-02 SEBAGIAN (koreksi temuan audit).** Klaim "PASTI GAGAL" **dicabut** — verifikasi byte-level membuktikan `DO UPDATE SET` valid (baris 12/150 + migrasi `20260921000001:69`); flag `parse_partial` indexer adalah keterbatasan grammar tree-sitter untuk upsert. AC jumlah seed dikoreksi ke 5/5/2. Sisa: runtime (`pgcrypto`, `auth.*`) butuh `supabase db reset` sekali untuk vonis final.
3. ~~**R-1 rate-limit salah sasaran**~~ ✅ **SELESAI 2026-10-11** — rule menunjuk `/api/orders/**/payment-token` (rule mati `/api/checkout` yang tidak punya endpoint dihapus).
4. ~~**R-2 inkonsistensi admin `payment-token`**~~ ✅ **SELESAI 2026-10-11** — diputuskan ikut pola mayoritas (owner + admin bypass, konsisten dengan 3 endpoint order lain).
5. ~~**R-3 pola ganda `addresses/[id].ts`**~~ ✅ **SELESAI 2026-10-11** — query lanjutan memakai `existing.user_id` (pemilik terverifikasi); +3 regression test admin.
6. ~~**GATE RUSAK + ERROR INVENTARIS (temuan 2026-10-12)**~~ ✅ **SELESAI 2026-10-12** — ±29 error di 6 file diperbaiki: `shared/schemas/address.ts` (migrasi `required_error` Zod 3 → `error` Zod 4, 5 situs), `server/utils/idempotency.ts` (guard `undefined`), `app/components/ui/UiInput.vue` (`modelValue` terima `undefined`), `app/layouts/admin.vue` (`logout` → alias `signOut`, sebelumnya tombol mati), `app/pages/orders/index.vue` (guard index array), `app/pages/katalog.vue` (generic `$fetch` eksplisit), + `@types/node` di root devDependencies. `pnpm exec nuxi typecheck` kini EXIT 0. ✅ **SELESAI 2026-10-12**: script `pnpm typecheck` diarahkan ke `nuxi typecheck` sehingga gate lokal dan CI memeriksa kode nyata.
7. ~~**E2E MERAH karena env kosong (temuan 2026-10-12)**~~ ✅ **SELESAI 2026-10-16 (PR #15)** — akar masalah terbukti: tanpa Supabase URL/Key, plugin `@nuxtjs/supabase` (`enforce: pre`) melempar saat setup sehingga setup pinia terlewat, lalu hook `app:rendered` pinia crash (`.state` of undefined) dan menutupi error asli di semua halaman SSR. Perbaikan: plugin Nitro `server/plugins/00.env-guard.ts` + validator `shared/utils/env-guard.ts` (+4 unit test) membuat server menolak boot dengan pesan jelas. 5 secrets CI sudah diisi dan job E2E hijau, guard tidak false-trigger (issue #10 sebagian tertutup, sisa required checks).
8. **E2E auth + cart hydration (temuan 2026-10-13, SELESAI 2026-10-16, PR #17).** Akar login: akun seed `.local` gagal `signInWithPassword` di cloud (`Database error querying schema`, terbukti via API); akun `.test` (dashboard, profil+role benar) login OK. Baris `.local` yang rusak sudah dihapus dari cloud; seed `.local` tetap local-only, akun kanonis cloud adalah `.test`. E2E baca kredensial dari env (fallback seed lokal), 4 secrets CI sudah diisi dan job E2E hijau (2m37s). Bug nyata diperbaiki: `initCart()` di `onMounted` layout default untuk full page load. Flake submit pre-hydration dimitigasi. Sisa: daftarkan job E2E ke required checks (issue #10) dan verifikasi live issue #12.
9. **Fix checkout premature empty state flash (SELESAI 2026-10-26).** Pada saat checkout berhasil membuat order di backend dan mengosongkan keranjang di store, template checkout sebelumnya langsung menampilkan empty state "Keranjang Belanja Kosong" sebelum popup Snap Midtrans muncul. Diperbaiki dengan state `isOrderPlaced` dan snapshot keranjang terisolasi (`placedOrderSnapshot`), sehingga rincian item pesanan tetap utuh dan formulir beralih ke state persiapan pembayaran dengan mulus (+3 unit test di `tests/unit/checkout-transition.spec.ts`).
10. **Fix order detail polling flicker, stepper timeline UX, and remove slop badge (SELESAI 2026-10-26).** Di halaman `/orders/[id]`, sinkronisasi status pembayaran background polling setiap 3.5 detik sebelumnya menggunakan satu variabel `isCheckingStatus` yang terikat pada disabled/loading state tombol aksi, sehingga tombol berkedip aktif/nonaktif secara mengganggu. Masalah diperbaiki dengan memisahkan `isSilentChecking` (background polling) dan `isManualChecking` (tombol Cek Status oleh pengguna). Komponen stepper alur transaksi yang sebelumnya polos dan terputus diganti dengan visual timeline terhubung yang informatif, adaptif terhadap status pesanan, serta badge "Realtime Status Aktif" dibersihkan.
11. **Migrasi Dropdown Bawaan ke Primitif Kustom UiSelect (SELESAI 2026-10-26).** Audit seluruh dropdown form dan filter di halaman katalog, form produk, serta panel admin. Komponen native `<select>` diganti dengan `<UiSelect>` kustom yang ramah aksesibilitas keyboard (Arrows, Enter, Escape, Space), mendukung prefix, pencarian, dan penataan z-index terisolasi (`isolation: isolate` pada kartu produk) agar popover tidak tertabrak badge produk (+9 unit test di `tests/unit/ui-select.spec.ts`).
12. **Penyempurnaan Alur dan Tampilan Pesanan Pelanggan (SELESAI 2026-10-26).** Tab filter status pesanan pada `/orders` dibuat full-width responsif tanpa indikator scrollbar visual. Daftar pesanan diekstrak ke `OrderCard.vue` dengan pemisahan aksi Bayar langsung (Snap Popup) dan Detail. Di halaman `/orders/[id]`, pembatalan pesanan terhubung dengan restock atomik RPC, penayangan alasan pembatalan dan timestamp transparan, tombol aksi "Beli Lagi" yang memasukkan item kembali ke keranjang belanja, pembatasan akses cetak invoice hanya untuk status lunas/dikirim/selesai, serta pembersihan type casting `as any` (+10 unit test gabungan di `tests/unit/orders-card.spec.ts` dan `tests/unit/orders-detail-actions.spec.ts`).
13. **Unifikasi Desain & Geometri Etalase Publik (SELESAI 2026-10-26).** Penyatuan geometri radius (`rounded-card`, `rounded-field`), pembersihan seluruh warna legasi hardcoded (`slate-*`, `zinc-*`, `rose-*`, `emerald-*`) menjadi token semantik brand (`bg-brand-canvas`, `bg-brand-canvas-soft`, `text-brand-ink`, `text-brand-muted`, `brand-danger`, `brand-success`, `brand-warning`), eliminasi 7 warning ESLint `vue/html-self-closing` pada void element `<img/>` dan `<input/>` di komponen etalase publik (`ProductCard`, `ProductGallery`, `ProductConfigurator`, `CartDrawer`, `cart.vue`, `KatalogMobileFilter`, `AppNavbar`), serta sinkronisasi dark mode otomatis melalui CSS variables terpusat.
14. **Redesign Split Layout Halaman Login & Register (SELESAI 2026-10-26).** Transformasi tampilan autentikasi menjadi layout split 2-kolom: kolom kiri memuat visual arsitektural kurasi ShelfStack dan logo resmi, kolom kanan memuat formulir kompak yang pas di viewport tanpa scroll vertikal berlebih pada desktop. Seluruh badge/icon trust redundan ('Belanja Aman • Privasi Terjaga') dihapus. Penambahan fitur show/hide password toggle interaktif pada input kata sandi yang ramah aksesibilitas (+4 unit test di `tests/unit/auth-redesign.spec.ts`).
15. **Pencapaian 100% Zero ESLint Warnings (SELESAI 2026-10-26).** Seluruh 16 sisa warning pre-existing `vue/html-self-closing` pada void element `<img/>`, `<input/>`, dan `<br/>` di komponen `AppNavbar.vue`, `HomeHero.vue`, `HomeFeaturedCategories.vue`, `HomeFlashDeals.vue`, `UiFileField.vue`, `OrderCancelDialog.vue`, `OrderInvoiceModal.vue`, dan `admin/orders/[id].vue` telah dibersihkan secara tuntas. Perintah `pnpm lint` kini menghasilkan output bersih: 0 problems (0 errors, 0 warnings).
16. **Wishlist System Lengkap (SELESAI 2026-10-26).** Implementasi Pinia store persistent `shelfstack-wishlist` (`useWishlistStore`), tombol love interaktif `WishlistButton` di kartu produk (`ProductCard`) dan halaman konfigurasi detail (`ProductConfigurator`), dynamic badge counter pada ikon hati di `AppNavbar` (desktop dan menu mobile), halaman mandiri `/wishlist` dengan grid koleksi tersimpan, aksi "Pindahkan ke Bag" per item maupun kolektif (`moveAllToCart`) dengan filter stok habis, toast notifikasi, serta 9 unit test komprehensif di `tests/unit/wishlist-store.spec.ts`.
17. **Sistem Kupon Promo & Voucher Diskon (SELESAI 2026-10-28, SHF-VOUCHER).** Implementasi modul voucher promo dan potongan diskon otomatis end-to-end. Database migrasi `20261121000001_coupons_and_promo_discounts.sql` mendefinisikan tabel master `public.coupons` (tipe percentage/fixed, batas maksimum potongan, kuota pemakaian global dan per-user, soft delete) dan audit trail `public.coupon_usages` dengan RLS strict dan foreign key cascade. RPC `create_order` diperbarui secara atomik untuk memvalidasi dan mengunci baris kupon (`FOR UPDATE`), menghitung diskon di sisi server Postgres, mencatat pemakaian, dan menyimpan metadata potongan ke `public.orders` (`subtotal_cents`, `discount_cents`, `coupon_code`). Server endpoint `POST /api/coupons/validate` memverifikasi kode promo terhadap subtotal belanja. Store Pinia `useCartStore` terintegrasi dengan kalkulasi diskon dinamis dan persistensi `localStorage`. Komponen interaktif `CartCouponInput.vue` dipasang pada drawer keranjang (`CartDrawer.vue`), halaman keranjang (`cart.vue`), dan halaman checkout (`checkout.vue`), serta rincian diskon tampil pada halaman detail pesanan pelanggan dan panel admin (+29 unit test baru di `tests/unit/coupon-schema.spec.ts`, `tests/unit/api-coupons.spec.ts`, dan `tests/unit/cart-coupon.spec.ts`).
18. **Pelacakan Pengiriman & Ekspedisi Kurir (SELESAI 2026-10-27, SHF-LOG-01).** Implementasi sistem pelacakan logistik terpadu untuk 5 kurir resmi (JNE, SiCepat, J&T, Anteraja, POS Indonesia). Database migrasi `20261120000001_shipping_and_order_tracking.sql` menambahkan field resi pada tabel `orders` dan sub-tabel `shipping_checkpoints` dengan RLS multi-tenant terisolasi dan registrasi `supabase_realtime`. Admin fulfillment modal mendukung pemilihan kurir dan pembuatan resi otomatis 1-klik (`SS-<KURIR>-<TIMESTAMP>`). Halaman publik `/tracking` memungkinkan pengecekan resi oleh pengunjung dengan sensor nama & telepon penerima untuk privasi. Pelanggan dapat memantau linimasa riwayat perjalanan kurir secara langsung di halaman rincian pesanan `/orders/[id]` (+9 unit test di `tests/unit/shipping-tracking.spec.ts`).
19. **Sistem Ulasan & Rating Produk Terverifikasi (SELESAI 2026-10-30, Product Reviews & Ratings).** Implementasi modul ulasan produk nyata end-to-end. Migrasi SQL `20261122000001_product_reviews_and_ratings.sql` mendefinisikan tabel `public.product_reviews` dengan soft-delete `deleted_at`, unique key `(product_id, user_id, order_id)`, partial performance index, RLS policies untuk baca publik dan otorisasi pemilik, serta database trigger `recalculate_product_rating()` yang secara otomatis memperbarui nilai rating dan ulasan pada tabel master `products`. Backend service `server/utils/review.ts` dan Zod schema `shared/schemas/review.ts` mengatur validasi input (bintang 1-5, ulasan 10-1000 karakter), validasi eligibilitas pembelian nyata (pesanan berstatus `completed`), dan sensor privasi nama depan + inisial belakang (`Budi S.`) tanpa elemen badge artifisial. Tampilan frontend modular di etalase (`ProductReviewsSection.vue`, `ReviewRatingSummary.vue`, `ReviewFilterBar.vue`, `ReviewCard.vue`, `ReviewEligibilityCard.vue`, `ReviewFormModal.vue`) terintegrasi pada halaman detail produk `/product/[id]` dan daftar barang belanja pesanan lunas di `/orders/[id]` (+46 unit test baru di `tests/unit/review-schema.spec.ts`, `tests/unit/api-reviews.spec.ts`, dan `tests/unit/product-reviews-section.spec.ts`).
20. **Modularisasi & Manajemen Kupon Promo Panel Admin (SELESAI 2026-11-03, SHF-ADM-COUPON-01).** Refactoring halaman admin kupon monolith (`coupons.vue`, sebelumnya 751 baris) menjadi arsitektur modular terpisah yang mematuhi batas maksimal 300 baris kode Talenavi SOP: `AdminCouponMetrics.vue` (64 baris), `AdminCouponTable.vue` (215 baris), `AdminCouponModal.vue` (229 baris), `AdminCouponUsagesModal.vue` (189 baris), dan composable `useAdminCouponForm.ts` (148 baris). Menambahkan integrasi biaya penukaran koin (`coin_cost`) pada skema kupon, API endpoint create/update, dan badge visual koin. Menghadirkan audit modal riwayat pemakaian kupon (`GET /api/admin/coupons/[id]/usages`) yang menampilkan pesanan terkait, status, besaran potongan, dan tanggal klaim pelanggan. Menyelaraskan komponen alert (`UiAlert.vue`) dengan fixed icon line container (`h-5 w-5`) dan `leading-5` sehingga ikon dan teks berada pada satu sumbu horizontal simetris tanpa kemiringan (+5 unit test di `tests/unit/admin-coupons-management.spec.ts`).

21. **Pilihan Layanan & Kalkulator Ongkir Checkout (SELESAI 2026-10-30, SHF-SHP-01).** Implementasi modul opsi pengiriman bertingkat (Tiered Shipping Rates) dan kalkulator ongkir dinamis end-to-end. Migrasi SQL `20261123000001_checkout_shipping_rates.sql` menambahkan kolom `shipping_service` dan `shipping_cost_cents` pada tabel `public.orders`, serta memperbarui RPC atomik `create_order` dengan kalkulasi ongkir di sisi server Postgres (anti-tamper) dengan promo otomatis Bebas Ongkir (Rp 0) untuk layanan Reguler dengan minimal belanja Rp 500.000. Endpoint Nitro `POST /api/shipping/calculate` dan schema Zod `shared/schemas/shipping.ts` menyediakan 4 tier resmi (Reguler Rp 15k, Next Day Rp 30k, Instan Rp 45k, Kargo Rp 25k). Komponen frontend `ShippingMethodSelector.vue` bergaya Archival Gallery Modernist terintegrasi pada alur checkout `app/pages/checkout.vue` dengan sinkronisasi tagihan ke Midtrans Snap dan penayangan biaya pengiriman pada rincian pesanan serta modal invoice (+32 unit test baru di `tests/unit/shipping-calculator.spec.ts` dan `tests/unit/shipping-selector.spec.ts`, total 62 file / 605 tests lolos 100%).

22. **Sistem Komplain & Retur Barang Pelanggan (SELESAI 2026-11-03, SHF-RMA-01).** Implementasi alur pengembalian dan penukaran barang (RMA & Customer Returns) end-to-end. Migrasi SQL `20261128000001_customer_return_requests_and_rma.sql` mendefinisikan tabel `public.return_requests` dengan indeks parsial unik per order aktif, RLS policies, dan bucket Supabase Storage baru `return-proofs` (maks 5MB, format JPEG/PNG/WebP). Backend Nitro API (`server/api/orders/[id]/return-requests/`, `server/api/returns/upload.post.ts`, `server/api/admin/returns/`) memverifikasi garansi 7 hari pasca pesanan selesai, pencatatan audit log, notifikasi in-app, serta penanganan restock inventaris otomatis saat admin menyetujui penyelesaian retur. Komponen frontend modular mematuhi batas maksimal 300 baris: `OrderReturnModal.vue` (294 baris), `OrderReturnStatusCard.vue` (265 baris), `AdminReturnDetailModal.vue` (249 baris), dan `app/pages/admin/returns.vue` (282 baris). Menyelaraskan perataan vertikal komponen `UiAlert.vue` sehingga icon dan teks selalu sejajar (+20 unit test baru di `tests/unit/return-request-schema.spec.ts` dan `tests/unit/order-return-components.spec.ts`, total 74 file / 701 tests lolos 100%).

23. **Sistem Live Chat Bantuan Pelanggan Real-time (SELESAI 2026-11-04, SHF-CHAT-01).** Implementasi live chat dua arah antara pelanggan etalase dan admin CS berbasis Supabase Realtime (Postgres Changes). Migrasi SQL `20261129000001_customer_support_live_chat.sql` mendefinisikan tabel `public.support_threads` dan `public.support_messages` dengan soft-deletes, triggers update unread counter atomik, dan bucket Supabase Storage baru `chat-attachments` (maks 5MB, format JPEG/PNG/WebP). Backend Nitro API (8 endpoints di `server/api/support/` dan `server/api/admin/support/`) menyediakan inisialisasi thread, pengiriman pesan dengan auto welcome bot, upload berkas bukti foto, pemuatan inbox admin, canned responses picker, dan perubahan status kendala. Komponen frontend modular mematuhi batas maksimal 300 baris: `LiveChatWidget.vue` (115 baris), `LiveChatWindow.vue` (245 baris), `ChatOrderSnippet.vue` (71 baris), `AdminSupportInboxList.vue` (228 baris), `AdminSupportChatPane.vue` (250 baris), `AdminCannedResponseMenu.vue` (91 baris), `app/pages/admin/support.vue` (184 baris), `useSupportChat.ts` (292 baris), dan `useAdminSupportChat.ts` (272 baris). Terintegrasi dengan layout etalase, navbar, dan sidebar admin (+178 unit test baru di 8 suite test, total 83 file / 880 tests lolos 100%).

24. **Modularisasi Menyeluruh <= 300 Baris & Penyempurnaan Live Chat (SELESAI 2026-11-06, v0.31.1).** Audit dan modularisasi tuntas atas seluruh halaman (`app/pages/`, 14 file) dan komponen (`app/components/` & `app/features/`, 15 file) yang sebelumnya melampaui batas 300 baris kode per file sesuai konstitusi Talenavi Engineering SOP. Kini seluruh 172 file `.vue` di dalam `app/` berada di bawah 300 baris (terbesar 296 baris) melalui ekstraksi composable dan sub-komponen terfokus dengan tipe TypeScript ketat tanpa `any`. Termasuk perbaikan kelas skala aktif peluncur `LiveChatWidget.vue` (`active:scale-95`), penyelarasan tipe callback `useUiSelect.ts`, serta sinkronisasi status inventaris fitur di `docs/PROGRESS.md` dan `docs/BACKLOG.md` (`pnpm typecheck` EXIT 0, `pnpm lint` EXIT 0, `pnpm exec vitest run` 83 file / 880 tests lolos 100%).

25. **Paritas Transaksional Pembatalan Pesanan, Worker BullMQ + DLQ, Unifikasi Skema Produk & Remediasi Standar Web Modern (SELESAI 2026-11-06, v0.32.0).**
    - **Database & Paritas Pembatalan (`supabase/migrations/20261130000001_order_cancellation_parity_and_expiry_hardening.sql`)**: Menambahkan kolom soft-delete `deleted_at` dan indeks parsial unik `idx_coupon_usages_active_unique` pada `public.coupon_usages` (menghapus operasi hard `DELETE`), memulihkan `set_config('app.order_transition_source', 'cancel_order_rpc', true)`, otorisasi admin, dan grant `service_role` pada `public.cancel_order`, serta menyatukan pemulihan stok, kuota/wallet voucher (`coupons` + `user_coupons`), dan refund koin loyalitas (`coins_used` via `coin_transactions` bertipe `cancelled_order`) di ketiga jalur pembatalan resmi (`cancel_order`, `handle_payment_webhook`, dan `transition_order_status`).
    - **Infrastruktur Antrean BullMQ + Dead Letter Queue (`services/order-service/`)**: Mengintegrasikan `bullmq` dengan antrean utama `order-expiry` (delayed job per pesanan `expire-order-<uuid>`, rekonsiliasi berkala 5 menit via `upsertJobScheduler`, exponential backoff 3 percobaan) dan Dead Letter Queue `order-expiry-dlq`, endpoint internal terproteksi `x-internal-secret` (`POST /schedule-expiry`, `GET /queue-stats`, `GET /dlq`, `POST /dlq/:jobId/retry`), blokir akses publik di `deploy/nginx/nginx.conf`, jembatan fail-open di Nitro (`server/utils/order-service.ts`), serta kartu pemantauan operasional `AdminExpiryQueueCard.vue` di `/admin/orders`.
    - **Unifikasi Skema Produk (`Backlog C-07`) & Dokumentasi Portofolio (`Backlog Q-04`)**: Mengekspor `productFormSchema` tunggal dari `shared/schemas/product.ts` untuk `useProductForm.ts` dan memperbarui `README.md` dengan diagram arsitektur Mermaid serta indeks ADR.
    - **Standar Web Modern, Aksesibilitas & Performa**: Pemuatan font `DM Sans` via `<link rel="preconnect">` di `nuxt.config.ts` (menghapus `@import` CSS dan font `Inter` tak terpakai), `htmlAttrs: { lang: 'id' }`, _skip link_ keyboard ke `<main>`, `100dvh` layout shell, `fetchpriority="high"` khusus citra utama LCP `HomeHero.vue`, elemen semantik `<search>` pada navbar, `aria-labelledby` + `overscroll-contain` pada `UiModal.vue`, penonaktifan `spellcheck`/`autocorrect` otomatis untuk field identifier pada `UiInput.vue`, serta penghilangan aturan global `animation-duration: 0.01ms !important` demi `@media (prefers-reduced-motion: reduce)` yang terarah.

26. **Kesiapan Peluncuran Produksi, Ekosistem Seeding Penuh, Telemetri Multi-Layanan & Hardening Web Vitals (SELESAI 2026-11-07, v0.33.0).**
    - **Ekosistem Seeding Database Penuh (`supabase/seed.sql` : F0-02)**: Menambahkan master kupon promo diskon (`WELCOME10`, `SHELF50K`, `FREESHIP`), riwayat pesanan 5 status lifecycle lengkap (`completed`, `shipped`, `paid`, `pending`, `cancelled`) beserta item barang, checkpoint kurir pelacakan logistik (JNE dan SiCepat), ulasan bintang 5 terverifikasi pada produk utama, 1 tiket komplain retur aktif di `/admin/returns`, percakapan customer support live chat di `/admin/support`, dan notifikasi pelanggan in-app.
    - **Telemetri Kesiapan Multi-Layanan (`server/api/ready.get.ts`, `server/api/health.get.ts` : Q-03)**: Endpoint `/api/ready` memeriksa status database PostgreSQL, jembatan internal Fastify `@shelfstack/order-service` via `pingOrderService()`, dan status Redis cache. Endpoint liveness probe `/api/health` melaporkan metadata proses dan semver secara real-time (+8 unit test di `tests/unit/health-readiness.spec.ts`).
    - **Akses Demo 1-Klik (`app/pages/auth/login.vue` : Q-04)**: Menghadirkan komponen `AuthDemoCredentialsBanner.vue` untuk pengisian instan akun Demo Pelanggan dan Demo Admin (+3 unit test di `tests/unit/auth-demo-banner.spec.ts`).
    - **Optimasi Core Web Vitals & Aksesibilitas WCAG 2.1 AA (`Q-05`)**: Dimensi gambar eksplisit dan `fetchpriority="high"` pada citra produk utama `ProductGallery.vue`, `loading="lazy"` pada thumbnail dan kategori `HomeFeaturedCategories.vue`, serta kontainer rasio aspek tetap untuk eliminasi Cumulative Layout Shift (CLS < 0.1).

27. **Rute Kategori Cantik SEO (`/c/[slug]` : C-06), Sinkronisasi E2E Demo Banner & Dokumentasi Portofolio (SELESAI 2026-11-07, v0.33.1).**
    - **Halaman Kategori Cantik SEO (`app/pages/c/[slug].vue` : C-06)**: Menghadirkan halaman etalase kategori terkurasi `/c/[slug]` (`tech`, `home`, `furniture`, `lifestyle`, `stationery`) dengan `useSeoMeta` dinamis, breadcrumb navigasi terhubung, badge kurasi resmi, grid `ProductList`, dan empty state ramah saat slug tidak terdaftar (+3 unit test di `tests/unit/category-slug-page.spec.ts`).
    - **Sinkronisasi E2E Playwright dengan Akun Demo (`LoginPage.ts`, `auth.spec.ts`)**: Memperbarui fallback kredensial otomatis pada Page Object Model ke `demo-customer@shelfstack.local` dan `demo-admin@shelfstack.local` serta menambah verifikasi otomasi browser untuk pengisian instan 1-klik banner demo pada `/auth/login`.
    - **Finalisasi Portofolio & Ekosistem Template GitHub**: Menambahkan suite template GitHub profesional lengkap di `.github/` (default PR, multi-scope PR feature/bugfix/hotfix/refactor/docs, issue templates bug/feature, dan `CONTRIBUTING.md`), serta memperbarui `README.md` dan `docs/BACKLOG.md`.

28. **Arsitektur Deep Modules, Standar Web Modern, dan Eliminasi Any Type (SELESAI 2026-11-08, v0.34.0).**
    - **Modularisasi Menyeluruh (Batas Komponen <= 300 Baris)**: Merestrukturisasi 100% file `.vue` dan `.ts` pada direktori `app/`, `server/`, dan `shared/` sehingga seluruhnya berada di bawah 300 baris kode melalui ekstraksi composable dan utilitas mendalam (`useOrderPaymentSync`, `useOrderPolling`, `useOrderTracking`, `order-presentation`, `checkout-pricing`, `coupon-math`, `payment-reconciliation`, `review-mutations`, `midtrans-refund`, `supabase-realtime`).
    - **Pengetikan Basis Data Ketat**: Mengeliminasi seluruh casting `as any` di layer backend dan client dengan menyelaraskan `database.types.ts` dengan skema migrasi terkini.
    - **Standar Web Modern**: Penerapan isolasi scroll CSS murni (`overscroll-behavior: contain`), `scrollbar-gutter: stable`, dan `font-size-adjust: from-font` pada root styling untuk pencegahan CLS.

29. **Elevasi Etalase Publik: Craftsmanship, Anti-Slop Copywriting, dan Ulasan Pembeli Terverifikasi (SELESAI 2026-11-08, v0.35.0).**
    - **Ulasan Pembeli Terverifikasi Nyata Database (`server/api/reviews/featured.get.ts` & `HomeReviews.vue`)**: Agregasi ulasan berating tinggi dari tabel `product_reviews` dan data pembeli nyata untuk showcase beranda.
    - **Copywriting Anti-Slop & Konversi Nilai Ganda (`HomePromoCTA.vue`)**: Penawaran voucher belanja pengguna baru dan akses instan ke panel pengelolaan toko bagi evaluator teknis.
    - **WCAG 2.1 AA & Zero CLS**: Target sentuh 44x44px dan dimensi gambar eksplisit.

30. **Portfolio Packaging, PWA Standalone Manifest, Dynamic Sitemap, dan SEO Structured Data (SELESAI 2026-11-08, v0.36.0).**
    - **PWA Web App Manifest Standalone (`public/site.webmanifest` & `nuxt.config.ts`)**: Konfigurasi manifest standar PWA lengkap (mode `standalone`, tema `#141414`, icon set 192/512) dan deklarasi OpenGraph global.
    - **Dynamic XML Sitemap & Crawl Directives (`server/routes/sitemap.xml.ts` & `public/robots.txt`)**: Rute Nitro dinamis `/sitemap.xml` yang melakukan query langsung atas produk aktif dan canonical route publik, didukung direktif `robots.txt` terarah.
    - **Schema.org/Product JSON-LD Rich Snippets (`app/pages/product/[id].vue`)**: Metadata terstruktur Google Search (nama, brand, SKU, harga, stok `InStock`/`OutOfStock`, kondisi `NewCondition`, dan `AggregateRating`).
    - **Indikator Ketahanan Jaringan Offline (`OfflineBanner.vue` & `app/layouts/default.vue`)**: Banner koneksi offline reaktif native tanpa dependensi berlebih.
    - **Quality Gate Suite**: 90 file test / 937 tests lolos 100% di Vitest, 14 test E2E Playwright lolos 100%, 0 lint error, dan nuxi typecheck EXIT 0.

---

## 📌 Inventaris Fitur Belum Diimplementasikan (Backlog Lanjutan)

Berikut adalah pencatatan resmi fitur etalase dan operasional yang saat ini **belum diimplementasikan** atau masih berupa placeholder:

1. ~~**Pusat Notifikasi (In-App Notification Center & Web Push)**~~:
   - Status: ✅ **SELESAI 2026-10-27** (Tabel `public.notifications`, migrasi `20261119000001_in_app_notifications.sql`, RLS multi-tenant strict, publikasi Supabase Realtime, endpoint Nitro GET/PATCH, store `useNotificationStore`, komponen `NotificationBell.vue` dengan popover dan unread badge, integrasi pemicu order transaksi otomatis, serta 16 unit test).
2. ~~**Wishlist System (Koleksi Produk Tersimpan)**~~:
   - Status: ✅ **SELESAI 2026-10-26** (Store persistent `useWishlistStore`, `WishlistButton.vue`, badge navbar, `/wishlist`, integrasi keranjang, sinkronisasi dua arah database Supabase, dan mitigasi hard refresh).
3. ~~**Kalkulator Ongkir & Integrasi Kurir Ekspedisi (Shipping & Logistics API)**~~:
   - Status: ✅ **SELESAI 2026-10-30** (SHF-SHP-01).
   - Keterangan: 4 tingkat opsi layanan pengiriman bertingkat (Reguler, Kilat Next Day, Instan Sameday, Kargo), kalkulasi ongkir server-side atomik di RPC `create_order`, promo otomatis Bebas Ongkir untuk Reguler belanja >= Rp 500.000, pemilihan kurir mitra (JNE, SiCepat, J&T, Anteraja, Pos), komponen `ShippingMethodSelector`, sinkronisasi Midtrans Snap, rincian biaya kirim di invoice, serta 32 unit test.
4. ~~**Lacak Pengiriman Ekspedisi (Courier Live Tracking)**~~:
   - Status: ✅ **SELESAI 2026-10-27** (SHF-LOG-01).
   - Keterangan: Kolom tracking pada `orders`, tabel riwayat `shipping_checkpoints`, RLS strict, publikasi realtime, utilitas generator resi & data masking privasi, modal admin fulfillment dengan pilihan kurir resmi, kartu linimasa pelacakan di `/orders/[id]`, halaman publik pencarian resi di `/tracking` yang terhubung dari navbar dan footer, serta 9 unit test di `tests/unit/shipping-tracking.spec.ts`.
5. ~~**Kupon Promo & Diskon (Voucher Codes & Auto-Discounts)**~~:
   - Status: ✅ **SELESAI 2026-10-28 & 2026-11-03** (SHF-VOUCHER & SHF-ADM-COUPON-01).
   - Keterangan: Tabel `public.coupons` dan `public.coupon_usages` dengan RLS strict, validasi dan penguncian kupon atomik (`FOR UPDATE`) di RPC `create_order`, endpoint validasi kode promo, penukaran voucher dengan koin loyalitas (`coin_cost`), komponen pemilihan voucher di keranjang dan checkout, serta panel manajemen kupon admin modular beserta riwayat pemakaian.
6. ~~**Pusat Bantuan & FAQ Interaktif (Help Center / FAQ Page)**~~:
   - Status: ✅ **SELESAI 2026-10-30** (Halaman `/help` interaktif dengan pencarian FAQ real-time, tab navigasi kategori via `UiTabs`, accordion yang dapat dibuka/tutup, integrasi URL hash `#pengembalian` dan `#pengiriman`, banner bantuan cepat dengan link ke `/tracking` dan `/contact`, serta 9 unit test di `tests/unit/help-page.spec.ts`).
7. ~~**Live Chat / Bantuan Pelanggan Langsung (Customer Support Chat)**~~:
   - Status: ✅ **SELESAI 2026-11-04** (SHF-CHAT-01).
   - Keterangan: Sistem Live Chat dua arah berbasis Supabase Realtime (tabel support_threads dan support_messages, trigger unread atomik, bucket chat-attachments maks 5MB), 8 endpoint Nitro API, composable useSupportChat & useAdminSupportChat (proteksi deduplikasi singleton realtime channel), floating widget etalase dengan login prompt ramah tamu, split-view dual-pane admin workspace di /admin/support dengan template balasan cepat, stempel jam (HH:mm), pemilih emotikon cepat, pratinjau lampiran gambar & lightbox, cuplikan kartu pesanan/produk, serta 83 file / 880 test lolos 100%.
8. ~~**Halaman Profil Perusahaan (Tentang Kami & Kontak)**~~:
   - Status: ✅ **SELESAI 2026-10-30** (Halaman kurasi `/about` dengan 4 strip metrik, 3 pilar komitmen rekayasa, dan CTA katalog; serta halaman `/contact` dengan informasi saluran resmi, formulir kontak interaktif tervalidasi via `UiInput`/`UiSelect`/`UiTextarea`, feedback toast, pembersihan form pasca-submit, tautan footer terintegrasi, dan 10 unit test di `tests/unit/contact-page.spec.ts` dan `tests/unit/about-page.spec.ts`).
9. ~~**Ulasan & Rating Pelanggan (Product Reviews & Ratings)**~~:
   - Status: ✅ **SELESAI 2026-10-30** (Tabel `public.product_reviews`, migrasi `20261122000001_product_reviews_and_ratings.sql`, trigger kalkulasi rating atomik pada tabel `products`, endpoint Nitro GET/POST/DELETE, validasi Zod tervalidasi, eligibility check pembeli pesanan berstatus `completed`, sensor inisial nama pengulas privasi `Budi S.` tanpa badge generik, komponen modular `ProductReviewsSection`, modal submit ulasan interaktif dengan rating bintang dan hitung karakter, tombol ulasan di rincian pesanan, filter rating bintang, dan 46 unit test lolos 100%).
10. ~~**Antrean Pekerja Latar Belakang (BullMQ Worker untuk Order Expiry Sweep)**~~:
    - Status: ✅ **SELESAI 2026-11-06** (Antrean `order-expiry` + `order-expiry-dlq` berbasis Redis 7 dan BullMQ v6 di `@shelfstack/order-service`, delayed job per order saat checkout secara fail-open, repeatable reconciliation sweep setiap 5 menit, exponential retry 3 percobaan, endpoint telemetri dan replay DLQ di `/admin/orders`, serta 25 unit test di `@shelfstack/order-service`).

## 📋 Catatan Teknis & Konvensi Wajib

- **Batas Baris:** Maksimal ~300 baris per file Vue.
- **Komponen Global:** Wajib gunakan `<UiButton>`, `<UiInput>`, `<UiBadge>`, `<UiCard>`. Dilarang menulis class Tailwind berulang.
- **Git Commit SOP:** Format `<type>: [AA] short description in English`. Jangan pernah gunakan `--no-verify`.
- **Database:** Eksekusi `supabase db push` setelah menambahkan migrasi SQL baru.
