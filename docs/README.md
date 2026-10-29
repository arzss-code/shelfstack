# Indeks Dokumentasi ShelfStack

> **Mulai dari sini:** `PROGRESS.md` (status terkini dan known gaps, wajib dibaca sebelum kerja) → `BACKLOG.md` (scope dan kriteria penerimaan) → `ARCHITECTURE.md` (pola FSD-lite) → `/DESIGN.md` (design system aktif).

Direktori ini menyimpan seluruh spesifikasi teknis, dokumen arsitektur, rencana rilis, dan laporan rekayasa ShelfStack.

---

## 1. Sumber Kebenaran & Pelacakan Progres

- [`PROGRESS.md`](./PROGRESS.md): Log kemajuan implementasi aktif, verifikasi test, dan daftar Known Gaps terbuka.
- [`BACKLOG.md`](./BACKLOG.md): Backlog MoSCoW lengkap beserta acceptance criteria stabil (ID C-xx, K-xx, dll.).
- [`PRD-ECOMMERCE.md`](./PRD-ECOMMERCE.md): Product Requirements Document resmi (v2.0) yang memuat visi kurasi, target persona, dan model bisnis.
- [`UX-SPEC.md`](./UX-SPEC.md): Spesifikasi pengalaman pengguna (UX), arsitektur informasi, matriks aksi halaman, panduan validasi form, serta standar aksesibilitas.

---

## 2. Rencana Portofolio & Eksekusi Sprint

- [`PORTFOLIO-PLAN.md`](./PORTFOLIO-PLAN.md): Master plan 12 minggu, visi full-stack e-commerce, arsitektur target, dan DoD global.
- [`SPRINT-PLAN.md`](./SPRINT-PLAN.md): Rincian tugas Sprint 1 sampai 6, panduan file-by-file, dan demo script.
- [`PORTFOLIO-PACKAGING.md`](./PORTFOLIO-PACKAGING.md): Template portofolio akhir (README showcase, demo, dan poin CV).

---

## 3. Arsitektur & Keputusan Desain (ADR)

- [`ARCHITECTURE.md`](./ARCHITECTURE.md): Panduan arsitektur Feature-Scoped Development (FSD-lite) berbasis Nuxt 4.
- [`ADR/`](./ADR/): Architectural Decision Records resmi:
  - `001-nuxt-supabase.md`: Pemilihan Nuxt 4 dan Supabase.
  - `002-fsd-lite.md`: Struktur modular feature-scoped.
  - `003-price-cents-rpc.md`: Penyimpanan harga presisi rupiah dan mutasi via PostgreSQL RPC.
  - `004-single-supabase-project.md`: Konsolidasi proyek Supabase.
  - `005-order-state-payment-state-separation.md`: Pemisahan status pesanan dan status pembayaran.
- [`architecture/`](./architecture/): Spesifikasi domain backend transaksional:
  - `inventory.md`: Invarian mutasi stok dan ledger pergerakan barang.
  - `order-state-machine.md`: State machine transisi pesanan.
  - `payment-state-machine.md`: State machine pembayaran dan rekonsiliasi Midtrans.

---

## 4. Spesifikasi Teknis Per Fase

- [`PHASE-0-FOUNDATION.md`](./PHASE-0-FOUNDATION.md): Pondasi database, RLS, audit trail, dan skema awal.
- [`PHASE-1-AUTH-SECURITY.md`](./PHASE-1-AUTH-SECURITY.md): Autentikasi Supabase, proteksi RBAC, dan sanitasi.
- [`PHASE-2-CATALOG.md`](./PHASE-2-CATALOG.md): Katalog produk, filter URL, pencarian, dan optimasi gambar.
- [`PHASE-3-CART-ORDERS.md`](./PHASE-3-CART-ORDERS.md): Keranjang belanja, checkout transaksional, dan webhook Midtrans.
- [`PHASE-4-ADMIN.md`](./PHASE-4-ADMIN.md): Dashboard admin, manajemen pesanan, dan pengelolaan produk.
- [`PHASE-5-QUALITY-LAUNCH.md`](./PHASE-5-QUALITY-LAUNCH.md): Pengujian end-to-end, hardening, dan kesiapan rilis.

---

## 5. Rekayasa Produksi, Keamanan & QA

- [`engineering/`](./engineering/): Standar operasional dan keandalan sistem:
  - `observability.md`: Runbook logging terstruktur JSON, request tracing, dan health checks.
  - `security.md`: Panduan keamanan server, proteksi webhook, dan sanitasi PII.
  - `production-hardening.md`: Strategi idempoten, penanganan race condition, dan pencegahan overselling.
  - `load-testing.md`: Skenario uji beban k6 dan verifikasi konkurensi.
- [`roadmap/`](./roadmap/): Roadmap rekayasa berorientasi produksi (`production-roadmap.md`).
- [`qa/`](./qa/): Dokumen skenario pengujian manual dan visual (`TC-PRD-01.md`).

---

## 6. Tooling, Workspace & Laporan Magang

- [`MCP-SETUP.md`](./MCP-SETUP.md): Panduan konfigurasi Model Context Protocol (OpenCode/Antigravity).
- [`standup/`](./standup/): Arsip laporan harian magang (Morning Plan dan Evening Report).
- [`superpowers/`](./superpowers/): Rencana implementasi dan rancangan spesifikasi fitur spesifik.

---

## 7. Arsip Dokumen Lama

- [`archive/`](./archive/): Dokumen dan artefak lama yang diarsipkan untuk konteks historis:
  - `DESIGN-OKLCH-LEGACY.md` (token OKLCH lama era sebelum rebrand).
  - `DESIGN-ECOMMERCE.md` (dokumen konsep awal Nuxt 3).
  - `SOW-ECOMMERCE.md` (draf Statement of Work awal).
  - `mobbin/` (catatan riset antarmuka visual awal).
  - `stitch_shelfstack_e_commerce_platform/` (prototipe layar dan ekspor HTML Stitch awal).
