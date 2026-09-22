# Portfolio Plan — product-management → ShelfStack

> Master plan. Status: Fullstack E-Commerce, Deep-dive 2–3 bulan (12 minggu / 6 sprint).
> Dokumen pendamping: `SPRINT-PLAN.md`, `BACKLOG.md`, `PHASE-0..5-*.md`, `ADR/`, `PORTFOLIO-PACKAGING.md`.
> Dokumen lama tetap berlaku: `PRD-ECOMMERCE.md`, `SOW-ECOMMERCE.md`, `DESIGN-ECOMMERCE.md`, `ARCHITECTURE.md`, `DESIGN.md`.

## 1. Visi & Positioning

**Dari:** "Aplikasi frontend kelola katalog internal" (`README.md` saat ini).

**Ke:** **ShelfStack — Fullstack Mini E-Commerce (Nuxt 4 + Supabase).**

Satu repo membuktikan satu alur end-to-end:

```
DB schema (Supabase) → RLS → Server API (Nuxt) → State (Pinia) → UI (PrimeVue+Tailwind) → Realtime → Test → CI → Deploy (Vercel)
```

**Narasi portofolio (pakai kalimat ini di CV/LinkedIn):**

> Membangun ShelfStack, mini e-commerce fullstack: storefront publik + admin dashboard + auth RBAC + checkout transaksional + realtime, dengan Nuxt 4, Supabase (Postgres/RLS/Storage/Realtime), Zod, Vitest & Playwright, deploy di Vercel dengan CI hijau.

**Kenapa ini relevan 2026:**

- Nuxt 4 + Vue 3.5 Composition API + `<script setup>` = standar hiring frontend Vue.
- Supabase (Postgres + Auth + RLS + Storage + Realtime) = BaaS paling dicari untuk MVP fullstack tanpa DevOps berat.
- Zod validasi client + server, `@nuxt/image`, `nuxt-security`, Pinia persist, Vitest + Playwright, GitHub Actions + Vercel = checklist "production-ready" yang perekrut cek.

## 2. Kondisi Awal (Audit 2026-09-18)

### 2.1 Yang sudah kuat — jangan dibuang

| Area                            | Bukti                                                                                                                          | Keputusan                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Stack modern                    | `package.json`: Nuxt `4.5.2`, PrimeVue `4.5.5` Aura, Pinia `4`, Supabase JS `2.112`, Zod `4.4`, `nuxt-security`, `@nuxt/image` | Pertahankan, upgrade minor saja                       |
| CRUD + soft-delete/restore      | `app/stores/product.ts:182-226`, `app/pages/index.vue:200-256` tab Aktif/Sampah                                                | Pertahankan, pindah ke feature folder                 |
| Upload + kompresi WebP          | `app/utils/image.ts`, `app/repository/product.ts:73-96`                                                                        | Pertahankan, tambah policy storage                    |
| Pagination load-more `limit 12` | `app/stores/product.ts:12-14,17-47`                                                                                            | Pertahankan sementara, ganti URL pagination di Fase 2 |
| Activity Log realtime           | `supabase/migrations/20260818100747_activity_logs.sql`, `app/features/activities/`                                             | Pertahankan, jadikan audit trail admin                |
| Dark mode + Toast + Confirm     | `app/app.vue:13-14`, `nuxt.config.ts:41-56`                                                                                    | Pertahankan                                           |
| Server API pattern              | `server/api/products/index.ts`, `server/utils/response.ts`                                                                     | Pertahankan, tambah Zod + auth guard                  |
| Test awal                       | `tests/unit/api-products.spec.ts`, `tests/e2e/home.spec.ts`, `product.spec.ts`                                                 | Pertahankan, tambah coverage                          |

### 2.2 Gap kritis (wajib tutup untuk klaim Fullstack)

1. **RLS terbuka.** `supabase/migrations/20260818043330_init_products.sql:23-32` pakai `USING(true)` untuk semua operasi. `activity_logs` juga `WITH CHECK(true)`. Tidak boleh live seperti ini.
2. **Belum ada domain e-commerce.** Belum ada `profiles`, `categories`, `orders`, `order_items` sesuai `DESIGN-ECOMMERCE.md:17-22`. Belum ada Auth, cart, checkout.
3. **Satu layout.** `app/layouts/default.vue` saja. Belum ada `admin.vue` + middleware RBAC.
4. **FSD-lite setengah jalan.** `app/stores/product.ts` + `app/repository/product.ts` masih di luar `app/features/products/` melanggar `ARCHITECTURE.md:13-16`.
5. **CI kosong.** `.github/workflows/` kosong. `README.md` masih bilang Nuxt 3, tanpa demo link.
6. **Katalog belum pro.** Filter di `app/pages/index.vue:22-27` masih `includes()` client-side. Belum ada `stock`, `category_id`, SEO, `NuxtImg`.

## 3. Arsitektur Target

```
app/
  features/
    products/  # schema.ts, stores/product.ts, repository/product.ts, composables/useProducts.ts, components/*
    auth/      # composables/useAuth.ts, components/LoginForm.vue, RegisterForm.vue
    cart/      # stores/cart.ts, composables/useCart.ts, components/CartDrawer.vue
    orders/    # schema.ts, composables/useOrders.ts, components/*
    categories/# kecil: composables + select component
    activities/# existing: rapikan jadi audit trail
  pages/
    index.vue (landing publik), katalog.vue (etalase + search), product/[id].vue
    cart.vue, checkout.vue, orders.vue, orders/[id].vue
    auth/login.vue, auth/register.vue, auth/callback.vue
    admin/index.vue, admin/products.vue, admin/orders.vue, admin/activities.vue
  middleware/auth.ts, admin.ts
  layouts/default.vue (storefront), admin.vue (sidebar)
server/api/
  products/, categories/, orders/, auth/me.get.ts
supabase/migrations/ # versioned, lihat PHASE-1 & 3
```

Aturan:

- Satu fitur = satu folder dengan `schema.ts + store + composable + components`. Dilarang taruh komponen spesifik fitur di `app/components/` (hanya `AppNavbar.vue` global yang boleh di sana).
- Validasi selalu dua lapis: Zod client (UX cepat) + Zod server (keamanan).
- Uang selalu `*_cents INTEGER`, jangan `NUMERIC/float` untuk total order (lihat `ADR/003-price-cents-rpc.md`).
- RLS = otoritas final. Server API tetap cek session + role, tapi tidak pernah bypass RLS pakai service_role untuk request user.

## 4. Peta Fase → Sprint (12 minggu)

| Fase             | Sprint | Minggu | Goal demo                                                   |
| ---------------- | ------ | ------ | ----------------------------------------------------------- |
| 0 Foundation     | S1     | 1–2    | Lint+type+test hijau, seed jalan, Zod server untuk products |
| 1 Auth+Security  | S2–S3  | 3–5    | Login 2 role, RLS strict, `/admin` 403 untuk customer       |
| 2 Catalog Pro    | S3–S4  | 6–8    | Search/filter/sort via URL, SEO + OG, LCP <2.5s             |
| 3 Cart+Orders    | S4–S5  | 9–12   | Checkout atomik via RPC, realtime status order              |
| 4 Admin Ops      | S5–S6  | 12–14  | KPI + kelola order/produk tanpa buka Supabase               |
| 5 Quality+Launch | S6     | 14–16* | CI hijau, demo live, README portofolio                      |

*Sprint 6 diperpanjang / overlap karena buffer. Detail tugas per sprint di `SPRINT-PLAN.md`. Detail teknis per fase di `PHASE-*.md`.

Total scope terkendali: buffer 2 minggu sudah termasuk di S6. Kalau waktu mepet, potong prioritas `Should/ Could` di `BACKLOG.md`, jangan potong `Must`.

## 5. Definition of Done Global (wajib semua fase)

1. `pnpm lint`, `vue-tsc --noEmit`, `vitest run` hijau.
2. E2E critical path hijau (`auth → katalog → cart → checkout → admin update status`).
3. Tidak ada RLS `USING(true)` untuk tulis. Setiap policy baru ada di migrasi + terdokumentasi di PHASE-1/3.
4. Setiap endpoint POST/PUT ada Zod server-side, return format konsisten via `server/utils/response.ts`.
5. Setiap halaman punya loading + empty + error state, responsif 375px, keyboard navigable.
6. `CHANGELOG.md` + `version.json` diupdate tiap sprint.
7. Docs fase terkait diupdate (bukan cuma kode).

## 6. Risiko & Mitigasi

| Risiko                                                 | Dampak                       | Mitigasi                                                                                                 |
| ------------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| RLS mengunci diri sendiri saat dev                     | Frustasi, CRUD tiba-tiba 403 | Kerjakan Fase 1 di branch + Supabase lokal (`supabase db reset --local`), siapkan `seed.sql` + akun demo |
| Scope checkout membengkak (payment real)               | Sprint molor                 | Payment = mock/sandbox saja. Tulis eksplisit di docs. Payment real = out of scope                        |
| Migrasi `price numeric → price_cents int` merusak data | Data lama invalid            | Migrasi backfill `price_cents = round(price*100)`, dual-read 1 sprint, baru hapus kolom lama             |
| Realtime boros / bocor channel                         | Perf + biaya                 | Channel per-user (`orders:user_<id>`), unsubscribe on unmount, batasi ke orders + activity saja          |
| Over-engineering FSD                                   | Refactor tanpa akhir         | Migrasi inkremental: copy → alias → hapus lama. Maks 20% kapasitas sprint untuk refactor                 |

## 7. Cara Pakai Dokumen Ini

1. Baca `BACKLOG.md` untuk daftar story + prioritas MoSCoW.
2. Kerjakan per `SPRINT-PLAN.md` (ada checklist harian + demo script).
3. Buka `PHASE-X-*.md` saat eksekusi untuk SQL, API contract, file-by-file task.
4. Tulis keputusan kontroversial ke `ADR/` (contoh sudah disediakan).
5. Saat selesai, ikuti `PORTFOLIO-PACKAGING.md` untuk README, CV, demo.
