# Audit Implementasi, Keamanan, dan UI/UX ShelfStack

## Status dan ruang lingkup

- **Tujuan:** menilai kelengkapan implementasi, praktik rekayasa, kualitas fitur, serta kejelasan UI/UX untuk pengembangan portfolio.
- **Status:** laporan temuan, bukan pernyataan seluruh fitur selesai atau sertifikasi keamanan.
- **Dasar pemeriksaan:** source code, migrasi, dokumentasi, test, eksekusi quality gate, eksperimen QR dan kontras, serta pemeriksaan browser lokal.
- **Perubahan implementasi:** tidak ada perbaikan source code atau migrasi yang dilakukan sebagai bagian dari audit.
- **Snapshot:** workspace berubah selama audit. Temuan dan hasil perintah mencerminkan kondisi saat diperiksa, bukan otomatis kondisi release terakhir atau kondisi setelah dokumen ini ditulis.

Seluruh referensi source menggunakan path relatif terhadap root repository. Nomor baris adalah lokasi saat audit dan dapat bergeser setelah perubahan berikutnya. Rekomendasi di dokumen ini belum berarti sudah diimplementasikan atau menjadi backlog yang disetujui.

**Tindak lanjut:** implementasi bertahap sudah dimulai setelah audit. Tahap 1A menangani ownership lampiran order support dan cleanup avatar. Regresi handler lolos, tetapi production build masih timeout; tahap ini belum ditutup dengan seluruh quality gate. Lihat [`roadmap/audit-remediation-plan.md`](./roadmap/audit-remediation-plan.md) dan status terkini di [`PROGRESS.md`](./PROGRESS.md#remediasi-audit-tahap-1a). Bagian 1 sampai 10 di bawah tetap merupakan snapshot audit awal, bukan klaim kondisi setelah remediasi.

## 1. Ringkasan eksekutif

ShelfStack memiliki fondasi yang menarik untuk portfolio, tetapi belum tepat dipresentasikan sebagai aplikasi yang seluruh fiturnya selesai dan terverifikasi.

Masalah utama bukan kekurangan jumlah fitur. Cakupan yang ada sudah cukup luas. Prioritas berikutnya adalah:

1. Konsistensi antara tampilan, API, dan database.
2. Kebenaran transaksi ketika terjadi pembatalan, refund, retry, atau permintaan bersamaan.
3. Privasi dan pembatasan akses antar pengguna.
4. Penyelesaian fitur yang terlihat selesai, tetapi perilakunya belum sesuai janji UI.
5. Pengujian yang membuktikan implementasi sebenarnya, bukan hanya bentuk kode.

Dasar visual storefront sudah baik dan tidak membutuhkan perombakan total. Peningkatan terpenting adalah kejelasan informasi, aksesibilitas, konsistensi kebijakan, serta perilaku yang dapat dipercaya.

## 2. Hal yang sudah baik

- Cakupan domain cukup kaya untuk dibahas saat interview: katalog, checkout, pembayaran, inventori, pembatalan, refund, retur, dukungan pelanggan, dan pekerjaan asynchronous.
- Fondasi pengujian tersedia. Dalam eksekusi audit, 1.264 test aplikasi dan 25 test order-service berhasil dijalankan.
- Homepage yang sudah selesai dimuat menunjukkan palet putih, hitam, dan biru yang konsisten, hierarki tipografi, foto produk, serta navigasi kategori yang jelas.
- Ada dasar aksesibilitas, termasuk asosiasi label dan error input, pengelolaan fokus modal, serta penanganan Escape.
- Filter katalog tersimpan di URL dan sejumlah loading/empty state sudah tersedia.

Bukti:

- `app/components/ui/UiInput.vue:111`
- `app/components/ui/UiModal.vue:69`
- Hasil eksekusi pada bagian 8.

## 3. Temuan prioritas tinggi: kebenaran transaksi

Temuan pada bagian ini berasal dari penelusuran source dan migrasi. Audit tidak mengeksekusi transaksi berisiko terhadap database deployment.

### 3.1. Penggunaan koin tidak konsisten dengan skema database

**Temuan:** skema loyalty menggunakan `balance_coins`, `lifetime_spent_coins`, serta ledger `type` dan `amount_coins`. Tipe pengeluaran yang diizinkan mencakup `spent`, bukan `redeemed`, dan nominal ledger positif.

Namun:

- `create_order` terbaru menggunakan `transaction_type`, nilai `redeemed`, dan nominal negatif.
- Cabang pengembalian koin pada `cancel_order` menggunakan nama kolom `balance`, `lifetime_spent`, dan `amount` yang tidak cocok dengan skema tersebut.

**Dampak:** berdasarkan skema dalam repository, cabang checkout atau pembatalan yang menggunakan koin dapat gagal dan mengalami rollback. Dampak pada database deployment belum direproduksi.

**Rekomendasi:** corrective migration dan integration test yang menjalankan lifecycle koin melalui RPC sebenarnya, termasuk rollback dan permintaan duplikat.

Bukti:

- `supabase/migrations/20261127000001_loyalty_coins_and_rewards.sql:15`
- `supabase/migrations/20261201000001_flash_deals_and_campaigns.sql:264`
- `supabase/migrations/20261130000003_product_variants_and_sku_matrix.sql:470`

### 3.2. Harga yang ditampilkan dapat berbeda dari tagihan

**Temuan pertama:** tarif ongkir berbeda antara konfigurasi aplikasi dan SQL `create_order`.

| Layanan | Konfigurasi aplikasi | SQL `create_order` |
| ------- | -------------------: | -----------------: |
| Regular |             Rp15.000 |           Rp20.000 |
| Express |             Rp30.000 |           Rp35.000 |
| Instant |             Rp45.000 |           Rp50.000 |
| Cargo   |             Rp25.000 |           Rp45.000 |

Token pembayaran menggunakan total database, sedangkan snapshot checkout masih dihitung dari sisi aplikasi.

**Temuan kedua:** utility flash sale memiliki fallback yang menghasilkan diskon, kuota, dan angka klaim sintetis ketika tidak ada deal aktif atau query gagal. Harga tersebut dapat muncul pada detail produk dan rekonsiliasi cart, tetapi SQL checkout hanya menghormati deal yang tersimpan di database.

**Dampak:** pelanggan dapat melihat harga atau ongkir yang berbeda dari nilai order dan tagihan pembayaran.

**Rekomendasi:** satu kontrak perhitungan harga server. Sebelum pembayaran, tampilkan total final server dan minta konfirmasi ulang jika berubah. Jangan membuat promo finansial sintetis ketika sumber data gagal.

Bukti:

- `shared/schemas/shipping.ts:167`
- `supabase/migrations/20261201000001_flash_deals_and_campaigns.sql:301`
- `server/api/orders/[id]/payment-token.post.ts:70`
- `app/composables/useCheckoutOrder.ts:210`
- `server/utils/flash-sale.ts:51`
- `server/api/cart/reconcile.post.ts:46`
- `supabase/migrations/20261201000001_flash_deals_and_campaigns.sql:133`

### 3.3. Restock retur belum atomic dan aman terhadap retry

**Temuan:** endpoint review retur membaca stok, menghitung `stock + qty` di JavaScript, lalu melakukan penulisan stok, ledger, dan tiket melalui request database terpisah. Sebagian error mutasi tidak diperiksa. Perubahan stok juga sudah memiliki trigger pencatatan ledger.

**Dampak:** request bersamaan dapat kehilangan perubahan stok; retry dapat melakukan restock lebih dari sekali; pencatatan movement manual berisiko ganda dengan trigger.

**Rekomendasi:** satu RPC transaksional untuk mengunci tiket, memvalidasi transisi, mengembalikan stok, dan mencatat movement secara idempotent. Verifikasi invariant melalui test konkurensi dan retry.

Bukti:

- `server/api/admin/returns/[id]/review.put.ts:71`
- `supabase/migrations/20261101000001_inventory_movements_ledger.sql:66`

### 3.4. Refund pending belum mencegah barang dikirim

**Temuan:** refund yang diterima tetapi masih menunggu konfirmasi penyedia pembayaran dapat meninggalkan order berstatus `paid`. Transisi `paid` ke `shipped` belum memeriksa refund pending. Callback refund mengabaikan order yang tidak lagi `paid`.

**Urutan kejadian yang berisiko:** refund diterima, admin mengirim barang, konfirmasi refund datang, lalu callback diabaikan secara lokal.

**Dampak:** barang dapat dikirim ketika refund sedang diproses, dan status lokal dapat tidak sesuai hasil pembayaran. Insiden nyata pada gateway tidak direproduksi.

**Rekomendasi:** guard refund dan fulfillment di bawah penguncian order yang konsisten. Uji kedua urutan kejadian, termasuk webhook terlambat dan request bersamaan.

Bukti:

- `server/api/orders/[id]/refund.post.ts:188`
- `supabase/migrations/20261130000001_order_cancellation_parity_and_expiry_hardening.sql:849`
- `supabase/migrations/20261109000001_refund_identity_correlation_and_amount_validation.sql:92`

### 3.5. Pengembalian stok varian belum konsisten

**Temuan:** checkout mengurangi stok varian dan pembatalan pelanggan mengembalikannya. Jalur expiry, pembatalan admin, dan refund yang ditelusuri masih mengembalikan stok parent saja.

**Dampak:** stok parent dan varian dapat berbeda setelah reversal order.

**Rekomendasi:** samakan semantik reversal untuk seluruh jalur. Test harus memeriksa stok parent, stok varian, dan ledger, bukan hanya status order.

Bukti:

- `supabase/migrations/20261201000001_flash_deals_and_campaigns.sql:149`
- `supabase/migrations/20261130000003_product_variants_and_sku_matrix.sql:429`
- `supabase/migrations/20261130000001_order_cancellation_parity_and_expiry_hardening.sql:589`
- `supabase/migrations/20261130000001_order_cancellation_parity_and_expiry_hardening.sql:757`
- `supabase/migrations/20261115000001_refund_and_security_definer_least_privilege.sql:224`

## 4. Temuan prioritas tinggi: privasi dan otorisasi

Bagian ini sebaiknya dibereskan sebelum demo publik menyimpan data pengguna sungguhan. Temuan dibuktikan melalui source review, bukan eksploitasi akun atau data deployment.

| Temuan                                                                                          | Risiko                                                                                     | Bukti                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucket lampiran chat dan bukti retur bersifat public                                            | Akses baca tidak dibatasi oleh kepemilikan pengguna; API mengembalikan URL publik permanen | `supabase/migrations/20261129000001_customer_support_live_chat.sql:216`, `supabase/migrations/20261128000001_customer_return_requests_and_rma.sql:73`, `server/api/support/upload.post.ts:67`, `server/api/returns/upload.post.ts:70` |
| Policy UPDATE pesan support hanya memeriksa partisipasi percakapan                              | Pelanggan dapat memperbarui pesan admin melalui Data API, tidak terbatas pada read receipt | `supabase/migrations/20261129000001_customer_support_live_chat.sql:182`                                                                                                                                                               |
| Penyertaan order pada chat mengambil order tanpa pemeriksaan pemilik                            | Informasi total dan status order pengguna lain dapat terungkap                             | `server/api/support/messages.post.ts:114`                                                                                                                                                                                             |
| Cleanup avatar mempercayai path dari URL profil                                                 | Service role berisiko menghapus objek avatar pengguna lain                                 | `shared/schemas/profile.ts:11`, `server/api/account/avatar.delete.ts:32`, `server/api/account/avatar.post.ts:95`                                                                                                                      |
| Pencarian tracking publik meneruskan input ke `.ilike()` dan mengembalikan deskripsi checkpoint | Wildcard dapat memperluas pencarian; deskripsi dapat membawa nama penerima                 | `server/api/tracking/search.get.ts:29`, `server/utils/shipping.ts:125`                                                                                                                                                                |

**Rekomendasi:** private bucket dan signed URL, pemeriksaan ownership pada setiap resource, pembatasan kolom yang dapat diperbarui, serta test negatif lintas pengguna. Policy upload berdasarkan folder pengguna saja tidak membuat akses baca bucket public menjadi privat.

### Catatan tambahan

- Middleware rate limit mempercayai IP pertama pada forwarded header, sedangkan konfigurasi proxy mempertahankan prefix yang diberikan klien. Ini dapat melemahkan pembatasan aplikasi. Nginx masih memiliki limit berdasarkan alamat sumber, sehingga bukan berarti seluruh throttling dapat dilewati. Bukti: `server/middleware/03.rate-limit.ts:16`, `deploy/nginx/nginx.conf:112`.
- Selector demo admin tidak digate dan seed memberi role admin sebenarnya. Demo publik perlu menggunakan lingkungan disposable dengan data sintetis dan batas tindakan yang jelas. Kredensial demo live tidak diuji. Bukti: `app/pages/auth/login.vue:117`, `supabase/seed.sql:261`.

## 5. Fitur yang terlihat selesai tetapi belum memenuhi janji UI

### 5.1. Form kontak menampilkan sukses tanpa mengirim pesan

Implementasi menunggu sekitar 500 ms, menampilkan pesan sukses, lalu mengosongkan form tanpa request pengiriman ke API.

**Dampak:** pengguna percaya pesan sudah diterima, padahal tidak ada pengiriman.

**Rekomendasi:** hubungkan ke kanal nyata atau ganti dengan kontak langsung dan keterangan yang jujur.

Bukti: `app/pages/contact.vue:96`.

### 5.2. QR invoice dan waybill belum merupakan encoding QR yang benar

Utility membuat pola dari hash payload, bukan encoding QR standar beserta error correction. Eksperimen langsung menghasilkan SVG identik untuk dua URL berbeda dengan suffix `Aa` dan `BB`.

Ada ketidaksesuaian kontrak URL juga: beberapa dokumen menggunakan query `order_id` atau `ref`, sedangkan halaman tracking membaca `q`.

**Dampak:** tampilan dokumen memberi kesan dapat dipindai untuk verifikasi, tetapi perilaku tersebut belum didukung implementasi yang benar.

**Rekomendasi:** gunakan encoder QR standar, uji roundtrip dengan decoder independen, dan pastikan URL tujuan membuka dokumen atau tracking yang dimaksud.

Bukti:

- `app/features/orders/utils/logistics-vector.ts:243`
- `app/pages/orders/[id]/invoice.vue:225`
- `app/pages/tracking.vue:202`
- `tests/unit/invoice-and-waybill.spec.ts:109`

### 5.3. Email masih best-effort

Dispatcher menggunakan log in-memory, dapat jatuh ke mock, dan belum memiliki persistent outbox untuk retry dan deduplikasi. Pengiriman email pada webhook juga perlu memperhitungkan delivery duplikat agar tidak mengirim ulang setelah RPC tidak melakukan perubahan.

**Rekomendasi:** persistent idempotent outbox jika email menjadi bagian penting alur, atau jelaskan batas kemampuan demo secara eksplisit.

Bukti:

- `server/utils/email-dispatcher.ts:20`
- `server/utils/email-dispatcher.ts:60`
- `server/api/orders/index.ts:177`
- `server/api/midtrans/notification.post.ts:171`

### 5.4. Web Push saat aplikasi ditutup belum lengkap

Handler penerimaan pada service worker dan notifikasi browser dari halaman sudah ada. Namun rangkaian PushManager subscription, penyimpanan endpoint, VAPID, dan pengiriman server belum ditemukan pada penelusuran audit.

**Rekomendasi:** bedakan notifikasi saat aplikasi terbuka dari Web Push saat aplikasi ditutup. Tidak harus membangun seluruhnya untuk portfolio, tetapi penamaan kemampuan harus sesuai implementasi.

Bukti: `public/sw.js:214`, `app/utils/desktop-notification.ts:59`.

### 5.5. Simulasi logistik perlu diberi batas yang jelas

Checkpoint kurir manual atau simulator dapat diterima untuk portfolio. Jangan menyebutnya sebagai integrasi carrier nyata jika belum terhubung ke carrier. Simulator baru yang muncul selama audit merupakan pekerjaan aktif dan tidak diubah oleh audit ini.

## 6. Penilaian UI/UX

### 6.1. Temuan browser dan aksesibilitas

| Area           | Temuan                                                                           | Rekomendasi                                                                  | Bukti                                                                                                     |
| -------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Responsiveness | Katalog mode list pada viewport 320 px memiliki lebar dokumen 339 px             | Telusuri elemen penyebab overflow, jangan hanya menyembunyikan scrollbar     | Pemeriksaan browser `/katalog?view=list`, screenshot lokal `scratch/audit-catalog-320-confirmed.png`      |
| Target sentuh  | Ada kontrol navigasi 36 x 36 px dan toggle password 24 x 24 px                   | Perbesar area sentuh, terutama navigasi mobile; target 44 px                 | `app/components/AppNavbar.vue:175`, `app/components/ui/UiInput.vue:150`                                   |
| Keyboard       | Toggle password dan link detail compact product card menggunakan `tabindex="-1"` | Pastikan aksi penting dapat dicapai dengan Tab                               | `app/components/ui/UiInput.vue:153`, `app/features/products/components/ProductCompactCard.vue:39`         |
| Label aksi     | Tombol Beli menambahkan produk ke keranjang                                      | Gunakan label Tambah ke Keranjang                                            | `app/features/products/components/ProductCompactCard.vue:159`, `app/composables/useProductCard.ts:93`     |
| Kontras        | Teks warning `#e28e00` di atas putih memiliki rasio 2,592:1                      | Gunakan token teks warning yang memenuhi AA, minimal 4,5:1 untuk teks normal | `app/assets/css/main.css:41`, `app/features/products/components/ProductCompactCard.vue:143`               |
| Login demo     | Selector dua kolom terlalu padat pada layar kecil                                | Susun vertikal dan kurangi informasi berulang                                | `app/components/auth/AuthDemoCredentialsBanner.vue:43`, screenshot lokal `scratch/audit-login-mobile.png` |

Homepage pada 1440 px dan 390 px, serta halaman login dan kontak pada 390 px, tidak menunjukkan overflow dalam pemeriksaan ini. Masalah responsif yang teramati bersifat spesifik, bukan berarti seluruh aplikasi rusak.

Penyebab elemen spesifik untuk overflow katalog belum diisolasi. Skeleton pada screenshot awal homepage tidak dianggap bug stuck loading, karena pemeriksaan berikutnya berhasil memuat halaman.

### 6.2. Informasi komersial belum konsisten

- Homepage menjanjikan retur 30 hari, tetapi halaman kebijakan dan validasi server menggunakan 7 hari.
- Angka katalog, klaim pengujian, dan garansi ditulis statis tanpa sumber yang jelas dalam implementasi yang ditinjau.
- Identitas perusahaan dan NPWP invoice perlu ditandai sebagai contoh jika bukan identitas legal sebenarnya.
- Review seed perlu jelas sebagai data demo, bukan disajikan seolah testimoni pelanggan nyata.

**Rekomendasi:** gunakan sumber kebijakan yang konsisten, hilangkan klaim yang tidak dapat dibuktikan, dan tandai data demo serta pembayaran sandbox dengan jelas.

Bukti:

- `app/components/home/HomeAssurances.vue:42`
- `app/pages/returns.vue:12`
- `server/utils/return-request.ts:83`
- `app/components/home/HomeHero.vue:46`
- `app/pages/about.vue:47`
- `app/pages/orders/[id]/invoice.vue:126`

### 6.3. Pisahkan audiens pembeli dan evaluator portfolio

Homepage mencampurkan pesan perdagangan dengan pesan operasional dan ajakan ke admin. Ini rekomendasi desain, bukan bug.

- Storefront sebaiknya berfokus pada produk, harga, pengiriman, dan kepercayaan pembeli.
- Penjelasan arsitektur dan akses demo admin dapat ditempatkan pada halaman Tentang Proyek atau jalur evaluasi portfolio.

Katalog lokal juga menunjukkan beberapa nama produk pengujian dan gambar rusak. Observasi ini hanya berlaku pada lingkungan lokal yang diperiksa. Siapkan dataset demo yang dikurasi dan dapat direset, tanpa menganggap kondisi tersebut pasti ada di deployment lain.

## 7. Pengujian, dokumentasi, dan deployment

### 7.1. Jumlah test belum menjamin cakupan perilaku kritis

Ada test yang menguji komponen dan handler sebenarnya. Namun beberapa bukti kritis masih terlalu jauh dari implementasi:

- Test idempotency menggunakan salinan endpoint simulasi, bukan handler sebenarnya.
- Test cancellation memeriksa string dalam migrasi lama, sehingga override migrasi baru dapat terlewat.
- Salah satu E2E payment menyiapkan interception order-create, tetapi tidak benar-benar menyelesaikan submit checkout.
- Assertion realtime tertentu memeriksa heading, bukan penerimaan perubahan data.
- Load test inventori yang didokumentasikan menggunakan stok awal nol dan seluruh 149 request ditolak. Itu belum membuktikan alokasi stok terbatas ketika sebagian pembelian berhasil.

Bukti:

- `tests/unit/api-orders-idempotency.spec.ts:28`
- `tests/unit/order-cancellation-parity.spec.ts:15`
- `tests/e2e/full-business-journey.spec.ts:255`
- `tests/e2e/pages/OrderDetailPage.ts:42`
- `docs/engineering/load-testing.md:94`

**Prioritas pengujian berikutnya:**

1. Pembelian bersamaan terhadap stok terbatas, dengan postcondition jumlah sukses, stok akhir, dan ledger.
2. Webhook duplikat tidak menggandakan efek.
3. Pembatalan/refund mengembalikan stok dan koin tepat sekali.
4. Pengguna A tidak dapat membaca atau mengubah resource pengguna B.
5. Satu alur sandbox lengkap dari checkout sampai hasil pembayaran pada lingkungan terisolasi.

Hindari klaim mutlak bebas race/deadlock jika bukti yang tersedia belum mendukungnya. Referensi klaim README yang perlu ditinjau: `README.md:53`.

### 7.2. Setup demo dan deployment belum sepenuhnya reproducible

- README menyebut migrasi dan seed, tetapi langkah perintah yang ditampilkan belum lengkap untuk keduanya.
- Compose produksi belum meneruskan flag enable pembayaran dan konfigurasi provider email yang dibutuhkan; flag pembayaran memiliki default false.
- Pemetaan port 443 belum membuktikan TLS tersedia, karena konfigurasi Nginx yang ditinjau hanya mendengarkan port 80. Jika TLS diterminasi di luar container, dokumentasikan.
- Identitas akun demo pada dokumentasi dan banner berbeda antara suffix `.test` dan `.local`. Login deployment tidak diuji, sehingga ini dicatat sebagai inkonsistensi konfigurasi, bukan bukti login rusak.
- `PRODUCT.md` masih menggambarkan dashboard katalog internal dan perlu diselaraskan dengan ruang lingkup e-commerce saat ini.

Bukti:

- `README.md:116`
- `scripts/seed.mjs:56`
- `deploy/docker-compose.prod.yml:6`
- `deploy/docker-compose.prod.yml:26`
- `deploy/nginx/nginx.conf:53`
- `nuxt.config.ts:79`
- `docs/PROGRESS.md:177`
- `app/components/auth/AuthDemoCredentialsBanner.vue:13`
- `PRODUCT.md`

## 8. Hasil verifikasi yang dieksekusi saat audit

Hasil berikut berasal dari eksekusi pada sesi audit. Perintah tidak otomatis dijalankan ulang saat laporan ini didokumentasikan dan bukan jaminan kondisi workspace terbaru.

| Pemeriksaan                                         | Hasil yang diamati                                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                                         | Lulus, tidak ada masalah dilaporkan                                                                                     |
| `pnpm typecheck`                                    | Gagal, 8 error pada halaman dokumen baru                                                                                |
| `pnpm exec vitest run`                              | 132 file, 1.264 test lulus; terdapat sejumlah warning Nuxt                                                              |
| `pnpm --filter @shelfstack/order-service test`      | 2 file, 25 test lulus                                                                                                   |
| `pnpm --filter @shelfstack/order-service typecheck` | Lulus                                                                                                                   |
| `pnpm build`                                        | Timeout setelah 180 detik saat bundling Nitro; client dan SSR selesai, hasil production build final belum terverifikasi |
| Browser lokal                                       | Menu mobile buka/tutup, autofill akun demo, dan validasi form kontak kosong berhasil                                    |
| Eksperimen QR                                       | Dua payload URL berbeda menghasilkan SVG identik                                                                        |
| Perhitungan kontras                                 | `#e28e00` di atas putih menghasilkan rasio 2,592:1                                                                      |

### 8.1. Error typecheck pada pekerjaan aktif

Delapan error berada pada halaman baru yang masih untracked ketika pemeriksaan dilakukan:

- `app/pages/orders/[id]/invoice.vue:163`: properti alamat `province` dan `postal_code` tidak ada pada tipe.
- `app/pages/orders/[id]/invoice.vue:200`: properti nested product `sku` tidak ada, juga digunakan pada baris 201.
- `app/pages/orders/[id]/invoice.vue:234`: `subtotal_cents` mungkin undefined.
- `app/pages/orders/[id]/invoice.vue:242`: `coins_redeemed` tidak ada, juga digunakan pada baris 244.
- `app/pages/orders/[id]/waybill.vue:178`: properti `postal_code` tidak ada.

Hasil ini tidak boleh otomatis dikaitkan dengan baseline release terakhir. Pekerjaan lain yang muncul di workspace selama audit tidak diubah atau di-revert.

### 8.2. Cakupan dan batas pemeriksaan browser

- Route publik diperiksa menggunakan Chromium/Playwright terhadap server dev lokal sementara.
- Selector pelanggan demo berhasil mengisi email, tetapi login tidak dilakukan.
- Menu mobile berhasil dibuka dan ditutup.
- Submit form kontak kosong menampilkan validasi setelah hydration.
- Homepage yang sudah selesai dimuat memiliki delapan link produk, tanpa flash skeleton tersisa dan tanpa overflow pada viewport desktop yang diperiksa.
- Tidak ada uncaught page error. Satu `console.error` tercatat pada pass kedua, tetapi isinya tidak tersimpan dan belum terdiagnosis. Jangan menyebut pemeriksaan console sepenuhnya bersih.
- Request mutasi diblokir selama pemeriksaan browser; tidak ada checkout, pembayaran, refund, operasi admin nyata, atau pengiriman form nyata yang dilakukan.
- Server audit sementara telah dihentikan.

Screenshot tersedia secara lokal pada direktori `scratch/` yang di-ignore Git, sehingga bukan artefak yang dijamin ikut repository:

- `scratch/audit-home-desktop-loaded.png`: referensi homepage yang sudah selesai dimuat.
- `scratch/audit-catalog-320-confirmed.png`: bukti overflow katalog pada 320 px.
- `scratch/audit-login-mobile.png`: kepadatan selector demo pada mobile.
- `scratch/audit-contact-mobile.png`: tampilan kontak mobile.

### 8.3. Batas kesimpulan

- Tidak ada migrasi, seed, load test, atau transaksi gateway nyata yang dijalankan terhadap layanan deployment.
- Tidak ada eksploitasi akun atau data pengguna nyata.
- Domain demo tidak dapat di-resolve dari lingkungan audit. Ini bukan bukti outage global.
- Production bundle tidak selesai diverifikasi. Pemeriksaan browser menggunakan dev server, bukan hasil production build.
- Tidak ada pengukuran Core Web Vitals atau benchmark performa produksi.
- Audit ini bukan security certification, bukti seluruh fitur benar, atau pernyataan bebas race/deadlock.

## 9. Roadmap perbaikan untuk portfolio

| Tahap                     | Fokus                                                              | Kriteria selesai yang disarankan                                            |
| ------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 1. Kebenaran dan keamanan | Koin, harga, stok/varian, refund, ownership, lampiran privat       | Integration test membuktikan invariant transaksi dan isolasi pengguna       |
| 2. Alur demo yang selesai | Kontak, QR, batas kemampuan email/notifikasi, data demo            | Tidak ada sukses palsu atau klaim fitur yang melampaui implementasi         |
| 3. Penyempurnaan UX       | Mobile kecil, keyboard, kontras, label aksi, kebijakan             | Alur utama nyaman dengan mouse, sentuhan, dan keyboard; informasi konsisten |
| 4. Kemasan portfolio      | Setup reproducible, dokumentasi, bukti pengujian, demo walkthrough | Reviewer dapat menjalankan dan memahami proyek tanpa menebak                |

Untuk kemasan portfolio, tampilkan:

- Masalah yang diselesaikan dan batas scope yang sengaja dipilih.
- Diagram arsitektur dan alasan pemilihan komponen.
- Satu alur demo yang benar-benar dapat dijalankan.
- Bukti penanganan duplicate request, retry, rollback, dan konkurensi.
- Batasan integrasi sandbox, simulasi logistik, serta data sintetis.
- Hasil pengujian yang dapat direproduksi, bukan hanya jumlah test atau badge.

## 10. Kesimpulan

ShelfStack berpotensi menjadi portfolio yang kuat tanpa menambah banyak fitur baru. Nilai tambah terbesar berikutnya adalah menyelesaikan konsekuensi dari fitur yang sudah ada: transaksi benar, kegagalan ditangani, data terlindungi, UI jujur, dan hasilnya dapat dibuktikan.

Tindak lanjut yang disarankan adalah menyepakati kelompok temuan yang akan ditangani, lalu menurunkannya ke backlog dengan acceptance criteria dan pengujian yang relevan. Dokumen ini tidak mengubah status implementasi pada `PROGRESS.md` maupun ID backlog yang sudah ada.
