import { z } from 'zod'

export const flashDealItemSchema = z.object({
  product_id: z.number().int().positive(),
  product_slug: z.string().min(1),
  product_name: z.string().min(1),
  image_url: z.string().nullable(),
  original_price_cents: z.number().int().positive(),
  promo_price_cents: z.number().int().positive(),
  discount_percentage: z.number().int().min(1).max(99),
  quota: z.number().int().positive(),
  claimed: z.number().int().min(0),
  starts_at: z.string(),
  ends_at: z.string(),
  is_active: z.boolean(),
})

export type FlashDealItem = z.infer<typeof flashDealItemSchema>

export const flashSaleCampaignSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  tagline: z.string().min(1),
  ends_at: z.string(),
  is_active: z.boolean(),
  items: z.array(flashDealItemSchema),
})

export type FlashSaleCampaign = z.infer<typeof flashSaleCampaignSchema>

/**
 * Menghitung persentase klaim flash sale (0-100%)
 */
export function calculateClaimPercentage(claimed: number, quota: number): number {
  if (quota <= 0) return 100
  const percentage = Math.round((claimed / quota) * 100)
  return Math.min(100, Math.max(0, percentage))
}

/**
 * Menghitung harga diskon berdasarkan persentase
 */
export function calculateDiscountPrice(
  originalPriceCents: number,
  discountPercentage: number,
): number {
  const discountFactor = (100 - discountPercentage) / 100
  return Math.max(100, Math.round(originalPriceCents * discountFactor))
}

const adminFlashDealFields = {
  product_id: z.coerce.number().int('ID produk wajib bilangan bulat').positive(),
  promo_price_cents: z.coerce
    .number()
    .int('Harga promo harus bilangan bulat (sen)')
    .positive('Harga promo harus lebih dari 0'),
  discount_percentage: z.coerce
    .number()
    .int('Persentase diskon harus bilangan bulat')
    .min(1, 'Diskon minimal 1%')
    .max(99, 'Diskon maksimal 99%'),
  quota: z.coerce
    .number()
    .int('Kuota promo harus bilangan bulat')
    .min(1, 'Kuota promo minimal 1 unit')
    .max(100000, 'Kuota promo maksimal 100.000 unit'),
  starts_at: z.string().datetime({ message: 'Format waktu mulai tidak valid (ISO 8601)' }),
  ends_at: z.string().datetime({ message: 'Format waktu berakhir tidak valid (ISO 8601)' }),
  is_active: z.boolean().default(true),
}

export const adminFlashDealCreateSchema = z
  .object(adminFlashDealFields)
  .refine((data) => new Date(data.ends_at).getTime() > new Date(data.starts_at).getTime(), {
    message: 'Waktu berakhir harus setelah waktu mulai',
    path: ['ends_at'],
  })

export const adminFlashDealUpdateSchema = z
  .object(adminFlashDealFields)
  .partial()
  .refine(
    (data) => {
      if (data.starts_at && data.ends_at) {
        return new Date(data.ends_at).getTime() > new Date(data.starts_at).getTime()
      }
      return true
    },
    {
      message: 'Waktu berakhir harus setelah waktu mulai',
      path: ['ends_at'],
    },
  )

export type AdminFlashDealCreateInput = z.infer<typeof adminFlashDealCreateSchema>
export type AdminFlashDealUpdateInput = z.infer<typeof adminFlashDealUpdateSchema>
