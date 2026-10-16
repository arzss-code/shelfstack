# ShelfStack

Aplikasi fullstack untuk kelola katalog produk internal — berevolusi jadi mini e-commerce
(storefront publik + admin dashboard + auth + orders). Dibangun ngikutin SOP Talenavi untuk
nge-handle list produk, tambah/edit data, dan pastinya state management yang rapi.

> Rencana portofolio 12 minggu (Sprint 1–6): lihat `docs/PORTFOLIO-PLAN.md`,
> `docs/SPRINT-PLAN.md`, dan `docs/BACKLOG.md`.

## Tech Stack

- **Nuxt 4** (Vue 3) + **Nitro** (server API)
- **Tailwind CSS** (Styling) + **PrimeIcons** (icon font)
- **Primitif UI sendiri** di `app/components/ui/` (bukan pustaka komponen pihak ketiga)
- **Pinia** (State Management)
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Zod** (Schema Validation, client + server via `shared/schemas/`)
- **Midtrans Sandbox** (Payment Snap)
- Dev/infra: **Vitest + Playwright** (testing), **nuxt-security + @nuxt/image**, **Docker + Nginx** (deploy), **Fastify + Redis 7** (`services/order-service`, pilot)

## Cara Setup

1. Clone repo ini.
2. Copy `.env.example` ke `.env` dan isi _credentials_ Supabase kamu.
3. Install dependencies:
   ```bash
   pnpm install
   ```

## Scripts

- `pnpm dev` - Jalanin server local untuk development
- `pnpm build` - Build project untuk production
- `pnpm preview` - Preview hasil build lokal
- `pnpm generate` - Generate static
- `pnpm typecheck` - Cek tipe (`vue-tsc --noEmit`)
- `pnpm lint` / `pnpm lint:fix` - ESLint
- `pnpm test` - Unit test (Vitest, watch mode)
- `pnpm test:e2e` - E2E (Playwright)

> **CI:** `.github/workflows/ci.yml` menjalankan `lint → typecheck → build → vitest → docker compose validate` di setiap push/PR.
>
> **Docs:** indeks dokumentasi di `docs/README.md`; status terkini di `docs/PROGRESS.md` (wajib dibaca sebelum kerja); scope di `docs/BACKLOG.md`.
>
> **Note:** Pastikan RLS (Row Level Security) di Supabase udah di-setup dengan bener buat table `products`, `orders`/`order_items`, `profiles`, `activity_logs` dan storage bucket `product-images`, kalau nggak nanti bakal kena error 403 / Access Denied.
