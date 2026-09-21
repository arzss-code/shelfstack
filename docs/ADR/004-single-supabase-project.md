# ADR 004 — Satu Project Supabase Cloud (Tanpa Dev/Prod Split)

- Status: Accepted. Tanggal: 2026-09-18.
- Konteks: Rencana awal (PORTFOLIO-PLAN) mengasumsikan 2 project Cloud (dev + prod). Realita: slot free tier penuh, dan database branching Supabase adalah fitur Pro/berbayar — tidak tersedia. Docker lokal terlalu berat untuk mesin harian.
- Keputusan: **Satu project Supabase Cloud untuk dev + demo portofolio.** Pengganti environment dev:
  1. Semua perubahan skema wajib file migrasi versioned (tidak ada klik manual tanpa catat).
  2. RLS diuji dengan matriks 3 aktor (anon + customer + admin) di project yang sama.
  3. SQL Editor dashboard (service_role, bypass RLS) = jalan keluar darurat jika policy salah.
  4. `pg_dump` sebelum migrasi berisiko (Fase 1 RLS, Fase 3 RPC).
  5. Seed bertanda + SQL cleanup sebelum launch (Sprint 6).
- Batas keputusan: jika nanti ada data user asli (bukan akun demo), keputusan ini dicabut dan prod wajib pisah. Selama akun demo saja, satu project acceptable.
- Konsekuensi: butuh disiplin (tulis dulu migrasinya, baru push). Keuntungan: tanpa biaya, tanpa Docker harian.
