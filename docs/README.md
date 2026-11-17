# Indeks Dokumentasi ShelfStack

> **Mulai dari sini:** `PROGRESS.md` (status terkini dan known gaps, wajib dibaca sebelum kerja) → `BACKLOG.md` (scope dan kriteria penerimaan) → `ARCHITECTURE.md` (pola FSD-lite) → `/DESIGN.md` (design system aktif).

Direktori ini menyimpan seluruh spesifikasi teknis, dokumen arsitektur, rencana rilis, dan laporan rekayasa ShelfStack.

---

## 1. Sumber Kebenaran & Pelacakan Progres

- [`PROGRESS.md`](./PROGRESS.md): Sumber kebenaran tingkat 1. Log kemajuan implementasi aktif, verifikasi test aktual, baseline quality gate, dan daftar Known Gaps terbuka.
- [`BACKLOG.md`](./BACKLOG.md): Sumber kebenaran tingkat 2. Backlog MoSCoW lengkap beserta acceptance criteria stabil (ID C-xx, K-xx, dll.).
- [`PRD-ECOMMERCE.md`](./PRD-ECOMMERCE.md): Product Requirements Document resmi (v2.0) yang memuat visi kurasi, target persona, dan model bisnis single-vendor.
- [`UX-SPEC.md`](./UX-SPEC.md): Spesifikasi pengalaman pengguna (UX), arsitektur informasi, matriks aksi halaman, panduan validasi form, serta standar aksesibilitas.
- [`DESIGN-REFERENCES.md`](./DESIGN-REFERENCES.md): Katalog referensi web dunia nyata, pembedahan gaya visual, dan matriks adopsi desain ShelfStack.

---

## 2. Arsitektur & Keputusan Desain (ADR)

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

## 3. Rekayasa Produksi, Keamanan & Keandalan

- [`PROJECT-AUDIT.md`](./PROJECT-AUDIT.md): Snapshot audit implementasi, keamanan, kelengkapan fitur, UI/UX, hasil pengujian aktual, serta prioritas perbaikan untuk portfolio. Temuan bukan pernyataan sudah diperbaiki.
- [`engineering/`](./engineering/): Standar operasional dan keandalan sistem:
  - `observability.md`: Runbook logging terstruktur JSON, request tracing, dan health checks.
  - `security.md`: Panduan keamanan server, proteksi webhook, dan sanitasi PII.
  - `production-hardening.md`: Strategi idempoten, penanganan race condition, dan pencegahan overselling.
  - `load-testing.md`: Skenario uji beban k6 dan verifikasi konkurensi.
- [`roadmap/`](./roadmap/): Roadmap rekayasa berorientasi produksi:
  - [`audit-remediation-plan.md`](./roadmap/audit-remediation-plan.md): Rencana perbaikan bertahap berdasarkan audit, acceptance criteria tahap 1A, hasil verifikasi aktual, dan temuan yang masih terbuka.
  - `production-roadmap.md`: Peta jalan keandalan dan skala produksi.
  - `extended-enhancements-plan.md`: Cetak biru peningkatan mendalam pasca-v1 (EPIC 6: email dispatcher, live omnibox search, unifikasi geometri etalase, dan customer portal).

---

## 4. Tooling & Workspace

- [`MCP-SETUP.md`](./MCP-SETUP.md): Panduan konfigurasi Model Context Protocol (OpenCode/Antigravity).

---

## 5. Arsip Dokumentasi (Historical Archive)

- [`archive/`](./archive/): Dokumen teknis dan artefak lama yang diarsipkan untuk konteks historis:
  - `PORTFOLIO-PLAN-LEGACY.md` (rencana master awal 12 minggu era September 2026).
  - `SPRINT-PLAN-LEGACY.md` (rencana sprint awal 1 sampai 6 yang telah tuntas).
  - `PORTFOLIO-PACKAGING-LEGACY.md` (draf template showcase portofolio lama).
  - `TC-PRD-01-LEGACY.md` (draf manual test case awal 4 skenario).
  - `standup/` (laporan harian magang September sampai Oktober 2026).
  - `superpowers/` (draf rencana fitur lama yang sudah diimplementasi).
  - `DESIGN-OKLCH-LEGACY.md` (token OKLCH lama era sebelum rebrand).
  - `DESIGN-ECOMMERCE.md` (dokumen konsep awal era Nuxt 3).
  - `SOW-ECOMMERCE.md` (draf Statement of Work awal).
  - `mobbin/` (catatan riset antarmuka visual awal).
  - `stitch_shelfstack_e_commerce_platform/` (prototipe layar dan ekspor HTML Stitch awal).
  - Lihat katalog lengkap di [`archive/README.md`](./archive/README.md).
