# Audit Lanjutan ShelfStack (v1.1.0-beta.29): Fitur Setengah Jadi, Celah Produk, UI/UX, & Copywriting

> **Status Remediasi (`v1.1.0-beta.31`, 2026-11-21):** Seluruh item peningkatan platform Fase 1 sampai 5 telah tuntas diimplementasikan: Hardening Dark Mode (77 komponen), perapihan beranda (`HomeReviews.vue`), moderasi ulasan pelanggan (`/admin/reviews`), persistent email outbox queue (`20261204000001_email_outbox_queue.sql`), dan ongkir dinamis zonasi Semarang/Jawa/Luar Jawa (`shared/schemas/shipping.ts`). Terverifikasi via `pnpm lint` (EXIT 0), `pnpm typecheck` (EXIT 0), `pnpm exec vitest run` (144 file, 1.428 test lolos 100%), dan `pnpm build` (EXIT 0).

- **Tanggal Audit:** 2026-11-18
- **Baseline:** `v1.1.0-beta.29` (pasca-remediasi audit awal pada PR `#103` dan PR `#104`)
- **Tujuan:** Memetakan fitur yang baru berjalan sebagian (_half-baked_), bug fungsional, kontradiksi kebijakan & copywriting, penyimpangan `DESIGN.md`, celah UI/UX & aksesibilitas, serta fitur e-commerce lanjutan yang dapat dikerjakan pada fase berikutnya.
- **Kerangka Audit:** `ponytail-audit`, `ux-audit`, `antislop` (`antislop-ui`, `antislop-copywriting`, `antislop-human`, `antislop-layoutmobile`), `ux-copy`, `impeccable` (`audit` / `critique` + `impeccable detect`), `security-audit`, dan standar rekayasa repo (`AGENTS.md`, `DESIGN.md`, `PRODUCT.md`).

> **Catatan Ruang Lingkup:** Temuan di dokumen ini diverifikasi melalui penelusuran kode sumber, skema migrasi SQL, komposisi rute/API, serta pemindaian statis (`impeccable detect` dan skrip pemindaian AST/teks). Tidak ada perubahan kode fitur maupun eksekusi runtime terhadap database deployment sebagai bagian dari audit ini.

---

## 1. Ringkasan Skor Kesehatan Audit

| Dimensi Audit                               |    Skor     | Status            | Catatan Utama                                                                                                                                          |
| :------------------------------------------ | :---------: | :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kelengkapan End-to-End Fitur**            | **2.5 / 4** | Perlu Dituntaskan | Kontak tidak tersimpan, varian / flash sale / kategori belum punya CRUD Admin, RMA retur tipe `refund` belum terhubung ke finansial & koin             |
| **Kebenaran Kebijakan & Copywriting**       | **2.0 / 4** | Kritis            | Retur `30 hari` vs `7 hari` di 3 komponen utama, klaim `1.300+` vs `34+` produk, batas bayar FAQ `24 jam` vs sistem `2 jam`                            |
| **Konsistensi Design System (`DESIGN.md`)** | **2.0 / 4** | Menyimpang        | `191` `bg-white` hardcoded (merusak `.dark`), `324` class warna Tailwind mentah, `645` `text-[9px..11px]`, `67` `font-mono`                            |
| **UX States, Mobile & Aksesibilitas**       | **2.5 / 4** | Perlu Perbaikan   | `/katalog` & `/c/[slug]` tanpa Error State, kurang `min-w-0` pemicu overflow 320px, `42` kontrol `< 44x44px`, 1 link `404` di beranda                  |
| **Kebersihan Kode & Keamanan Dasar**        | **3.5 / 4** | Baik              | `0` em-dash di kode sumber, auth/RLS/rate-limit baik; sisa `22` cast `any`, `9` `console.*` klien tanpa guard, serta race/RLS bug di `restock.post.ts` |

---

## 2. Fitur yang "Masih Setengah Jalan" (Half-Baked / Belum Tersambung Penuh)

### 1. [P0] Formulir Kontak (`/contact`) Adalah "Black Hole" (Tidak Tersimpan & Tidak Terkirim)

- **Bukti:** `server/api/contact.post.ts:24-41`, `app/pages/returns.vue:42,244`, `app/data/faqs.ts:32,156`
- **Masalah:** Handler `/api/contact` hanya memvalidasi payload dengan Zod, menulis `messageLength` ke `logger.info` (tanpa mencatat isi pesan), lalu mengembalikan nomor tiket sintetik `CTK-...` dengan janji _"Tim dukungan ShelfStack akan merespons dalam 1x24 jam kerja"_. Tidak ada penyimpanan ke database (`contact_messages` / `support_threads`) maupun pengiriman email ke `SUPPORT_EMAIL`.
- **Dampak Berantai:** Halaman `returns.vue` dan `faqs.ts` mengarahkan pelanggan yang ingin membatalkan pesanan lunas atau mengajukan retur ke `/contact`. Pesan pelanggan hilang tanpa pernah bisa dibaca Admin.
- **Rekomendasi:** Simpan pesan kontak ke tabel PostgreSQL baru (`contact_messages`) atau teruskan menjadi tiket `/admin/support`, kirim notifikasi via `email-dispatcher` ke `SUPPORT_EMAIL`, serta arahkan CTA pengajuan retur di `/returns` dan `/help` langsung ke `/orders` (fitur RMA mandiri yang sudah ada).

### 2. [P0] Quick Restock Admin (`POST /api/admin/products/[id]/restock`) Rawan Race Condition & Selalu Gagal RLS Ledger

- **Bukti:** `server/api/admin/products/[id]/restock.post.ts:34-73`, `supabase/migrations/20261101000001_inventory_movements_ledger.sql:48-102`
- **Masalah:**
  1. Handler membaca `product.stock` di JavaScript lalu menulis `.update({ stock: previousStock + quantity })` tanpa `FOR UPDATE`, sehingga rentan _lost update_ jika checkout berlangsung bersamaan.
  2. Baris 61 menjalankan `.from('stock_movements').insert(...)` menggunakan `serverSupabaseClient` biasa, padahal policy tabel tersebut mengunci `with check (false)` untuk non-trigger/RPC. Operasi insert ini gagal dan mencatat `console.error` (baris 71). Di sisi lain, trigger `trg_products_stock_audit` sebenarnya sudah otomatis mencatat `stock_movements` saat `products.stock` diperbarui, namun belum membawa `notes` alasan restock Admin.
- **Rekomendasi:** Buat RPC atomik `admin_restock_product(p_product_id, p_variant_id, p_quantity, p_notes)` dengan penguncian baris `FOR UPDATE` dan propagasi session variable `app.stock_change_notes` ke trigger `trg_record_stock_movement`, lalu hapus insert manual dari endpoint.

### 3. [P1] Matriks Varian Produk (`product_variants`) Tanpa CRUD & Restock Admin

- **Bukti:** `server/api/products/[id]/variants.get.ts:1-35`, `app/features/products/components/ProductForm.vue:61-130`, `app/pages/admin/index.vue:140-148`
- **Masalah:** Detail produk dan RPC `create_order` sudah mendukung pilihan varian, harga override, serta pemotongan stok varian. Namun di `/admin/products`, `ProductForm.vue` hanya mengelola field produk induk dan belum menyediakan CRUD maupun restock untuk `product_variants` (padahal KPI dashboard `admin/index.vue:143` menyebut _"Varian produk perlu restock"_). Selain itu, `ProductForm.vue` masih memuat input `"Tautan Referensi (Opsional)"` (baris 116) dan placeholder `"Kemeja Linen Vintage"` (baris 69) warisan awal proyek yang tidak selaras dengan katalog peralatan kerja ShelfStack.
- **Rekomendasi:** Bangun UI editor & restock varian di `/admin/products` beserta endpoint `POST/PUT/DELETE` tervalidasi Zod, dan bersihkan field/placeholder warisan pada `ProductForm.vue`.

### 4. [P1] Kampanye Flash Sale (`flash_deals`) Tanpa CRUD Admin + Timer Tengah Malam Palsu

- **Bukti:** `app/pages/index.vue:18-23,44`, `app/components/home/HomeFlashDeals.vue:13-16`, `app/composables/useHomeFlashDeals.ts:65-87`, `PRODUCT.md:22`
- **Masalah:**
  1. Tabel `public.flash_deals` belum memiliki antarmuka manajemen maupun API tulis untuk Admin (`/admin/promotions`). Begitu kampanye seed berakhir, promo baru tidak bisa dibuat lewat panel Admin.
  2. Komentar pada `HomeFlashDeals.vue:14` menegaskan timer tidak boleh tampil tanpa jadwal backend agar terhindar dari _fake urgency_. Namun `app/pages/index.vue:19-23` masih menghitung `dailyFlashSaleEnd` ke tengah malam setiap hari dan meneruskannya ke `<HomeFlashDeals :promo-ends-at="dailyFlashSaleEnd" />`. Ditambah lagi, `useHomeFlashDeals.ts:65-87` mengisi grid dengan 4 produk katalog reguler saat `flash_deals` kosong, sehingga produk berharga normal tampil di dalam banner merah **"Flash Deals: Promo Terbatas Hari Ini"** beserta hitung mundur harian palsu.
- **Rekomendasi:** Sambungkan waktu `end_at` dan daftar item beranda secara langsung ke respons aktif `/api/promotions/flash-deals`, dan bangun halaman CRUD kampanye Flash Sale di `/admin`.

### 5. [P1] Manajemen Kategori (`categories`) Hanya Read-Only (Klaim `BACKLOG.md` `D-03` Belum Terpenuhi)

- **Bukti:** `docs/BACKLOG.md:65`, `server/api/categories/index.ts:12-87`, `app/components/home/HomeHero.vue:87,117,144`
- **Masalah:** `BACKLOG.md` menandai `D-03` (_"CRUD produk + kategori + stok"_) selesai, tetapi `/api/categories` menolak seluruh metode tulis (`405 Method not allowed`) dan belum ada UI pengelolaan kategori di Admin. Selain itu, `CANONICAL_CATEGORIES` dan `HomeHero.vue` masih mengandalkan URL eksternal `lh3.googleusercontent.com/aida-public/...` yang rawan kedaluwarsa.
- **Rekomendasi:** Sediakan endpoint CRUD + UI Admin untuk kategori (`name`, `slug`, `description`, `display_order`, upload gambar ke Supabase Storage) serta migrasikan aset statis hero/kategori ke asset internal atau bucket storage resmi.

### 6. [P1] Tiket Retur Tipe `refund` (`return_requests`) Terputus dari Alur Refund Finansial & Ledger Koin

- **Bukti:** `supabase/migrations/20261202000001_audit_remediation_transactions_and_privacy.sql:1082-1084,1270-1313`
- **Masalah:** Saat Admin mengubah tiket retur berjenis `refund` menjadi `completed`, RPC `admin_review_return_request` mengembalikan stok produk/varian, tetapi tidak membuat baris pada `public.refunds` (yang juga masih membatasi status order hanya `paid` pada `finalize_refund`), tidak mengurangi `products.sold_count`, tidak mengembalikan `coins_used`, serta tidak mencabut kembali cashback 1% (`coins_earned`) yang cair saat order `completed`.
- **Rekomendasi:** Integrasikan keputusan akhir tiket retur bertipe `refund` dengan pencatatan `public.refunds`, pengembalian/penyesuaian ledger koin (`user_coins` & `coin_transactions`), serta penyesuaian `sold_count`.

### 7. [P2] Duplikasi Rute Akun (`/account/coins` vs `/account/points`) & Endpoint Admin Tanpa Pintu Navigasi

- **Bukti:** `app/pages/account/coins.vue:1-15`, `app/pages/account/points.vue:14-18`, `app/layouts/admin.vue:17-26`
- **Masalah:** `/account/coins` me-render ulang `points.vue` dengan metadata judul SEO berbeda (_"Buku Kas Koin Loyalitas"_ vs _"Koin & Rewards"_) tanpa canonical redirect. Di panel Admin, endpoint yang sudah dibangun di backend (`/api/admin/emails/logs`, `/api/admin/emails/test`, `/api/admin/coupons/[id]/usages`) tidak seluruhnya mudah dijangkau dari alur navigasi sidebar `admin.vue`, dan pengiriman email masih mengandalkan histori in-memory tanpa tabel outbox persisten di database.

---

## 3. Bug Fungsional, UI/UX, Design System, & Copywriting

### 8. [P0] Tautan Produk 404 pada Kartu Ulasan di Beranda (`HomeReviews.vue`)

- **Bukti:** `app/components/home/HomeReviews.vue:186-190`, `app/components/home/HomeFlashDeals.vue:242`, `app/pages/product/[id].vue`
- **Masalah:** `<NuxtLink :to="'/products/' + (review.product_slug || review.product_id)">` mengarah ke prefix jamak `/products/...`, sedangkan rute aktual adalah tunggal `/product/[id]`. Setiap klik produk pada seksi ulasan beranda menghasilkan **404 Not Found**. Sementara `HomeFlashDeals.vue:242` selalu memakai `/product/${product.id}` alih-alih memprioritaskan `product.slug`.
- **Rekomendasi:** Ubah target tautan di `HomeReviews.vue` menjadi `/product/${review.product_slug || review.product_id}` dan gunakan pola yang sama (`product.slug || product.id`) di `HomeFlashDeals.vue`, serta tambahkan unit/E2E test navigasi kartu ulasan & flash deals.

### 9. [P1] Kartu Showcase Hero Beranda Bersifat Mati (`Non-Interactive Showcase`)

- **Bukti:** `app/components/home/HomeHero.vue:80-165`
- **Masalah:** Tiga ubin foto produk (_Headphone Studio ANC Rp2.680.000_, _Lampu Meja Task Rp850.000_, _Tas Komuter EDC Rp1.120.000_) menggunakan animasi hover zoom (`group-hover:scale-105`), tetapi hanya berupa `<div>` tanpa `<NuxtLink>` dan menggunakan nama/harga statis terpisah dari tabel `products` (melanggar `antislop` C-2, R-26, R-38).
- **Rekomendasi:** Ikatkan showcase hero ke produk katalog asli (dengan `<NuxtLink :to="/product/...">`) atau tampilkan label showcase editorial tanpa meniru kartu produk yang dapat diklik.

### 10. [P1] Kontradiksi Kebijakan Komersial & Klaim Angka Antar Halaman

1. **Garansi Retur `30 Hari` vs `7 Hari`**:
   - Tertulis **"Garansi/Jaminan Pengembalian 30 Hari"** di bar atas seluruh halaman (`app/components/AppNavbar.vue:104`), ringkasan keranjang (`app/components/cart/CartSummarySidebar.vue:78`), dan beranda (`app/components/home/HomeReviews.vue:43`).
   - Padahal `app/components/home/HomeAssurances.vue:43`, `app/pages/returns.vue:15`, `app/data/faqs.ts:135`, dan validasi backend memberlakukan **7 hari**.
2. **Jumlah Katalog `1.300+` vs `34+`**:
   - `app/components/home/HomeHero.vue:52` menampilkan **`1.300+ Produk Pilihan`**, sedangkan `app/pages/about.vue:51` menampilkan **`34+ Produk Terkurasi`** (bertentangan dengan larangan angka fabrikasi `antislop` R-17 & `AGENTS.md`).
3. **Batas Pembayaran `24 Jam` vs `2 Jam`**:
   - `app/data/faqs.ts:71` menyatakan batas waktu pelunasan VA & QRIS adalah **24 jam**, padahal worker `@shelfstack/order-service` (`services/order-service/src/config.ts:15`) membatalkan pesanan pending setelah **120 menit (2 jam)**.
4. **Klaim Gratis Ongkir Tanpa Syarat Minimum**:
   - `app/components/home/HomePromoCTA.vue:48` menulis _"Bebas Ongkir se-Indonesia"_ tanpa mencantumkan syarat belanja minimal `Rp500.000` yang berlaku di server.

### 11. [P1] Copywriting Beranda Mencampur Audiens Pembeli vs Admin & Redundansi 11 Kartu Jaminan

- **Bukti:** `app/components/home/HomeHero.vue:17`, `app/components/home/HomePromoCTA.vue:23-34`, `app/pages/index.vue:42-48`, `app/components/home/HomeAssurances.vue`, `app/components/home/HomeFeatures.vue`, `app/components/home/HomeReviews.vue`, `app/components/product/ProductConfigurator.vue:247`, `app/features/products/components/ProductCompactCard.vue:168`, `app/components/AppNavbar.vue:180`
- **Masalah:**
  1. Headline utama (`HomeHero.vue:17`: _"Etalase rapi di depan, operasional tertib di belakang."_) dan banner penutup (`HomePromoCTA.vue:23-34`: _"Kelola katalogmu sendiri: Masuk sebagai pemilik toko..."_) berbicara kepada pengembang/penguji portofolio, bukan pembeli toko.
  2. Beranda memuat **11 kartu klaim jaminan berulang** di tiga blok berurutan (`HomeAssurances` 4 kartu, `HomeFeatures` 3 kartu, dan `HomeReviews` 4 kartu _Empat Komitmen Layanan Resmi_).
  3. Terminologi keranjang dan loyalty tidak seragam: _"Tambah ke Bag"_, _"+ Keranjang"_, _"Keranjang Belanja"_, serta campuran _"Voucher"_ vs _"Kupon"_ dan _"Koin"_ vs _"Points"_.

### 12. [P1] Penyimpangan Design Token (`DESIGN.md`), Dark Mode Setengah Jadi, & Temuan `impeccable detect`

- **Bukti:** `app/assets/css/main.css:19,80-122`, `app/pages/account/points.vue:118-146`, `app/pages/orders/[id].vue:123`, `app/components/admin/support/AdminSupportInboxList.vue:213`, `app/components/wishlist/WishlistButton.vue:155`, `app/components/home/HomePromoCTA.vue:13`, `app/components/AppNavbar.vue:100`, hasil pemindaian statis repo
- **Masalah:**
  1. **Dark Mode Rusak & Tanpa Toggle (`antislop` R-21, R-34):** `main.css` mendefinisikan palet `.dark`, namun aplikasi tidak memiliki pengubah tema (`0` toggle), dan masih ada **`191` class `bg-white` hardcoded** pada file `.vue` yang dipasangkan dengan token `text-brand-ink` (jika `.dark` aktif, teks putih bertumpuk di atas latar putih).
  2. **Kebocoran Token Warna & Tipografi:** Terdeteksi **`324` class warna Tailwind mentah** (`emerald-*`, `amber-*`, `rose-*`, `neutral-*`, `slate-*`, `zinc-*`, `blue-*`, `red-*`), **`8` hex code langsung** di `.vue`, **`645` ukuran teks arbitrer** (`text-[9px]`..`text-[11px]`), serta **`67` kemunculan `font-mono`** (meski `--font-mono` di-map ke `DM Sans`, class `font-mono` menyalahi larangan eksplisit `DESIGN.md:121`).
  3. **Temuan `impeccable detect` & `antislop-ui`:** `border-l-4` (_side-tab accent border_) di `AdminSupportInboxList.vue:213`, kurva pegas memantul `cubic-bezier(0.175, 0.885, 0.32, 1.275)` di `WishlistButton.vue:155`, orb dekoratif `blur-3xl` di `HomePromoCTA.vue:13`, serta dot `animate-pulse` berulang pada bar teks statis `AppNavbar.vue:100`.

### 13. [P1] Celah UX 5-States, Overflow 320px, & `42` Kontrol Sentuh `< 44x44px`

- **Bukti:** `app/pages/katalog.vue:69-81,192`, `app/pages/c/[slug].vue:119-141`, `app/components/navbar/NavbarMobileDrawer.vue:47`, `app/components/product/ProductConfigurator.vue:209`, `app/features/products/components/ProductCompactCard.vue:164`, `app/components/katalog/KatalogToolbar.vue:135`, `app/components/category/CategoryToolbar.vue:69`
- **Masalah:**
  1. **Tanpa `Error State` (`ux-audit`):** `katalog.vue` dan `c/[slug].vue` tidak membaca status `error` dari `useAsyncData`. Saat API `/api/products` gagal, pengguna hanya melihat empty state _"tidak ada produk"_ tanpa pesan gangguan dan tombol _Coba Lagi_.
  2. **Overflow Horizontal 320px:** `<section class="lg:col-span-9 space-y-6">` di `katalog.vue:192` belum memiliki `min-w-0`, sehingga flex/grid di dalamnya dapat meluap melebihi lebar viewport sempit.
  3. **`42` Tombol/Tautan di Bawah `44x44px` (`antislop` R-03):** Mencakup tombol cari `w-6 h-6` (`24px`) di `NavbarMobileDrawer.vue:47`, stepper kuantitas `w-8 h-8` (`32px`) di `ProductConfigurator.vue:209`, tombol `+ Keranjang` `h-8` (`32px`) di `ProductCompactCard.vue:164`, serta pengubah mode tampilan `w-7 h-7` (`28px`) di `KatalogToolbar.vue:135` dan `CategoryToolbar.vue:69`.

### 14. [P2] Kebersihan Kode Tersisa (Strict Typing & Client Console)

- **Bukti:** `server/api/midtrans/notification.post.ts:119-132`, `server/api/products/index.ts:162`, `server/api/products/[id]/variants.get.ts:20`, `app/features/auth/composables/useAuth.ts:42`, `app/composables/useActivityLog.ts:17`, `app/features/activities/composables/useActivities.ts:37`, `app/features/notifications/stores/notifications.ts:120,142,170,237`, `app/features/wishlist/stores/wishlist.ts:112,139`
- **Masalah:** Masih tersisa **`22` kemunculan `: any` / `as any`** di luar `database.types.ts` dan **`9` pemanggilan `console.error` / `console.warn` sisi klien** tanpa guard `if (import.meta.dev)`.

---

## 4. Fitur E-Commerce yang Belum Ada (Kandidat Fase Berikutnya)

1. **Pengajuan Pembatalan / Refund Mandiri untuk Pesanan `paid` (Sebelum Dikirim):** Pelanggan saat ini hanya dapat membatalkan pesanan `pending`; pesanan `paid` yang belum memiliki resi belum memiliki alur pengajuan batal/refund dari sisi pelanggan.
2. **Panel Admin Lengkap untuk Entitas yang Sudah Punya Tabel DB:** CRUD Varian & SKU Produk, CRUD Kampanye Flash Sale (`/admin/promotions`), dan CRUD Kategori (`/admin/categories` + migrasi aset gambar ke Storage).
3. **Inbox Pesan Kontak (`/contact` -> Admin) & Persistent Email Outbox:** Menyimpan pesan kontak ke PostgreSQL, mengirim alert email, serta menyediakan tabel outbox/retry agar pengiriman email transaksional tidak bergantung pada memori proses dan aman terhadap webhook duplikat.
4. **Kalkulasi Ongkir Berbasis Wilayah Tujuan:** Menghitung estimasi ongkos kirim berdasarkan provinsi/kota tujuan (`/api/locations`) alih-alih tarif datar nasional.
5. **Pengubah Tema Light/Dark (`Theme Toggle`) Fungsional Penuh:** Menyambungkan CSS `.dark` yang sudah tersedia setelah pembersihan `191` class `bg-white` hardcoded.

---

## 5. Rencana Urutan Pengerjaan Disarankan

1. **Tahap 1 (Bug Kritis & Kejujuran Storefront):** Perbaiki link `404` `HomeReviews.vue`, hilangkan timer tengah malam palsu di `index.vue`/`HomeFlashDeals.vue`, hubungkan `/api/contact` ke penyimpanan database nyata, migrasikan `restock.post.ts` ke RPC atomik, sambungkan refund RMA ke akuntansi/koin, dan selaraskan seluruh copy & kebijakan kontradiktif (7 hari retur, batas bayar 2 jam, angka katalog dinamis, pemisahan copy pembeli vs admin).
2. **Tahap 2 (Penuntasan Fitur Admin Setengah Jadi):** Bangun CRUD Admin untuk Varian Produk, Kampanye Flash Sale, Kategori, Inbox Pesan Kontak + Outbox Email, serta pengajuan pembatalan/refund mandiri untuk order `paid`.
3. **Tahap 3 (Unifikasi Design System, UX 5-States, & A11y Mobile):** Ganti `bg-white` & warna mentah Tailwind dengan token `brand-*` + aktifkan Theme Toggle, tambahkan Error State & `min-w-0` di `/katalog` + `/c/[slug]`, perbesar `42` target sentuh ke `>= 44x44px`, dan bersihkan sisa `22` `any` + `9` `console.*`.
