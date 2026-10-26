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
9. **Fix checkout premature empty state flash (SELESAI 2026-10-26).** Pada saat checkout berhasil membuat order di backend dan mengosongkan keranjang di store, template checkout sebelumnya langsung menampilkan empty state "Keranjang Belanja Kosong" sebelum popup Snap Midtrans muncul. Diperbaiki dengan state `isOrderPlaced` dan snapshot keranjang terisolasi (`placedOrderSnapshot`), sehingga rincian item pesanan tetap utuh dan formulir beralih ke state persiapan pembayaran dengan mulus (+3 unit test di `tests/unit/checkout-transition.spec.ts`).
10. **Fix order detail polling flicker, stepper timeline UX, and remove slop badge (SELESAI 2026-10-26).** Di halaman `/orders/[id]`, sinkronisasi status pembayaran background polling setiap 3.5 detik sebelumnya menggunakan satu variabel `isCheckingStatus` yang terikat pada disabled/loading state tombol aksi, sehingga tombol berkedip aktif/nonaktif secara mengganggu. Masalah diperbaiki dengan memisahkan `isSilentChecking` (background polling) dan `isManualChecking` (tombol Cek Status oleh pengguna). Komponen stepper alur transaksi yang sebelumnya polos dan terputus diganti dengan visual timeline terhubung yang informatif, adaptif terhadap status pesanan, serta badge "Realtime Status Aktif" dibersihkan.
11. **Migrasi Dropdown Bawaan ke Primitif Kustom UiSelect (SELESAI 2026-10-26).** Audit seluruh dropdown form dan filter di halaman katalog, form produk, serta panel admin. Komponen native `<select>` diganti dengan `<UiSelect>` kustom yang ramah aksesibilitas keyboard (Arrows, Enter, Escape, Space), mendukung prefix, pencarian, dan penataan z-index terisolasi (`isolation: isolate` pada kartu produk) agar popover tidak tertabrak badge produk (+9 unit test di `tests/unit/ui-select.spec.ts`).
12. **Penyempurnaan Alur dan Tampilan Pesanan Pelanggan (SELESAI 2026-10-26).** Tab filter status pesanan pada `/orders` dibuat full-width responsif tanpa indikator scrollbar visual. Daftar pesanan diekstrak ke `OrderCard.vue` dengan pemisahan aksi Bayar langsung (Snap Popup) dan Detail. Di halaman `/orders/[id]`, pembatalan pesanan terhubung dengan restock atomik RPC, penayangan alasan pembatalan dan timestamp transparan, tombol aksi "Beli Lagi" yang memasukkan item kembali ke keranjang belanja, pembatasan akses cetak invoice hanya untuk status lunas/dikirim/selesai, serta pembersihan type casting `as any` (+10 unit test gabungan di `tests/unit/orders-card.spec.ts` dan `tests/unit/orders-detail-actions.spec.ts`).
13. **Unifikasi Desain & Geometri Etalase Publik (SELESAI 2026-10-26).** Penyatuan geometri radius (`rounded-card`, `rounded-field`), pembersihan seluruh warna legasi hardcoded (`slate-*`, `zinc-*`, `rose-*`, `emerald-*`) menjadi token semantik brand (`bg-brand-canvas`, `bg-brand-canvas-soft`, `text-brand-ink`, `text-brand-muted`, `brand-danger`, `brand-success`, `brand-warning`), eliminasi 7 warning ESLint `vue/html-self-closing` pada void element `<img/>` dan `<input/>` di komponen etalase publik (`ProductCard`, `ProductGallery`, `ProductConfigurator`, `CartDrawer`, `cart.vue`, `KatalogMobileFilter`, `AppNavbar`), serta sinkronisasi dark mode otomatis melalui CSS variables terpusat.
14. **Redesign Split Layout Halaman Login & Register (SELESAI 2026-10-26).** Transformasi tampilan autentikasi menjadi layout split 2-kolom: kolom kiri memuat visual arsitektural kurasi ShelfStack dan logo resmi, kolom kanan memuat formulir kompak yang pas di viewport tanpa scroll vertikal berlebih pada desktop. Seluruh badge/icon trust redundan ('Belanja Aman • Privasi Terjaga') dihapus. Penambahan fitur show/hide password toggle interaktif pada input kata sandi yang ramah aksesibilitas (+4 unit test di `tests/unit/auth-redesign.spec.ts`).
15. **Pencapaian 100% Zero ESLint Warnings (SELESAI 2026-10-26).** Seluruh 16 sisa warning pre-existing `vue/html-self-closing` pada void element `<img/>`, `<input/>`, dan `<br/>` di komponen `AppNavbar.vue`, `HomeHero.vue`, `HomeFeaturedCategories.vue`, `HomeFlashDeals.vue`, `UiFileField.vue`, `OrderCancelDialog.vue`, `OrderInvoiceModal.vue`, dan `admin/orders/[id].vue` telah dibersihkan secara tuntas. Perintah `pnpm lint` kini menghasilkan output bersih: 0 problems (0 errors, 0 warnings).
16. **Wishlist System Lengkap (SELESAI 2026-10-26).** Implementasi Pinia store persistent `shelfstack-wishlist` (`useWishlistStore`), tombol love interaktif `WishlistButton` di kartu produk (`ProductCard`) dan halaman konfigurasi detail (`ProductConfigurator`), dynamic badge counter pada ikon hati di `AppNavbar` (desktop dan menu mobile), halaman mandiri `/wishlist` dengan grid koleksi tersimpan, aksi "Pindahkan ke Bag" per item maupun kolektif (`moveAllToCart`) dengan filter stok habis, toast notifikasi, serta 9 unit test komprehensif di `tests/unit/wishlist-store.spec.ts`.

---

## 📌 Inventaris Fitur Belum Diimplementasikan (Backlog Lanjutan)

Berikut adalah pencatatan resmi fitur etalase dan operasional yang saat ini **belum diimplementasikan** atau masih berupa placeholder:

1. **Pusat Notifikasi (In-App Notification Center & Web Push)**:
   - Status: Belum diimplementasikan.
   - Keterangan: Belum ada tabel database `notifications`, endpoint `/api/notifications`, maupun ikon lonceng notifikasi di header navbar untuk pembaruan pesanan/sistem. Notifikasi saat ini hanya berupa toast lokal (`useUiToast`).
2. ~~**Wishlist System (Koleksi Produk Tersimpan)**~~:
   - Status: ✅ **SELESAI 2026-10-26** (Store persistent `useWishlistStore`, `WishlistButton.vue`, badge navbar, `/wishlist`, integrasi keranjang, sinkronisasi dua arah database Supabase, dan mitigasi hard refresh).
3. **Kalkulator Ongkir & Integrasi Kurir Ekspedisi (Shipping & Logistics API)**:
   - Status: Belum diimplementasikan (masih flat / gratis ongkir statis).
   - Keterangan: Belum terhubung dengan API kurir logistik (RajaOngkir, Biteship, JNE, SiCepat, J&T). Belum ada field berat barang (`weight_grams`), kalkulasi jarak antar-kota, maupun pilihan jenis layanan (Instan, Reguler, Kargo).
4. **Lacak Pengiriman Ekspedisi (Courier Live Tracking)**:
   - Status: Belum diimplementasikan.
   - Keterangan: Alur pesanan saat ini hanya melacak status siklus hidup internal (`pending`, `paid`, `shipped`, `delivered`). Belum ada field nomor resi (`tracking_number`), kurir, maupun linimasa perpindahan paket antar-hub. Link "Lacak Pesanan" di navbar dan footer masih berupa placeholder ke `/katalog`.
5. **Kupon Promo & Diskon (Voucher Codes & Auto-Discounts)**:
   - Status: Belum diimplementasikan.
   - Keterangan: Belum ada modul voucher (tabel `coupons`, input kode promo di keranjang/checkout, validasi kuota klaim, dan potongan harga dinamis). Diskon saat ini hanya potongan langsung berbasis kolom produk (`original_price_cents`).
6. **Pusat Bantuan & FAQ Interaktif (Help Center / FAQ Page)**:
   - Status: Belum diimplementasikan.
   - Keterangan: Belum ada halaman `/help` atau `/faq` mandiri. Link "Pusat Bantuan", "Kebijakan Pengembalian", dan "Informasi Pengiriman" di navbar atas dan footer masih dialihkan ke `/katalog`.
7. **Live Chat / Bantuan Pelanggan Langsung (Customer Support Chat)**:
   - Status: Belum diimplementasikan.
   - Keterangan: Belum ada widget live chat (Tawk.to, Crisp, webhook WhatsApp CS, atau chat real-time interaktif berbasis Supabase). Teks di footer hanya label statis.
8. **Halaman Profil Perusahaan (Tentang Kami, Kontak, Karier)**:
   - Status: Belum diimplementasikan.
   - Keterangan: Belum ada rute halaman `/about`, `/contact`, atau `/careers`. Link di footer saat ini masih mengarah ke `/katalog`.
9. **Ulasan & Rating Pelanggan (Product Reviews & Ratings)**:
   - Status: Belum diimplementasikan.
   - Keterangan: Belum ada tabel `product_reviews`, sistem submit ulasan pasca-pesanan selesai, maupun agregasi rating bintang pelanggan nyata (bintang statis sebelumnya telah dibersihkan demi integritas data).
10. **Antrean Pekerja Latar Belakang (BullMQ Worker untuk Order Expiry Sweep)**:
    - Status: Belum diimplementasikan.
    - Keterangan: Pembatalan pesanan kedaluwarsa saat ini masih dijalankan via direct sweep endpoint berkala, belum menggunakan Redis BullMQ dengan antrean DLQ (Dead Letter Queue).

## 📋 Catatan Teknis & Konvensi Wajib

- **Batas Baris:** Maksimal ~300 baris per file Vue.
- **Komponen Global:** Wajib gunakan `<UiButton>`, `<UiInput>`, `<UiBadge>`, `<UiCard>`. Dilarang menulis class Tailwind berulang.
- **Git Commit SOP:** Format `<type>: [AA] short description in English`. Jangan pernah gunakan `--no-verify`.
- **Database:** Eksekusi `supabase db push` setelah menambahkan migrasi SQL baru.
