# ADR 001 — Nuxt 4 + Supabase (BaaS) untuk E-Commerce Portofolio

- Status: Accepted. Tanggal: 2026-09-18.
- Konteks: Butuh fullstack cepat 12 minggu, satu orang, tanpa DevOps berat. Alternatif: Next+Prisma+Postgres self-host, atau Nuxt + Express + Mongo.
- Keputusan: **Nuxt 4 (SSR + server API) + Supabase (Postgres + Auth + RLS + Storage + Realtime).** Pinia untuk cart/session, Zod dua lapis, PrimeVue Aura + Tailwind untuk UI.
- Alasan:
  1. RLS Postgres = authz di DB, tidak perlu tulis middleware auth manual banyak.
  2. Realtime + Storage built-in, cocok untuk order status + gambar produk.
  3. Nuxt server API cukup untuk validasi + RPC, tanpa repo backend terpisah.
  4. Skill yang diuji pasar 2026: SSR, SEO, server validation, RLS — semuanya kepakai.
- Konsekuensi: vendor lock-in Supabase ringan; mitigasi dengan SQL migrasi versioned + `database.types.ts` sehingga pindah Postgres relatif mudah. Jangan pakai service_role di client.
