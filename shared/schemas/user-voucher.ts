import { z } from 'zod'

export const voucherStatusSchema = z.enum(['available', 'claimed', 'used', 'expired'])
export type VoucherStatus = z.infer<typeof voucherStatusSchema>

export const claimVoucherSchema = z
  .object({
    coupon_id: z.string().uuid('ID kupon harus berformat UUID yang valid.').optional(),
    code: z
      .string()
      .trim()
      .min(2, 'Kode kupon minimal 2 karakter.')
      .max(30, 'Kode kupon maksimal 30 karakter.')
      .optional()
      .transform((val) => (val ? val.toUpperCase() : undefined)),
  })
  .refine((data) => Boolean(data.coupon_id || data.code), {
    message: 'ID kupon atau kode kupon wajib disertakan.',
    path: ['code'],
  })

export type ClaimVoucherInput = z.infer<typeof claimVoucherSchema>

export const userVoucherItemSchema = z.object({
  id: z.string(),
  coupon_id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().int(),
  formatted_discount: z.string(),
  min_purchase_cents: z.number().int(),
  formatted_min_purchase: z.string(),
  max_discount_cents: z.number().int().nullable().optional(),
  formatted_max_discount: z.string().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  status: voucherStatusSchema,
  claimed_at: z.string().nullable().optional(),
  used_at: z.string().nullable().optional(),
  is_expired: z.boolean(),
  order_id: z.string().nullable().optional(),
})

export type UserVoucherItem = z.infer<typeof userVoucherItemSchema>

export const voucherWalletResponseSchema = z.object({
  claimed: z.array(userVoucherItemSchema),
  discoverable: z.array(userVoucherItemSchema),
  history: z.array(userVoucherItemSchema),
  active_count: z.number().int().nonnegative(),
})

export type VoucherWalletResponse = z.infer<typeof voucherWalletResponseSchema>
