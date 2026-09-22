import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})

export const registerSchema = z
  .object({
    full_name: z.string().min(3, 'Nama minimal 3 karakter.').max(100),
    email: z.string().email('Email tidak valid.'),
    password: z.string().min(8, 'Password minimal 8 karakter.'),
    confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: 'Konfirmasi password tidak sama.',
    path: ['confirm_password'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
