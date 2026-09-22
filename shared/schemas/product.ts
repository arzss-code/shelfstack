import { z } from 'zod'

// Bentuk produk SESUAI skema DB saat ini (Fase 0).
// price masih numeric positif; migrasi ke price_cents INTEGER terjadi di Fase 1 (lihat ADR/003).
// Schema ini dipakai dua sisi: validasi form di client + validasi body di server API.
export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama produk minimal 3 karakter.')
    .max(120, 'Nama produk maksimal 120 karakter.'),
  price: z.number({ error: 'Harga wajib berupa angka.' }).positive('Harga harus lebih dari 0.'),
  description: z.string().max(2000, 'Deskripsi maksimal 2000 karakter.').nullish(),
  link: z.string().url('Link harus URL yang valid.').nullish(),
  image_url: z.string().url('URL gambar tidak valid.').nullish(),
})

export type ProductInput = z.infer<typeof productSchema>

// Query pagination GET /api/products (from/to dikirim sebagai string query).
export const productListQuerySchema = z.object({
  from: z.coerce.number().int().min(0).default(0),
  to: z.coerce.number().int().min(0).default(11),
})
