import { z } from 'zod'

export const discountTypeSchema = z.enum(['percentage', 'fixed'])
export type DiscountType = z.infer<typeof discountTypeSchema>

export const validateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Kode kupon minimal 2 karakter.')
    .max(30, 'Kode kupon maksimal 30 karakter.')
    .transform((val) => val.toUpperCase()),
  subtotal_cents: z
    .number()
    .int('Subtotal harus berupa bilangan bulat.')
    .nonnegative('Subtotal tidak boleh bernilai negatif.'),
})

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>

export const couponSummarySchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  discount_type: discountTypeSchema,
  discount_value: z.number().int().positive(),
  max_discount_cents: z.number().int().nonnegative().nullable().optional(),
  min_purchase_cents: z.number().int().nonnegative(),
  discount_cents: z.number().int().nonnegative(),
  formatted_discount: z.string(),
  final_total_cents: z.number().int().nonnegative(),
})

export type CouponSummary = z.infer<typeof couponSummarySchema>

export const createCouponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, 'Kode kupon minimal 2 karakter.')
      .max(30, 'Kode kupon maksimal 30 karakter.')
      .regex(
        /^[A-Za-z0-9_-]+$/,
        'Kode kupon hanya boleh berisi huruf, angka, strip, dan garis bawah.',
      )
      .transform((val) => val.toUpperCase()),
    name: z
      .string()
      .trim()
      .min(3, 'Nama kupon minimal 3 karakter.')
      .max(100, 'Nama kupon maksimal 100 karakter.'),
    description: z
      .string()
      .trim()
      .max(255, 'Deskripsi maksimal 255 karakter.')
      .nullable()
      .optional(),
    discount_type: discountTypeSchema,
    discount_value: z
      .number()
      .int('Nilai diskon harus bilangan bulat.')
      .positive('Nilai diskon harus lebih dari 0.'),
    max_discount_cents: z
      .number()
      .int('Pagu diskon harus bilangan bulat.')
      .nonnegative('Pagu diskon tidak boleh negatif.')
      .nullable()
      .optional(),
    min_purchase_cents: z
      .number()
      .int('Minimal belanja harus bilangan bulat.')
      .nonnegative('Minimal belanja tidak boleh negatif.')
      .default(0),
    usage_limit: z
      .number()
      .int('Batas kuota harus bilangan bulat.')
      .positive('Batas kuota harus lebih dari 0.')
      .nullable()
      .optional(),
    user_limit: z
      .number()
      .int('Batas per user harus bilangan bulat.')
      .positive('Batas per user minimal 1.')
      .default(1),
    starts_at: z.string().nullable().optional(),
    expires_at: z.string().nullable().optional(),
    is_active: z.boolean().default(true),
    coin_cost: z
      .number()
      .int('Biaya koin harus bilangan bulat.')
      .nonnegative('Biaya koin tidak boleh negatif.')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return false
      }
      return true
    },
    {
      message: 'Diskon persentase tidak boleh lebih dari 100%.',
      path: ['discount_value'],
    },
  )

export type CreateCouponInput = z.infer<typeof createCouponSchema>

export const updateCouponSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama kupon minimal 3 karakter.')
    .max(100, 'Nama kupon maksimal 100 karakter.')
    .optional(),
  description: z.string().trim().max(255, 'Deskripsi maksimal 255 karakter.').nullable().optional(),
  discount_type: discountTypeSchema.optional(),
  discount_value: z
    .number()
    .int('Nilai diskon harus bilangan bulat.')
    .positive('Nilai diskon harus lebih dari 0.')
    .optional(),
  max_discount_cents: z
    .number()
    .int('Pagu diskon harus bilangan bulat.')
    .nonnegative('Pagu diskon tidak boleh negatif.')
    .nullable()
    .optional(),
  min_purchase_cents: z
    .number()
    .int('Minimal belanja harus bilangan bulat.')
    .nonnegative('Minimal belanja tidak boleh negatif.')
    .optional(),
  usage_limit: z
    .number()
    .int('Batas kuota harus bilangan bulat.')
    .positive('Batas kuota harus lebih dari 0.')
    .nullable()
    .optional(),
  user_limit: z
    .number()
    .int('Batas per user harus bilangan bulat.')
    .positive('Batas per user minimal 1.')
    .optional(),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  coin_cost: z
    .number()
    .int('Biaya koin harus bilangan bulat.')
    .nonnegative('Biaya koin tidak boleh negatif.')
    .nullable()
    .optional(),
})

export type UpdateCouponInput = z.infer<typeof updateCouponSchema>

export interface AvailableCoupon {
  id: string
  coupon_id?: string
  code: string
  name: string
  description?: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  formatted_discount: string
  max_discount_cents?: number | null
  formatted_max_discount?: string | null
  min_purchase_cents: number
  formatted_min_purchase: string
  usage_limit?: number | null
  usage_count?: number
  remaining_quota?: number | null
  user_limit?: number | null
  starts_at?: string | null
  expires_at?: string | null
  is_expired: boolean
  is_available?: boolean
  status?: string
}
