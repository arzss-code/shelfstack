# ShelfStack Design References & Style Benchmarks (DESIGN-REFERENCES)

> **Status Dokumen:** Referensi Resmi Desain  
> **Versi:** 1.0.0 (Oktober 2026)  
> **Penulis:** AA (Senior Full-Stack Engineer & Pair Lead)  
> **Target Audiens:** Frontend Engineers, UI/UX Designers, Product Managers

---

## 1. Pendahuluan & Filosofi Desain

Dokumen ini mencatat katalog referensi web dunia nyata (_real-world benchmarks_) yang menjadi acuan kurasi visual platform **ShelfStack**. Seluruh referensi dipilih berdasarkan standar rekayasa antarmuka kelas dunia yang mengutamakan kejelasan konten, kejujuran tipografi, dan efisiensi interaksi.

ShelfStack secara tegas menolak pola antarmuka generik kecerdasan buatan (_AI SaaS Slop_), seperti:

- Gradien warna ungu atau indigo dekoratif tanpa fungsi semantik.
- Kartu bersarang berlebihan (_cards-inside-cards-inside-cards_) dengan sudut lengkung ekstrem.
- Grafik atau chart hiasan tanpa data transaksional nyata.
- Grid kartu produk yang seragam dan monoton tanpa ritme editorial.
- Karakter em dash pada teks antarmuka dan komentar kode.

---

## 2. Benchmark Utama: Archival Gallery Modernist (Arah Terpilih)

Arah visual utama ShelfStack memadukan keheningan ruang pamer arsitektural (_gallery-white interface_) dengan kecepatan belanja modern. Berikut adalah situs referensi rujukan beserta pembedahan gayanya:

### 2.1 Teenage Engineering (Stockholm, Swedia)

- **Tautan Resmi:** [teenage.engineering](https://teenage.engineering/)
- **Kategori Gaya:** _Functional Minimalism & Audio Hardware Modernism_
- **Karakteristik Visual Utama:**
  - **Kanvas & Kontras:** Kanvas putih bersih dipadukan dengan teks hitam tinta pekat. Tanpa bayangan drop shadow yang kotor, kedalaman dibentuk murni melalui garis pembatas 1px (_hairline borders_).
  - **Tipografi:** Grotesque sans berbobot tegas dengan tracking rapat, teks deskriptif singkat, dan angka harga proporsional yang lugas.
  - **Penyajian Produk:** Objek mekanis (synthesizer, mikrofon, speaker) disajikan layaknya artefak pameran di atas meja studio yang bersih.
- **Elemen yang Diadopsi ShelfStack:**
  - Penataan fotografi produk beresolusi tinggi sebagai pahlawan visual utama (_visual hero_).
  - Pembatasan kartu produk menggunakan border netral 1px (`#e5e7eb`) tanpa bayangan difus hitam.
  - Aksen warna tunggal berbobot fungsional tinggi untuk indikator status belanja aktif.

### 2.2 Grovemade (Portland, Amerika Serikat)

- **Tautan Resmi:** [grovemade.com](https://grovemade.com/)
- **Kategori Gaya:** _Architectural Desk Workspace Curation_
- **Karakteristik Visual Utama:**
  - **Materialitas & Tekstur:** Setiap halaman memperlihatkan detail fisik material meja kerja (kayu walnut, aluminium billet, wol felt, kuningan) melalui pencahayaan studio yang lembut.
  - **Whitespace Lapang:** Jarak antar-seksi yang sangat lega (80px sampai 120px), memberikan kenyamanan bernapas pada mata pengguna.
  - **Struktur Halaman:** Membagi koleksi berdasarkan ekosistem meja kerja (misal: _Desk Pads_, _Laptop Stands_, _Audio Trays_).
- **Elemen yang Diadopsi ShelfStack:**
  - Tata letak asimetris pada _Hero Section_ (menghindari layout simetris generik kiri teks, kanan gambar).
  - Badge kategori terukur pada setiap kartu produk untuk memperjelas konteks material.
  - Penekanan pada garansi resmi dan kualitas pembuatan per unit.

### 2.3 Vitra Design Archive (Basel, Swiss)

- **Tautan Resmi:** [vitra.com](https://www.vitra.com/)
- **Kategori Gaya:** _Swiss International Style & Museum Archival Catalog_
- **Karakteristik Visual Utama:**
  - **Rasionalisme Grid:** Menggunakan proporsi kisi modular yang kokoh berbasis rasio matematika Swiss.
  - **Hirarki Tipografi Ketat:** Judul halaman menggunakan huruf berukuran besar dengan leading padat, dipasangkan dengan teks tubuh yang mudah dibaca.
  - **Panggung Plinth:** Produk furnitur diposisikan di atas bidang datar minimalis (_plinth_) untuk mengangkat nilai prestise barang.
- **Elemen yang Diadopsi ShelfStack:**
  - Format angka harga tabular bersih (`tabular-nums`) di halaman checkout dan keranjang.
  - Footer berlatar gelap pekat (_Inverted Plinth Footer_) dengan telemetri status sistem aktif.
  - Penolakan terhadap efek animasi melompat atau transisi lambat yang menghambat navigasi.

### 2.4 Apple Store: Accessories & Audio (Cupertino, Amerika Serikat)

- **Tautan Resmi:** [apple.com/shop](https://www.apple.com/shop)
- **Kategori Gaya:** _Precision Consumer Modernism_
- **Karakteristik Visual Utama:**
  - **Floating Navigation:** Bar navigasi melayang (_sticky navbar_) dengan permukaan kaca buram (_frosted glassmorphism_ `backdrop-blur-md`) yang menyatu dengan kanvas.
  - **Ergonomi Keranjang:** Panel keranjang samping (_Slide-over Cart Drawer_) yang menyajikan rincian barang, diskon, dan tombol checkout secara terisolasi tanpa navigasi halaman baru.
  - **Transisi Taktil:** Animasi mikro 150ms sampai 200ms saat tombol ditekan (`active:scale-[0.98]`).
- **Elemen yang Diadopsi ShelfStack:**
  - Navigasi utama _Floating Stadium Navbar_ berbentuk pil (`rounded-full`) dengan logo identitas tiga bilah rak.
  - Global Slide-over Cart Drawer dengan stepper kuantitas terpadu dan tombol hapus berdampingan.
  - Pemformatan mata uang Rupiah non-monospaced yang elegan (`Rp 2.680.000`).

### 2.5 Nothing Technology (London, Inggris)

- **Tautan Resmi:** [nothing.tech](https://nothing.tech/)
- **Kategori Gaya:** _Monochrome Technical Transparency_
- **Karakteristik Visual Utama:**
  - **Palet Trikromatik:** Dominasi hitam pekat, putih kanvas, dan aksen titik merah/oranye selektif.
  - **Kejujuran Komponen:** Elemen antarmuka transparan memperlihatkan tata letak struktural di baliknya.
- **Elemen yang Diadopsi ShelfStack:**
  - Disiplin palet warna: hanya satu warna aksen komersial (_International Electric Blue_ `#0066ff`) untuk memicu konversi pembelian, sementara 95% antarmuka lainnya bertumpu pada skala netral abu-abu dan hitam.

### 2.6 Studio Neat (Austin, Amerika Serikat)

- **Tautan Resmi:** [studioneat.com](https://studioneat.com/)
- **Kategori Gaya:** _Honest Direct-to-Consumer Craft_
- **Karakteristik Visual Utama:**
  - **Cerita Produk Langsung:** Tanpa jargon pemasaran yang berlebihan. Deskripsi fokus pada masalah kerja nyata dan solusi yang dihadirkan produk.
  - **Modal & Formulir Sederhana:** Formulir pemesanan ringkas dengan validasi langsung di tempat (_inline contextual validation_).
- **Elemen yang Diadopsi ShelfStack:**
  - Modal pemilih voucher promo yang ringkas dan padat (maksimal tinggi 82vh) tanpa scrollbar bertumpuk.
  - Penanganan status kosong (_empty states_) yang menyajikan tombol ajakan belanja solutif.

---

## 3. Benchmark Arah Visual Alternatif (Referensi Tambahan)

Untuk keperluan perbandingan arsitektural dan diversifikasi modul tertentu (seperti halaman log aktivitas atau portal admin):

### 3.1 Kategori Swiss Industrial Grid (Utilitarian Workstation)

- **Referensi Kunci:**
  - **Linear App ([linear.app](https://linear.app/)):** Standar industri untuk kerapatan data tinggi, navigasi keyboard terpadu, dan respon instan tanpa jeda.
  - **Framework Computer ([frame.work](https://frame.work/)):** Transparansi spesifikasi teknis modular per bagian.
  - **Braun Design Collection (Dieter Rams):** Pendekatan fungsional murni ("Less, but better").
- **Karakteristik:** Sudut tajam atau radius rendah (4px sampai 6px), garis kisi modular yang terlihat jelas, font monospace untuk angka metrik dan SKU, serta tombol aksi persegi panjang.

### 3.2 Kategori Warm Architectural Craft (Nordic Tactile Minimalism)

- **Referensi Kunci:**
  - **Bang & Olufsen ([bang-olufsen.com](https://www.bang-olufsen.com/)):** Perpaduan audio presisi dengan kehangatan material interior rumah Skandinavia.
  - **Astep Design ([astep.design](https://astep.design/)):** Pencahayaan arsitektural minimalis dengan latar belakang warna kertas alabaster hangat.
  - **Hay ([hay.dk](https://hay.dk/)):** Desain furnitur kontemporer dengan palet warna terakota dan material ramah lingkungan.
- **Karakteristik:** Palet kertas hangat (`#faf8f5`), teks arang umber (`#1e1c19`), aksen terakota tanah liat (`#c25e36`), dan tipografi bertemperatur hangat.

---

## 4. Matriks Adopsi Komponen ShelfStack

Tabel berikut memetakan inspirasi benchmark ke dalam komponen nyata yang dibangun pada ShelfStack:

| Komponen ShelfStack | File Komponen                                           | Situs Acuan Utama           | Karakteristik yang Diimplementasikan                                                                            |
| :------------------ | :------------------------------------------------------ | :-------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Floating Navbar** | `app/components/storefront/AppNavbar.vue`               | Apple Store & Vitra         | Geometri _stadium pill_ melayang, material kaca buram, pencarian instan, dan penghitung tas belanja.            |
| **Hero Showcase**   | `app/pages/index.vue`                                   | Teenage Engineering & Vitra | Tata letak split-screen asimetris, judul sans deklaratif tebal, tombol CTA pil hitam pekat.                     |
| **Kartu Produk**    | `app/features/products/components/ProductCard.vue`      | Grovemade & Apple           | Rasio media persegi 1:1, radius 16px, border 1px halus, badge status stok pil, harga IDR proporsional.          |
| **Slide-over Cart** | `app/features/cart/components/CartDrawer.vue`           | Apple Store & Studio Neat   | Drawer samping kanan, tombol hapus bersebelahan dengan stepper kuantitas di sudut bawah, tanpa duplikasi harga. |
| **Modal Voucher**   | `app/features/promos/components/VoucherSelectModal.vue` | Studio Neat & Zalora        | Kartu kupon simetris tanpa lekukan tiket sobek yang canggung, batas tinggi dialog 82vh, radio bulat tegas.      |
| **Plinth Footer**   | `app/components/storefront/AppFooter.vue`               | Teenage Engineering & Vitra | Kontras gelap terbalik (`#121316`), radius lengkung atas 24px, telemetri status server hidup (_live beacon_).   |
| **Admin Workspace** | `app/layouts/admin.vue` & `app/pages/admin/`            | Linear App & Swiss Grid     | Tabel data densitas tinggi, pemilahan status pesanan via badge semantik, angka tabular presisi.                 |

---

## 5. Kepatuhan Standar Rekayasa & Anti-Slop Checklist

Setiap perancangan komponen baru wajib melalui daftar periksa berikut sebelum dinyatakan memenuhi standar:

- [x] **Rasio Kontras Terverifikasi:** Teks isi minimal 4.5:1 terhadap kanvas kanvas putih, teks judul minimal 3:1 (kepatuhan WCAG 2.1 AA).
- [x] **Tanpa Karakter Em Dash:** Dilarang menyisipkan karakter em dash pada teks antarmuka maupun komentar kode. Gunakan koma, titik dua, kurung, atau titik.
- [x] **Mata Uang Proporsional:** Harga IDR menggunakan font `DM Sans` proporsional dengan kelas `tabular-nums`, dilarang menggunakan font monospace terminal pada etalase belanja.
- [x] **Ergonomi Sentuh:** Target sentuh minimum elemen interaktif mobile berukuran 44x44px.
- [x] **Indikator Status Jujur:** Data stok, nomor resi, kupon, dan nominal diskon wajib bersumber dari database PostgreSQL Supabase yang nyata.
