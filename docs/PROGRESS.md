# Progress Tracker — ShelfStack (Product Management)

> **Catatan Status Proyek:** Dokumen ini adalah sumber kebenaran terkini mengenai progress implementasi fitur, status sprint, dan milestone yang telah dicapai. **Setiap agen AI WAJIB membaca dokumen ini sebelum mulai bekerja.**

---

## 📌 Status Terkini

- **Sprint Aktif:** Transisi dari **Sprint 3 (Katalog Pro)** menuju **Sprint 4 (Cart & Checkout)**
- **Versi Rilis:** `v0.11.0-s3` (Roadmap Target: 6 Sprint / 12 Minggu)
- **Keputusan Arsitektur:**
  - Model Bisnis: **Single-Vendor E-Commerce** (ShelfStack sebagai penjual kurasi resmi)
  - Payment Gateway: **Midtrans Sandbox** (metode Snap Popup/Redirect)
  - UI Language: **Bahasa Indonesia** konsisten di seluruh etalase publik
  - Realtime Engine: **Supabase Realtime** (Postgres Changes untuk order tracking)
  - Deployment Target: **Vercel** (SSR Nuxt 4 native)

---

## 🚀 Riwayat Kemajuan per Fase

### ✅ Fase 0: Foundation & Hygiene (Sprint 1)

- [x] Konfigurasi Nuxt 4, TypeScript, Tailwind CSS, PrimeVue, dan Vitest.
- [x] Database types Supabase terintegrasi (`app/types/database.types.ts`).
- [x] Migrasi FSD: repositori dan store terpusat di `app/features/products/`.
- [x] Validasi server produk menggunakan Zod schema dengan unit test lengkap (`tests/unit/`).

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

## 📋 Catatan Teknis & Konvensi Wajib

- **Batas Baris:** Maksimal ~300 baris per file Vue.
- **Komponen Global:** Wajib gunakan `<UiButton>`, `<UiInput>`, `<UiBadge>`, `<UiCard>`. Dilarang menulis class Tailwind berulang.
- **Git Commit SOP:** Format `<type>: [AA] short description in English`. Jangan pernah gunakan `--no-verify`.
- **Database:** Eksekusi `supabase db push` setelah menambahkan migrasi SQL baru.
