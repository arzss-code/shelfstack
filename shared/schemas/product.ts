import { z } from 'zod'

// Bentuk produk SESUAI skema DB saat ini (Fase 0).
// price masih numeric positif; migrasi ke price_cents INTEGER terjadi di Fase 1 (lihat ADR/003).
// Schema ini dipakai dua sisi: validasi form di client + validasi body di server API.
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama produk minimal 3 karakter.')
    .max(120, 'Nama produk maksimal 120 karakter.'),
  price: z.number({ error: 'Harga wajib berupa angka.' }).positive('Harga harus lebih dari 0.'),
  description: z.string().max(2000, 'Deskripsi maksimal 2000 karakter.').nullish(),
  link: z.string().url('Link harus URL yang valid.').nullish(),
  image_url: z.string().url('URL gambar tidak valid.').nullish(),
  stock: z
    .number({ error: 'Stok wajib diisi.' })
    .int('Stok harus bilangan bulat.')
    .min(0, 'Stok minimal 0.')
    .default(0),
  category_id: z.string().uuid('Kategori tidak valid.').nullish(),
  slug: z.string().max(150).nullish(),
  sku: z.string().max(50).nullish(),
  weight_grams: z.number().int().positive().default(500),
  specs: z.record(z.string(), z.unknown()).default({}),
  gallery_urls: z.array(z.string().url()).default([]),
  rating: z.number().min(0).max(5).default(5),
  review_count: z.number().int().min(0).default(0),
  sold_count: z.number().int().min(0).default(0),
  is_featured: z.boolean().default(false),
})

export type ProductInput = z.infer<typeof productSchema>

// Skema validasi form produk di sisi klien yang diturunkan dari sumber kebenaran productSchema (Backlog C-07).
export const productFormSchema = productSchema
  .pick({
    name: true,
    price: true,
    description: true,
    category_id: true,
  })
  .extend({
    stock: z
      .number({ error: 'Stok wajib diisi.' })
      .int('Stok harus bilangan bulat.')
      .min(0, 'Stok minimal 0.'),
    link: z
      .union([
        z.string().url('Format link tidak valid (gunakan http:// atau https://).'),
        z.literal(''),
        z.null(),
      ])
      .optional(),
  })

export type ProductFormInput = z.infer<typeof productFormSchema>

// Query pagination & filter GET /api/products
export const productListQuerySchema = z.object({
  from: z.coerce.number().int().min(0).default(0),
  to: z.coerce.number().int().min(0).default(11),
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  stock_status: z.enum(['all', 'in_stock', 'critical']).optional(),
  sort: z.enum(['featured', 'price-low', 'price-high', 'name-asc', 'popular']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})
