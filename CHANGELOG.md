# Changelog
Semua perubahan penting dalam projek **Product Management FE**.
Format ini berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [v0.2.0-beta.3] - 2026-08-10
### Fixed
- Menurunkan versi (downgrade) `@pinia/nuxt` dari `1.0.1` ke `0.11.0` untuk mengatasi *bug compatibility* antara `nuxtApp.payload.pinia` dengan Nuxt 4 yang menyebabkan gagal *render* SSR.


## [v0.2.0-beta.2] - 2026-08-10
### Fixed
- Perbaikan *crash* saat render SSR (`TypeError: Cannot read properties of undefined (reading 'state')`) dengan menginstal dependensi inti `pinia` yang sebelumnya belum terpasang.


## [v0.2.0-beta.1] - 2026-08-10
### Added
- Integrasi module `@nuxtjs/supabase` untuk konektivitas basis data.
- Refaktor arsitektur halaman produk menggunakan *Vue Best Practices* (memisahkan `index.vue` menjadi *Container*, `ProductList.vue`, dan `ProductForm.vue`).
- Implementasi fungsionalitas CRUD Produk sepenuhnya menggunakan Supabase.
- Fungsionalitas unggah gambar (*image upload*) ke Supabase Storage.
- Penambahan file `/docs/SUPABASE-CRUD-TUTORIAL.md` sebagai modul tutorial tahap demi tahap.


## [v0.1.0-beta.1] - 2026-08-10
### Added
- Inisialisasi proyek Nuxt 3 dengan integrasi PrimeVue dan Pinia.
- Setup layout global `default.vue` dengan PrimeIcons.
- Implementasi Pinia store untuk simulasi data produk.
- Pembuatan endpoint API `/version` untuk mematuhi SOP Talenavi.
- Standardisasi repository (README, folder docs, .env.example) sesuai SOP Coding Repo.
