# Rencana Implementasi: Spesifikasi Dinamis & Varian Kontekstual Detail Produk (FR-3.2)

> **Goal:** Mengimplementasikan spesifikasi teknis dinamis dan pilihan varian kontekstual per kategori produk di halaman detail produk ShelfStack.  
> **Standar:** SOP Talenavi (Clean Architecture, Vue SFC <300 baris, strict TypeScript, TDD).

---

## 1. Latar Belakang & Masalah

Saat ini halaman detail produk (`app/pages/product/[id].vue`) sudah dinamis untuk data primer (nama, harga, stok, gambar, deskripsi, slug, dan SEO). Namun beberapa elemen penting masih **seragam/hardcoded**:

1. **Pilihan Warna & Material di `ProductConfigurator.vue`:**  
   Semua produk (mulai dari Ketel Kopi, Tas EDC, Lampu Meja, hingga Headphone) menampilkan opsi yang sama: _Matte Obsidian / Silver Frost_ dan _Anodized Alloy / Solid Walnut / Merino Wool Felt_.
2. **Belum Ada Dynamic Specification Table (FR-3.2 PRD-ECOMMERCE.md):**  
   Belum ada tabel spesifikasi teknis mendalam (misal: Dimensi & Beban untuk Furnitur, Kapasitas & Food-Grade untuk Dapur, Baterai & Konektivitas untuk Audio/Gadget).
3. **Rating & Ulasan Statis:**  
   Angka `4.94 (486 ulasan)` masih hardcoded di `ProductConfigurator.vue`.

---

## 2. Arsitektur Solusi

### Pemetaan Spesifikasi per 5 Kategori Kanonik ShelfStack:

| Kategori                                  | Opsi Varian 1 (Warna/Finishing)             | Opsi Varian 2 (Material/Tipe)                                | Spesifikasi Teknis Utama (Specs Table)                                                  |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Tech & Gadget (`tech`)**                | Matte Obsidian, Silver Frost, Space Gray    | Wireless ANC, Wired Studio, Ultra-Low Latency                | Driver Diafragma, Daya Baterai, Versi Bluetooth, Port Pengisian, Bobot                  |
| **Rumah & Dapur (`home`)**                | Matte Black, Brushed Steel, Chalk White     | Borosilicate Glass, 304 Stainless Steel, Solid Walnut Handle | Kapasitas Volume, Kompatibilitas Kompor/Api, Material Food-Grade, Ketahanan Suhu, Bobot |
| **Furnitur & Ruang Kerja (`furniture`)**  | Deep Walnut, Natural Oak, Matte Midnight    | Solid Walnut Wood, Anodized Aluminium, Powder-Coated Steel   | Dimensi (P×L×T), Beban Maksimal, Material Rangka, Perakitan, Garansi Struktur           |
| **Pakaian & Aksesoris (`lifestyle`)**     | Tactical Black, Slate Gray, Olive Drab      | 20L Daily Commute, 25L Weekender, Compact Sling              | Material Luar (Cordura), Ketahanan Air, Kompartemen Laptop, Bobot Kosong, Ritsleting    |
| **Alat Tulis & Kerajinan (`stationery`)** | Raw Titanium, Stonewashed Black, Brass Gold | 0.5mm Fine Needle, 0.7mm Medium, Bold Flow                   | Material Bodi, Mekanisme Aksi, Tipe Refill, Dimensi Panjang, Titik Berat                |

---

## 3. Rincian Tugas & Langkah Pengerjaan

### Task 1: Module Specs & Variant Resolver (`app/utils/product-specs.ts`)

- **Tanggung Jawab:** Menyediakan kamus spesifikasi dan pemilih varian dinamis berdasarkan slug/id kategori atau field `product.specs`.
- **Files:**
  - Create: `app/utils/product-specs.ts`
  - Test: `tests/unit/product-specs.spec.ts`

### Task 2: Komponen Tabel Spesifikasi Dinamis (`ProductSpecsTable.vue`)

- **Tanggung Jawab:** Menampilkan tabel spesifikasi teknis rapi menggunakan styling design system (`UiCard`, border brand halus, typography Inter/Montserrat).
- **Files:**
  - Create: `app/components/product/ProductSpecsTable.vue`

### Task 3: Integrasi `ProductGallery.vue`

- **Tanggung Jawab:** Menampilkan `ProductSpecsTable.vue` di bawah deskripsi produk dan membuat micro-spec box adaptif terhadap jenis garansi produk.
- **Files:**
  - Modify: `app/components/product/ProductGallery.vue`

### Task 4: Refaktor `ProductConfigurator.vue`

- **Tanggung Jawab:** Mengganti warna dan material statis dengan data kontekstual dari `getProductVariants(product)`.
- **Files:**
  - Modify: `app/components/product/ProductConfigurator.vue`

### Task 5: Pengujian Menyeluruh & Verifikasi Kualitas

- Jalankan unit test, typecheck, lint, dan verifikasi tampilan di browser dev.
