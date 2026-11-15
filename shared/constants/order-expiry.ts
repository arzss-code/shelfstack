/**
 * Standar batas waktu pembayaran pesanan e-commerce (Best Practice).
 * 120 menit (2 jam) memberikan kenyamanan bagi pembeli untuk menyelesaikan pembayaran,
 * sekaligus melindungi inventaris toko agar tidak tertahan terlalu lama.
 */
export const ORDER_EXPIRY_MINUTES = 120
export const ORDER_EXPIRY_MS = ORDER_EXPIRY_MINUTES * 60 * 1000
export const ORDER_EXPIRY_HOURS = ORDER_EXPIRY_MINUTES / 60
