# Audit Remediation Implementation Plan

**Goal:** memperbaiki temuan `docs/PROJECT-AUDIT.md` dalam kelompok kecil yang dapat diuji tanpa mencampurkan perubahan transaksi, keamanan, dan UI.

**Architecture:** pertahankan Nuxt/Nitro, Supabase, dan kontrak respons yang sudah ada. Validasi ownership sebelum penggunaan service role, gunakan migrasi untuk perubahan database, dan buktikan perubahan perilaku melalui test terhadap handler/RPC sebenarnya.

**Tech Stack:** TypeScript, Nitro/H3, Supabase, PostgreSQL, Vitest, Playwright, pnpm.

## Aturan pelaksanaan

- Jangan menimpa pekerjaan dokumen order dan simulator yang sudah ada di working tree.
- Jangan mengubah version, changelog, branch, atau melakukan commit tanpa permintaan.
- Setiap kelompok: reproduksi melalui test, perubahan minimal, test regresi, lint, typecheck, dan laporan hasil aktual.
- Test handler memanggil handler asli. Mock hanya batas autentikasi, request, dan penyimpanan; bukan salinan endpoint.
- Jangan memakai test string SQL sebagai pengganti bukti transaksi atau konkurensi PostgreSQL.
- Jangan menguji pada production atau menjalankan mutasi remote untuk mempermudah validasi.
- Status selesai satu kelompok tidak berarti seluruh audit selesai.

## Tahap 1A: isolasi resource pada API

**Scope:** dua temuan bagian 4 audit: lampiran order pada support dan cleanup avatar.

**Status pelaksanaan:** implementasi dan regresi unit tersedia. **Belum ditutup dengan seluruh quality gate**, karena `pnpm build` timeout 240 detik pada bundling Nitro. Tidak ada klaim seluruh audit selesai atau isolasi database telah teruji.

### Keputusan implementasi

- POST support memeriksa `orders.id` dan `orders.user_id` menggunakan identitas terautentikasi sebelum menulis thread atau pesan.
- Order asing dan order tidak ditemukan memiliki respons 404 yang sama agar keberadaan resource tidak terungkap.
- Kegagalan lookup menghasilkan 500 generik dan tidak boleh dilanjutkan sebagai validasi sukses.
- GET support memeriksa ulang order pada thread lama sebelum memperkaya pesan. Referensi lama yang tidak sah tidak dibersihkan secara destruktif.
- Skema `orders` saat ini tidak memiliki `deleted_at`. Jangan menambahkan filter terhadap kolom yang tidak tersedia atau mengarang soft-delete order.
- Cleanup avatar hanya menerima URL bucket yang cocok dengan URL kanonis SDK, folder pengguna yang sedang login, dan nama file aman. URL profil bukan bukti kepemilikan.
- URL eksternal/OAuth, folder pengguna lain, path ambigu, dan URL tidak valid dilewati untuk cleanup. Profil tetap dapat diganti atau dilepas seperti sebelumnya.
- Cleanup file lama bersifat best-effort setelah update profil berhasil. Kegagalan cleanup dicatat tanpa URL atau informasi sensitif dan tidak memalsukan kegagalan update profil yang sudah berhasil.
- Tidak ada perubahan schema, kebijakan bucket, atau kontrak sukses UI pada tahap ini.

### File yang terpengaruh

| File                                          | Tanggung jawab                                                                                |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `server/utils/support-order.ts`               | Lookup order berdasarkan ID dan pemilik, serta normalisasi kegagalan lookup                   |
| `server/api/support/messages.post.ts`         | Validasi lampiran sebelum side effect dan penggunaan ulang hasil lookup                       |
| `server/api/support/thread.get.ts`            | Enrichment lampiran lama hanya untuk order milik pelanggan                                    |
| `server/utils/avatar-storage.ts`              | Validasi path cleanup dan penanganan kegagalan cleanup                                        |
| `server/api/account/avatar.post.ts`           | Cleanup avatar lama yang terotorisasi setelah update berhasil                                 |
| `server/api/account/avatar.delete.ts`         | Pelepasan avatar dan cleanup yang terotorisasi                                                |
| `tests/unit/support-order-ownership.spec.ts`  | Regresi handler support dengan database double yang menerapkan filter                         |
| `tests/unit/fixtures/support-order.ts`        | Fixture bertipe dan database double support, terpisah agar file test tetap di bawah 300 baris |
| `tests/unit/avatar-storage-ownership.spec.ts` | Regresi handler upload/delete untuk URL dan folder lintas pengguna                            |
| `vitest.config.ts`                            | Resolusi alias Nitro Supabase untuk test handler melalui perintah standar                     |

### Urutan dan acceptance criteria

- [x] Jalankan test handler support sebelum fix dan amati kegagalan ownership (dieksekusi agent implementasi).
- [x] Implementasikan lookup ber-owner dan reuse hasil; GET tidak mengembalikan total/status order asing.
- [x] Buktikan POST order asing/tidak ada tidak menulis thread atau pesan; UUID tidak valid ditolak sebelum akses database.
- [x] Buktikan lookup database gagal mengembalikan 500 generik tanpa diagnosis internal.
- [x] Tambahkan regresi avatar terlebih dahulu dan amati cleanup tidak sah pada implementasi lama: 42 gagal / 13 lolos.
- [x] Implementasikan validasi URL/folder/path yang dipakai kedua handler avatar.
- [x] Buktikan pada unit test bahwa avatar milik sendiri tetap dibersihkan; avatar asing/eksternal/path ambigu tidak dihapus; update profil gagal tidak memicu cleanup avatar lama.
- [x] Buktikan pada unit test bahwa kegagalan cleanup tidak mengubah hasil update profil yang sudah berhasil dan tidak bocor ke respons/log.
- [x] Eksekusi suite terkait, full unit suite, lint, typecheck, serta production build dengan batas waktu. Hasil build belum lolos.
- [x] Perbarui `docs/PROGRESS.md` dan tindak lanjut audit dengan hasil aktual serta batas validasinya.
- [ ] Tutup gate production build dengan hasil EXIT 0. Percobaan batch ini timeout setelah 240 detik; jangan menganggap hasil parsial sebagai build sukses.

Perintah verifikasi terarah:

```sh
pnpm exec vitest run tests/unit/support-order-ownership.spec.ts tests/unit/avatar-storage-ownership.spec.ts
pnpm lint
pnpm typecheck
pnpm exec vitest run
pnpm build
```

### Hasil verifikasi batch 1A

| Perintah                                                                                                                                                                                                                                                                    | Hasil aktual                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm exec vitest run tests/unit/avatar-storage-ownership.spec.ts` sebelum fix                                                                                                                                                                                              | 42 gagal / 13 lolos, cleanup folder asing/eksternal tetap terpanggil dan exception cleanup merusak respons sukses              |
| `pnpm exec vitest run tests/unit/support-order-ownership.spec.ts`                                                                                                                                                                                                           | 1 file / 33 test lolos melalui konfigurasi Vitest persisten                                                                    |
| `pnpm exec vitest run tests/unit/support-order-ownership.spec.ts tests/unit/avatar-storage-ownership.spec.ts`                                                                                                                                                               | 2 file / 88 test lolos                                                                                                         |
| Scoped ESLint pada 9 file implementasi/config/test sebelum ekstraksi fixture                                                                                                                                                                                                | EXIT 0                                                                                                                         |
| `pnpm exec prettier --check server/utils/support-order.ts server/utils/avatar-storage.ts tests/unit/support-order-ownership.spec.ts tests/unit/avatar-storage-ownership.spec.ts tests/unit/fixtures/support-order.ts vitest.config.ts` setelah format dan ekstraksi fixture | EXIT 0                                                                                                                         |
| `pnpm lint`                                                                                                                                                                                                                                                                 | EXIT 0, tidak ada error/warning ESLint                                                                                         |
| `pnpm typecheck`                                                                                                                                                                                                                                                            | EXIT 0                                                                                                                         |
| `pnpm exec vitest run`                                                                                                                                                                                                                                                      | 134 file / 1.352 test lolos                                                                                                    |
| `pnpm --filter @shelfstack/order-service test`                                                                                                                                                                                                                              | 2 file / 25 test lolos                                                                                                         |
| `pnpm build`                                                                                                                                                                                                                                                                | Timeout 240 detik pada bundling Nitro. Client dan SSR selesai, tetapi tidak ada hasil bundle produksi final yang terverifikasi |
| Scoped `git diff --check`                                                                                                                                                                                                                                                   | EXIT 0, tanpa whitespace error; ada peringatan normalisasi LF/CRLF Git                                                         |

Test dan utilitas baru diformat mengikuti `.prettierrc`; database double support dipisahkan ke fixture agar semua file TypeScript baru tetap di bawah 300 baris. Pemeriksaan format awal menemukan 5 file perlu penyesuaian; hasil format final diverifikasi ulang.

Test menggunakan mock batas auth/request/Supabase, bukan Supabase live. Vitest menampilkan warning konfigurasi URL/key Supabase yang tidak tersedia dan warning komponen Nuxt pada sejumlah suite UI. Build menampilkan warning opsi esbuild/oxc, deprecation dependency, serta anotasi Zod. Tidak ada klaim output bebas warning atau deployment berhasil. Tidak ada eksekusi browser/E2E maupun integrasi PostgreSQL, RLS, atau Storage nyata.

### Review dan risiko tersisa

- Review independen terhadap 9 file implementasi/config/test sebelum ekstraksi fixture tidak menemukan blocker pada scope 1A. Reviewer juga menjalankan ulang 88 test dan scoped ESLint. Setelah fixture dipisahkan, full unit suite, lint, typecheck, dan pemeriksaan format dijalankan ulang dan lolos. Ini bukan audit keamanan menyeluruh.
- Test ownership support memakai filter database double dan fixture kolom sesuai `orders` pada `app/types/database.types.ts:350`. Bukti handler: `tests/unit/support-order-ownership.spec.ts:28`; bukti avatar: `tests/unit/avatar-storage-ownership.spec.ts:89`.
- Perilaku lama lampiran order per thread belum diselesaikan: setelah order A terpasang, POST order B dapat mengembalikan B, sedangkan GET berikutnya masih memperkaya pesan dengan A. Perlu keputusan kontrak penyimpanan lampiran dan regresi sukses A-ke-B, bukan perubahan diam-diam pada scope keamanan. Bukti: `server/api/support/messages.post.ts:74`, `server/api/support/thread.get.ts:73`.
- Referensi order historis tidak sah tidak dihapus dari database, hanya tidak diperkaya dengan detail order. RLS/Data API dan bucket publik tetap perlu perbaikan 1B.
- Cleanup avatar yang gagal atau URL yang ditolak dapat menyisakan objek. Tidak ada retry durable baru, perubahan metadata OAuth, maupun penyelesaian race upload/update bersamaan.

### Change report

- **Objective:** isolasi lampiran order support dan penghapusan avatar antar pengguna.
- **Files Changed:** 10 file pada tabel implementasi di atas, ditambah `docs/roadmap/audit-remediation-plan.md`, `docs/PROGRESS.md`, `docs/PROJECT-AUDIT.md`, dan `docs/README.md`. Perubahan user pada dokumen order, simulator, version, dan changelog dipertahankan.
- **Database Changes:** tidak ada migrasi, skema, policy, atau mutasi remote.
- **API Changes:** route dan shape sukses tetap. POST lampiran order asing/tidak ada sekarang 404 sebelum mutasi; lookup gagal 500 generik. GET tidak memperkaya lampiran asing. Kegagalan cleanup avatar tidak membatalkan keberhasilan update profil.
- **Business Logic Changes:** tidak menyentuh koin, inventory, order state, payment, atau perhitungan harga.
- **Tests Added:** `tests/unit/support-order-ownership.spec.ts` (33) dan `tests/unit/avatar-storage-ownership.spec.ts` (55), memanggil handler asli.
- **Tests Executed:** tabel di atas, termasuk kegagalan test sebelum fix dan timeout build.
- **Security Impact:** query order ber-owner dan cleanup hanya pada origin/bucket/folder milik pengguna. Bukti: `server/utils/support-order.ts:10`, `server/utils/avatar-storage.ts:5`.
- **Concurrency Impact:** tidak mengubah transaksi/locking database; bukan bukti aman dari seluruh race. Konsistensi thread/message dan update avatar bersamaan belum diselesaikan.
- **Performance Impact:** hasil lookup order dipakai ulang; `getPublicUrl` lokal tidak melakukan request Storage. Tidak ada benchmark atau klaim peningkatan latensi.
- **Remaining Risks:** production build belum lolos; Supabase/RLS/Storage integration dan seluruh temuan di luar 1A belum ditutup.
- **Follow-up:** diagnosis bundling Nitro pada lingkungan build yang sesuai, lalu 1B dan 1C dengan bukti integrasi terisolasi sebelum menyimpan data pengguna nyata.

## Tahap 1B: privasi storage, RLS, dan tracking

- [ ] Private bucket untuk chat/retur dan signed URL yang diotorisasi.
- [ ] Pembatasan UPDATE pesan support pada role/kolom yang tepat.
- [x] Perlindungan tracking publik dari wildcard (`%`, `_`) dan paparan identitas penerima (`maskCheckpointDescription`).
- [ ] Review trusted proxy untuk rate limit dan batas akun demo admin.
- [ ] Bukti test RLS dan Storage lintas pengguna pada instance Supabase terisolasi, termasuk akses langsung melalui Data API.
- [ ] Perubahan bucket harus sekaligus memeriksa kompatibilitas URL lampiran lama dan rendering pelanggan/admin.
- [ ] Putuskan kontrak lampiran order per pesan dibanding per thread; uji pengiriman order B ketika thread sudah memiliki order A sebelum memperluas perilaku lampiran.

## Tahap 1C: integritas transaksi dan harga

- [ ] Koreksi kontrak ledger dan saldo koin melalui migrasi baru.
- [x] Satukan quote harga: eliminasi promo/diskon sintetis fallback pada `server/utils/flash-sale.ts`.
- [ ] Satukan quote ongkir dengan total authoritative server (penyelarasan SQL RPC `create_order` vs `shared/schemas/shipping.ts`).
- [ ] RPC retur/restock atomic dan idempotent, dengan ledger tepat sekali.
- [ ] Guard refund pending terhadap fulfillment dan pengujian kedua urutan kejadian.
- [ ] Reversal stok parent/varian konsisten pada cancel, expiry, dan refund.
- [ ] Wajib PostgreSQL terisolasi untuk test rollback, duplicate request, dan alokasi stok bersamaan. Docker tidak merespons dalam pemeriksaan awal 15 detik; jangan menganggap lingkungan integrasi tersedia tanpa verifikasi berikutnya.

## Tahap 2: kelengkapan dan kejujuran fitur demo

- [x] Form kontak mengirim ke kanal nyata via endpoint handler `server/api/contact.post.ts` dengan Zod schema dan ticket ID resmi (menghilangkan delay 500 ms palsu).
- [x] QR standar ISO/IEC 18004 dengan error correction Reed-Solomon GF(256) (`qr-encoder.ts`) dan kontrak URL tracking yang konsisten (`?q=`, `?order_id=`, `?ref=`).
- [ ] Putuskan kebutuhan persistent email outbox; jelaskan batas notifikasi halaman dibanding Web Push.
- [x] Label sandbox, simulasi logistik, data sintetis, dan kebijakan komersial yang konsisten (garansi retur 7 hari).

## Tahap 3: aksesibilitas dan UX

- [x] Isolasi akar overflow katalog 320 px (perbaikan layout `ProductCompactCard.vue`).
- [x] Target sentuh minimal 44x44px (`AppNavbar.vue`, `UiInput.vue`), navigasi keyboard (menghapus `tabindex="-1"` pada aksi interaktif), kontras teks warning AA 5.3:1 (`main.css`), dan label tambah ke keranjang (`ProductCompactCard.vue`).
- [x] Penyederhanaan selector akun demo mobile responsif vertikal dan pemisahan storefront dari presentasi teknis.
- [x] Verifikasi browser pada viewport kecil, keyboard, serta idle/loading/success/empty/error untuk alur yang diubah.

## Tahap 4: reproducibility dan packaging portfolio

- Setup migrasi/seed, konfigurasi deployment, dan dokumentasi terminasi TLS yang dapat diikuti.
- Dataset demo terkurasi dan resettable pada lingkungan terisolasi.
- Perbaikan test yang menyalin endpoint atau hanya memeriksa string migrasi.
- Bukti sandbox journey dan finite-stock concurrency yang dapat diulang.
- Selaraskan dokumentasi produk dan klaim kualitas dengan bukti yang tersedia.
