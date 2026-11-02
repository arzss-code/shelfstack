# Sprint Plan — 12 Minggu / 6 Sprint

> Ritme: sprint 2 minggu. Kapasitas asumsi 10–12 jam/minggu (magang + belajar). Sesuaikan jam, jangan kurangi DoD `Must`.
> Setiap sprint: Goal → Backlog (dengan file) → Checklist harian → Demo script → DoD → Risiko.
> Update `CHANGELOG.md` + `version.json` tiap akhir sprint.

## Aturan Main Sprint

- Branch: `feat/s1-foundation`, `feat/s2-auth`, `feat/s3-catalog`, `feat/s4-cart-orders`, `feat/s5-admin`, `feat/s6-launch`. PR kecil (<400 baris) + template `.github/PULL_REQUEST_TEMPLATE.md`.
- Commit: `feat(auth): ...`, `fix(rls): ...`, `docs(sprint-2): ...`, `test(orders): ...`.
- Demo tiap akhir sprint direkam 2–5 menit (bukti portofolio + bahan README GIF).
- Kapasitas refactor maksimal 20% per sprint. Bug RLS = prioritas tertinggi.

---

## SPRINT 1 — Foundation & Hygiene (Minggu 1–2)

**Goal:** Fondasi bertipe, seed jalan, validasi server untuk products. Tidak ada fitur user baru.

**Backlog:** F0-01 … F0-05.

**Task file-by-file:**

1. `app/types/database.types.ts` — regenerate: `supabase gen types typescript --linked > app/types/database.types.ts`. Ganti `useSupabaseClient<any>()` di `app/stores/product.ts:6`.
2. `supabase/seed.sql` (baru) — 5 kategori kanonik, 5 produk kurasi, 2 user demo. Pastikan `supabase db reset --local` hijau.
3. `app/features/products/schema.ts` (baru) — Zod: `name 3–120, price_cents int >0, stock int >=0, description max 2000 nullable, link url nullable, category_id uuid nullable`.
4. `server/api/products/index.ts` — tambah `safeParse` GET (from/to/q/cat/sort) + POST. Pakai `server/utils/response.ts`. Tambah `tests/unit/product-schema.spec.ts`.
5. Migrasi FSD: copy `app/stores/product.ts` → `app/features/products/stores/product.ts`, `app/repository/product.ts` → `app/features/products/repository/product.ts`. Update `app/pages/index.vue:2-6` ke path baru. Path lama jadi re-export alias 1 sprint, lalu hapus.
6. `README.md` koreksi Nuxt 3→4 + tambah bagian `Roadmap ke E-Commerce` link ke `PORTFOLIO-PLAN.md`.
7. `version.json` → `0.9.0-s1`, `CHANGELOG.md` entry S1.

**Checklist harian (contoh):**

- D1–2: types + seed lokal jalan.
- D3–5: Zod server + unit test.
- D6–8: migrasi FSD + lint/type hijau.
- D9–10: README/CHANGELOG + demo rekam.

**Demo script (3 mnt):** tunjukkan `seed` reset → POST invalid 400 → POST valid 201 → `vue-tsc` hijau.

**DoD S1:** `lint + typecheck + vitest` hijau, tidak ada `any` di product flow, seed reproducible.

**Risiko:** Supabase lokal berat → mitigasi pakai Docker secukupnya, atau cloud branch terpisah.

---

## SPRINT 2 — Auth & RLS Core (Minggu 3–4)

**Goal:** Login jalan, RLS strict untuk products + storage. Ini sprint paling penting.

**Backlog:** A-01, A-03, A-04, A-06 (OAuth A-02 geser ke S3 jika mepet).

**Task file-by-file:**

1. SQL `supabase/migrations/2026XXXX_profiles_categories_base.sql` — buat `profiles`, `categories`, tambah `stock`, `category_id`, `price_cents` ke `products` + backfill. Trigger `handle_new_user()` auto-insert profiles. (SQL lengkap di `PHASE-1-AUTH-SECURITY.md`.)
2. SQL `supabase/migrations/2026XXXX_rls_strict_products.sql` — drop policy `true`, buat policy admin-only CUD + public read aktif. Sama untuk storage `product-images`.
3. `app/features/auth/composables/useAuth.ts` (baru) — register/login/logout/session/role + error mapping Indonesia.
4. `app/middleware/auth.ts`, `app/middleware/admin.ts` (baru) — guard + redirect.
5. `app/pages/auth/login.vue`, `register.vue` (baru) — PrimeVue + Zod client.
6. `app/layouts/admin.vue` (baru) — shell kosong + slot, dipakai penuh di S5.
7. `app/components/AppNavbar.vue` — tambah state login/logout + avatar + link Admin (hanya jika role admin).
8. Test: `tests/e2e/auth.spec.ts` (register→login→/admin 403 sebagai customer).

**Demo (4 mnt):** register customer → login → buka `/admin` ditolak → login admin → CRUD produk sukses → `curl` anon POST 403.

**DoD S2:** Tidak ada policy tulis `true` tersisa untuk products/storage. Akun demo didokumentasikan (jangan commit password real ke git, pakai seed lokal + secret Vercel).

---

## SPRINT 3 — Catalog Pro + OAuth (Minggu 5–6)

**Goal:** Katalog terasa seperti toko beneran.

**Backlog:** A-02, C-01 … C-05, A-07.

**Task:**

1. `server/api/products/index.ts` — filter `q/cat/sort/from/to` + index SQL `btree(category_id)`, `gin(name)`.
2. `app/pages/index.vue` — refactor: query URL (`useRouteQuery`), debounce 300ms, `useAsyncData`, skeleton, empty/error state. Pisah `features/products/composables/useProducts.ts`.
3. `app/pages/product/[id].vue` — tambah `useSeoMeta` + OG, breadcrumb, related, tombol keranjang (disabled stok 0, siapkan event untuk S4).
4. `app/features/products/components/ProductCard.vue` (baru, ganti grid inline di `ProductList.vue`) — pakai `NuxtImg`, badge stok, `tabular-nums` harga.
5. OAuth Google: aktifkan provider di Supabase + `additional_redirect_urls` Vercel di `supabase/config.toml:161-163`.
6. Lighthouse run + catat skor di `PHASE-2-CATALOG.md`.

**Demo:** ketik search → URL berubah → refresh tetap → buka detail → share preview → Lighthouse screenshot.

---

## SPRINT 4 — Cart + Checkout Atomik (Minggu 7–9, diperpanjang)

**Goal:** Uang bergerak dengan benar. Sprint paling rawan molor — jaga scope.

**Backlog:** K-01 … K-05 (K-06 geser ke S5 jika mepet).

**Task:**

1. SQL `supabase/migrations/2026XXXX_orders.sql` — `orders` + `order_items` + function `create_order()` + `cancel_order()` + RLS (lihat `PHASE-3-CART-ORDERS.md`).
2. `app/features/cart/stores/cart.ts` — Pinia persist localStorage, actions add/setQty/remove/clear, getter total_cents.
3. `app/features/cart/components/CartDrawer.vue` + `app/pages/cart.vue` — drawer global di `default.vue`.
4. `app/pages/checkout.vue` + `app/features/orders/schema.ts` — form alamat Zod, review items, tombol bayar mock.
5. `server/api/orders/index.ts` (POST) — panggil RPC, jangan insert manual dua tabel dari client.
6. `app/pages/orders.vue`, `orders/[id].vue` — riwayat + detail + realtime `postgres_changes` filter `user_id=eq.<id>`.
7. Test: unit cart total + e2e `login → add → checkout → order muncul`.

**Demo:** sebagai customer checkout 2 item → stok berkurang → status pending → klik Bayar simulasi → paid realtime.

---

## SPRINT 5 — Admin Ops + Cancel/Return (Minggu 10–11)

**Goal:** Admin bisa kerja tanpa buka Supabase.

**Backlog:** D-01 … D-04, K-06, C-06 (jika sempat).

**Task:**

1. `app/layouts/admin.vue` — sidebar (Dashboard, Orders, Products, Activities) + guard `admin.ts`.
2. `app/pages/admin/index.vue` — KPI + chart + tabel terbaru. Query via server API agregasi (jangan select semua orders ke client).
3. `app/pages/admin/orders.vue` — filter status + ubah status (hanya transisi legal) via `PUT /api/orders/[id]/status`.
4. `app/pages/admin/products.vue` — CRUD + kategori + stok, reuse `ProductForm.vue` + field baru.
5. `app/pages/admin/activities.vue` — pindah dari `app/pages/admin/activities.vue` lama, tambah filter + diff viewer.
6. `server/api/orders/[id]/status.put.ts` — cek admin + transisi + tulis activity + trigger realtime.

**Demo:** admin buka dashboard → ubah pending→shipped → customer lihat update realtime → cek audit trail.

---

## SPRINT 6 — Quality, CI, Launch (Minggu 12 + buffer)

**Goal:** Layak share ke perekrut.

**Backlog:** Q-01 … Q-05, D-05 (optional).

**Task:**

1. `.github/workflows/ci.yml` (baru) — job `lint → typecheck → unit → e2e (chromium) → vercel-preview`. Lihat template di `PHASE-5-QUALITY-LAUNCH.md`.
2. Test gap: tambah `product-schema.spec.ts`, `cart.spec.ts`, `checkout.spec.ts`, `admin-orders.spec.ts`. Perbaiki `tests/e2e/*` yang flaky (tambah `waitFor`, seed deterministik).
3. Deploy: Vercel project + env + Supabase Cloud migrasi berurutan + storage bucket + realtime enable. Cek `/api/version`.
4. Perf/a11y: Lighthouse ≥90, kontras WCAG, focus visible, `alt` image, form label.
5. Packaging: ikuti `PORTFOLIO-PACKAGING.md` — README baru + GIF + diagram + CV bullets. Bump `version.json 1.0.0`, `CHANGELOG.md` release notes.

**Demo final (5 mnt, rekam untuk README):** visitor → search → detail → cart → checkout → bayar → admin approve → realtime → audit.

**Exit criteria 12 minggu:** Semua `Must` di `BACKLOG.md` selesai + CI hijau + demo live bisa dibuka perekrut tanpa tanya cara run.

---

## Kapasitas & Cara Potong Scope dengan Aman

- Jika telat 1 minggu di S2/S4: potong `Could` dulu (C-06, D-05, OAuth Google), jangan potong RLS/RPC/test happy path.
- Jika telat 2 minggu: tunda `D-01 chart` jadi tabel saja, `Q-05 a11y audit` jadi checklist manual.
- Jangan pernah potong: RLS strict, Zod server, RPC atomik, CI hijau, README demo.
