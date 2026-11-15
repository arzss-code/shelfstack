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
