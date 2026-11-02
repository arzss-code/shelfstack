import { z } from 'zod'

export const updateProfileSchema = z
  .object({
    full_name: z
      .string({ error: 'Nama lengkap wajib diisi.' })
      .trim()
      .min(3, 'Nama lengkap minimal 3 karakter.')
      .max(100, 'Nama lengkap maksimal 100 karakter.')
      .optional(),
    avatar_url: z.string().url('Format URL foto profil tidak valid.').nullable().optional(),
  })
  .refine((data) => data.full_name !== undefined || data.avatar_url !== undefined, {
    message: 'Setidaknya salah satu data profil wajib disertakan.',
  })

export const updateEmailSchema = z.object({
  email: z
    .string({ error: 'Alamat email wajib diisi.' })
    .trim()
    .email('Format alamat email tidak valid.'),
})

export const updatePasswordSchema = z
  .object({
    password: z
      .string({ error: 'Password baru wajib diisi.' })
      .min(8, 'Password baru minimal 8 karakter.'),
    confirm_password: z
      .string({ error: 'Konfirmasi password wajib diisi.' })
      .min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Konfirmasi password tidak cocok.',
    path: ['confirm_password'],
  })

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

export interface AccountStats {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  totalAddresses: number
  memberSince: string
}
