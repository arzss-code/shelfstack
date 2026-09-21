# Phase 0 — Foundation & Hygiene (Sprint 1, Minggu 1–2)

> Goal: bertipe penuh, seed reproducible, validasi server. Tidak ada fitur user baru.
> Backlog: F0-01 … F0-05.

## 1. File Diubah / Dibuat

| Aksi       | File                                                                 | Detail                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regenerate | `app/types/database.types.ts`                                        | Sudah sesuai skema saat ini (products + activity_logs). Regen ulang wajib tiap ada migrasi baru: `supabase gen types typescript --linked > app/types/database.types.ts` |
| Edit       | `app/stores/product.ts:6`                                            | `useSupabaseClient<Database>()`, hapus `any`                                                                                                                            |
| Baru       | `supabase/seed.sql`                                                  | 8 products skema saat ini (lihat §2). Categories/profiles menyusul Fase 1                                                                                               |
| Baru       | `shared/schemas/product.ts`                                          | Zod produk + query pagination, dipakai client DAN server (lihat §3). Dipilih `shared/` agar bisa diimpor `server/api/` tanpa alias khusus                               |
| Edit       | `server/api/products/index.ts` + `server/api/products/[id]/index.ts` | Zod GET(query)/POST/PUT, pakai `response.ts`                                                                                                                            |
| Baru       | `tests/unit/product-schema.spec.ts`                                  | 9 case schema (valid, PRD-1-02 negatif, query default/coerce)                                                                                                           |
| Fix        | `eslint.config.mjs`, `vitest.config.ts`                              | Abaikan `.kilo/**` (nested worktree Kilo merusak lint/test). Ditemukan saat baseline 2026-09-18                                                                         |
| Tambah     | `vue-tsc` devDependency                                              | Gate typecheck `vue-tsc --noEmit` (belum ada di `package.json` sebelumnya)                                                                                              |
| Pindah     | `app/features/products/stores/product.ts`, `repository/product.ts`   | Copy dari `app/stores/`, `app/repository/`, update `app/pages/index.vue:2-6`                                                                                            |
| Edit       | `README.md`, `CHANGELOG.md`, `version.json`                          | Koreksi Nuxt 3→4, bump `0.9.0-s1`                                                                                                                                       |

## 2. Seed `supabase/seed.sql` (sudah dibuat, skema saat ini)

> Catatan koreksi 2026-09-18: draft awal doc ini memakai `price_cents/stock/categories`, padahal kolom/tabel itu baru ada di Fase 1. Seed Fase 0 sengaja products-only (8 baris, kolom `price` numeric). Seed categories + stock menyusul migrasi Fase 1.

```sql
-- lihat file supabase/seed.sql (8 products via kolom name/price/description/link/image_url)
```

Akun demo dibuat via Supabase Auth dashboard / `supabase auth` lokal, bukan hardcode password di seed. Dokumentasikan emailnya saja di README.

## 3. Zod Produk (sudah implementasi di `shared/schemas/product.ts`)

> Koreksi 2026-09-18: lokasi dipindah dari `app/features/products/schema.ts` ke `shared/schemas/product.ts` agar bisa diimpor server tanpa alias. Bentuk mengikuti DB saat ini (`price` numeric positif); `price_cents/stock/category_id` menyusul Fase 1.

```ts
export const productSchema = z.object({
  name: z.string().min(3).max(120),
  price: z.number().positive(), // → jadi price_cents int di Fase 1 (ADR/003)
  description: z.string().max(2000).nullish(),
  link: z.string().url().nullish(),
  image_url: z.string().url().nullish(),
})
export const productListQuerySchema = z.object({
  from: z.coerce.number().int().min(0).default(0),
  to: z.coerce.number().int().min(0).default(11),
})
```

Server wajib `safeParse`, gagal → `400` via `errorResponse`. Client pakai schema sama untuk UX instan.

## 4. Migrasi FSD-lite (aman, inkremental)

1. Copy (jangan move) store/repo ke `features/products/`.
2. Update import di `app/pages/index.vue`, `app/pages/product/[id].vue`.
3. Jadikan file lama re-export: `export * from '~/features/products/stores/product'`.
4. Satu sprint kemudian hapus file lama. Dilarang edit dua sisi sekaligus.

## 5. Test Plan

- Unit: schema valid, nama pendek ditolak, harga negatif ditolak, url invalid ditolak.
- Manual: `supabase db reset --local` → `pnpm dev` → daftar muncul 8 produk.
- `pnpm lint && vue-tsc --noEmit && vitest run` hijau.

## 6. DoD Phase 0

- [x] Baseline hijau 2026-09-18: `pnpm lint` 0 error, `vue-tsc --noEmit` 0 error, `vitest run` 12/12 pass.
- [x] POST/PUT `/api/products` invalid → 400 konsisten (Zod server).
- [x] Tidak ada `any` di product/activity flow (tersisa: `catch (error: any)` idiomatis, `response.ts` helper generik, `01.h3-patch.ts`, event FileUpload — dicatat sebagai residual acceptable).
- [x] Migrasi FSD-lite store/repo ke `features/products/` (file lama jadi alias, hapus Sprint 2).
- [x] README koreksi Nuxt 3→4 + rebrand ShelfStack + `version.json 0.9.0-s1` + CHANGELOG.
- [ ] Seed `supabase db reset --local` terverifikasi jalan (file dibuat, belum dites — butuh Supabase CLI + Docker).
