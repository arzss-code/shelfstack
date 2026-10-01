# REPORTING & MIGRATION GUARDRAILS

## 1. Extensive Technical Reports Must Use Artifacts

- **Mandatory Artifact Usage:** Setiap kali menghasilkan laporan implementasi fitur, diagram arsitektur, daftar file perubahan besar, atau ringkasan Quality Gate yang panjang, WAJIB ditulis ke dalam file Artifact (.md) di direktori artifact.
- **Concise Chat Response:** Respon chat hanya boleh berisi ringkasan eksekutif singkat (1-2 paragraf) dan mengarahkan pengguna ke link Artifact terkait. Dilarang menulis ulang seluruh isi artifact di respon chat.

## 2. Supabase Migration Execution Instructions

- **Dashboard First:** Jangan pernah mengasumsikan pengguna memiliki CLI Supabase yang ter-link atau Docker lokal yang aktif.
- **Copy-Paste Guidance:** Selalu sediakan instruksi salin-tempel ke SQL Editor Supabase Dashboard sebagai metode utama yang cepat dan aman, baru kemudian berikan petunjuk `supabase link` / `db push` sebagai opsi alternatif.
