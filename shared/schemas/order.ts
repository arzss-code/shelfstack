import { z } from 'zod'

export const checkoutItemSchema = z.object({
  product_id: z.number().int().positive('ID produk tidak valid.'),
  qty: z.number().int().min(1, 'Kuantitas minimal 1.').max(99, 'Kuantitas maksimal 99.'),
})

export const checkoutAddressSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama penerima minimal 3 karakter.')
    .max(100, 'Nama penerima maksimal 100 karakter.'),
  phone: z
    .string()
    .min(9, 'Nomor telepon minimal 9 digit.')
    .max(15, 'Nomor telepon maksimal 15 digit.')
    .regex(/^[0-9+\-\s]+$/, 'Format nomor telepon tidak valid.'),
  street: z
    .string()
    .min(10, 'Alamat lengkap minimal 10 karakter.')
    .max(300, 'Alamat maksimal 300 karakter.'),
  city: z
    .string()
    .min(3, 'Kota/Kabupaten minimal 3 karakter.')
    .max(100, 'Kota/Kabupaten maksimal 100 karakter.'),
  postal: z
    .string()
    .min(5, 'Kode pos minimal 5 digit.')
    .max(10, 'Kode pos maksimal 10 karakter.')
    .regex(/^[0-9]+$/, 'Kode pos harus berupa angka.'),
  note: z.string().max(300, 'Catatan maksimal 300 karakter.').optional(),
})

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, 'Keranjang belanja tidak boleh kosong.'),
  address: checkoutAddressSchema,
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>
export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>
