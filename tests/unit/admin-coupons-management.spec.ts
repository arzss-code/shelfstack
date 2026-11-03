import { describe, expect, it } from 'vitest'
import { createCouponSchema, updateCouponSchema } from '../../shared/schemas/coupon'
import { formatRupiah } from '../../app/utils/format'

describe('Admin Coupons Management Unit Tests', () => {
  describe('Kupon Promosi Biasa & Kupon Koin Loyalitas', () => {
    it('memvalidasi kupon promosi persentase dengan pagu maksimal', () => {
      const input = {
        code: 'HEMAT25',
        name: 'Diskon Spesial 25%',
        description: 'Maksimal potongan Rp 50.000',
        discount_type: 'percentage' as const,
        discount_value: 25,
        max_discount_cents: 5000000,
        min_purchase_cents: 10000000,
        usage_limit: 200,
        user_limit: 1,
        is_active: true,
      }

      const res = createCouponSchema.safeParse(input)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.code).toBe('HEMAT25')
        expect(res.data.coin_cost).toBeUndefined()
      }
    })

    it('memvalidasi kupon yang diintegrasikan dengan Loyalty Coins Hub (coin_cost)', () => {
      const input = {
        code: 'KOINTUKAR10',
        name: 'Voucher Potongan Koin 10K',
        description: 'Tukar 1.000 Koin ShelfStack',
        discount_type: 'fixed' as const,
        discount_value: 1000000,
        min_purchase_cents: 5000000,
        usage_limit: 500,
        user_limit: 1,
        is_active: true,
        coin_cost: 1000,
      }

      const res = createCouponSchema.safeParse(input)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.code).toBe('KOINTUKAR10')
        expect(res.data.coin_cost).toBe(1000)
      }
    })

    it('memvalidasi update status kupon dan nilai biaya koin baru', () => {
      const updatePayload = {
        is_active: false,
        coin_cost: 3000,
      }

      const res = updateCouponSchema.safeParse(updatePayload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.is_active).toBe(false)
        expect(res.data.coin_cost).toBe(3000)
      }
    })
  })

  describe('Format Nominal & Pemetaan Status Usages', () => {
    it('memformat diskon dan nilai transaksi pesanan secara konsisten', () => {
      const discountCents = 2500000
      const orderTotalCents = 15000000

      const formattedDiscount = formatRupiah(discountCents / 100)
      const formattedTotal = formatRupiah(orderTotalCents / 100)

      expect(formattedDiscount).toContain('25.000')
      expect(formattedTotal).toContain('150.000')
    })

    it('menghitung status kedaluwarsa kupon berdasarkan tanggal expires_at', () => {
      const now = new Date('2026-11-03T12:00:00Z').getTime()
      const expiredDate = '2026-10-31T23:59:59Z'
      const activeDate = '2026-12-31T23:59:59Z'

      const isExpired1 = new Date(expiredDate).getTime() < now
      const isExpired2 = new Date(activeDate).getTime() < now

      expect(isExpired1).toBe(true)
      expect(isExpired2).toBe(false)
    })
  })
})
