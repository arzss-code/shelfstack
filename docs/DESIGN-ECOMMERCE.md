# Technical Design Document (DESIGN.md)

## Project: Talenavi E-Commerce Platform

### 1. Tech Stack & Architecture

- **Framework**: Nuxt 4 (Vue 3 Composition API).
- **UI Library**: PrimeVue (Aura Theme) + Tailwind CSS.
- **Backend as a Service (BaaS)**: Supabase (PostgreSQL, Auth, Storage).
- **State Management**: Pinia (menyimpan data _Cart_ dan _Auth Session_).
- **Architecture Pattern**: Feature-Sliced Design (FSD) untuk skalabilitas tinggi.

### 2. Database Schema (Supabase)

Relasi inti (_Entity Relationship_):

- `users` (Supabase Auth built-in).
- `profiles` (id, user_id, full_name, phone, role: ['admin', 'customer']).
- `categories` (id, name, slug).
- `products` (id, category_id, name, price, stock, description, image_url, deleted_at).
- `orders` (id, user_id, total_amount, status: ['pending', 'paid', 'shipped', 'completed'], created_at).
- `order_items` (id, order_id, product_id, quantity, price_at_time).

### 3. Keamanan (Security Guardrails)

- **Supabase RLS**:
  - `products`: _Read_ (Publik), _Insert/Update/Delete_ (Hanya Admin).
  - `orders`: _Read_ (Admin, atau _Customer_ pembeli terkait), _Insert_ (Customer terautentikasi), _Update_ (Hanya Admin).
- **Nuxt Security**: Implementasi perlindungan dasar (XSS, HSTS) via modul `nuxt-security`.

### 4. Struktur Direktori Baru (Sesuai FSD)

```text
app/
 ├── features/
 │    ├── products/    (Logika & Komponen Katalog)
 │    ├── cart/        (Logika & Komponen Keranjang/Pinia)
 │    ├── auth/        (Form Login/Register)
 │    └── orders/      (Logika Transaksi)
 ├── layouts/
 │    ├── default.vue  (Navbar Storefront Publik)
 │    └── admin.vue    (Sidebar Dashboard Admin)
 ├── pages/
 │    ├── index.vue    (Beranda Publik)
 │    ├── cart.vue     (Halaman Keranjang)
 │    └── admin/       (Direktori Khusus Admin)
```

### 5. Strategi Deployment

- **Platform**: Vercel.
- **CI/CD Pipeline**: GitHub Actions (Otomatis lint, tes Vitest & Playwright, sebelum di-_deploy_ ke _production_).
