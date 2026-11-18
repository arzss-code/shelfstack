import { z } from 'zod'

export const adminVariantCreateSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, 'SKU varian minimal 2 karakter')
    .max(64, 'SKU varian maksimal 64 karakter'),
  name: z
    .string()
    .trim()
    .min(2, 'Nama varian minimal 2 karakter')
    .max(120, 'Nama varian maksimal 120 karakter'),
  attributes: z.record(z.string(), z.string()).default({}),
  price_cents: z
    .number()
    .int('Harga override harus bilangan bulat (sen)')
    .nonnegative('Harga override tidak boleh negatif')
    .nullable()
    .optional(),
  stock: z
    .number()
    .int('Stok varian harus bilangan bulat')
    .min(0, 'Stok varian tidak boleh negatif')
    .max(100000, 'Stok varian maksimal 100.000 unit')
    .default(0),
  is_active: z.boolean().default(true),
})

export const adminVariantUpdateSchema = adminVariantCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu kolom varian harus diperbarui',
  })

export type AdminVariantCreateInput = z.infer<typeof adminVariantCreateSchema>
export type AdminVariantUpdateInput = z.infer<typeof adminVariantUpdateSchema>
