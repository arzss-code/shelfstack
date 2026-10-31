# Morning Plan — Jumat, 18 September 2026

> Fokus hari ini: **Sprint 2 Fase 1 (Auth + RLS strict)** + restruktur IA storefront + bahasa visual DESIGN.md.
> Dokumen acuan: `docs/SPRINT-PLAN.md`, `docs/PHASE-1-AUTH-SECURITY.md`, `docs/BACKLOG.md`.

## 1. Target Hari Ini

| #   | Task                                                                                            | Kriteria selesai                                                          |
| --- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | Tulis migrasi `profiles` + `categories` + kolom baru + trigger                                  | File `20260918010001` + `20260918010002` ada dan idempotent (aman re-run) |
| 2   | Kunci RLS: cabut policy `USING(true)`, ganti strict + `is_admin()`                              | Tidak ada policy tulis terbuka; tidak ada lubang self-promote             |
| 3   | Auth end-to-end: `useAuth`, middleware, login/register/callback, layout admin, guard `/admin/*` | Customer ditolak masuk `/admin`, admin lolos                              |
| 4   | Restruktur IA: `/` landing, `/katalog` publik, CRUD pindah `/admin/products`                    | Beranda bukan CRUD lagi; guard terpasang                                  |
| 5   | Bahasa visual DESIGN.md + sistem token tunggal                                                  | Satu sumber warna (`main.css`), dark-mode konsisten light/dark            |
| 6   | E2E hijau: `auth.spec` baru + perbaiki test lama yang flaky                                     | `playwright` 13–14/14 lolos stabil                                        |

## 2. Yang DIBUTUHKAN dari Manusia (blocker potensial)

- [ ] `supabase link` + `db push` 2 migrasi ke project Cloud (butuh akses dashboard).
- [ ] Buat akun admin pertama: register via UI lalu `update profiles set role='admin'`.
- [ ] Verifikasi matriks RLS di Cloud (anon 401, customer 403 `/admin`, admin CRUD jalan).

## 3. Risiko Hari Ini

- RLS salah tulis = CRUD 403 semua. Mitigasi: recovery via SQL Editor (service_role bypass), perubahan hanya di file migrasi.
- E2E flaky di dev (hidrasi lambat ~4.4s). Mitigasi: helper `waitForHydration`, pola poll-retry.

## 4. Definisi "Hari Ini Berhasil"

Kode + migrasi + test selesai dan hijau di lokal; yang tersisa hanya 3 aksi manusia di atas.

## 5. Logbook Aktivitas (format perusahaan — siap salin ke form)

### Aktivitas 1

- **Target Aktivitas:** Melanjutkan Projek Frontend (Fitur Auth & Profile)
- **Target Durasi:** 4h
- **Keterangan:** Hari ini saya akan mengimplementasikan fitur database dan keamanan (migrasi `profiles`, `categories`, dan setup strict RLS), serta mengimplementasikan fitur Autentikasi end-to-end (halaman login, register, dan middleware admin).
- **Target Description:**
  - Hari ini saya akan mengimplementasikan fitur database dan keamanan (migrasi `profiles`, `categories`, dan setup strict RLS).
  - Hari ini saya akan mengimplementasikan fitur Autentikasi end-to-end (halaman login, register, dan middleware admin).

### Aktivitas 2

- **Target Aktivitas:** Melanjutkan Projek Frontend (Redesign Storefront & Testing)
- **Target Durasi:** 4h
- **Keterangan:** Hari ini saya akan meredesign struktur halaman (memisahkan layout publik dan halaman admin), meredesign sistem UI (panduan visual dan dark mode), serta memastikan stabilitas seluruh fitur melalui testing Unit & E2E.
- **Target Description:**
  - Hari ini saya akan meredesign struktur halaman (memisahkan layout publik dan halaman admin).
  - Hari ini saya akan meredesign sistem UI dengan membuat panduan bahasa visual (`DESIGN.md`) dan dark mode.
  - Hari ini saya akan memastikan seluruh fitur berjalan dengan baik melalui testing Unit & E2E.
