# Phase 2 — Catalog Pro (Sprint 3, Minggu 5–7)

> Goal: katalog seperti toko beneran + SEO + cepat.
> Backlog: C-01 … C-05 (+ A-02 OAuth, A-07 jika belum).

## 1. API Contract `GET /api/products`

Query: `q?, cat? (slug), sort? (newest|price_asc|price_desc), from?=0, to?=11`

```ts
// response sukses (via successResponse)
{ status:'success', message:'...', data: Product[], errors:null }
// Product kini: {id, name, price_cents, stock, category_id, categories:{slug,name}?, image_url, ...}
```

SQL index (migrasi baru):

```sql
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
-- enable pg_trgm sekali: create extension if not exists pg_trgm;
```

Server: `ilike %q%` dulu (cukup untuk portofolio), `eq category`, `order` sesuai sort, `range(from,to)`, selalu `is deleted_at null`.

## 2. UI Spec

### `app/pages/katalog.vue` (ganti fokus dari `index.vue` — beranda kini landing, CRUD pindah ke `admin/products.vue`)

- State di URL: `useRouteQuery` untuk `q,cat,sort,page`. (Fase berjalan: search client-side dulu, URL state di task berikutnya.)

- State di URL: `useRouteQuery` untuk `q,cat,sort,page`. Ganti `searchQuery` lokal + `filteredProducts includes()` yang lama.
- `useAsyncData('products', () => $fetch('/api/products', {params}), {watch:[q,cat,sort,page]})` + `debounce 300ms` untuk `q`.
- Komponen: `SearchBar`, `CategorySelect` (dari `/api/categories`), `SortSelect`, `ProductGrid` + `ProductCard` + `SkeletonCard`, `EmptyState`, `ErrorState` + Retry.
- Pagination: tombol `Muat Lebih Banyak` dipertahankan tapi pakai `page` query; sembunyikan saat `q` aktif jika hasil < limit.

### `app/features/products/components/ProductCard.vue` (baru)

- `NuxtImg` + `loading="lazy"`, `alt=name`, rasio 4:3, fallback placeholder.
- Harga format `Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})` dari `price_cents`.
- Badge: `Stok habis` (disabled tombol), `Sisa X` jika `<5`, kategori chip.
- Angka pakai `tabular-nums`, radius max 12px, border solid (ikut `DESIGN.md` anti-slop).

### `app/pages/product/[id].vue`

- `useSeoMeta({title, description, ogTitle, ogDescription, ogImage})` + `defineOgImage` jika ada.
- Breadcrumb: Home / Kategori / Nama. Related: `GET /api/products?cat=<slug>&to=3` exclude id sendiri.
- Tombol `+ Keranjang` emit ke cart store (Fase 3); jika stok 0 disabled + tooltip.

## 3. File-by-file

| File                                               | Aksi                            |
| -------------------------------------------------- | ------------------------------- |
| `server/api/products/index.ts`                     | tambah filter + join categories |
| `server/api/categories/index.ts`                   | baru, public read               |
| `app/features/products/composables/useProducts.ts` | baru, bungkus fetch + query URL |
| `app/features/products/components/ProductCard.vue` | baru                            |
| `app/features/products/components/ProductList.vue` | refactor jadi grid + slot state |
| `app/pages/index.vue`                              | refactor URL state              |
| `app/pages/product/[id].vue`                       | SEO + related + cart hook       |

## 4. Perf Budget

- LCP <2.5s (mobile 4G throttled), CLS <0.1, gambar <200KB via WebP + `NuxtImg sizes`.
- Skeleton dulu, jangan spinner fullscreen. `prefetch` detail saat hover (Nuxt default).
- Catat skor Lighthouse sebelum/sesudah di bawah.

| Tanggal    | LCP | CLS | Perf | Catatan  |
| ---------- | --- | --- | ---- | -------- |
| 20xx-xx-xx |     |     |      | baseline |
|            |     |     |      | sesudah  |

## 5. Test Plan

- Unit: query builder (q kosong vs isi, sort mapping).
- E2E `tests/e2e/catalog.spec.ts`: ketik `kopi` → URL `?q=kopi` → refresh tetap → pilih kategori → sort murah → buka detail → OG meta ada.
- Visual mobile 375px: grid 1 kolom, tidak terpotong (lanjutkan `TC-PRD-01.md` PRD-1-04).

## 6. DoD

- [ ] Refresh tidak hilangkan filter. [ ] Stok real dari DB. [ ] OG preview WA bagus. [ ] Lighthouse dicatat.
