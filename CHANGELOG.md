# Changelog

Catatan update untuk **Product Management** (rebrand portofolio: **ShelfStack**).

## [0.21.0] - 2026-10-30

### Pilihan Layanan & Kalkulator Ongkir Checkout (SHF-SHP-01)

- **Database Migrasi & Skema Transaksional**:
  - Migrasi `supabase/migrations/20261123000001_checkout_shipping_rates.sql` menambahkan kolom `shipping_service` (default 'reguler') dan `shipping_cost_cents` (default 0) pada tabel `public.orders`.
  - Fungsi RPC atomik `public.create_order` diperbarui untuk memvalidasi dan menghitung tarif ongkir secara aman di sisi server Postgres (anti-tamper):
    - Layanan Reguler (2-3 Hari Kerja): Rp 15.000 (Otomatis Bebas Ongkir Rp 0 jika subtotal belanja >= Rp 500.000).
    - Layanan Kilat / Next Day (1 Hari Kerja): Rp 30.000.
    - Layanan Instan / Sameday (Tiba Hari Ini): Rp 45.000.
    - Layanan Kargo Ekonomis (4-7 Hari Kerja): Rp 25.000.
  - Total pesanan akhir dihitung atomik: `v_total := greatest(0, v_subtotal - v_discount + v_shipping_cost)`.
  - Sinkronisasi snapshot tagihan langsung ke transaksi Midtrans Snap (`gross_amount = order.total_cents / 100`).
- **Server API & Schemas**:
  - `shared/schemas/shipping.ts`: Enum `shippingServiceSchema`, metadata `shippingRateTiers`, dan fungsi murni `calculateShippingFee()`.
  - `shared/schemas/order.ts`: Penambahan `shipping_service` dan `courier_code` pada `checkoutSchema`.
  - `server/utils/idempotency.ts`: Penyertaan `shipping_service` ke dalam kalkulasi deterministik `calculateCheckoutHash()`.
  - `POST /api/shipping/calculate`: Endpoint kalkulasi tarif ongkir publik untuk estimasi biaya pengiriman cepat.
  - `server/api/orders/index.ts`: Meneruskan parameter opsi pengiriman ke pemanggilan RPC `create_order`.
- **Frontend & Etalase Interaktif**:
  - Komponen `app/components/checkout/ShippingMethodSelector.vue` (187 baris): Antarmuka pemilihan 4 layanan pengiriman bertingkat dengan radio card Archival Modernist, badge Bebas Ongkir dinamis, estimasi waktu tiba, chip mitra kurir pilihan (JNE, SiCepat, J&T, Anteraja, Pos), dan aksesibilitas WAI-ARIA `role="radiogroup"`.
  - Halaman `app/pages/checkout.vue`: Integrasi pilihan kurir dengan kalkulasi ongkir reaktif pada ringkasan belanja, pengiriman parameter ke backend, dan pemeliharaan state snapshot pembayaran Midtrans.
  - Halaman `app/pages/orders/[id].vue` & `OrderInvoiceModal.vue`: Penayangan baris rincian "Biaya Pengiriman" dengan nama layanan kurir pada rincian pesanan dan cetak invoice resmi.
- **Quality Gates & Tests**:
  - `tests/unit/shipping-calculator.spec.ts`: 25 unit tests (kalkulasi tarif 4 tier, threshold bebas ongkir, proteksi non-reguler, validasi schema, API endpoint).
  - `tests/unit/shipping-selector.spec.ts`: 7 unit tests (render opsi, interaksi radio card, seleksi kurir, navigasi keyboard).
  - Total test suite: 62 test files / 605 tests lolos 100%.
  - `nuxi typecheck` EXIT 0 & `eslint .` 0 error.

## [0.20.0] - 2026-10-30

### Sistem Ulasan & Rating Produk Terverifikasi (Product Reviews & Ratings)

- **Database Migrasi & Skema Transaksional**:
  - Migrasi `supabase/migrations/20261122000001_product_reviews_and_ratings.sql` mendefinisikan tabel `public.product_reviews` dengan kolom `id`, `product_id`, `user_id`, `order_id`, `rating` (1-5), `review_text` (10-1000 karakter), dan soft-delete `deleted_at`.
  - Constraint integritas unik `(product_id, user_id, order_id)` memastikan hanya satu ulasan per transaksi produk yang dapat diajukan.
  - Partial performance index pada `product_reviews(product_id, rating)` dan `product_reviews(user_id)` dengan filter `deleted_at IS NULL`.
  - PostgreSQL trigger function `recalculate_product_rating()` yang secara otomatis menghitung ulang rata-rata rating (`products.rating`) dan total ulasan (`products.review_count`) pada setiap operasi INSERT, UPDATE, atau soft-delete.
  - Kebijakan RLS strict: pembacaan ulasan aktif diizinkan untuk semua peran (anon dan authenticated), pembuatan dan penghapusan ulasan hanya dapat dilakukan oleh pemilik akun (`auth.uid() = user_id`).
- **Nitro Server API & Service Domain**:
  - `shared/schemas/review.ts`: Skema validasi Zod untuk query parameter dan payload ulasan, utilitas masking privasi nama pengulas `formatReviewerName`, serta kalkulator agregasi distribusi bintang `calculateReviewStats`.
  - `server/utils/review.ts`: Lapisan domain service untuk verifikasi eligibilitas pesanan tuntas (`completed`), pengambilan ulasan dengan pagination dan filter rating, serta pengelolaan soft delete.
  - `GET /api/products/[id]/reviews`: Mengembalikan ulasan terpaginasi, ringkasan rating rata-rata, total ulasan, dan breakdown distribusi rating bintang (1-5).
  - `GET /api/products/[id]/reviews/eligibility`: Memverifikasi apakah pengguna yang terautentikasi berhak memberikan ulasan berdasarkan riwayat pesanan `completed`.
  - `POST /api/products/[id]/reviews`: Menerima ulasan baru dengan validasi kepemilikan transaksi pesanan.
  - `DELETE /api/products/[id]/reviews/[reviewId]`: Mengizinkan pemilik ulasan melakukan soft-delete ulasan mereka.
- **Frontend & Etalase Interaktif**:
  - `app/types/review.ts`: Kontrak antarmuka TypeScript untuk entitas ulasan dan statistik.
  - `app/components/product/ProductReviewsSection.vue`: Orkestrator bagian ulasan terpadu pada halaman `/product/[id]` dengan anchor `#reviews`, pagination adaptif, filter bintang, dan penanganan empty/loading state.
  - `app/components/product/ReviewRatingSummary.vue`: Tampilan bento ringkasan skor rata-rata dengan progress bar distribusi bintang interaktif untuk filter 1-klik.
  - `app/components/product/ReviewCard.vue`: Kartu ulasan bergaya Archival Gallery Modernist dengan sensor privasi nama (`Budi S.`), tanggal relatif terformat, dan rating bintang tanpa badge artifisial.
  - `app/components/product/ReviewEligibilityCard.vue`: Kartu pemicu ulasan kontekstual untuk pembeli terverifikasi, pengguna yang sudah mengulas, atau pengunjung umum.
  - `app/components/product/ReviewFormModal.vue`: Dialog modal interaktif berstandar aksesibilitas dengan star picker 1-5, textarea berpenghitung karakter (10-1000), penanganan error real-time, dan feedback toast.
  - `app/pages/orders/[id].vue`: Integrasi tombol "Beri Ulasan" pada daftar barang belanja pesanan berstatus `completed`.
  - `app/components/product/ProductConfigurator.vue`: Tautan rating bintang menuju anchor `#reviews` dengan smooth scrolling.
- **Quality Gates & Tests**:
  - `pnpm lint` 0 error / 0 warning.
  - `nuxi typecheck` EXIT 0 tanpa error tipe data.
  - 17 unit test di `tests/unit/review-schema.spec.ts`.
  - 11 unit test di `tests/unit/api-reviews.spec.ts`.
  - 18 unit test di `tests/unit/product-reviews-section.spec.ts`.
  - Total test suite: 60 file / 570 test lolos 100%.

## [0.19.0] - 2026-10-28

### Sistem Kupon Promo, Halaman Publik Promo & Back-Office Admin (SHF-VOUCHER)

- **Halaman Publik Promo & Voucher (/promos)**:
  - Antarmuka storefront publik (`app/pages/promos.vue`) berstandar Archival Modernist anti-AI-slop sesuai arahan design-taste-frontend.
  - Kartu voucher bergaya tiket taktil dengan perforasi potongan samping (ticket notches), chip persentase/flat, indikator kuota, dan status berlaku.
  - Aksi interaktif: salin kode promo 1-klik dengan feedback taktil, dan tombol "Gunakan di Keranjang" yang memvalidasi serta langsung menerapkan kupon ke keranjang belanja.
  - Penautan navigasi publik: rute `/promos` ditautkan pada pita kategori sub-nav dan laci navigasi mobile (`app/components/AppNavbar.vue`).
- **Halaman Back-Office Admin Kelola Voucher (/admin/coupons)**:
  - Antarmuka manajemen kupon admin (`app/pages/admin/coupons.vue`) dengan layout workspace admin terpadu (`app/layouts/admin.vue`).
  - 4 kartu metrik bento: Total Voucher, Voucher Aktif, Total Penggunaan, dan Total Penghematan Pelanggan (Rp).
  - Tabel data kupon berdensitas tinggi dengan filter status (Aktif, Nonaktif, Kedaluwarsa), filter tipe diskon, pencarian teks, dan progress bar sisa kuota.
  - Modal dialog formulir pembuatan dan pengubahan voucher dengan validasi ketat, tombol toggle aktif/nonaktif, serta dialog konfirmasi soft-delete.
- **Server API & Schemas**:
  - `shared/schemas/coupon.ts`: Skema validasi Zod untuk pembuatan kupon (`createCouponSchema`) dan pembaruan (`updateCouponSchema`).
  - `GET /api/coupons`: Endpoint publik untuk mengambil daftar kupon aktif yang siap digunakan di etalase.
  - `GET /api/admin/coupons`: Endpoint admin untuk memuat daftar seluruh kupon dan ringkasan metrik analitik.
  - `POST /api/admin/coupons`: Endpoint admin untuk menerbitkan kupon baru dengan pencegahan kode duplikat.
  - `PUT /api/admin/coupons/[id]`: Endpoint admin untuk memperbarui parameter diskon atau toggle status kupon.
  - `DELETE /api/admin/coupons/[id]`: Endpoint admin untuk melakukan soft-delete pada kupon.
- **Database Migrasi & RLS Strict**:
  - Penambahan tabel master kupon `public.coupons` (`supabase/migrations/20261121000001_coupons_and_promo_discounts.sql`) dengan kolom tipe diskon (percentage/fixed), pagu maksimal potongan, syarat minimum belanja, kuota pemakaian global dan per-user, masa berlaku, dan soft delete (`deleted_at`).
  - Penambahan tabel audit trail `public.coupon_usages` dengan relasi foreign key cascade dan constraint unik `(user_id, coupon_id, order_id)` untuk pencegahan penyalahgunaan kuota berlebih.
  - Penambahan kolom diskon pada tabel `public.orders`: `subtotal_cents`, `discount_cents`, `coupon_id`, dan `coupon_code`.
  - Pembaruan fungsi RPC `create_order` menjadi atomik dan aman: validasi kupon, penguncian baris kupon `FOR UPDATE`, kalkulasi diskon di sisi server Postgres, penambahan `usage_count`, dan pencatatan audit pemakaian.
  - Kebijakan RLS: pembacaan kupon aktif diizinkan untuk publik/authenticated, admin memiliki akses penuh, dan mutasi langsung `coupon_usages` dari sisi client dilarang keras (`with check (false)`).
- **Frontend & Komponen UI/UX**:
  - Store Pinia `useCartStore`: State `appliedCoupon`, getter `discountCents`, `finalPrice`, `formattedFinalPrice`, aksi `applyCoupon()` dan `removeCoupon()`, serta persistensi `localStorage` (`shelfstack-applied-coupon`).
  - Komponen `CartCouponInput.vue` (`app/components/cart/CartCouponInput.vue`): Form input kode voucher dengan saran kupon cepat (quick pills), chip status kupon aktif, kalkulasi penghematan, tombol hapus voucher, dan peringatan jika subtotal belum mencapai minimum belanja.
  - Integrasi Cart Drawer (`CartDrawer.vue`) & Halaman Keranjang (`cart.vue`): Input voucher pada ringkasan pesanan dengan rincian Subtotal, Diskon Kupon, dan Total Tagihan yang adaptif.
  - Integrasi Checkout (`checkout.vue`): Pengiriman kode voucher ke pembuatan pesanan dan sinkronisasi nominal pembayaran Midtrans Snap.
  - Integrasi Rincian Pesanan Pelanggan (`orders/[id].vue`) dan Admin (`admin/orders/[id].vue`): Penayangan baris rincian potongan diskon kupon.
- **Quality Gates & Tests**:
  - `pnpm lint` 0 error / 0 warning (100% clean).
  - `pnpm typecheck` EXIT 0 tanpa error tipe data.
  - 20 unit test di `tests/unit/coupon-schema.spec.ts` (validasi schema, aturan kupon, dan validasi admin schema).
  - 6 unit test di `tests/unit/api-coupons.spec.ts` (integrasi API kupon dan skenario checkout).
  - 7 unit test di `tests/unit/cart-coupon.spec.ts` (integrasi store Pinia cart dan kalkulasi kupon).
  - Total test suite: 51 file / 470 test lolos 100%.

## [0.18.0] - 2026-10-27

### Pelacakan Pengiriman & Ekspedisi Kurir (SHF-LOG-01)

- **Database Migrasi & RLS**:
  - Penambahan kolom pengiriman pada tabel `public.orders` (`supabase/migrations/20261120000001_shipping_and_order_tracking.sql`): `tracking_number`, `courier_code`, `courier_name`, `shipped_at`, `delivered_at`.
  - Penambahan tabel riwayat checkpoint ekspedisi `public.shipping_checkpoints` dengan index `(order_id, created_at desc)` dan `(tracking_number)`.
  - Kebijakan RLS terisolasi: pelanggan dapat melihat checkpoint pesanan miliknya, admin memiliki hak kelola penuh, dan penambahan ke publikasi `supabase_realtime` untuk live streaming tracking tanpa polling.
- **Server Endpoints & Logistics Utilities**:
  - `server/utils/shipping.ts`: Generator nomor resi otomatis sesuai prefix kurir (`SS-JNE-`, `SS-SCP-`, `SS-JNT-`, `SS-ANTR-`, `SS-POS-`), generator checkpoint otomatis tahap awal dan konfirmasi penerimaan, serta utilitas masking nama dan nomor telepon untuk privasi.
  - `server/api/orders/[id]/status.put.ts`: Mendukung input kurir dan resi saat status diubah menjadi `shipped`, memicu checkpoint awal dan notifikasi otomatis, serta mencatat checkpoint `delivered` saat status menjadi `completed`.
  - `server/api/tracking/search.get.ts`: Endpoint pencarian resi publik (mendukung query no resi atau ID order) dengan sensor data penerima (`recipient_name_masked`, `recipient_phone_masked`).
  - `server/api/orders/[id]/tracking.get.ts`: Endpoint pelacakan autentikasi untuk pelanggan pada pesanan spesifik miliknya.
- **Frontend & Komponen UI/UX**:
  - Komponen `OrderTrackingTimeline.vue` (`app/components/orders/OrderTrackingTimeline.vue`): Linimasa vertikal dengan status badge, detail lokasi hub, timestamp, dan tombol salin resi instan.
  - Halaman publik `/tracking` (`app/pages/tracking.vue`): Formulir pencarian nomor resi dengan deep-link `?q=`, kartu privasi data, dan integrasi navigasi dari header bar atas serta footer.
  - Integrasi Admin Detail Pesanan (`app/pages/admin/orders/[id].vue`): Modal pengiriman dengan pilihan kurir resmi, tombol 1-klik "Resi Otomatis", dan visualisasi linimasa langsung pada panel admin.
  - Integrasi Detail Pesanan Pelanggan (`app/pages/orders/[id].vue`): Kartu pelacakan kurir terpadu yang muncul otomatis saat pesanan berstatus `shipped` atau `completed`.
- **Quality Gates**:
  - `pnpm lint` 0 error / 0 warning (100% clean).
  - `pnpm typecheck` EXIT 0 tanpa error tipe data.
  - 9 unit test komprehensif baru di `tests/unit/shipping-tracking.spec.ts`.
  - Total test suite: 48 file / 436 test lolos 100%.

## [0.17.0] - 2026-10-27

### In-App Notification Center & Realtime Broadcast (SHF-NOTIF-01)

- **Database Migrasi & RLS Strict**:
  - Penambahan tabel `public.notifications` (`supabase/migrations/20261119000001_in_app_notifications.sql`) dengan relasi cascade ke `auth.users`, constraint tipe notifikasi resmi (`order_created`, `payment_success`, `order_shipped`, `order_cancelled`, `order_completed`, `system`), index komposit `(user_id, is_read, created_at desc)`, dan kebijakan RLS multi-tenant terisolasi.
  - Integrasi publikasi Supabase Realtime (`alter publication supabase_realtime add table public.notifications`) untuk siaran pembaruan notifikasi live ke pelanggan.
- **Server Endpoints & Transactional Event Triggers**:
  - `GET /api/notifications`: memuat 30 notifikasi terbaru milik pengguna terautentikasi dan menghitung unread count secara atomik.
  - `PATCH /api/notifications/read-all`: menandai semua notifikasi aktif sebagai telah dibaca.
  - `PATCH /api/notifications/[id]/read`: menandai satu notifikasi spesifik milik pengguna sebagai dibaca.
  - Pemicu otomatis pada siklus transaksi:
    - `order_created`: saat pesanan berhasil dibuat di checkout (`server/api/orders/index.ts`).
    - `payment_success`: saat pembayaran terkonfirmasi via webhook Midtrans (`server/api/midtrans/notification.post.ts`).
    - `order_shipped` & `order_completed`: saat status pesanan diubah oleh admin (`server/api/orders/[id]/status.put.ts`).
    - `order_cancelled`: saat pesanan dibatalkan (`server/api/orders/[id]/cancel.post.ts`).
- **State Management & Frontend UI/UX**:
  - Pinia store `useNotificationStore` (`app/features/notifications/stores/notifications.ts`) dengan optimis update, listener realtime `postgres_changes`, cursor-based pagination (`loadMore`, `hasMore`, `nextCursor`), dan integrasi HTML5 Web Notification API untuk notifikasi desktop browser.
  - Komponen `NotificationBell.vue` (`app/components/notifications/NotificationBell.vue`) diposisikan pada pita atas gelap (_top announcement bar_) dengan varian `dark`, membersihkan kluster kanan navbar utama agar lebih kompak dan lega.
  - Halaman penuh Pusat Notifikasi (`app/pages/notifications.vue`) dengan filter tab (Semua, Belum Dibaca, Pesanan & Pembayaran, Sistem), kontrol notifikasi browser, dan cursor pagination.
  - Integrasi menu Notifikasi pada drawer navigasi mobile lengkap dengan badge penghitung belum dibaca.
- **Quality Gates**:
  - Zero ESLint error dan zero warning (100% clean gate).
  - `nuxi typecheck` EXIT 0 tanpa error tipe data.
  - 19 unit test terverifikasi di `tests/unit/api-notifications.spec.ts` dan `tests/unit/notification-store.spec.ts`, total suite 47 file / 427 test lolos 100%.

## [0.16.0] - 2026-10-26

### Penyatuan Geometri & Primitif Etalase Publik

- **Unifikasi Geometri & Token Semantik**:
  - Penyatuan skala radius ke `rounded-card` (14px) dan `rounded-field` (10px) di seluruh etalase:
    `KatalogToolbar`, `KatalogSidebar`, `KatalogMobileFilter`, `ProductCard`, `ProductGallery`,
    `ProductConfigurator`, `CartDrawer`, `cart.vue`, `checkout.vue`, `SavedAddressSelector.vue`, dan `AppNavbar`.
  - Migrasi palet hardcoded (`slate-*`, `zinc-*`, `rose-*`, `emerald-*`, `#18191b`) menjadi token semantik brand:
    `bg-brand-canvas`, `bg-brand-canvas-soft`, `text-brand-ink`, `text-brand-muted`, `border-brand-hair`,
    `bg-brand-danger-tint`, `bg-brand-success-tint`, `bg-brand-warning-tint`, dan `text-brand-success-text`.
  - Penanganan void tag ESLint: eliminasi warning `vue/html-self-closing` pada void element `<img/>` dan `<input/>`
    di komponen etalase publik (berkurang dari 32 menjadi 18 warning pre-existing).
  - Perbaikan kontrak heading SEO dan Playwright: penambahan semantic `<h1>Katalog</h1>` pada header `app/pages/katalog.vue`.

### Arsitektur Pesanan & Pembayaran (ADR 005)

- **Pemisahan State Pesanan dan State Pembayaran**:
  - Dokumentasi ADR 005 (`docs/ADR/005-order-state-payment-state-separation.md`) yang menetapkan pemisahan mutlak
    antara status pesanan bisnis (`pending`, `processing`, `shipped`, `delivered`, `cancelled`) dan status pembayaran (`pending`, `paid`, `failed`, `refunded`, `expired`).
  - Ekstraksi kartu pesanan mandiri (`app/features/orders/components/OrderCard.vue`) dengan visual status ganda
    yang jelas dan pemisahan tombol aksi Bayar (Snap Popup langsung) dan Lihat Detail.
  - Alur Beli Lagi (`reorder`): menyalin item pesanan terdahulu ke keranjang belanja aktif dan mengarahkan ke `/cart`.
  - Gating cetak invoice: dibatasi hanya untuk pesanan dengan status lunas, dikirim, atau selesai (`paid`, `shipped`, `delivered`).
  - Pencegahan polling flicker pada halaman `/orders/[id]`: pemisahan flag `isSilentChecking` (polling 3.5 detik)
    dan `isManualChecking` (tombol Cek Status oleh pengguna) agar interaktivitas tombol stabil.
  - Restock atomik pada pembatalan pesanan oleh pengguna dengan validasi alasan pembatalan dan pencatatan audit log.

### Dropdown Primitif Kustom (`UiSelect`)

- Penggantian elemen `<select>` native di etalase dan panel back-office dengan primitif kustom `UiSelect`.
- Dukungan penuh navigasi keyboard (Arrow Down/Up, Enter, Escape, Space, Home, End) serta penanganan penumpukan z-index
  terisolasi (`isolation: isolate`) pada kartu katalog.

### Domain Glossary

- Inisialisasi `GLOSSARY.md` di root repositori untuk membakukan definisi istilah domain (On-hand Stock, Reserved Stock,
  Available Stock, Snap Token, Order Expiry Sweep, Double-entry Ledger, Soft Delete).

### Redesign Split Layout Halaman Autentikasi

- **Penyusunan Ulang Tampilan Login & Register (`AuthCard.vue`, `login.vue`, `register.vue`)**:
  - Transformasi kartu form menjadi layout split 2-kolom: kolom kiri memuat visual arsitektural kurasi galeri ShelfStack (`/images/auth-showcase.jpg`) dan wordmark insignia resmi, kolom kanan memuat formulir autentikasi.
  - Kompak pada viewport: penataan form yang efisien dan grid 2-kolom untuk sandi pada registrasi sehingga halaman muat tanpa scrolling berlebih pada resolusi desktop standar.
  - Eliminasi trust badges redundan: penghapusan ikon 'Belanja Aman • Privasi Terjaga' dan 'Keamanan Terjamin • Checkout Lebih Cepat'.
  - Show Password Toggle: penambahan fitur interaktif tampilkan/sembunyikan kata sandi pada `UiInput` dan `AuthFormInput` dengan status aria-label yang aksesibel (+4 unit test di `tests/unit/auth-redesign.spec.ts`).

### Wishlist System (Koleksi Produk Tersimpan)

- **Implementasi Store & UI Wishlist**:
  - Store Pinia `useWishlistStore` (`app/features/wishlist/stores/wishlist.ts`) dengan arsitektur hybrid: local-first untuk guest dan otomatis sinkronisasi dua arah ke database saat login.
  - Komponen `WishlistButton.vue` dengan micro-animation spring physics, toggle state, aria-label aksesibel, dan integrasi primitif `UiTooltip` konsisten (posisi bottom, align end) yang terisolasi di dalam batas kartu produk tanpa clipping.
  - Integrasi kartu produk (`ProductCard.vue`): tombol love overlay di pojok kanan atas dengan stop propagation dan tooltip yang aman dari clipping `overflow-hidden`.
  - Integrasi konfigurator detail produk (`ProductConfigurator.vue`): tombol love inline sejajar dengan aksi Tambah ke Bag.
  - Integrasi navbar (`AppNavbar.vue`): navigasi langsung ke `/wishlist` dan dynamic badge counter item pada desktop dan mobile menu.
  - Halaman mandiri `/wishlist` (`app/pages/wishlist.vue`): tata letak gallery modernist, breadcrumbs ringkas, margin dan padding selaras dengan halaman pesanan, grid kartu produk tersimpan, aksi "Pindahkan ke Bag" per item maupun sekaligus (`moveAllToCart`), serta empty state elegan.
- **Integrasi Database Supabase & Server Nitro**:
  - Migrasi skema database `supabase/migrations/20261118000001_user_wishlists.sql` dengan relasi `user_id` ke `auth.users`, `product_id` ke `public.products`, composite unique constraint `(user_id, product_id)`, serta RLS policies terisolasi per user (`(select auth.uid()) = user_id`).
  - Skema Zod validasi input `shared/schemas/wishlist.ts` (`WishlistAddInput`, `WishlistDeleteInput`, `WishlistSyncInput`).
  - Nitro API route handlers: `GET /api/wishlist`, `POST /api/wishlist`, `DELETE /api/wishlist`, dan `POST /api/wishlist/sync` menggunakan query selektif non-destruktif yang 100% kompatibel dengan RLS policies.
  - Ketahanan Hard Refresh: penambahan watcher reaktif sesi auth Supabase pada hidrasi client dan inisialisasi store pada lifecycle mount agar item wishlist tidak hilang saat pengguna melakukan hard reload (`Ctrl + Shift + R`).
  - Penyeragaman seluruh istilah antarmuka dan pesan respon server menjadi "Wishlist".
- **Pengujian Unit**:
  - Penambahan 9 unit test di `tests/unit/wishlist-store.spec.ts` (menguji inisialisasi, penambahan, pencegahan duplikat, toggle, pemindahan ke keranjang, dan persistensi).
  - Penambahan 9 unit test di `tests/unit/api-wishlist.spec.ts` (menguji validasi skema Zod dan invariant keamanan isolasi data RLS per tenant).

### Peningkatan Tab Bar Favicon & Tata Arsip Dokumentasi

- **Aset Favicon Browser**:
  - Desain ulang ikon tab browser `public/favicon.svg` dengan proporsi diperbesar (zoomed squircle), kontras rak tebal, dan aksen biru kobalt ShelfStack.
  - Pembuatan bundel aset produksi: `favicon-32x32.png`, `apple-touch-icon.png`, dan `favicon.ico`.
  - Integrasi cache-busting `?v=2` pada `nuxt.config.ts` dan `app/app.vue`.
- **Restrukturisasi Dokumentasi Proyek**:
  - Pembersihan folder `docs/`: merelokasi berkas usang dan artefak Stitch ke `docs/archive/` dilengkapi `docs/archive/README.md`.
  - Pembaharuan master index `docs/README.md` dan ringkasan standup `docs/standup/README.md`.

### Gate Kualitas (dijalankan aktual 2026-10-26)

- `pnpm typecheck` (`nuxi typecheck`): EXIT 0 (0 error).
- `pnpm lint`: EXIT 0 (0 error, 0 warning, 100% clean).
- `pnpm exec vitest run`: 45 test files, 408 test lolos (100% pass).

## [Unreleased] - unify auth area (2026-10-16)

### Perubahan

- Fase 1 unifikasi etalase: area auth memakai primitif brand penuh.
  `AuthFormInput` menjadi adapter tipis di atas `UiInput` (kontrak props dan emit
  `clearError` dipertahankan, slot `label` yang tidak dipakai siapa pun dibuang).
- `AuthCard` memakai `rounded-card` tunggal (sebelumnya `rounded-2xl` di mobile dan
  `rounded-3xl` di desktop). `AuthSubmitButton` dan tombol Google login/register
  melepas override `h-11` sehingga geometrinya milik `UiButton` sepenuhnya.
- Tombol pill hand-rolled di success state reset-password menjadi
  `UiButton to="/auth/login"`, ikon `text-green-500` menjadi `text-brand-success-text`.
- Efek samping: satu warning `vue/html-self-closing` hilang (32 menjadi 31).

### Gate (dijalankan aktual 2026-10-16)

`pnpm typecheck` EXIT 0, `pnpm lint` 0 error / 31 warning (pre-existing),
`pnpm exec vitest run` 37 file / 357 test lolos, detector impeccable `[]`,
screenshot login + register desktop 1440x900 dan mobile 390x844 lolos.
Satu-satunya console error adalah 404 `apple-touch-icon.png` (pre-existing,
aset statis hilang, di luar scope).

## [Unreleased] - vocabulary completion (2026-10-16)

### Perubahan

- `AdminStatCard` prop `color` memakai union semantik
  `'success' | 'warning' | 'danger' | 'info' | 'neutral'` (tipe ekspor `AdminStatTone`).
  Pemetaan ke ramp brand tidak berubah, hanya nama kontraknya. Empat call site
  di `app/pages/admin/index.vue` dimigrasi. Tidak ada test yang mengikat nama lama.
- 20 em dash di luar admin dihapus: 13 judul SEO memakai `-` (selaras judul admin),
  4 komentar kode memakai `:`, tombol `Tambah ke Bag` memakai `·` (selaras pita promo),
  label sortir memakai `A-Z`. Nol em dash tersisa di `app/`.

### Gate (dijalankan aktual 2026-10-16)

`pnpm typecheck` EXIT 0, `pnpm lint` 0 error / 32 warning (pre-existing),
`pnpm exec vitest run` 37 file / 357 test lolos, detector impeccable `[]`.

## [Unreleased] - redesign admin ke primitif brand (2026-10-16)

### Keputusan

PrimeVue dihapus sepenuhnya dari aplikasi. Penyebabnya bukan selera: `darkModeSelector: 'system'`
di `nuxt.config.ts` membuat komponen PrimeVue mengikuti dark mode OS, sementara token Tailwind
`brand-*` mengikuti class `.dark` yang tidak pernah dipasang. Kedua sistem theming hidup
bersamaan dan menghasilkan halaman setengah gelap (tab tak terlihat, dialog gelap di atas form terang).
Satu kosakata komponen menghapus dual theming itu.

`primeicons` tetap dipakai. Itu font ikon, bukan pustaka komponen, dan dipakai lintas etalase.

### Primitif baru (`app/components/ui/`)

- `UiModal`: teleport ke body, focus trap, scroll lock, tombol Escape, `aria-modal`. Wrapper `ClientOnly` supaya aman SSR.
- `UiSelect`, `UiTextarea`, `UiFileField`: kontrol formulir brand. `UiFileField` menegakkan JPEG/PNG/WebP dan batas 5 MB di dalam komponen.
- `UiTabs`: pil ter-segmentasi dengan `role="tablist"`, navigasi panah, Home/End.
- `UiSortHeader`, `UiSkeleton`, `UiIconButton`, `UiEmptyState`, `UiAlert`.
- `UiToastHost` + `useUiToast`, `UiConfirmHost` + `useUiConfirm`: menggantikan `<Toast>` dan `<ConfirmDialog>` global.
- `UiBadge`, `UiButton`, `UiInput` ditulis ulang ke token semantik dan `useId()` (sebelumnya `Math.random()` sebagai id, tidak aman SSR).

### Ramp status semantik (satu resep untuk badge, alert, toast, KPI)

Tiap status punya tiga lapis: warna teks, latar, garis tepi.
`--brand-success`, `--brand-warning`, `--brand-danger`, `--brand-accent`, masing-masing dengan
`-tint`, `-edge`, dan `-text`. Lapisan `-text` dipilih gelap supaya rasio kontras di atas
tint tetap di atas 4.5:1. Palet `surface-*` dan `primary-*` (yang diturunkan dari `--p-*` PrimeVue)
dihapus dari `tailwind.config.js`.

`--brand-muted` digelapkan ke `#5c5f64` dan `--brand-faint` ke `#6f7279` supaya teks pendukung
dan placeholder naik dari 2.56:1 ke di atas 4.5:1.

### Browser surfaces

Blok CSS `.p-toast` sepanjang 260 baris (hex hardcoded, `border-left: 5px`) dihapus, digantikan
tema scrollbar, `::selection`, caret, autofill, dan `.tabular` untuk kolom rupiah.

### Perbaikan fokus dan hydration

- Indikator fokus kini satu aturan global `:focus-visible` memakai `outline`, bukan `ring`.
  Sebelumnya tiap primitif membawa `focus-visible:ring-2` sehingga `UiInput` menampilkan dua
  cincin fokus bertumpuk. `outline-none` pada `UiInput`/`UiSelect`/`UiTextarea` ikut dibuang
  karena menindih aturan global.
- `UiModal` dan `UiToastHost` dibungkus `ClientOnly`. Log dev server menunjukkan
  "Hydration children mismatch" dan "Hydration class mismatch" pada kedua host sebelum perbaikan ini.
- `app/pages/auth/callback.vue` masih memuat `<ProgressSpinner>` PrimeVue yang tidak lagi ter-resolve
  setelah modul dicabut. Diganti spinner CSS brand.

### Skrip sekali jalan

Empat skrip `scripts/*.mjs` dipakai untuk transformasi massal dan sudah dihapus setelah dipakai.
Catatan operasional: `Set-Content`/`Out-File` PowerShell merusak UTF-8 di repo ini (em dash jadi
mojibake plus BOM). Semua transformasi massal harus lewat Node.

### Gate (dijalankan aktual 2026-10-16)

`pnpm typecheck` EXIT 0, `pnpm lint` 0 error / 32 warning (`vue/html-self-closing`, pre-existing),
`pnpm exec vitest run` 37 file / 357 test lolos, detector impeccable `[]`.
Screendesktop 1440x900 dan mobile 390x844 untuk 4 halaman admin plus dialog Tambah Produk:
2 passed, 0 console error.

### Di luar scope

Redesign ini hanya menyentuh admin. Etalase publik masih memakai komponen lamanya
(`AppNavbar`, `ProductList`, `KatalogToolbar`, dan lain-lain) yang sekarang tidak punya
pasangan primitif. Token `brand-*` sudah menjadi satu-satunya sumber warna, jadi etalase tidak
rusak, tapi belum disatukan geometrinya. Ada 21 em dash tersisa di halaman etalase, `AppNavbar`,
dan komponen auth yang belum disentuh.

## [Unreleased] — audit docs & agent rules (2026-10-11)

### Audit (read-only, terverifikasi file:line)

- Baseline aktual: `typecheck` EXIT 0 · `lint` 0 error/32 warning · `vitest run` 33 file/310 test lolos.
- Auth endpoints: tidak ada mutasi tanpa auth; 3 inkonsistensi rendah dicatat di `docs/PROGRESS.md` Known Gaps (R-1 rate-limit `snap-token` vs `payment-token`, R-2 admin ditolak di `payment-token`, R-3 pola admin di `addresses/[id].ts`).
- F0-01 SELESAI: `database.types.ts` disinkron manual dari migrasi (2 tabel + 7 kolom + signature `create_order` + enum `order_status` di Constants); `typecheck` tetap EXIT 0 tanpa fallout. `supabase gen types` ulang tetap disarankan saat CLI terautentikasi.
- F0-02 SEBAGIAN: klaim "seed rusak" DICABUT setelah verifikasi byte-level — sintaks `DO UPDATE SET` valid; flag indexer adalah keterbatasan grammar. AC jumlah seed dikoreksi ke 5/5/2. Runtime (`pgcrypto`, `auth.*`) belum terverifikasi tanpa DB live.
- Koreksi temuan: `.github/workflows/ci.yml` ADA (bukan kosong); payment = Midtrans Sandbox asli (bukan mock).

### Eksekusi temuan audit (2026-10-11)

- T-7: `transition_order_status` kanonis **terbukti** menulis `activity_logs` transaksional — AC D-02 terpenuhi tanpa perubahan kode.
- T-3: rate-limit menunjuk `payment-token`; rule mati `/api/checkout` dihapus.
- T-4: `payment-token` ikut pola owner + admin bypass (konsisten 3 endpoint lain).
- T-5: `addresses/[id].ts` memakai `existing.user_id` untuk semua query lanjutan; +3 regression test admin; perbaiki 1 tipe helper test lama.
- T-6: export CSV filter tanggal `from`/`to` (helper murni `parseExportDateRange` + input tanggal di UI + `refunded` di allowlist); +5 unit test.
- Gate akhir: `typecheck` EXIT 0 · `lint` 0 error/32 warning (tanpa warning baru) · `vitest run` 33 file/**318 test lolos** (+8).

### Follow-up LSP + gate typecheck (2026-10-12)

- `refund.post.ts`: tipe inline `gatewayResult` diganti interface kanonis `MidtransRefundResult` (sudah menampung `bankConfirmedAt`).
- `activities.post.ts`: `entity_id` kini wajib di skema (selaras DB `NOT NULL` + satu-satunya caller selalu mengisi); payload tanpa itu ditolak 400, bukan 500.
- Koreksi metodologi: `pnpm typecheck` (`vue-tsc --noEmit`) terbukti memeriksa 0 file. Pemeriksa real `pnpm exec nuxi typecheck` menemukan ±29 error pre-existing di 6 file yang tidak tersentuh sesi ini (inventaris di `docs/PROGRESS.md` Known Gaps no. 6). Klaim hijau sebelumnya untuk `typecheck` dicabut.

### Perbaikan error typecheck real (2026-10-12)

- Zod 3 → 4: `required_error` menjadi `error` di `shared/schemas/address.ts` (5 situs).
- Guard `undefined`: `server/utils/idempotency.ts`, index array di `app/pages/orders/index.vue`.
- `UiInput` menerima `modelValue` undefined; `admin.vue` memakai alias `signOut` (tombol logout sebelumnya mati); generic eksplisit `$fetch` di `katalog.vue`; `@types/node` masuk root devDependencies.
- Hasil: `pnpm exec nuxi typecheck` EXIT 0 · `lint` 0 error · `vitest` 33 file/318 test lolos.

### Penjaga env server (2026-10-12)

- Diagnosis kegagalan E2E CI: tanpa Supabase URL/Key, plugin server `@nuxtjs/supabase`
  melempar saat setup sehingga setup pinia terlewat dan hook `app:rendered`
  crash (`.state` of undefined) di semua halaman SSR, menutupi error asli.
- Plugin Nitro `server/plugins/00.env-guard.ts` + `shared/utils/env-guard.ts`
  (+4 unit test): server menolak boot dengan pesan jelas bila konfigurasi
  belum lengkap. Terbukti: tanpa env → fatal eksplisit; dengan env → 200.

### Gate typecheck jujur (2026-10-12)

- Script `pnpm typecheck` diganti dari `vue-tsc --noEmit` (terbukti memeriksa 0 file)
  ke `nuxi typecheck`, sehingga gate lokal dan CI memeriksa proyek app + server
  secara nyata. Terverifikasi EXIT 0 sebelum diganti.

### Filter audit aktivitas D-04 (2026-10-16)

- Halaman `/admin/activities` kini punya filter aksi (tab Semua/CREATE/UPDATE/DELETE/RESTORE)
  dan filter entitas (dropdown dinamis dari data), penghitung hasil, dan tombol reset.
- Logika filter murni di `app/features/activities/utils/activity-filter.ts` (+10 unit test).
  Realtime tetap jalan karena filter berupa computed di atas data yang sama.

### Redesign konsistensi dashboard admin (2026-10-16)

- Seluruh permukaan admin disatukan ke token `brand-*`: `activities.vue` dan
  `ActivityDetailDialog.vue` lepas dari palet `surface/zinc` dan hex hardcoded,
  resep error/danger/success satu rasa, radius `rounded-card/2xl`, shadow whisper.
- Tabel pesanan: header ID Pesanan, Pelanggan, Tanggal, Total bisa diklik untuk
  sort (siklus desc, asc, mati) via param `sort` allowlist di `GET /api/admin/orders`
  (+11 unit test). Ekspor CSV mengikuti sort aktif.
- Tabel produk: sort client (Nama A-Z, Termurah, Termahal, Stok tersedikit) via
  helper murni `product-sort.ts` (+11 unit test), tanpa ubah store/API/kontrak publik.
- `font-mono` untuk ID/SKU dipertahankan (back-office, bukan elemen commerce).

### Changed

- Sinkronisasi docs: `PROGRESS.md` (v0.15.0 + Fase 4 + Known Gaps), `README.md` (11 scripts + stack + CI), `docs/README.md` (indeks baru), `BACKLOG.md` (K-04 sandbox, Q-01 CI ada), `ARCHITECTURE.md` + `DESIGN-ECOMMERCE.md` (Nuxt 4), `package.json` version → `0.15.0`.
- `AGENTS.md`: stack jujur (BullMQ = TODO), section Commands + Documentation Hierarchy + MCP Tooling.
- `docs/PULL_REQUEST_TEMPLATE.md` → `.github/PULL_REQUEST_TEMPLATE.md` (agar dibaca GitHub).

### Removed

- `GEMINI.md` (duplikat identik AGENTS.md), `docs/PROMPT.md`, `docs/SUPABASE-CRUD-TUTORIAL.md`, `docs/observability.md` (stub rusak), `docs/stitch_*/design.md` (duplikat mobbin).

## [v0.15.0] - 2026-10-09

### Changed

- **Architectural Modernist Design System & Premium Visual Pass**:
  - **Geometry Scale & Token Unification (`app/assets/css/main.css`)**: Refaktor skala radius dari sudut membulat generik (`>= 24px`) menjadi skala geometri arsitektural terukur (`--radius-sm: 8px`, `--radius-md: 12px`, `--radius-card: 14px`, `--radius-media: 12px`). Warna monokrom ink-first (`#141414`), garis tepi hairline halus (`#e4e5e7`), kanvas sejuk (`#f8f8f9`), dan teks sekunder muted (`#66686d`).
  - **Product Card Architecture (`ProductCard.vue`)**: Menggantikan pita 3D skeuomorfik dengan badge status pill mengambang yang ringkas; eliminasi fallback rating 5.0 dan angka penjualan statis yang tidak berdasar; penambahan deteksi error gambar pre-hydration SSR untuk mencegah frame gambar rusak.
  - **Product Detail Polish (`ProductConfigurator.vue` & `ProductGallery.vue`)**: Menghilangkan rating 4.92 default tanpa ulasan nyata; integrasi strip jaminan fulfillment ringkas ("Gudang Jakarta", "Garansi Toko Resmi", "Midtrans Terenkripsi"); penyatuan tombol "Pesan Cepat 1-Klik" menjadi outline elegan tanpa clashing dengan tombol utama; penanganan fallback gambar multi-angle.
  - **Storefront & Catalog Polish**: Standardisasi toolbar katalog dan active filter pill badge; kanvas harga pada hero mosaic menggunakan tipografi tabular bersih tanpa aksen elektrik; `HomeFlashDeals.vue` kini menggunakan placeholder bermerek yang konsisten saat URL gambar tidak tersedia tanpa gambar jam tangan acak.
  - **Cart, Checkout, & Admin Surfaces**: Sidebar checkout dan cart diselaraskan dengan token `rounded-card` dan bayangan lembut; KPI dashboard admin (`AdminStatCard.vue`) dan tabel transaksi terintegrasi dengan elevasi monokromatis modern.
  - **Visual QA Capture Automation (`scripts/capture-visual-qa.mjs`)**: Otomasi Playwright headless yang mendukung `--env-file=.env` dan autentikasi admin sesi penuh untuk verifikasi visual desktop (1440x900 @ 2x) dan mobile (375x812 @ 2x Touch).

## [v0.14.0] - 2026-10-09

### Added

- **Multi-Agent Batch 1 Product Hardening & Enhancements**:
  - **Isolated Admin Layout & Back-Office Navigation**: Desain ulang `app/layouts/admin.vue` memisahkan header/footer publik, menyediakan topbar breadcrumb dedicated dan mobile drawer navigation.
  - **Stock Movement Ledger Modal (`/admin/products`)**: Modal riwayat pergerakan stok real-time terhubung ke endpoint `/api/admin/products/:id/stock-movements`.
  - **Interactive Multi-Angle Gallery (`/product/:id`)**: Komponen `ProductGallery.vue` dengan pemilih thumbnail multi-angle reaktif.
  - **Deterministic Search Debounce (`/katalog`)**: Debounce 300ms pada pencarian teks katalog untuk mencegah request flooding.
  - **Local Seed Data Accounts**: Akun demo deterministic (`customer@shelfstack.local` & `admin@shelfstack.local`) dengan guardrails keamanan local-only.
  - **CI & Build Pipeline**: Menambahkan step typecheck `vue-tsc --noEmit` dan `nuxt build` pada GitHub Actions CI.

- **Multi-Agent Batch 2 Full-Stack Completion**:
  - **Browser E2E User Journey Suite (Playwright)**: Suite E2E komprehensif `tests/e2e/full-business-journey.spec.ts` dan 6 Page Object Models (`LoginPage`, `CatalogPage`, `CartDrawer`, `CheckoutPage`, `OrderDetailPage`, `AdminDashboardPage`) mencakup 6 journey bisnis inti.
  - **Persisted Shipping Address Management (Supabase)**: Skema database migrasi `20261117000001_user_addresses.sql` dengan RLS granular per user, validasi Zod `shared/schemas/address.ts`, endpoint REST `/api/addresses`, composable `useAddresses.ts`, serta pemilih alamat tersimpan `SavedAddressSelector.vue` di checkout dengan auto-fill dan opsi simpan.
  - **Dynamic Real-Data Homepage**: `HomeFlashDeals.vue` kini menggunakan data produk nyata dari store katalog dengan live countdown timer menuju tengah malam; `HomeReviews.vue` ditransformasi menjadi Pusat Jaminan Kualitas & Integritas Produk (anti-fake review); `HomeFeaturedCategories.vue` terhubung ke kategori dinamis.
  - **Payment & Sandbox Copywriting Truthfulness**: Copywriting checkout dan cart diperbaiki secara dinamis agar tidak mengklaim mode Sandbox sebagai transaksi produksi.

## [v0.13.5] - 2026-10-08

### Changed

- **Premium Toast Notification Redesign (Zero-Blur & High-Contrast)**:
  - Menggantikan default blur & transparansi pucat (Aura theme 84% transparency & backdrop-blur) pada PrimeVue Toast dengan card solid opaque 100% berstandar modern luxury e-commerce (Vercel/Stripe/Sonner standard).
  - Indikator aksen ketegasan warna solid (border kiri 5px & badge pill melingkar) untuk setiap severity: Hijau zamrud (`#10b981`) untuk Sukses, Merah (`#ef4444`) untuk Error, Biru Elektrik (`#0066ff`) untuk Info, dan Amber (`#f59e0b`) untuk Warning.
  - Tipografi tajam dengan font DM Sans (headline bold 13.5px `#0f172a`, teks deskripsi 12px `#475569`, bebas dari efek kabur/milky).
  - Reposisi default Toast dari `bottom-left` ke `bottom-right` yang lebih ergonomis pada desktop dan adaptif full-width pada mobile (<640px).

## [v0.13.4] - 2026-10-08

### Added

- **Zero-Refresh Real-Time Status Synchronization (`/orders` & `/orders/[id]`)**:
  - Implementasi background active sync polling (interval 3.5s - 4s) pada pesanan dengan status `pending` di kedua halaman (`/orders` dan `/orders/[id]`), berhenti otomatis begitu status berubah menjadi `paid` atau `cancelled`.
  - Event listener `visibilitychange` dan window `focus` yang secara instan memicu pemeriksaan status pembayaran saat pengguna kembali ke tab ShelfStack setelah menyelesaikan transfer di simulator Midtrans atau mobile banking.
  - Supabase Realtime channel subscription pada `/orders` (filter `user_id=eq.${user.id}`) dan `/orders/[id]` (filter `id=eq.${orderId}`) untuk update reaktif instan ke status `paid` tanpa memerlukan reload atau penyegaran browser manual.
  - Multi-candidate order ID lookup pada `POST /api/orders/[id]/check-payment-status` untuk mendukung query order ID asli, retry suffix, maupun `midtrans_id`.

## [v0.13.3] - 2026-10-08

### Added

- **Midtrans Payment Status Check & Sync (Shopee/Tokopedia UX Standard)**:
  - Endpoint baru `POST /api/orders/[id]/check-payment-status` untuk query langsung ke Midtrans Transaction Status API (`/v2/{order_id}/status`) dan sinkronisasi otomatis ke database Supabase via RPC atomik `handle_payment_webhook`.
  - Tombol _"Cek Status Pembayaran"_ pada halaman detail pesanan pending, memungkinkan pengguna memverifikasi pelunasan transfer bank/VA secara instan tanpa tergantung pada webhook inbound saat testing di localhost.
  - Auto-synchronization di background saat halaman pesanan dibuka atau saat modal Snap ditutup.

## [v0.13.2] - 2026-10-08

### Fixed

- **Order Cancellation Schema & Error Sanitization**:
  - Menambahkan kolom `cancelled_at` dan `cancellation_reason` pada tabel `public.orders` via migrasi `20261102000001_add_cancellation_fields_to_orders.sql`, memperbaiki error `42703: column "cancelled_at" of relation "orders" does not exist` saat memanggil RPC `cancel_order`.
  - Sanitasi pesan error pembatalan pesanan pada `server/api/orders/[id]/cancel.post.ts` agar pesan teknis database internal tidak bocor ke antarmuka pengguna (UX hygiene).

## [v0.13.1] - 2026-10-08

### Fixed

- **CSP WebSocket Violation**: Menambahkan `wss://*.supabase.co` serta endpoint Midtrans ke CSP `connect-src`, `script-src`, dan `frame-src` pada `nuxt.config.ts`, memperbaiki koneksi realtime status pesanan.
- **Midtrans Duplicate Order ID Resiliency**:
  - Menyimpan `snap_token` menggunakan `serverSupabaseServiceRole` sehingga token tersimpan secara permanen di database tanpa terblokir aturan RLS.
  - Menambahkan retry fallback otomatis dengan unique attempt suffix (`${order.id}-R${timestamp}`) ketika Midtrans menolak pembuatan token dengan pesan error `order_id sudah digunakan`.
  - Normalisasi `order_id` pada webhook Nuxt dan `@shelfstack/order-service` via `extractBaseOrderId` agar RPC atomik `handle_payment_webhook` selalu menerima UUID pesanan yang valid.

## [v0.13.0] - 2026-10-08

### Added

- **Phase 0 (Concurrency Hardening & Tier-1 Catalog)**:
  - Eliminasi circular deadlock database via deterministic lock ordering (`ORDER BY product_id ASC`) pada stored procedure `create_order`.
  - Atomic webhook processor RPC `handle_payment_webhook` dengan proteksi phantom stock (`CONFLICT_ALREADY_CANCELLED`) dan auto-restock saat expired/cancelled.
  - Upgrade etalase katalog: Server-side dynamic query, Full-Text Search tsvector, faceted category counts, dan server pagination.
- **Phase 1 (Standalone Fastify Pilot Microservice - `@shelfstack/order-service`)**:
  - Service terpisah berkinerja tinggi menggunakan Fastify 5, Zod Type Provider, dan validasi signature SHA-512 Midtrans.
  - Telemetry endpoint `GET /health` dan integration test suite via `app.inject()`.
- **Phase 2 (Relational Architecture & Inventory Movements Ledger)**:
  - Tabel audit trail abadi `stock_movements` (Double-Entry Inventory Accounting Ledger).
  - Anti-tamper database triggers pada tabel `products` untuk mencatat setiap mutasi stok secara otomatis tanpa celah manipulasi aplikasi.
  - Endpoint admin paginasi `/api/admin/products/[id]/stock-movements` untuk melihat riwayat mutasi per barang.
- **Phase 3 (Containerization Docker & Compose)**:
  - Multi-stage `Dockerfile` untuk Nuxt (image ramping < 150MB, eksekusi non-root `USER node`).
  - `Dockerfile` untuk `@shelfstack/order-service`.
  - Orchestration `docker-compose.yml` dan `docker-compose.dev.yml` menghubungkan Frontend, Order Service, dan Redis 7.
- **Phase 4 & 5 (Redis Caching & Background Jobs)**:
  - Redis Cache-Aside Manager dengan resilient Circuit Breaker dan $O(1)$ Versioned Tag Invalidation (`catalog:version`).
  - Worker otomatis pembatalan pesanan kadaluwarsa (`OrderExpiryWorker`) dengan auto-restock dan cache invalidation.
- **Phase 6 & 7 (Automated CI/CD Pipeline & Production Gateway)**:
  - Pipeline GitHub Actions `.github/workflows/ci.yml` (ESLint ➔ Typecheck ➔ Vitest 100 tests ➔ Docker validation).
  - Reverse proxy gateway Nginx produksi (`deploy/nginx/nginx.conf`) dengan HTTP/2, Gzip kompresi, rate limiting, dan security headers.
  - Orchestration produksi `deploy/docker-compose.prod.yml` dan health probe probe `/api/health`.

## [v0.12.0-s4] - 2026-10-08

### Added

- **Admin Order Management & FSM (D-02)**: Modul manajemen pesanan admin lengkap dengan finite state machine (`order-transitions.ts`), endpoint `/api/admin/orders` (pencarian, paginasi, filter status), endpoint `/api/orders/[id]/status` untuk pembaruan status teratur (pending -> paid -> shipped -> completed / cancelled), serta halaman `/admin/orders` dan `/admin/orders/[id]`.
- **Admin KPI Executive Dashboard (D-01)**: Layout admin terdedikasi (`app/layouts/admin.vue`), endpoint `/api/admin/stats` dengan agregasi pendapatan total, pesanan baru, produk aktif, dan peringatan stok menipis, serta kartu KPI modular (`AdminStatCard.vue`) pada halaman `/admin`.
- **Customer Self-Service Order Cancellation & Atomic Restock (K-06)**: Pembatalan pesanan berstatus `pending` langsung oleh pelanggan via endpoint `/api/orders/[id]/cancel` didukung Supabase RPC `cancel_order` yang merestok fisik inventaris secara atomik, serta dialog konfirmasi interaktif `OrderCancelDialog.vue`.
- **Input Stok Fisik & Kategori Dinamis Form Produk (D-03 & C-07)**: Dukungan field `stock` dan pemilihan kategori dinamis berbasis endpoint `/api/categories` pada `ProductForm.vue`, pembaruan repository & store payload, serta badge kesehatan stok (`Tersedia`, `Sisa <5`, `Habis`) pada `ProductCard.vue`.
- **Realtime Listener Supabase pada Pesanan Admin**: Sinkronisasi data pesanan baru (`INSERT`) dan pembaruan status (`UPDATE`) secara realtime di `/admin/orders` menggunakan Supabase Realtime channel.
- **Filter Cepat Stok Kritis (< 5 Unit) pada Kelola Produk**: Tab filter kilat di `/admin/products` untuk memonitor dan mengisi ulang stok produk yang menipis secara instan.

### Changed

- **Peningkatan Strict Type Safety**: Penambahan definisi RPC `cancel_order` pada skema Supabase `app/types/database.types.ts`, perbaikan null-safety pada fungsi utilitas `product-specs.ts`, dan pengetatan akses opsi pada `ProductConfigurator.vue`.
- **Pembersihan Arsitektur SFC**: Menjaga batas ukuran baris komponen Vue sesuai prinsip SOP Clean Architecture (<300 baris) dengan modularisasi tabel pesanan admin.

### Fixed

- **Vue Template Compiler Syntax Error**: Mengatasi kegagalan parsing Babel AST pada event inline multiline `@click` di `/admin/orders` dengan mendefinisikan method eksplisit `prevPage()` dan `nextPage()`.

## [v0.11.0-s3] - 2026-09-21

### Added

- **Aset Fotografi Kurasi Stitch**: Menghubungkan aset fotografi studio otentik dari spesifikasi Stitch `shelfstack_homepage_multi_category_department_store` untuk 5 kartu Kategori Pilihan (Tech & Gadget, Rumah & Dapur, Furnitur & Meja, Pakaian & EDC, Alat Tulis & Kerajinan), Hero Mosaic, dan Flash Deals.
- **Konfigurasi Content Security Policy (CSP)**: Memperbarui daftar domain gambar yang diizinkan (`img-src`) di `nuxt.config.ts` untuk mendukung host gambar terkurasi.
- **Official ShelfStack Logo**: Implementasi SVG logo 3 tingkat rak geometris (2 rak atas putih + 1 rak bawah electric blue) dan komponen `AppLogo.vue`.
- **Aturan Copywriting Bebas Jargon**: Penambahan `.agents/rules/copywriting-rules.md` yang mewajibkan copywriting 100% humanis, bahasa Indonesia natural, dan bebas istilah internal developer di etalase publik.
- **Global UI Design System (`app/components/ui/`)**: Library komponen antarmuka terstandarisasi mencakup `<UiButton>` (multi-varian, auto-NuxtLink, loading state), `<UiInput>` (label, ikon, validasi error), `<UiBadge>` (indikator status konsisten), dan `<UiCard>` (kontainer modular dengan shadow whisper).
- **Komponen Kartu Produk Reusable (`ProductCard.vue`)**: Kartu etalase independen dengan badge stok dinamis (`Habis`, `Sisa <5`, `Tersedia`), integrasi `formatRupiah`, dan aksi detail terstandarisasi.
- **Shared Formatting Utility (`app/utils/format.ts`)**: Fungsi terpusat `formatRupiah()` untuk format mata uang IDR di seluruh aplikasi.
- **Alur Pemulihan Sandi Lengkap**: Halaman `/auth/forgot-password` dan `/auth/reset-password` dengan integrasi Supabase Auth dan komponen form ber-kontras tinggi.
- **Faceted Product Filtering**: Fitur filter dinamis di `/katalog` mencakup kategori cepat, rentang harga, live search dengan tombol clear, pengurutan (Termurah, Termahal, Nama A-Z), dan density toggle (grid 3 vs 4 kolom).

### Changed

- **Modularisasi Arsitektur Clean Code (SOP Talenavi)**:
  - `app/pages/index.vue`: Direfaktor dari monolit 720 baris menjadi ~36 baris orkestrator dengan 8 sub-komponen terisolasi di `app/components/home/`.
  - `app/pages/katalog.vue`: Direfaktor dari 545 baris menjadi ~290 baris dengan 4 sub-komponen di `app/components/katalog/` (`KatalogToolbar`, `KatalogActiveFilters`, `KatalogSidebar`, `KatalogMobileFilter`).
  - `app/pages/product/[id].vue`: Direfaktor dari 445 baris menjadi ~140 baris dengan 2 sub-komponen di `app/components/product/` (`ProductGallery`, `ProductConfigurator`) serta penambahan metadata Open Graph untuk SEO.
  - Halaman Autentikasi (`login.vue`, `register.vue`): Direfaktor menjadi bersih (~100 baris) menggunakan komponen `AuthCard`, `AuthFormInput`, `AuthSubmitButton`.
- **Harmonisasi Layout Hero Mosaic (`index.vue`)**: Menyatukan tata letak dan tinggi antara kartu utama kiri dengan tumpukan 2 baris kartu kanan (`Lampu Meja Task` dan `Tas Komuter EDC`). Menghapus badge ink/white asimetris yang acak dan menerapkan desain _bottom pill overlay_ kaca seragam (`bg-white/95 backdrop-blur-md rounded-full`) lengkap dengan judul produk, sub-label kurasi, dan harga IDR yang sejajar presisi dari atas hingga bawah.
- **Pembersihan Redundansi & Peningkatan Informatif Hero**: Menghilangkan baris trust points inline duplikat di bawah tombol Hero dan menggantikannya dengan metrik skala toko dan bukti sosial kuantitatif (`1.300+ Produk Pilihan`, `5 Kategori Kerja & Rumah`, `4.9★ 18rb+ Ulasan`) yang langsung memberi kredibilitas tanpa menduplikasi kartu manfaat di bawahnya.
- **Modernisasi Bilah Manfaat Belanja (Section 2)**: Merefaktor boks abu-abu monoton menjadi kartu putih bersih modern bernuansa e-commerce (`bg-white border border-brand-hair rounded-card shadow-whisper`) dengan pembatas halus dan detail kebijakan konkret (`100% Produk Original`, `Gratis Ongkir Se-Indonesia`, `Garansi Retur 30 Hari`, `Layanan Bantuan 24/7`).
- **Pembersihan Header UI/UX (`AppNavbar.vue`)**: Menghapus tautan redundant "Katalog" di bilah aksi kanan (navigasi katalog sudah diakomodasi oleh pita kategori dan search bar), merapikan tombol selector kategori di input pencarian agar tidak terpotong atau wrap menjadi 2 baris, dan menyeimbangkan proporsi search bar serta tombol aksi belanja.
- **Eliminasi Badge AI-Slop & Desain Bebas Gimmick**: Menghilangkan seluruh badge pill melayang dengan pulsing dot buatan AI (seperti `Koleksi Terverifikasi`, `Katalog Pilihan 2026`, badge uppercase `ETALASE TERVERIFIKASI`, `KEUNGGULAN LAYANAN`, `TESTIMONI`, dan `Dashboard Pemilik Toko`). Judul section kini tampil lugas dan percaya diri.
- **Restrukturisasi Kategori Pilihan**: Menghapus penomoran pseudo-militer AI (`Divisi 01` - `Divisi 05`), menghapus deretan mini-tile redundant "Pilih Kategori Cepat" di Hero, dan menghubungkan kartu kategori langsung ke filter katalog yang relevan (`/katalog?category=...`).
- **Penyempurnaan Copywriting Customer-Centric (`product/[id].vue` & `copywriting-rules.md`)**: Mengganti teks teknis berlebihan (seperti `±0.05mm Toleransi Presisi`, `Eco Vault`, `Precision Milled`) menjadi bahasa Indonesia yang ramah konsumen (`100% Asli Terverifikasi`, `Kemasan Aman Proteksi Ekstra`, `Pilihan Material`).
- **Redesign Halaman Beranda (`/`)**: Desain ulang penuh berlandaskan spesifikasi Stitch `shelfstack_homepage_multi_category_department_store` dengan kanvas putih bersih permanen, hero banner modern, 4 trust cards, 5 kategori utama terkurasi, flash sale 24 jam dengan countdown, dan kurasi produk unggulan.
- **Redesign Halaman Autentikasi (`/auth/login` & `/auth/register`)**: Modernisasi kartu login dan register bernuansa e-commerce bersih, badge keamanan enkripsi data, Google OAuth 1-klik, dan validasi Zod interaktif.
- **Redesign Etalase Katalog (`/katalog` & `ProductList.vue`)**: Tampilan katalog modular dengan breadcrumb terstruktur, faceted sidebar, dan kartu produk responsif dengan hover micro-interactions.
- **Perbaikan Mode Gelap & Kanvas**: Menghapus `@media (prefers-color-scheme: dark)` di `main.css` dan mengunci `darkMode: 'class'` di `tailwind.config.js` sehingga etalase tetap putih bersih modern terlepas dari preferensi dark mode OS.
- **Stabilisasi Playwright E2E**: Mengatur `workers: 2` untuk eksekusi lokal pada `playwright.config.ts` demi mencegah resource starvation pada server pengembangan Vite saat menjalankan 14 tes end-to-end.

### Changed (IA restructure 2026-09-18)

- Beranda `/` ditulis ulang jadi landing publik (hero, kategori, produk unggulan, value props, CTA admin) — tidak lagi CRUD langsung.
- Etalase publik pindah ke `/katalog` (search + `ProductList` mode `hideActions` baru, klik kartu ke detail).
- CRUD lengkap pindah ke `/admin/products` (guard `admin`, layout admin).
- Navbar: tambah link Katalog + Kelola (admin). Sidebar admin: tambah Produk.
- API baru `GET /api/categories` (defensif: landing tetap jalan walau tabel belum ada).
- Tes E2E disesuaikan: `home.spec` (landing), `product.spec` (katalog publik + guard admin).
- Redesign landing (`/`): hero split dengan visual produk asli + kartu harga real (fallback picsum),
  pills kategori scroll-snap, grid unggulan, value props format editorial rows (bukan 3 kartu kembar),
  satu label CTA "Masuk" untuk semua intent login, footer ringkas. Nol em-dash, dual light/dark.
- Bahasa visual storefront (adaptasi pola DESIGN.md, bukan jiplak brand): foto produk di depan,
  radius 16px untuk permukaan foto/kartu + full-pill untuk tombol/tab/badge, satu aksen emerald,
  strip promo gelap sebagai satu-satunya momen kontras, tanpa shadow dekoratif lebar.
- Iterasi DESIGN.md: Montserrat (display+body, scope `.storefront`, admin tetap Inter), kanvas putih
  - ink `#0a1317`, CTA pil hitam marketing + cobalt `#0064e0` untuk aksi/link commerce, tab pil aktif
    gelap, kartu foto 32px tanpa shadow, search-pill `#f1f4f7`, breadcrumb + galeri detail 32px.
    Catatan: radius 32px adalah keputusan sadar mengikuti DESIGN.md (melewati batas 16px default).
- Sistem token tunggal: warna brand hidup sebagai CSS variable di `main.css` + class `brand-*`
  (tailwind.config), dark-mode ikut OS di semua lapis (Tailwind `darkMode: 'media'`, PrimeVue `system`,
  media query CSS). Perbaikan nyata: sebelumnya dark Tailwind tidak ikut sehingga navbar putih
  di halaman hitam. Diverifikasi via production build + screenshot light/dark.
- Audit konsistensi token: seluruh hex di permukaan publik kini hanya dari palet DESIGN.md
  (ink, cobalt, hairline, surface-soft); bocoran emerald di login/register diganti pil hitam
  `contrast` + link cobalt; heading auth ke weight 500. Emerald dipertahankan hanya di register
  admin (layout/sidebar/activities) sebagai bahasa terpisah yang disengaja.

## [v0.10.0-s2] - 2026-09-18

### Added

- Auth email+password + Google OAuth (`useAuth`, `/auth/login`, `/auth/register`, `/auth/callback`).
- Middleware `auth` + `admin`, layout `admin.vue` (shell, diisi penuh Fase 4), guard `/admin/activities`.
- Migrasi `20260918010001` (profiles, categories, kolom stock/category_id/price_cents, trigger auto-profiles + sync price_cents) dan `20260918010002` (RLS strict products/profiles/activity/storage).
- Fix keamanan pre-push: semua cek admin lewat `is_admin()` SECURITY DEFINER (anti-rekursi RLS);
  policy owner-update dihapus karena memungkinkan self-promote (`SET role='admin'` ke baris sendiri).
- Server guard `requireUser/requireAdmin` (`server/utils/auth.ts`) dipasang di semua endpoint tulis products + baca sampah; endpoint `GET /api/auth/me`.
- E2E `tests/e2e/auth.spec.ts` (guard redirect, validasi form, 401 anon, katalog publik) + helper `waitForHydration`.

### Changed

- Navbar: rebrand ShelfStack + state login/logout + link Admin kondisional; judul tab app.
- Perbaikan flaky E2E pre-existing: tunggu hidrasi + locator dialog + scope main + poll-retry klik.
- `nuxt.config.ts`: Vite watcher abaikan `.kilo/**`.

### Note (belum dieksekusi, butuh aksi manusia)

- Migrasi SQL ditulis tapi **belum di-push ke Supabase Cloud** (butuh `supabase link` + `db push` + akun admin pertama via dashboard). Sampai itu dilakukan, RLS lama (`USING true`) masih aktif di cloud.
- Akun admin pertama dibuat manual: daftar via UI lalu `update profiles set role='admin'` di SQL Editor.

## [v0.9.0-s1] - 2026-09-18

### Added

- Skema validasi bersama **Zod** di `shared/schemas/product.ts` dipakai client + server.
- Unit test `tests/unit/product-schema.spec.ts` (9 case, termasuk kasus negatif PRD-1-02).
- `supabase/seed.sql` (8 produk) untuk `supabase db reset --local`.
- DevDependency `vue-tsc` untuk gate typecheck.
- Dokumentasi rencana portofolio 12 minggu di `docs/` (`PORTFOLIO-PLAN`, `SPRINT-PLAN`, `BACKLOG`, `PHASE-0..5`, `ADR/`, `PORTFOLIO-PACKAGING`).

### Changed

- Migrasi FSD-lite: `app/stores/product.ts` + `app/repository/product.ts` pindah ke `app/features/products/` (file lama jadi alias, dihapus Sprint 2).
- Typed Supabase client (`useSupabaseClient<Database>()`, interface `ActivityLog`) — tidak ada `any` lagi di product/activity flow kecuali `catch`.
- Validasi server `POST/PUT /api/products` via Zod → `400` konsisten (tidak lagi insert body mentah).
- `eslint.config.mjs` + `vitest.config.ts` mengabaikan `.kilo/**` (nested worktree merusak lint/test).
- README: koreksi Nuxt 3 → Nuxt 4, rebrand ShelfStack.

## [v0.8.0-beta.1] - 2026-08-18

### Added

- Implementasi sistem **Realtime Activity Log** terintegrasi menggunakan WebSocket (`public:activity_logs`) untuk memantau perubahan data.
- Menambahkan **AppNavbar** sebagai komponen navigasi global yang premium dan _anti-slop_ dengan fungsionalitas indikator menu aktif.
- Panduan arsitektur _Feature-Scoped Development (FSD-lite)_ dalam bentuk dokumentasi.

### Changed

- Memindahkan (`refactor`) `useActivities.ts` dan `ActivityDetailDialog.vue` ke struktur isolasi modular di `app/features/activities/` untuk menjaga kode tetap bersih dan mudah diskalakan.
- Standardisasi CSS menggunakan warna-warna semantik dari _PrimeVue Aura theme_ yang dipetakan langsung ke _utility classes_ `tailwind.config.js` untuk perbaikan _Dark Mode_ secara menyeluruh dan menghilangkan _glitch_ warna (menghapus _inline_ CSS variable).

## [v0.7.0] - 2026-08-10

### Added

- Setup **Tailwind CSS** buat mempermudah styling (menggantikan inline styles yang kepanjangan).
- Validasi form sekarang pakai **Zod** biar lebih _type-safe_ dan terpusat.
- Auto-cleanup di `product.ts` (store): kalau kita hapus produk atau ganti gambar, gambar lama di Supabase Storage sekarang otomatis dihapus biar nggak menuh-menuhin storage.

### Changed

- Ekstrak interface `Product` ke `types/product.ts` biar lebih rapi.
- Pindahin fungsi `compressImage` ke `utils/image.ts` (separation of concerns).
- Refactor semua template UI (`index.vue`, `ProductForm.vue`, `ProductList.vue`) ke utility classes Tailwind.

## [v0.6.0] - 2026-08-10

### Added

- Dark Mode support (ngikutin system preference).
- Global Error Handling via `product.ts` + Toast Notification.

### Changed

- Refactor layout utama pakai standar **Impeccable** biar keliatan lebih profesional dan anti-slop.
- Beralih ke **Semantic Tokens** (`--p-content-background`, dll) buat fixing bug warna di Dark Mode.
- Ganti bawaan `<Card>` PrimeVue jadi custom grid card di `ProductList.vue`.
- Max-width container di-set ke `1200px` biar enak dilihat di monitor ultrawide.

## [v0.5.0] - 2026-08-10

### Added

- Halaman **Detail Produk** (`/product/[id]`) untuk menampilkan data produk secara utuh.
- Fungsi `fetchProductById` pada `product.ts` untuk melayani _routing_ dinamis.

### Changed

- Mengubah judul proyek di layout utama menjadi **Product Manager**.
- Merapikan tata letak (_layout_) beranda (`index.vue`) dan `ProductList.vue` yang ditambahkan tombol (mata/detail).

## [v0.4.0] - 2026-08-10

### Added

- Penambahan atribut data produk lengkap (`description` dan `link`) pada `ProductForm.vue`, `ProductList.vue`, antarmuka `product.ts`, dan dokumentasi panduan SQL.

### Changed

- Penyelarasan UI komponen ke desain _B2B Anti-Slop_ sesuai mandat `DESIGN.md`.
- Menonaktifkan secara paksa `box-shadow` PrimeVue Card dan menggantinya dengan `border` solid bersudut kaku maksimal 12px.
- Sinkronisasi CSS root variable dengan profil warna utama `oklch(0.45 0.16 250)` (Talenavi Blue).

## [v0.3.0-beta.1] - 2026-08-10

### Added

- Implementasi sistem **Toast Notification** global menggunakan PrimeVue di `app.vue`.
- Validasi unggahan gambar (maksimal 5MB dan hanya menerima format `jpeg`, `png`, `webp`) sesuai `SOP-SUPABASE`.
- **Kompresi Gambar Sisi Klien** (Client-side Compression) menggunakan HTML5 Canvas API untuk mengubah ukuran (resize) menjadi max lebar 1200px dan mengonversi gambar menjadi format `WebP` berkualitas 70% demi penghematan kuota penyimpanan.

## [v0.2.0-beta.3] - 2026-08-10

### Fixed

- Menurunkan versi (downgrade) `@pinia/nuxt` dari `1.0.1` ke `0.11.0` untuk mengatasi _bug compatibility_ antara `nuxtApp.payload.pinia` dengan Nuxt 4 yang menyebabkan gagal _render_ SSR.

## [v0.2.0-beta.2] - 2026-08-10

### Fixed

- Perbaikan _crash_ saat render SSR (`TypeError: Cannot read properties of undefined (reading 'state')`) dengan menginstal dependensi inti `pinia` yang sebelumnya belum terpasang.

## [v0.2.0-beta.1] - 2026-08-10

### Added

- Integrasi module `@nuxtjs/supabase` untuk konektivitas basis data.
- Refaktor arsitektur halaman produk menggunakan _Vue Best Practices_ (memisahkan `index.vue` menjadi _Container_, `ProductList.vue`, dan `ProductForm.vue`).
- Implementasi fungsionalitas CRUD Produk sepenuhnya menggunakan Supabase.
- Fungsionalitas unggah gambar (_image upload_) ke Supabase Storage.
- Penambahan file `/docs/SUPABASE-CRUD-TUTORIAL.md` sebagai modul tutorial tahap demi tahap.

## [v0.1.0-beta.1] - 2026-08-10

### Added

- Inisialisasi proyek Nuxt 3 dengan integrasi PrimeVue dan Pinia.
- Setup layout global `default.vue` dengan PrimeIcons.
- Implementasi Pinia store untuk simulasi data produk.
- Pembuatan endpoint API `/version` untuk mematuhi SOP Talenavi.
- Standardisasi repository (README, folder docs, .env.example) sesuai SOP Coding Repo.
