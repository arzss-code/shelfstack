# Test Case: Product Management (TC-PRD-01)

| No. Modul | Sheet Module       | Sheet Name      | Total TC | Status TC | Last Update |
| --------- | ------------------ | --------------- | -------- | --------- | ----------- |
| 1         | Product Management | `PRODUCT_MNGMT` | 4        | Draft     | 2026-08-20  |

## Modul 1: Product Management

| TC ID    | Type       | Scenario Description                                 | Test Steps                                                                                                                         | Expected Result                                                                                                             | Priority | Sprint |
| -------- | ---------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| PRD-1-01 | Functional | Menampilkan daftar produk aktif secara default       | 1. Buka halaman utama aplikasi (`/`)<br>2. Periksa daftar produk                                                                   | Tabel/Grid menampilkan daftar produk yang belum di-soft delete (kolom `deleted_at` = null).                                 | High     | 1      |
| PRD-1-02 | Functional | [Negative Case] Validasi Tambah Produk kosong        | 1. Klik 'Tambah Produk'<br>2. Kosongkan field 'Nama'<br>3. Isi field 'Harga' dengan `-10`<br>4. Klik 'Simpan'                      | Sistem menolak input. Pesan validasi muncul: 'Nama produk wajib diisi.' dan 'Harga tidak boleh negatif.'                    | High     | 1      |
| PRD-1-03 | Functional | [Edge Case] Tambah Produk dengan ukuran file pas 5MB | 1. Klik 'Tambah Produk'<br>2. Isi field 'Nama' & 'Harga'<br>3. Upload gambar tepat berukuran 5MB (format JPEG)<br>4. Klik 'Simpan' | Sistem melakukan kompresi di client-side, upload sukses, dan produk tersimpan tanpa error (sesuai `SOP-SUPABASE`).          | Medium   | 1      |
| PRD-1-04 | Visual     | Layout responsif pada layar Mobile                   | 1. Buka aplikasi di resolusi Mobile (375x667)<br>2. Lihat halaman utama dan modal form                                             | Grid produk berubah menjadi kolom tunggal, tombol dan input form menyesuaikan lebar layar, tidak ada elemen yang terpotong. | Low      | 1      |
