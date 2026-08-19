# Product Management

Aplikasi frontend untuk kelola katalog produk internal. Dibangun ngikutin SOP Talenavi untuk nge-handle list produk, tambah/edit data, dan pastinya state management yang rapi.

## Tech Stack

- **Nuxt 3** (Vue 3)
- **PrimeVue 4** (UI Components) + **Tailwind CSS** (Styling)
- **Pinia** (State Management)
- **Supabase** (Database & Storage)
- **Zod** (Schema Validation)

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

> **Note:** Pastikan RLS (Row Level Security) di Supabase udah di-setup dengan bener buat table `products` dan storage bucket `product-images`, kalau nggak nanti bakal kena error 403 / Access Denied.
