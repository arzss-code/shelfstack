export interface FaqItem {
  id: string
  category: 'pemesanan' | 'pembayaran' | 'pengiriman' | 'garansi' | 'pengembalian'
  categoryLabel: string
  question: string
  answer: string
  actionLink?: {
    text: string
    to: string
  }
}

export const faqs: FaqItem[] = [
  // Pemesanan
  {
    id: 'order-how-to-buy',
    category: 'pemesanan',
    categoryLabel: 'Pemesanan',
    question: 'Bagaimana cara berbelanja dan melakukan pemesanan di ShelfStack?',
    answer:
      'Pilih produk kurasi yang Anda inginkan dari katalog, tentukan opsi varian serta kuantitas, kemudian klik tombol "Tambah ke Bag". Buka keranjang belanja Anda untuk meninjau pesanan, lalu klik "Lanjut ke Pembayaran". Lengkapi alamat pengiriman, pilih jasa kurir yang diinginkan, dan selesaikan transaksi pembayaran.',
  },
  {
    id: 'order-cancellation',
    category: 'pemesanan',
    categoryLabel: 'Pemesanan',
    question: 'Bisakah saya membatalkan pesanan yang telah dibuat?',
    answer:
      'Pesanan yang masih berstatus "Menunggu Pembayaran" dapat dibatalkan langsung melalui menu detail pesanan. Namun untuk pesanan yang sudah lunas dan masuk tahap proses pengemasan, pembatalan mandiri tidak dapat dilakukan. Segera hubungi customer care kami sebelum nomor resi pengiriman diterbitkan.',
    actionLink: {
      text: 'Hubungi Customer Care',
      to: '/contact',
    },
  },
  {
    id: 'order-account-status',
    category: 'pemesanan',
    categoryLabel: 'Pemesanan',
    question: 'Bagaimana cara memeriksa status akun dan riwayat transaksi saya?',
    answer:
      'Anda dapat memantau riwayat transaksi dan melacak status pesanan secara lengkap melalui menu Akun > Pesanan Saya. Setiap pembaruan status akan dikirimkan otomatis melalui notifikasi akun dan email terdaftar.',
    actionLink: {
      text: 'Buka Halaman Pesanan Saya',
      to: '/orders',
    },
  },

  // Pembayaran
  {
    id: 'payment-midtrans-methods',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran',
    question: 'Apa saja metode pembayaran yang didukung via Midtrans?',
    answer:
      'ShelfStack terintegrasi langsung dengan payment gateway Midtrans. Kami menerima Virtual Account (BCA, Mandiri, BNI, BRI, Permata), QRIS (GoPay, OVO, DANA, LinkAja, ShopeePay), serta Kartu Kredit dan Debit berlogo Visa dan Mastercard dengan proteksi 3D Secure.',
  },
  {
    id: 'payment-auto-verification',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran',
    question: 'Apakah verifikasi konfirmasi pembayaran berlangsung otomatis?',
    answer:
      'Ya, verifikasi pembayaran terhubung langsung melalui webhook server Midtrans secara instan. Anda tidak perlu mengunggah bukti transfer manual. Status pesanan akan otomatis berubah menjadi "Dibayar" dalam hitungan detik setelah transaksi berhasil.',
  },
  {
    id: 'payment-expiry-window',
    category: 'pembayaran',
    categoryLabel: 'Pembayaran',
    question: 'Berapa batas waktu pelunasan pembayaran transaksi?',
    answer:
      'Batas waktu penyelesaian pembayaran Virtual Account dan QRIS adalah 24 jam sejak faktur diterbitkan. Apabila pembayaran tidak diselesaikan dalam jendela waktu tersebut, pesanan akan kedaluwarsa dan dibatalkan otomatis oleh sistem untuk membebaskan kuota stok produk.',
  },

  // Pengiriman
  {
    id: 'shipping-estimate-arrival',
    category: 'pengiriman',
    categoryLabel: 'Pengiriman',
    question: 'Berapa lama estimasi waktu pengiriman pesanan hingga tiba?',
    answer:
      'Estimasi pengiriman untuk area Jabodetabek adalah 1-2 hari kerja. Wilayah pulau Jawa lainnya berkisar 2-3 hari kerja, sedangkan luar Pulau Jawa berkisar 3-6 hari kerja tergantung pada zona logistik tujuan dan jenis layanan kurir yang Anda pilih saat checkout.',
  },
  {
    id: 'shipping-official-couriers',
    category: 'pengiriman',
    categoryLabel: 'Pengiriman',
    question: 'Ekspedisi kurir resmi apa saja yang bekerja sama dengan ShelfStack?',
    answer:
      'Kami bekerja sama secara resmi dengan tiga ekspedisi terpercaya di Indonesia: JNE (Reguler dan YES), SiCepat Express (BEST dan Reguler), serta J&T Express. Seluruh paket dikemas dengan standar proteksi kurasi ShelfStack dan asuransi pengiriman penuh.',
  },
  {
    id: 'shipping-tracking-number',
    category: 'pengiriman',
    categoryLabel: 'Pengiriman',
    question: 'Bagaimana cara memeriksa status nomor resi pengiriman paket?',
    answer:
      'Nomor resi resmi diterbitkan otomatis setelah paket diserahkan kepada pihak kurir ekspedisi. Kunjungi halaman Lacak Pesanan untuk mengecek linimasa perjalanan paket Anda secara real-time tanpa perlu membuka situs kurir eksternal.',
    actionLink: {
      text: 'Lacak Pengiriman Pesanan',
      to: '/tracking',
    },
  },

  // Garansi
  {
    id: 'warranty-two-years-terms',
    category: 'garansi',
    categoryLabel: 'Garansi',
    question: 'Bagaimana ketentuan garansi resmi 2 tahun di ShelfStack?',
    answer:
      'Seluruh koleksi produk esensial dan perlengkapan di ShelfStack dilindungi jaminan garansi resmi selama 2 tahun sejak tanggal penerimaan produk. Garansi mencakup biaya perbaikan fungsional dan penggantian suku cadang asli jika produk mengalami kendala operasional non-pemakaian.',
  },
  {
    id: 'warranty-claim-defects',
    category: 'garansi',
    categoryLabel: 'Garansi',
    question: 'Apa saja syarat untuk mengajukan klaim garansi cacat produksi?',
    answer:
      'Syarat klaim meliputi: (1) Invoice digital atau nomor pesanan resmi ShelfStack, (2) Bukti rekaman video kendala fungsi teknis produk, serta (3) Unit produk lengkap beserta kemasan asli dan aksesoris bawaan. Garansi tidak menanggung kerusakan akibat kelalaian pribadi, benturan fisik, atau rembesan cairan pada unit non-waterproof.',
  },
  {
    id: 'warranty-inspection-period',
    category: 'garansi',
    categoryLabel: 'Garansi',
    question: 'Berapa lama proses inspeksi dan penanganan klaim garansi?',
    answer:
      'Pemeriksaan teknis di Service Center membutuhkan waktu 2-4 hari kerja setelah produk tiba. Unit pengganti baru atau unit yang selesai diservis akan dikirimkan kembali ke alamat Anda tanpa biaya pengiriman tambahan untuk klaim yang memenuhi validasi.',
  },

  // Pengembalian
  {
    id: 'return-policy-seven-days',
    category: 'pengembalian',
    categoryLabel: 'Pengembalian',
    question: 'Bagaimana kebijakan retur produk 7 hari di ShelfStack?',
    answer:
      'Kami menyediakan jaminan kepuasan belanja dengan kebijakan pengembalian barang dalam kurun waktu 7 hari kalender terhitung sejak barang diterima. Fasilitas ini berlaku untuk kendala produk cacat bawaan, salah pengiriman varian, atau ketidaksesuaian spesifikasi katalog.',
  },
  {
    id: 'return-item-condition',
    category: 'pengembalian',
    categoryLabel: 'Pengembalian',
    question: 'Apa syarat kondisi fisik barang yang dapat diajukan untuk retur?',
    answer:
      'Barang harus dalam kondisi baru, belum digunakan untuk aktivitas harian berat, segel resmi pabrik utuh, serta lengkap dengan dus kemasan asli dan buku panduan manual. Kami mewajibkan rekaman video saat membuka paket (unboxing) sebagai bukti pendukung klaim.',
  },
  {
    id: 'return-refund-workflow',
    category: 'pengembalian',
    categoryLabel: 'Pengembalian',
    question: 'Bagaimana alur dan jangka waktu proses pengembalian dana (refund)?',
    answer:
      'Setelah paket retur tiba di gudang dan lolos inspeksi kualitas, proses refund diproses dalam 1-3 hari kerja. Dana transaksi VA dan QRIS dikembalikan ke rekening bank atau saldo e-wallet Anda, sedangkan transaksi Kartu Kredit dikreditkan kembali ke limit kartu sesuai siklus penagihan bank penerbit (5-14 hari kerja).',
    actionLink: {
      text: 'Ajukan Pengembalian via Kontak',
      to: '/contact',
    },
  },
]
