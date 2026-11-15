import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  flashDealItemSchema,
  flashSaleCampaignSchema,
  calculateClaimPercentage,
  calculateDiscountPrice,
} from '../../shared/schemas/flash-deals'

describe('Flash Sale & Limited-Time Promotion Engine', () => {
  describe('Zod Schemas & Domain Rules', () => {
    it('validates a valid flash deal item correctly', () => {
      const validDeal = {
        product_id: 101,
        product_slug: 'aluminum-monitor-stand',
        product_name: 'Aluminum Monitor Stand Pro',
        image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf',
        original_price_cents: 10000000,
        promo_price_cents: 8000000,
        discount_percentage: 20,
        quota: 20,
        claimed: 14,
        starts_at: '2026-11-15T00:00:00.000Z',
        ends_at: '2026-11-15T23:59:59.999Z',
        is_active: true,
      }

      const result = flashDealItemSchema.safeParse(validDeal)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.product_id).toBe(101)
        expect(result.data.discount_percentage).toBe(20)
      }
    })

    it('rejects invalid discount percentage (< 1 or > 99)', () => {
      const invalidLow = {
        product_id: 101,
        product_slug: 'test',
        product_name: 'Test',
        image_url: null,
        original_price_cents: 100000,
        promo_price_cents: 99000,
        discount_percentage: 0,
        quota: 10,
        claimed: 2,
        starts_at: '2026-11-15T00:00:00.000Z',
        ends_at: '2026-11-15T23:59:59.999Z',
        is_active: true,
      }
      expect(flashDealItemSchema.safeParse(invalidLow).success).toBe(false)

      const invalidHigh = { ...invalidLow, discount_percentage: 100 }
      expect(flashDealItemSchema.safeParse(invalidHigh).success).toBe(false)
    })

    it('validates a complete flash sale campaign with items', () => {
      const campaign = {
        id: 'flash-sale-2026-11-15',
        title: 'Flash Sale Hari Ini',
        tagline: 'Koleksi kurasi eksklusif dengan harga promo terbatas.',
        ends_at: '2026-11-15T23:59:59.999Z',
        is_active: true,
        items: [
          {
            product_id: 202,
            product_slug: 'desk-mat-vegan-leather',
            product_name: 'Desk Mat Vegan Leather',
            image_url: null,
            original_price_cents: 35000000,
            promo_price_cents: 28000000,
            discount_percentage: 20,
            quota: 15,
            claimed: 9,
            starts_at: '2026-11-15T00:00:00.000Z',
            ends_at: '2026-11-15T23:59:59.999Z',
            is_active: true,
          },
        ],
      }

      const parsed = flashSaleCampaignSchema.safeParse(campaign)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.items).toHaveLength(1)
      }
    })
  })

  describe('Business Calculation Formulas', () => {
    it('calculates claim percentage within 0-100% bounds', () => {
      expect(calculateClaimPercentage(0, 20)).toBe(0)
      expect(calculateClaimPercentage(10, 20)).toBe(50)
      expect(calculateClaimPercentage(15, 20)).toBe(75)
      expect(calculateClaimPercentage(25, 20)).toBe(100)
      expect(calculateClaimPercentage(5, 0)).toBe(100)
    })

    it('calculates discount price accurately', () => {
      // 100.000 diskon 20% -> 80.000
      expect(calculateDiscountPrice(100000, 20)).toBe(80000)
      // 250.000 diskon 30% -> 175.000
      expect(calculateDiscountPrice(250000, 30)).toBe(175000)
      // 50.000 diskon 15% -> 42.500
      expect(calculateDiscountPrice(50000, 15)).toBe(42500)
    })
  })

  describe('Architectural Line Limits & Governance', () => {
    const files = [
      'shared/schemas/flash-deals.ts',
      'server/api/promotions/flash-deals.get.ts',
      'app/composables/useFlashSale.ts',
      'app/composables/useProductConfigurator.ts',
      'app/components/promotions/FlashSaleProgress.vue',
      'app/components/promotions/ProductFlashSaleBanner.vue',
      'app/components/home/HomeFlashDeals.vue',
      'app/components/product/ProductConfigurator.vue',
      'app/pages/product/[id].vue',
      'tests/unit/flash-deals.spec.ts',
    ]

    it('ensures all modified and created files are <= 300 lines', () => {
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        expect(lines, `File ${file} exceeds 300 lines (${lines})`).toBeLessThanOrEqual(300)
      }
    })

    it('strictly prohibits em dashes in all modified and created files', () => {
      const emDash = String.fromCharCode(8212)
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        expect(content.includes(emDash), `File ${file} contains forbidden em dash`).toBe(false)
      }
    })
  })
})
