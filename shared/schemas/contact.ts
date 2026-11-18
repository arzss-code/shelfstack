import { z } from 'zod'

export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  email: z
    .string()
    .trim()
    .min(1, 'Alamat email wajib diisi')
    .email('Format email tidak valid')
    .max(150, 'Alamat email maksimal 150 karakter'),
  category: z
    .string()
    .trim()
    .min(1, 'Silakan pilih kategori pertanyaan')
    .max(50, 'Kategori maksimal 50 karakter'),
  orderNumber: z
    .string()
    .trim()
    .max(50, 'Nomor pesanan maksimal 50 karakter')
    .optional()
    .nullable(),
  message: z
    .string()
    .trim()
    .min(1, 'Pesan atau kendala wajib diisi')
    .min(10, 'Pesan minimal 10 karakter')
    .max(2000, 'Pesan maksimal 2000 karakter'),
})

export type ContactMessageInput = z.infer<typeof contactMessageSchema>

export const contactStatusSchema = z.enum(['open', 'in_progress', 'resolved'])
export type ContactMessageStatus = z.infer<typeof contactStatusSchema>

export const adminContactUpdateSchema = z.object({
  status: contactStatusSchema,
  admin_notes: z
    .string()
    .trim()
    .max(1000, 'Catatan admin maksimal 1000 karakter')
    .nullable()
    .optional(),
})

export type AdminContactUpdateInput = z.infer<typeof adminContactUpdateSchema>
