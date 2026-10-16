# Progress Tracker — ShelfStack (Product Management)

> **Catatan Status Proyek:** Dokumen ini adalah sumber kebenaran terkini mengenai progress implementasi fitur, status sprint, dan milestone yang telah dicapai. **Setiap agen AI WAJIB membaca dokumen ini sebelum mulai bekerja.**

---

## 📌 Status Terkini

- **Sprint Aktif:** **Sprint 6 (Quality & Launch)** — Fase 4 selesai fungsional, sisa Fase 5
- **Versi Rilis:** `v0.15.0` (`version.json`, `CHANGELOG.md` — sinkron 2026-10-11)
- **Baseline Quality Gate (2026-10-11, dijalankan aktual):** `pnpm lint` ✅ 0 error / 32 warning (`vue/html-self-closing`) · `vitest run` ✅ 33 file / 318 test lolos (+8 regression test baru) · ⚠️ `pnpm typecheck` (`vue-tsc --noEmit`) terbukti **vacuous** (memeriksa 0 file, selalu EXIT 0) — jangan jadikan bukti. Pemeriksa real adalah `pnpm exec nuxi typecheck`, yang saat ini MERAH (lihat Known Gaps no. 6).
- **Keputusan Arsitektur:**
  - Model Bisnis: **Single-Vendor E-Commerce** (ShelfStack sebagai penjual kurasi resmi)
  - Payment Gateway: **Midtrans Sandbox** (metode Snap Popup/Redirect; BUKAN mock — tidak ada lapisan mock di kode)
  - UI Language: **Bahasa Indonesia** konsisten di seluruh etalase publik
  - Realtime Engine: **Supabase Realtime** (Postgres Changes untuk order tracking) + polling sync 3.5–4s untuk order `pending`
  - Deployment Target: **Docker + Nginx** (multi-stage build, `deploy/docker-compose.prod.yml`; Vercel tidak lagi jadi target)

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
- [ ] **Packaging portofolio** (README baru + GIF + diagram + akun demo — lihat `docs/PORTFOLIO-PACKAGING.md`).
- [ ] **Lighthouse ≥90** perf/a11y (belum diukur — jangan klaim).

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

---

## 📋 Catatan Teknis & Konvensi Wajib

- **Batas Baris:** Maksimal ~300 baris per file Vue.
- **Komponen Global:** Wajib gunakan `<UiButton>`, `<UiInput>`, `<UiBadge>`, `<UiCard>`. Dilarang menulis class Tailwind berulang.
- **Git Commit SOP:** Format `<type>: [AA] short description in English`. Jangan pernah gunakan `--no-verify`.
- **Database:** Eksekusi `supabase db push` setelah menambahkan migrasi SQL baru.
