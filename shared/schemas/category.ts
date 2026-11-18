import { z } from 'zod'

export const adminCategoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama kategori minimal 2 karakter')
    .max(80, 'Nama kategori maksimal 80 karakter'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, 'Slug kategori minimal 2 karakter')
    .max(80, 'Slug kategori maksimal 80 karakter')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z
    .string()
    .trim()
    .max(400, 'Deskripsi kategori maksimal 400 karakter')
    .nullable()
    .optional(),
  image_url: z
    .string()
    .trim()
    .max(500, 'URL gambar kategori maksimal 500 karakter')
    .nullable()
    .optional(),
  display_order: z.coerce
    .number()
    .int('Urutan tampil harus bilangan bulat')
    .min(0, 'Urutan tampil minimal 0')
    .max(999, 'Urutan tampil maksimal 999')
    .default(0),
})

export const adminCategoryUpdateSchema = adminCategoryCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu kolom kategori harus diperbarui',
  })

export type AdminCategoryCreateInput = z.infer<typeof adminCategoryCreateSchema>
export type AdminCategoryUpdateInput = z.infer<typeof adminCategoryUpdateSchema>
