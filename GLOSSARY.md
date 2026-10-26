# ShelfStack Domain Model

ShelfStack adalah platform e-commerce kurasi resmi (single-vendor) yang memprioritaskan integritas data transaksional, pemenuhan pesanan yang jelas, dan pengalaman berbelanja modern.

## Core Language

**Order**:
Rekaman transaksi pemesanan resmi sejumlah produk kurasi oleh pelanggan terdaftar yang memiliki status pemenuhan dan alamat tujuan.
_Avoid_: Pembelian, transaksi, checkout, faktur

**Order Status**:
Tahap siklus hidup fisik dan pemenuhan barang pada sebuah pesanan: `pending` (Menunggu Pembayaran), `paid` (Sedang Diproses), `shipped` (Sedang Dikirim), `completed` (Pesanan Selesai), `cancelled` (Pesanan Dibatalkan), dan `refunded` (Dana Dikembalikan).
_Avoid_: Status pembayaran, kondisi tagihan

**Payment Status**:
Keadaan transaksi finansial pada payment gateway: `Menunggu Pembayaran`, `Lunas`, `Belum Dibayar / Batal`, atau `Dana Dikembalikan`. Terpisah dari Order Status.
_Avoid_: Status pesanan, status alur pengiriman

**Storefront**:
Antarmuka publik resmi ShelfStack yang mencakup halaman Beranda, Katalog Produk, dan Detail Produk.
_Avoid_: Marketplace, toko multi-vendor, lapak

**Cart**:
Penyimpanan lokal sementara (state Pinia dengan persistensi browser) untuk menampung produk pilihan pelanggan sebelum transaksi checkout dibuat.
_Avoid_: Bag, bucket, keranjang belanja multi-seller

**Customer**:
Pengguna terautentikasi yang menelusuri katalog, melakukan transaksi checkout, dan memantau riwayat pesanan pribadi.
_Avoid_: Client, akun pembeli, guest buyer

**Product**:
Item barang kurasi resmi ShelfStack yang memiliki harga dalam satuan sen (`price_cents`), kuantitas persediaan stok (`stock`), dan kategori terstandarisasi.
_Avoid_: Barang dagangan, SKU penjual, listing
