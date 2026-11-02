# Portfolio Packaging — README, CV, Demo

> Dipakai di Sprint 6. Tujuan: perekrut paham dalam 3 menit + bisa klik demo tanpa tanya.

## 1. README Baru (struktur wajib)

```md
# ShelfStack — Mini E-Commerce Fullstack

[Badge CI passing] [Live Demo] [Video 2 mnt]

![GIF demo 30 detik: search → cart → checkout → admin approve]

## Demo

- Live: https://<vercel>.vercel.app
- Admin: admin@demo.test / (lihat Vercel env / minta akses)
- Customer: customer@demo.test / ...
- Video: <link>

## Fitur (tabel + screenshot per baris)

| Storefront                                     | Cart/Orders                                  | Admin                                            |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| search/filter/sort URL, detail SEO, badge stok | persist, checkout atomik, pay mock, realtime | KPI, kelola order status, CRUD+stok, audit trail |

## Arsitektur (mermaid)

DB(RLS) → Nuxt server(Zod+RPC) → Pinia → PrimeVue/Tailwind → Realtime → Vercel

## Tech decision (3 bullet + link ADR/)

## Cara run 5 menit (pnpm i, supabase start, seed, dev)

## Test & CI (perintah + coverage)

## Roadmap (apa yang sengaja tidak dibuat + kenapa mock payment)

## Kontak
```

Syarat: GIF <15MB, screenshot 1280px, akun demo jangan password real di git publik.

## 2. 3 Bullet CV (copy-paste, sesuaikan angka)

- Membangun mini e-commerce fullstack (Nuxt 4, Supabase, Zod) dengan auth RBAC, RLS strict, checkout transaksional via Postgres RPC, dan realtime status order; CI GitHub Actions + deploy Vercel hijau.
- Menerapkan katalog SEO + image optimization (`@nuxt/image`, WebP) mencapai LCP <2.5s dan Lighthouse ≥90 mobile.
- Menulis unit (Vitest) + E2E (Playwright) untuk critical path `register → checkout → admin approval` + audit trail activity.

## 3. Skrip Demo 2 Menit (hafalkan)

1. (0:00) "Ini storefront publik, search tersimpan di URL."
2. (0:30) "Detail SEO + stok real, tambah ke cart persisten."
3. (1:00) "Checkout, total dihitung server via RPC, stok lock atomik."
4. (1:30) "Bayar simulasi → admin approve → customer update realtime + audit."

## 4. Post LinkedIn (template)

> 12 minggu mengubah CRUD internal jadi mini e-commerce fullstack: Nuxt 4 + Supabase RLS + RPC checkout + realtime + CI hijau. Pelajaran terbesar: keamanan di DB (RLS), bukan cuma di UI. Demo: <link> | Kode: <link> #vue #nuxt #supabase #fullstack

## 5. Pertanyaan Interview yang Akan Datang + Jawaban Singkat

- "Kenapa total di server?" → Anti tamper + rounding; client hanya UX.
- "Kenapa RPC bukan 2 insert?" → Atomik + lock stok, hindari oversell.
- "RLS vs middleware?" → RLS otoritas final, middleware UX + defense in depth.
- "Kenapa mock payment?" → Hindari PCI scope di portofolio; arsitektur siap ganti provider.
