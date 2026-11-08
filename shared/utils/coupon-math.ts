/**
 * Shared Coupon Math & Eligibility Deep Module
 * Menghitung diskon voucher, validasi kelayakan belanja minimum, dan optimasi voucher terbaik.
 */

export interface CouponDiscountInput {
  discount_type: 'percentage' | 'fixed' | string
  discount_value: number
  min_purchase_cents: number
  max_discount_cents?: number | null
}

export interface CouponEligibilityInput extends CouponDiscountInput {
  is_expired?: boolean
  is_available?: boolean
}

/**
 * Menghitung besaran diskon voucher dalam satuan sen (cents) tanpa floating point inaccuracies.
 */
export function calculateCouponDiscountCents(
  coupon: CouponDiscountInput | null | undefined,
  subtotalCents: number,
): number {
  if (!coupon || subtotalCents <= 0) return 0
  if (coupon.min_purchase_cents > 0 && subtotalCents < coupon.min_purchase_cents) {
    return 0
  }

  if (coupon.discount_type === 'percentage') {
    let discount = Math.floor((subtotalCents * coupon.discount_value) / 100)
    if (coupon.max_discount_cents != null && discount > coupon.max_discount_cents) {
      discount = coupon.max_discount_cents
    }
    return Math.max(0, Math.min(discount, subtotalCents))
  }

  return Math.max(0, Math.min(coupon.discount_value, subtotalCents))
}

/**
 * Memvalidasi apakah kupon memenuhi syarat belanja dan masih berstatus aktif.
 */
export function isCouponEligible(
  coupon: CouponEligibilityInput | null | undefined,
  subtotalCents: number,
): boolean {
  if (!coupon) return false
  if (coupon.is_expired || coupon.is_available === false) return false
  return subtotalCents >= (coupon.min_purchase_cents || 0)
}

/**
 * Mencari voucher dengan potongan diskon terbesar untuk nilai keranjang tertentu.
 */
export function findBestCoupon<T extends CouponEligibilityInput>(
  coupons: T[],
  subtotalCents: number,
): T | null {
  let bestCoupon: T | null = null
  let maxDiscount = 0

  for (const coupon of coupons) {
    if (!isCouponEligible(coupon, subtotalCents)) continue
    const discount = calculateCouponDiscountCents(coupon, subtotalCents)
    if (discount > maxDiscount) {
      maxDiscount = discount
      bestCoupon = coupon
    }
  }

  return bestCoupon
}
