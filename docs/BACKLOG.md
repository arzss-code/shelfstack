# Backlog — ShelfStack

> Sumber kebenaran scope. Prioritas MoSCoW. Setiap story punya acceptance criteria (AC) yang bisa diuji.
> ID stabil: jangan ganti ID setelah sprint berjalan. Status awal semua `Todo`.
> Status pengerjaan riil ada di `PROGRESS.md` (termasuk "Known Gaps" hasil audit 2026-10-11 untuk F0-01/F0-02).

## Legenda

- **Must:** Portofolio tidak sah tanpa ini. Tidak boleh dicoret.
- **Should:** Sangat menaikkan nilai jual. Coret hanya jika sprint telat >1 minggu.
- **Could:** Pemanis. Kerjakan jika ada sisa kapasitas.
- **Out:** Eksplisit tidak dikerjakan 12 minggu ini (hindari scope creep).

## EPIC 0 — Foundation (Fase 0)

| ID    | Story                                                          | Prioritas | AC                                                                                                                                                                                                           |
| ----- | -------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F0-01 | Sebagai dev, saya regenerate `database.types.ts` bertipe penuh | Must      | `useSupabaseClient<Database>()`, tidak ada `any` di product flow                                                                                                                                             |
| F0-02 | Sebagai dev, saya punya `seed.sql` + akun demo                 | Must      | ✅ SELESAI (2026-11-07, v0.33.0): `seed.sql` lengkap dengan 5 kategori, 5 produk, 2 akun demo, 3 kupon, 5 pesanan lifecycle, resi kurir, ulasan bintang 5, komplain retur, support live chat, dan notifikasi |
| F0-03 | Sebagai dev, saya punya Zod server untuk products              | Must      | POST invalid → 400 dengan format `response.ts`, ada unit test                                                                                                                                                |
| F0-04 | Sebagai dev, saya migrasi store/repo ke `features/products/`   | Should    | Import lama jadi alias, tidak ada dual logic                                                                                                                                                                 |
| F0-05 | Sebagai dev, saya rapikan README + CHANGELOG + version         | Must      | README tidak lagi bilang Nuxt 3                                                                                                                                                                              |

## EPIC 1 — Auth & Security (Fase 1)

| ID   | Story                                                | Prioritas | AC                                                                                                                                                                  |
| ---- | ---------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01 | Sebagai visitor, saya bisa register + login email    | Must      | Session persist refresh, error message jelas (email sudah dipakai, password lemah)                                                                                  |
| A-02 | Sebagai visitor, saya bisa login Google OAuth        | Should    | ✅ SELESAI (2026-11-09, v0.37.1): Alur OAuth Google tangguh di `/auth/callback` dengan 5 status UI, penanganan error provider, retry profile fetch, dan 7 unit test |
| A-03 | Sebagai customer, saya tidak bisa buka `/admin`      | Must      | Redirect + toast 403, middleware `admin.ts` + RLS double-check                                                                                                      |
| A-04 | Sebagai dev, RLS products strict                     | Must      | Anon hanya SELECT `deleted_at IS NULL`; CUD admin only; buktikan via `curl` tanpa token → 403                                                                       |
| A-05 | Sebagai dev, RLS profiles/orders/activity strict     | Must      | Customer hanya baca miliknya; admin baca semua; anon tulis = 0                                                                                                      |
| A-06 | Sebagai admin, saya upload gambar tanpa error policy | Must      | Storage `product-images` write admin only, 5MB, jpeg/png/webp, kompresi tetap jalan                                                                                 |
| A-07 | Sebagai user, saya bisa lihat profil + logout        | Should    | `auth/me` konsisten client/server                                                                                                                                   |

## EPIC 2 — Catalog Pro (Fase 2)

| ID   | Story                                                                                | Prioritas | AC                                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C-01 | Sebagai pembeli, saya cari + filter kategori + sort via URL                          | Must      | Refresh tidak hilang state; `GET /api/products?q=&cat=&sort=&from=&to=`; debounce 300ms                                                                |
| C-02 | Sebagai pembeli, saya lihat badge stok                                               | Must      | `Habis` disabled, `Sisa <5` warning, data dari `stock` asli                                                                                            |
| C-03 | Sebagai pembeli, saya buka detail SEO-friendly                                       | Must      | `useSeoMeta` + OG image, breadcrumb, related 4 produk                                                                                                  |
| C-04 | Sebagai pembeli mobile, katalog tetap enak                                           | Must      | Grid 1 kolom 375px, tidak ada elemen terpotong (lihat tests/e2e/product.spec.ts)                                                                       |
| C-05 | Sebagai dev, LCP <2.5s                                                               | Should    | `NuxtImg`, lazy, skeleton; ukur Lighthouse mobile                                                                                                      |
| C-06 | Sebagai pembeli, saya lihat kategori dengan slug cantik                              | Could     | ✅ SELESAI (2026-11-07, v0.33.1): Halaman SEO-friendly `/c/[slug]` dengan dynamic `useSeoMeta`, breadcrumb, dan grid produk terfilter                  |
| C-07 | Sebagai dev, schema Zod produk tunggal (hapus duplikat lokal `ProductForm.vue:6-20`) | Should    | ✅ SELESAI (2026-11-06): `useProductForm.ts` mengimpor `productFormSchema` langsung dari `shared/schemas/product.ts` (batas nama 120 karakter seragam) |

## EPIC 3 — Cart & Orders (Fase 3)

| ID   | Story                                                                    | Prioritas | AC                                                                                           |
| ---- | ------------------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------- |
| K-01 | Sebagai pembeli, saya tambah/ubah/hapus cart persisten                   | Must      | Refresh tidak hilang (localStorage), badge navbar update realtime                            |
| K-02 | Sebagai pembeli, saya checkout dengan alamat tervalidasi                 | Must      | Zod alamat; stok dicek server; gagal stok → error jelas per item                             |
| K-03 | Sebagai sistem, checkout atomik via RPC                                  | Must      | `create_order()` 1 transaksi: insert order+items, decrement stock, rollback jika stok kurang |
| K-04 | Sebagai pembeli, saya bayar via Midtrans Sandbox + lihat status realtime | Must      | `pending→paid` via Snap sandbox; channel realtime update tanpa refresh                       |
| K-05 | Sebagai pembeli, saya lihat riwayat + detail order                       | Must      | `/orders`, `/orders/[id]` hanya milik sendiri (RLS buktikan)                                 |
| K-06 | Sebagai pembeli, saya batalkan order pending                             | Should    | `pending→cancelled`, stok dikembalikan via RPC                                               |

## EPIC 4 — Admin Ops (Fase 4)

| ID   | Story                                             | Prioritas | AC                                                                                  |
| ---- | ------------------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| D-01 | Sebagai admin, saya lihat KPI dashboard           | Must      | Revenue bulan ini, order pending, low-stock, tabel order terbaru                    |
| D-02 | Sebagai admin, saya ubah status order valid       | Must      | Hanya transisi legal; setiap perubahan tulis `activity_logs` + realtime ke customer |
| D-03 | Sebagai admin, saya CRUD produk + kategori + stok | Must      | Reuse `ProductForm.vue` + field baru; trash/restore tetap jalan                     |
| D-04 | Sebagai admin, saya audit aktivitas               | Should    | Filter entity/action, diff `old_data/new_data`                                      |
| D-05 | Sebagai admin, saya export CSV order              | Could     | Filter tanggal + status                                                             |

## EPIC 5 — Quality & Launch (Fase 5)

| ID   | Story                                                     | Prioritas | AC                                                                                                                                                                                     |
| ---- | --------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-01 | Sebagai dev, CI hijau                                     | Must      | `lint → typecheck → vitest → docker compose validate` di `.github/workflows/ci.yml` (sudah ada; pastikan tetap hijau)                                                                  |
| Q-02 | Sebagai dev, coverage kritis                              | Should    | Unit schema/store/RPC mock + e2e happy path + 403 path                                                                                                                                 |
| Q-03 | Sebagai visitor, saya buka demo live cepat + aman         | Must      | ✅ SELESAI (2026-11-07, v0.33.0): Health and readiness telemetry (`/api/ready`, `/api/health`, `/healthz`) dengan dependency reporting PostgreSQL, Redis, dan Order Service            |
| Q-04 | Sebagai perekrut, saya paham repo dalam 3 menit           | Must      | ✅ SELESAI (2026-11-06 & 2026-11-07): `README.md` dengan diagram Mermaid, indeks ADR, serta tombol 1-Klik Akses Demo Akun Pelanggan & Admin di `/auth/login`                           |
| Q-05 | Sebagai dev, saya ukur a11y + perf                        | Should    | ✅ SELESAI (2026-11-07, v0.33.0): Dimensi gambar eksplisit, `fetchpriority="high"` untuk LCP, `loading="lazy"` offscreen, eliminasi CLS (< 0.1), dan standar target sentuh WCAG 2.1 AA |
| Q-06 | Sebagai dev, saya punya suite load testing k6 reproduktif | Must      | ✅ SELESAI (2026-11-09, v0.37.0): Skenario catalog, checkout concurrency, webhook dedup, health probe, runner CLI `pnpm test:load`, dan 8 unit test                                    |

## Out of Scope & Backlog Lanjutan (Belum Diimplementasikan)

Fitur berikut tercatat resmi belum diimplementasikan pada siklus berjalan (alasan: menjaga fokus pada integritas data transaksional, auth strict, dan arsitektur etalase):

1. ~~**Pusat Notifikasi**~~: ✅ **SELESAI 2026-10-27** (Tabel `public.notifications`, RLS multi-tenant, publikasi Supabase Realtime, `useNotificationStore`, dan `NotificationBell.vue`; catatan: Web Push belum diimplementasikan).
2. ~~**Wishlist**~~: ✅ **SELESAI 2026-10-26** (Penyimpanan favorit persisten `useWishlistStore`, `WishlistButton.vue`, badge navbar, `/wishlist`, dan integrasi keranjang).
3. ~~**Kalkulator Ongkir & Logistik**~~: ✅ **SELESAI 2026-10-30** (SHF-SHP-01: 4 tingkat layanan pengiriman bertingkat, kalkulasi ongkir server-side di RPC `create_order`, promo Bebas Ongkir belanja >= Rp 500.000, komponen `ShippingMethodSelector`, dan unit tests).
4. ~~**Lacak Pengiriman Ekspedisi**~~: ✅ **SELESAI 2026-10-27** (SHF-LOG-01: Nomor resi kurir resmi, tabel `shipping_checkpoints` realtime, linimasa pelacakan di `/orders/[id]`, dan halaman pencarian resi publik `/tracking`).
5. ~~**Kupon Promo & Voucher**~~: ✅ **SELESAI 2026-10-28 & 2026-11-03** (SHF-VOUCHER & SHF-ADM-COUPON-01: Tabel `coupons` & `coupon_usages`, penguncian atomik di RPC `create_order`, penukaran koin, pemilih voucher di keranjang/checkout, serta manajemen kupon admin).
6. ~~**Pusat Bantuan & FAQ**~~: ✅ **SELESAI 2026-10-30** (Halaman `/help` interaktif, tab kategori via `UiTabs`, pencarian FAQ, dan kebijakan pengembalian mandiri).
7. ~~**Live Chat CS**~~: ✅ **SELESAI 2026-11-04** (SHF-CHAT-01: Sistem Live Chat dua arah berbasis Supabase Realtime, widget etalase, lampiran foto/pesanan/produk, dan ruang kerja inbox admin `/admin/support`).
8. ~~**Halaman Perusahaan**~~: ✅ **SELESAI 2026-10-30** (Halaman kurasi `/about` dan formulir kontak interaktif `/contact` dengan validasi Zod).
9. ~~**Ulasan & Rating Pelanggan**~~: ✅ **SELESAI 2026-10-30** (Tabel `public.product_reviews`, database trigger `recalculate_product_rating()`, endpoint Nitro GET/POST/DELETE, sensor privasi nama depan dan inisial `Budi S.`, modal ulasan interaktif pada order selesai dan detail produk, serta 46 unit test).
10. ~~**Infrastruktur BullMQ**~~: ✅ **SELESAI 2026-11-06** (Antrean `order-expiry` delayed per-order + repeatable reconciliation sweep 5 menit + exponential backoff retry + Dead Letter Queue `order-expiry-dlq` di `@shelfstack/order-service`, serta pemantauan & replay DLQ di panel admin `/admin/orders`).
11. **Payment Gateway Live**: Transaksi nyata menggunakan kartu kredit/kartu debit live (saat ini Midtrans Sandbox).
