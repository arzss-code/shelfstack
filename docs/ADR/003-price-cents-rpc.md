# ADR 003 — Uang dalam Cents + Checkout via RPC

- Status: Accepted. Tanggal: 2026-09-18.
- Konteks: `products.price` sekarang `numeric`. Rawan rounding float + client bisa kirim `total: 0` jika total dihitung di browser.
- Keputusan:
  1. **Simpan uang sebagai `*_cents INTEGER`** (`price_cents`, `total_cents`). Format Rupiah hanya di UI via `Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'})`.
  2. **Checkout via Postgres function `create_order(p_items, p_address)` + `cancel_order()`**, bukan insert dua tabel dari client. Total dihitung server dari `price_cents` asli + `FOR UPDATE` lock stok.
- Migrasi: tambah `price_cents`, backfill `round(price*100)`, dual-read 1 sprint, lalu NOT NULL + hapus `price` lama.
- Konsekuensi: perlu tulis PL/pgSQL + test RPC. Untung: atomik, anti race stok, anti tamper total — poin interview kuat.
