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
