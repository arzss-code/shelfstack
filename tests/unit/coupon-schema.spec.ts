import { describe, expect, it } from 'vitest'
import {
  couponSummarySchema,
  createCouponSchema,
  discountTypeSchema,
  updateCouponSchema,
  validateCouponSchema,
} from '../../shared/schemas/coupon'
import {
  buildCouponSummary,
  calculateCouponDiscount,
  validateCouponEligibility,
  type CouponRow,
} from '../../server/utils/coupon'

describe('Coupon & Promo Discount Domain Tests', () => {
  describe('Zod Schemas', () => {
    it('memvalidasi tipe diskon resmi (percentage dan fixed)', () => {
      expect(discountTypeSchema.safeParse('percentage').success).toBe(true)
      expect(discountTypeSchema.safeParse('fixed').success).toBe(true)
      expect(discountTypeSchema.safeParse('cashback').success).toBe(false)
    })

    it('mentransformasikan kode kupon ke huruf besar dan memangkas spasi', () => {
      const parsed = validateCouponSchema.safeParse({
        code: '  shelf10  ',
        subtotal_cents: 25000000,
      })

      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.code).toBe('SHELF10')
        expect(parsed.data.subtotal_cents).toBe(25000000)
      }
    })

    it('menolak kode kupon yang terlalu pendek atau subtotal bernilai negatif', () => {
      expect(
        validateCouponSchema.safeParse({
          code: 'a',
          subtotal_cents: 100000,
        }).success,
      ).toBe(false)

      expect(
        validateCouponSchema.safeParse({
          code: 'SHELF10',
          subtotal_cents: -5000,
        }).success,
      ).toBe(false)
    })

    it('memvalidasi couponSummarySchema secara komprehensif', () => {
      const validSummary = {
        code: 'SHELF10',
        name: 'Diskon 10%',
        description: 'Potongan 10% belanja',
        discount_type: 'percentage' as const,
        discount_value: 10,
        max_discount_cents: 10000000,
        min_purchase_cents: 20000000,
        discount_cents: 2500000,
        formatted_discount: 'Rp 25.000',
        final_total_cents: 22500000,
      }

      expect(couponSummarySchema.safeParse(validSummary).success).toBe(true)
    })
  })

  describe('Kalkulasi Diskon (calculateCouponDiscount)', () => {
    it('menghitung diskon persentase secara akurat', () => {
      const coupon = {
        discount_type: 'percentage' as const,
        discount_value: 10,
        max_discount_cents: 10000000, // Rp 100.000
      }

      // Subtotal Rp 200.000 (20.000.000 cents) -> 10% = Rp 20.000 (2.000.000 cents)
      expect(calculateCouponDiscount(coupon, 20000000)).toBe(2000000)
    })

    it('membatasi potongan diskon persentase pada pagu max_discount_cents', () => {
      const coupon = {
        discount_type: 'percentage' as const,
        discount_value: 20, // 20%
        max_discount_cents: 5000000, // Maksimal Rp 50.000
      }

      // Subtotal Rp 1.000.000 -> 20% = Rp 200.000, tetapi dibatasi Rp 50.000
      expect(calculateCouponDiscount(coupon, 100000000)).toBe(5000000)
    })

    it('menghitung diskon nominal tetap (fixed)', () => {
      const coupon = {
        discount_type: 'fixed' as const,
        discount_value: 5000000, // Rp 50.000
        max_discount_cents: null,
      }

      expect(calculateCouponDiscount(coupon, 30000000)).toBe(5000000)
    })

    it('memastikan diskon tidak melebihi subtotal belanja (anti-negatif)', () => {
      const coupon = {
        discount_type: 'fixed' as const,
        discount_value: 10000000, // Rp 100.000
        max_discount_cents: null,
      }

      // Subtotal hanya Rp 40.000 -> Diskon mentok di Rp 40.000
      expect(calculateCouponDiscount(coupon, 4000000)).toBe(4000000)
    })

    it('mengembalikan 0 jika subtotal <= 0', () => {
      const coupon = {
        discount_type: 'fixed' as const,
        discount_value: 5000000,
        max_discount_cents: null,
      }

      expect(calculateCouponDiscount(coupon, 0)).toBe(0)
      expect(calculateCouponDiscount(coupon, -100)).toBe(0)
    })
  })

  describe('Validasi Kelayakan Kupon (validateCouponEligibility)', () => {
    const baseCoupon: CouponRow = {
      id: 'coupon-1',
      code: 'SHELF10',
      name: 'Diskon 10%',
      description: 'Potongan 10%',
      discount_type: 'percentage',
      discount_value: 10,
      max_discount_cents: 10000000,
      min_purchase_cents: 20000000, // Min Rp 200.000
      usage_limit: 100,
      usage_count: 5,
      user_limit: 1,
      starts_at: null,
      expires_at: null,
      is_active: true,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    it('meloloskan kupon yang memenuhi seluruh syarat', () => {
      const res = validateCouponEligibility(baseCoupon, 25000000, 0)
      expect(res.valid).toBe(true)
      expect(res.error).toBeUndefined()
    })

    it('menolak kupon yang nonaktif atau telah di-soft-delete', () => {
      const inactive = { ...baseCoupon, is_active: false }
      expect(validateCouponEligibility(inactive, 25000000).valid).toBe(false)

      const deleted = { ...baseCoupon, deleted_at: new Date().toISOString() }
      expect(validateCouponEligibility(deleted, 25000000).valid).toBe(false)
    })

    it('menolak kupon yang belum mulai berlaku atau sudah kedaluwarsa', () => {
      const now = new Date('2026-10-28T12:00:00Z')

      const futureCoupon = {
        ...baseCoupon,
        starts_at: '2026-11-01T00:00:00Z',
      }
      expect(validateCouponEligibility(futureCoupon, 25000000, 0, now).valid).toBe(false)

      const expiredCoupon = {
        ...baseCoupon,
        expires_at: '2026-10-20T00:00:00Z',
      }
      expect(validateCouponEligibility(expiredCoupon, 25000000, 0, now).valid).toBe(false)
    })

    it('menolak kupon jika kuota penggunaan global telah habis', () => {
      const exhausted = {
        ...baseCoupon,
        usage_limit: 50,
        usage_count: 50,
      }
      const res = validateCouponEligibility(exhausted, 25000000, 0)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('telah habis')
    })

    it('menolak kupon jika subtotal belanja di bawah syarat minimum', () => {
      // Minimum Rp 200.000, subtotal Rp 150.000
      const res = validateCouponEligibility(baseCoupon, 15000000, 0)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('syarat minimum')
    })

    it('menolak kupon jika pengguna telah mencapai batas pemakaian personal', () => {
      const res = validateCouponEligibility(baseCoupon, 25000000, 1) // Sudah pakai 1x, batas 1x
      expect(res.valid).toBe(false)
      expect(res.error).toContain('batas maksimal pemakaian')
    })
  })

  describe('Penyusunan Ringkasan Kupon (buildCouponSummary)', () => {
    it('menghasilkan ringkasan dan format rupiah diskon secara terstruktur', () => {
      const coupon: CouponRow = {
        id: 'coupon-2',
        code: 'HEMAT50K',
        name: 'Potongan Rp 50.000',
        description: 'Hemat 50rb',
        discount_type: 'fixed',
        discount_value: 5000000, // Rp 50.000
        max_discount_cents: null,
        min_purchase_cents: 30000000, // Rp 300.000
        usage_limit: 500,
        usage_count: 12,
        user_limit: 1,
        starts_at: null,
        expires_at: null,
        is_active: true,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const summary = buildCouponSummary(coupon, 45000000) // Subtotal Rp 450.000
      expect(summary.code).toBe('HEMAT50K')
      expect(summary.discount_cents).toBe(5000000)
      expect(summary.final_total_cents).toBe(40000000) // Rp 400.000
      expect(summary.formatted_discount).toContain('50.000')
    })
  })

  describe('Admin Coupon Schemas (createCouponSchema & updateCouponSchema)', () => {
    it('memvalidasi pembuatan kupon baru dan mentransformasikan kode ke uppercase', () => {
      const valid = createCouponSchema.safeParse({
        code: 'promo_baru',
        name: 'Promo Awal Bulan',
        description: 'Potongan spesial',
        discount_type: 'percentage',
        discount_value: 15,
        max_discount_cents: 15000000,
        min_purchase_cents: 20000000,
        usage_limit: 100,
        user_limit: 1,
        is_active: true,
      })

      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.code).toBe('PROMO_BARU')
        expect(valid.data.discount_value).toBe(15)
        expect(valid.data.min_purchase_cents).toBe(20000000)
      }
    })

    it('menolak kupon persentase jika nilai diskon melebihi 100%', () => {
      const invalid = createCouponSchema.safeParse({
        code: 'PROMO150',
        name: 'Promo Tidak Valid',
        discount_type: 'percentage',
        discount_value: 120, // Lebih dari 100%
      })

      expect(invalid.success).toBe(false)
      if (!invalid.success) {
        expect(invalid.error.issues[0]?.message).toContain('100%')
      }
    })

    it('menolak kode kupon yang mengandung karakter khusus yang dilarang', () => {
      const invalid = createCouponSchema.safeParse({
        code: 'PROMO@HEMAT!',
        name: 'Promo Error',
        discount_type: 'fixed',
        discount_value: 5000000,
      })

      expect(invalid.success).toBe(false)
    })

    it('memvalidasi update kupon dengan field parsial', () => {
      const valid = updateCouponSchema.safeParse({
        name: 'Nama Promo Diperbarui',
        is_active: false,
        usage_limit: 500,
      })

      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.name).toBe('Nama Promo Diperbarui')
        expect(valid.data.is_active).toBe(false)
      }
    })

    it('memvalidasi kupon loyalitas dengan atribut coin_cost yang sah', () => {
      const valid = createCouponSchema.safeParse({
        code: 'KOINHEMAT50',
        name: 'Voucher Koin Rp 50.000',
        discount_type: 'fixed',
        discount_value: 5000000,
        coin_cost: 5000,
      })

      expect(valid.success).toBe(true)
      if (valid.success) {
        expect(valid.data.coin_cost).toBe(5000)
      }

      const invalidNegative = createCouponSchema.safeParse({
        code: 'KOINERROR',
        name: 'Voucher Koin Error',
        discount_type: 'fixed',
        discount_value: 10000,
        coin_cost: -500,
      })
      expect(invalidNegative.success).toBe(false)

      const updateWithCoin = updateCouponSchema.safeParse({
        coin_cost: 2500,
      })
      expect(updateWithCoin.success).toBe(true)
      if (updateWithCoin.success) {
        expect(updateWithCoin.data.coin_cost).toBe(2500)
      }
    })
  })
})
