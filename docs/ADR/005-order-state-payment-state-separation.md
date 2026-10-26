# ADR 005: Pemisahan State Pesanan (Fulfillment) dan State Pembayaran (Financial)

- **Status**: Accepted
- **Tanggal**: 2026-10-26
- **Konteks**: Pada implementasi awal, status pesanan (`order.status`) sering kali disamakan dengan status pembayaran di antarmuka pengguna (misal: pesanan `shipped` ditampilkan sebagai "Status Pembayaran: Sedang Dikirim", atau pesanan `cancelled` ditampilkan sebagai "Status Pembayaran: Dibatalkan"). Hal ini membingungkan pelanggan dan melanggar prinsip pemisahan domain pada platform e-commerce enterprise.
- **Keputusan**:
  1. **Order Status (Status Alur Pesanan)** didefinisikan secara khusus untuk melacak pemenuhan logistik barang (`pending`, `paid` -> Diproses, `shipped` -> Dikirim, `completed` -> Selesai, `cancelled` -> Dibatalkan).
  2. **Payment Status (Status Pembayaran)** didefinisikan secara independen untuk merefleksikan kondisi finansial transaksi gateway (`Menunggu Pembayaran`, `Lunas`, `Belum Dibayar`, `Dana Dikembalikan`).
  3. Di antarmuka pengguna, Header Pesanan secara eksklusif menampilkan Status Alur Pesanan, sedangkan kartu Ringkasan Tagihan secara eksklusif menampilkan Status Pembayaran Finansial.
- **Konsekuensi**:
  - Pelanggan mendapatkan kejelasan mutlak: barang yang sedang dikirim (`shipped`) berstatus pembayaran "Lunas", dan barang yang dibatalkan sebelum bayar berstatus "Belum Dibayar".
  - Mencegah penulisan status logistik yang menimpa atau mengaburkan catatan pembayaran Midtrans.
