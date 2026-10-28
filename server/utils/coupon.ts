import type { Database } from '~/types/database.types'
import { formatRupiah } from '~/utils/format'
import type { CouponSummary } from '~~/shared/schemas/coupon'

export type CouponRow = Database['public']['Tables']['coupons']['Row']

/**
 * Menghitung besaran diskon riil dalam satuan cents berdasarkan tipe dan pagu maksimal
 */
export function calculateCouponDiscount(
  coupon: Pick<CouponRow, 'discount_type' | 'discount_value' | 'max_discount_cents'>,
  subtotalCents: number,
): number {
  if (subtotalCents <= 0) return 0

  if (coupon.discount_type === 'percentage') {
    const rawDiscount = Math.floor((subtotalCents * coupon.discount_value) / 100)
    const cappedDiscount =
      coupon.max_discount_cents != null && rawDiscount > coupon.max_discount_cents
        ? coupon.max_discount_cents
        : rawDiscount
    return Math.min(cappedDiscount, subtotalCents)
  }

  return Math.min(coupon.discount_value, subtotalCents)
}

/**
 * Validasi aturan kelayakan kupon (waktu, kuota global, kuota per-user, minimum belanja)
 */
export function validateCouponEligibility(
  coupon: CouponRow,
  subtotalCents: number,
  userUsageCount = 0,
  now = new Date(),
): { valid: boolean; error?: string } {
  if (!coupon.is_active || coupon.deleted_at != null) {
    return { valid: false, error: `Kupon "${coupon.code}" tidak ditemukan atau sudah tidak aktif.` }
  }

  const nowMs = now.getTime()

  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > nowMs) {
    return { valid: false, error: `Kupon "${coupon.code}" belum dapat digunakan saat ini.` }
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < nowMs) {
    return { valid: false, error: `Kupon "${coupon.code}" sudah kedaluwarsa.` }
  }

  if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, error: `Kuota penggunaan kupon "${coupon.code}" telah habis.` }
  }

  if (coupon.min_purchase_cents > 0 && subtotalCents < coupon.min_purchase_cents) {
    const minRp = formatRupiah(coupon.min_purchase_cents / 100)
    return {
      valid: false,
      error: `Total belanja belum memenuhi syarat minimum ${minRp} untuk kupon "${coupon.code}".`,
    }
  }

  if (coupon.user_limit != null && coupon.user_limit > 0 && userUsageCount >= coupon.user_limit) {
    return {
      valid: false,
      error: `Anda telah mencapai batas maksimal pemakaian (${coupon.user_limit}x) untuk kupon "${coupon.code}".`,
    }
  }

  return { valid: true }
}

/**
 * Format payload ringkasan kupon untuk respon API
 */
export function buildCouponSummary(coupon: CouponRow, subtotalCents: number): CouponSummary {
  const discountCents = calculateCouponDiscount(coupon, subtotalCents)
  const finalTotalCents = Math.max(0, subtotalCents - discountCents)

  return {
    code: coupon.code,
    name: coupon.name,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    max_discount_cents: coupon.max_discount_cents,
    min_purchase_cents: coupon.min_purchase_cents,
    discount_cents: discountCents,
    formatted_discount: formatRupiah(discountCents / 100),
    final_total_cents: finalTotalCents,
  }
}
