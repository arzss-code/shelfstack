import { describe, expect, it } from 'vitest'
import {
  calculateCouponDiscount,
  validateCouponEligibility,
  buildCouponSummary,
  type CouponRow,
} from '../../server/utils/coupon'
import { checkoutSchema } from '../../shared/schemas/order'

describe('Coupon Validation & Checkout Integration Unit Tests', () => {
  const mockCouponSHELF10: CouponRow = {
    id: 'f1a94bb2-0000-0000-0000-000000000001',
    code: 'SHELF10',
    name: 'Diskon Spesial 10%',
    description: 'Potongan 10% hingga Rp 100.000 dengan minimal belanja Rp 200.000',
    discount_type: 'percentage',
    discount_value: 10,
    max_discount_cents: 10000000, // Rp 100.000
    min_purchase_cents: 20000000, // Rp 200.000
    usage_limit: 1000,
    usage_count: 5,
    user_limit: 1,
    starts_at: null,
    expires_at: null,
    is_active: true,
    deleted_at: null,
    created_at: '2026-10-28T00:00:00.000Z',
    updated_at: '2026-10-28T00:00:00.000Z',
  }

  const mockCouponHEMAT50K: CouponRow = {
    id: 'f1a94bb2-0000-0000-0000-000000000002',
    code: 'HEMAT50K',
    name: 'Hemat Rp 50.000',
    description: 'Potongan langsung Rp 50.000 dengan minimal belanja Rp 300.000',
    discount_type: 'fixed',
    discount_value: 5000000, // Rp 50.000
    max_discount_cents: null,
    min_purchase_cents: 30000000, // Rp 300.000
    usage_limit: 500,
    usage_count: 50,
    user_limit: 2,
    starts_at: null,
    expires_at: null,
    is_active: true,
    deleted_at: null,
    created_at: '2026-10-28T00:00:00.000Z',
    updated_at: '2026-10-28T00:00:00.000Z',
  }

  it('menghitung potongan persentase untuk belanja Rp 350.000 secara presisi', () => {
    // 10% dari Rp 350.000 = Rp 35.000
    const subtotal = 35000000
    const discount = calculateCouponDiscount(mockCouponSHELF10, subtotal)
    expect(discount).toBe(3500000)

    const summary = buildCouponSummary(mockCouponSHELF10, subtotal)
    expect(summary.discount_cents).toBe(3500000)
    expect(summary.final_total_cents).toBe(31500000)
    expect(summary.formatted_discount).toContain('35.000')
  })

  it('memotong tepat pagu maksimal saat persentase melebihi batas batas maksimum', () => {
    // Belanja Rp 2.500.000 (10% = Rp 250.000), tapi batas maksimum Rp 100.000
    const subtotal = 250000000
    const discount = calculateCouponDiscount(mockCouponSHELF10, subtotal)
    expect(discount).toBe(10000000) // Rp 100.000

    const summary = buildCouponSummary(mockCouponSHELF10, subtotal)
    expect(summary.final_total_cents).toBe(240000000) // Rp 2.400.000
  })

  it('mengakomodasi diskon tetap Rp 50.000 untuk belanja di atas minimum', () => {
    const subtotal = 40000000 // Rp 400.000
    const eligibility = validateCouponEligibility(mockCouponHEMAT50K, subtotal, 0)
    expect(eligibility.valid).toBe(true)

    const discount = calculateCouponDiscount(mockCouponHEMAT50K, subtotal)
    expect(discount).toBe(5000000)

    const summary = buildCouponSummary(mockCouponHEMAT50K, subtotal)
    expect(summary.final_total_cents).toBe(35000000)
  })

  it('menolak kupon jika belanjaan kurang dari minimum yang disyaratkan', () => {
    const subtotal = 25000000 // Rp 250.000, syarat HEMAT50K adalah Rp 300.000
    const eligibility = validateCouponEligibility(mockCouponHEMAT50K, subtotal, 0)
    expect(eligibility.valid).toBe(false)
    expect(eligibility.error).toContain('syarat minimum')
  })

  it('mengizinkan kupon dipakai hingga batas user_limit, lalu menolaknya jika terlampaui', () => {
    const subtotal = 40000000
    // User baru pakai 1x, batas 2x -> lolos
    expect(validateCouponEligibility(mockCouponHEMAT50K, subtotal, 1).valid).toBe(true)

    // User sudah pakai 2x, batas 2x -> ditolak
    const rejected = validateCouponEligibility(mockCouponHEMAT50K, subtotal, 2)
    expect(rejected.valid).toBe(false)
    expect(rejected.error).toContain('batas maksimal pemakaian')
  })

  it('mengintegrasikan coupon_code opsional pada checkoutSchema', () => {
    const validCheckoutWithCoupon = {
      items: [
        {
          product_id: 1,
          qty: 2,
        },
      ],
      address: {
        name: 'Ahmad Arya',
        phone: '081234567890',
        street: 'Jl. Sudirman No. 45',
        city: 'Jakarta Selatan',
        postal: '12190',
      },
      coupon_code: 'SHELF10',
    }

    const res = checkoutSchema.safeParse(validCheckoutWithCoupon)
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.coupon_code).toBe('SHELF10')
    }

    const validWithoutCoupon = {
      ...validCheckoutWithCoupon,
      coupon_code: undefined,
    }
    expect(checkoutSchema.safeParse(validWithoutCoupon).success).toBe(true)
  })
})
