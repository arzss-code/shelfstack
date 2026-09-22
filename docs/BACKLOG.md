# Backlog — ShelfStack

> Sumber kebenaran scope. Prioritas MoSCoW. Setiap story punya acceptance criteria (AC) yang bisa diuji.
> ID stabil: jangan ganti ID setelah sprint berjalan. Status awal semua `Todo`.

## Legenda

- **Must:** Portofolio tidak sah tanpa ini. Tidak boleh dicoret.
- **Should:** Sangat menaikkan nilai jual. Coret hanya jika sprint telat >1 minggu.
- **Could:** Pemanis. Kerjakan jika ada sisa kapasitas.
- **Out:** Eksplisit tidak dikerjakan 12 minggu ini (hindari scope creep).

## EPIC 0 — Foundation (Fase 0)

| ID    | Story                                                          | Prioritas | AC                                                               |
| ----- | -------------------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| F0-01 | Sebagai dev, saya regenerate `database.types.ts` bertipe penuh | Must      | `useSupabaseClient<Database>()`, tidak ada `any` di product flow |
| F0-02 | Sebagai dev, saya punya `seed.sql` + akun demo                 | Must      | `supabase db reset` menghasilkan 4 kategori, 8 produk, 2 user    |
| F0-03 | Sebagai dev, saya punya Zod server untuk products              | Must      | POST invalid → 400 dengan format `response.ts`, ada unit test    |
| F0-04 | Sebagai dev, saya migrasi store/repo ke `features/products/`   | Should    | Import lama jadi alias, tidak ada dual logic                     |
| F0-05 | Sebagai dev, saya rapikan README + CHANGELOG + version         | Must      | README tidak lagi bilang Nuxt 3                                  |

## EPIC 1 — Auth & Security (Fase 1)

| ID   | Story                                                | Prioritas | AC                                                                                            |
| ---- | ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| A-01 | Sebagai visitor, saya bisa register + login email    | Must      | Session persist refresh, error message jelas (email sudah dipakai, password lemah)            |
| A-02 | Sebagai visitor, saya bisa login Google OAuth        | Should    | Callback ke `/` + buat `profiles` otomatis via trigger                                        |
| A-03 | Sebagai customer, saya tidak bisa buka `/admin`      | Must      | Redirect + toast 403, middleware `admin.ts` + RLS double-check                                |
| A-04 | Sebagai dev, RLS products strict                     | Must      | Anon hanya SELECT `deleted_at IS NULL`; CUD admin only; buktikan via `curl` tanpa token → 403 |
| A-05 | Sebagai dev, RLS profiles/orders/activity strict     | Must      | Customer hanya baca miliknya; admin baca semua; anon tulis = 0                                |
| A-06 | Sebagai admin, saya upload gambar tanpa error policy | Must      | Storage `product-images` write admin only, 5MB, jpeg/png/webp, kompresi tetap jalan           |
| A-07 | Sebagai user, saya bisa lihat profil + logout        | Should    | `auth/me` konsisten client/server                                                             |

## EPIC 2 — Catalog Pro (Fase 2)

| ID   | Story                                                                                | Prioritas | AC                                                                                             |
| ---- | ------------------------------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------- |
| C-01 | Sebagai pembeli, saya cari + filter kategori + sort via URL                          | Must      | Refresh tidak hilang state; `GET /api/products?q=&cat=&sort=&from=&to=`; debounce 300ms        |
| C-02 | Sebagai pembeli, saya lihat badge stok                                               | Must      | `Habis` disabled, `Sisa <5` warning, data dari `stock` asli                                    |
| C-03 | Sebagai pembeli, saya buka detail SEO-friendly                                       | Must      | `useSeoMeta` + OG image, breadcrumb, related 4 produk                                          |
| C-04 | Sebagai pembeli mobile, katalog tetap enak                                           | Must      | Grid 1 kolom 375px, tidak ada elemen terpotong (lihat `TC-PRD-01.md` PRD-1-04)                 |
| C-05 | Sebagai dev, LCP <2.5s                                                               | Should    | `NuxtImg`, lazy, skeleton; ukur Lighthouse mobile                                              |
| C-06 | Sebagai pembeli, saya lihat kategori dengan slug cantik                              | Could     | `/c/minuman` alias query, tidak wajib                                                          |
| C-07 | Sebagai dev, schema Zod produk tunggal (hapus duplikat lokal `ProductForm.vue:6-20`) | Should    | `ProductForm` pakai `shared/schemas/product.ts`; aturan tampil (max 50 vs 120) disepakati satu |

## EPIC 3 — Cart & Orders (Fase 3)

| ID   | Story                                                        | Prioritas | AC                                                                                           |
| ---- | ------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------------- |
| K-01 | Sebagai pembeli, saya tambah/ubah/hapus cart persisten       | Must      | Refresh tidak hilang (localStorage), badge navbar update realtime                            |
| K-02 | Sebagai pembeli, saya checkout dengan alamat tervalidasi     | Must      | Zod alamat; stok dicek server; gagal stok → error jelas per item                             |
| K-03 | Sebagai sistem, checkout atomik via RPC                      | Must      | `create_order()` 1 transaksi: insert order+items, decrement stock, rollback jika stok kurang |
| K-04 | Sebagai pembeli, saya bayar simulasi + lihat status realtime | Must      | `pending→paid` mock; channel `orders:user_<id>` update tanpa refresh                         |
| K-05 | Sebagai pembeli, saya lihat riwayat + detail order           | Must      | `/orders`, `/orders/[id]` hanya milik sendiri (RLS buktikan)                                 |
| K-06 | Sebagai pembeli, saya batalkan order pending                 | Should    | `pending→cancelled`, stok dikembalikan via RPC                                               |

## EPIC 4 — Admin Ops (Fase 4)

| ID   | Story                                             | Prioritas | AC                                                                                  |
| ---- | ------------------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| D-01 | Sebagai admin, saya lihat KPI dashboard           | Must      | Revenue bulan ini, order pending, low-stock, tabel order terbaru                    |
| D-02 | Sebagai admin, saya ubah status order valid       | Must      | Hanya transisi legal; setiap perubahan tulis `activity_logs` + realtime ke customer |
| D-03 | Sebagai admin, saya CRUD produk + kategori + stok | Must      | Reuse `ProductForm.vue` + field baru; trash/restore tetap jalan                     |
| D-04 | Sebagai admin, saya audit aktivitas               | Should    | Filter entity/action, diff `old_data/new_data`                                      |
| D-05 | Sebagai admin, saya export CSV order              | Could     | Filter tanggal + status                                                             |

## EPIC 5 — Quality & Launch (Fase 5)

| ID   | Story                                             | Prioritas | AC                                                                                                 |
| ---- | ------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| Q-01 | Sebagai dev, CI hijau                             | Must      | `lint → typecheck → vitest → playwright → preview` di `.github/workflows/ci.yml` (sekarang kosong) |
| Q-02 | Sebagai dev, coverage kritis                      | Should    | Unit schema/store/RPC mock + e2e happy path + 403 path                                             |
| Q-03 | Sebagai visitor, saya buka demo live cepat + aman | Must      | Vercel + Supabase Cloud, header `nuxt-security`, `/api/version` OK                                 |
| Q-04 | Sebagai perekrut, saya paham repo dalam 3 menit   | Must      | README baru + GIF + arsitektur diagram + akun demo (lihat `PORTFOLIO-PACKAGING.md`)                |
| Q-05 | Sebagai dev, saya ukur a11y + perf                | Should    | Lighthouse ≥90 perf/a11y/best-practice, tab order logis                                            |

## Out of Scope (12 minggu ini)

- Payment gateway real (Midtrans/Stripe live), multi-vendor, kupon/ongkir real, i18n penuh, microservices, mobile native, AI recommendation. Alasan: memperbesar risiko tanpa menaikkan sinyal Fullstack secara proporsional. Payment = mock/sandbox saja.
