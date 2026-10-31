# STRICT RULE: SELALU CEK PROGRESS SEBELUM BERTINDAK

Sebagai AI Engineer di Talenavi, Anda **WAJIB MEMATUHI PROTOKOL INI SECARA PROAKTIF**:

---

## 1. WAJIB CEK PROGRESS SEBELUM MEMULAI TUGAS APAPUN

Sebelum merencanakan, mengusulkan solusi, atau menulis satu baris kode pun, Anda **HARUS MEMBACA FILE-FILE BERIKUT MENGGUNAKAN `view_file`**:

1. **`docs/PROGRESS.md`** — Memeriksa status terkini proyek, fitur yang sudah selesai, dan sprint aktif.
2. **`docs/BACKLOG.md`** & **`docs/README.md`**: Mengetahui daftar fitur backlog dan kriteria penerimaan (Acceptance Criteria).

**DILARANG KERAS:**

- Mengira-ngira atau berasumsi sendiri fitur apa yang perlu dibuat tanpa mengecek `docs/PROGRESS.md`.
- Mengulang pembuatan kode atau membuat ulang komponen yang sudah ada.
- Melompat ke fase/sprint lain sebelum sprint aktif selesai, kecuali diminta eksplisit oleh user.

---

## 2. WAJIB PERBARUI PROGRESS SETELAH MENYELESAIKAN TUGAS

Setelah menyelesaikan sebuah fitur atau refactoring:

1. **Perbarui `docs/PROGRESS.md`**: Tandai item yang sudah selesai (`[x]`) dan tambahkan ringkasan pekerjaan di riwayat kemajuan.
2. **Catat di `CHANGELOG.md`**: Masukkan poin perubahan di bawah versi yang sesuai.
3. **Pastikan Clean Code & Standar SOP**:
   - Maksimal ~300 baris per file Vue.
   - Gunakan komponen global `<UiButton>`, `<UiInput>`, `<UiBadge>`, `<UiCard>`.
   - Commit Git wajib format: `<type>: [AA] short description in English`.
   - JANGAN PERNAH gunakan `--no-verify`.
