import { z } from 'zod'

export const addressBaseSchema = z.object({
  name: z
    .string({ error: 'Nama penerima wajib diisi.' })
    .min(3, 'Nama penerima minimal 3 karakter.')
    .max(100, 'Nama penerima maksimal 100 karakter.'),
  phone: z
    .string({ error: 'Nomor telepon wajib diisi.' })
    .min(9, 'Nomor telepon minimal 9 digit.')
    .max(15, 'Nomor telepon maksimal 15 digit.')
    .regex(/^[0-9+\-\s]+$/, 'Format nomor telepon tidak valid.'),
  street: z
    .string({ error: 'Alamat lengkap wajib diisi.' })
    .min(10, 'Alamat lengkap minimal 10 karakter.')
    .max(300, 'Alamat maksimal 300 karakter.'),
  city: z
    .string({ error: 'Kota/Kabupaten wajib diisi.' })
    .min(3, 'Kota/Kabupaten minimal 3 karakter.')
    .max(100, 'Kota/Kabupaten maksimal 100 karakter.'),
  postal: z
    .string({ error: 'Kode pos wajib diisi.' })
    .min(5, 'Kode pos minimal 5 digit.')
    .max(10, 'Kode pos maksimal 10 karakter.')
    .regex(/^[0-9]+$/, 'Kode pos harus berupa angka.'),
  note: z
    .string()
    .max(300, 'Catatan maksimal 300 karakter.')
    .optional()
    .nullable()
    .transform((val) => (val === null || val === undefined ? undefined : val)),
  is_default: z.boolean().default(false).optional(),
})

export const createAddressSchema = addressBaseSchema

export const updateAddressSchema = addressBaseSchema.partial()

export const userAddressSchema = z.object({
  id: z.string().uuid('ID alamat harus berupa UUID valid.'),
  user_id: z.string().uuid('User ID harus berupa UUID valid.'),
  name: z.string().min(3).max(100),
  phone: z.string().min(9).max(15),
  street: z.string().min(10).max(300),
  city: z.string().min(3).max(100),
  postal: z.string().min(5).max(10),
  note: z.string().nullable().optional(),
  is_default: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
})

export type CreateAddressInput = z.infer<typeof createAddressSchema>
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>
export type UserAddress = z.infer<typeof userAddressSchema>
