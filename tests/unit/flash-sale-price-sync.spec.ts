import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  getFlashSaleTimeWindow,
  calculateDeterministicDiscount,
  buildFlashDealItem,
} from '../../server/utils/flash-sale'
import { calculateDiscountPrice } from '../../shared/schemas/flash-deals'

describe('Flash Sale Price Synchronization & Visual Card Integrity Suite', () => {
  describe('Server Promotion Window & Price Math Invariants', () => {
    it('generates a valid 24-hour daily window ending at 23:59:59.999', () => {
      const window = getFlashSaleTimeWindow()
      const start = new Date(window.startsAt)
      const end = new Date(window.endsAt)

      expect(end.getTime()).toBeGreaterThan(start.getTime())
      expect(window.isActive).toBe(true)
      expect(end.getHours()).toBe(23)
      expect(end.getMinutes()).toBe(59)
      expect(end.getSeconds()).toBe(59)
    })

    it('generates consistent deterministic discount percentage between 15% and 35%', () => {
      const testProductIds = [1, 2, 5, 10, 42, 99, 105, 204]
      for (const id of testProductIds) {
        const discount = calculateDeterministicDiscount(id)
        expect(discount).toBeGreaterThanOrEqual(15)
        expect(discount).toBeLessThanOrEqual(35)
      }
    })

    it('calculates mathematically accurate promo price cents', () => {
      const originalPriceCents = 10000000 // Rp 100.000
      const discountPercentage = 25
      const promoPriceCents = calculateDiscountPrice(originalPriceCents, discountPercentage)

      expect(promoPriceCents).toBe(7500000) // Rp 75.000
      expect(promoPriceCents).toBeLessThan(originalPriceCents)
    })

    it('builds a synchronized flash deal item preserving stock and quota bounds', () => {
      const mockProduct = {
        id: 101,
        name: 'Ergonomic Wood Desk',
        price: 500000,
        price_cents: 50000000,
        stock: 12,
        sold_count: 8,
      }

      const deal = buildFlashDealItem(mockProduct, 0)
      expect(deal.product_id).toBe(101)
      expect(deal.original_price_cents).toBe(50000000)
      expect(deal.promo_price_cents).toBeLessThan(deal.original_price_cents)
      expect(deal.quota).toBeLessThanOrEqual(mockProduct.stock)
      expect(deal.claimed).toBeLessThan(deal.quota)
      expect(deal.is_active).toBe(true)
    })
  })

  describe('Architectural Line Limits & Code Cleanliness', () => {
    const files = [
      'server/utils/flash-sale.ts',
      'server/api/promotions/flash-deals.get.ts',
      'server/api/cart/reconcile.post.ts',
      'app/components/promotions/ProductFlashSaleBanner.vue',
      'app/components/promotions/FlashSaleProgress.vue',
      'app/components/home/HomeFlashDeals.vue',
      'app/features/cart/stores/cart.ts',
      'app/features/cart/components/CartDrawerItem.vue',
      'app/pages/product/[id].vue',
      'tests/unit/flash-sale-price-sync.spec.ts',
    ]

    it('ensures all modified and created files are strictly <= 300 lines', () => {
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        expect(lines, `File ${file} exceeds 300 lines limit (${lines})`).toBeLessThanOrEqual(300)
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

  describe('Design System, Visual Taste & Accessibility Verifications', () => {
    it('verifies ProductFlashSaleBanner follows anti-slop rules without animate-ping and with solid-danger badge', () => {
      const fullPath = resolve(
        process.cwd(),
        'app/components/promotions/ProductFlashSaleBanner.vue',
      )
      const content = readFileSync(fullPath, 'utf-8')

      expect(content).not.toContain('animate-ping')
      expect(content).toContain('variant="solid-danger"')
      expect(content).toContain('timerSegments')
      expect(content).toContain('role="timer"')
      expect(content).toContain('aria-live="polite"')
      expect(content).toContain('role="region"')
    })

    it('verifies FlashSaleProgress uses progressbar ARIA semantics and gradient fill', () => {
      const fullPath = resolve(process.cwd(), 'app/components/promotions/FlashSaleProgress.vue')
      const content = readFileSync(fullPath, 'utf-8')

      expect(content).toContain('role="progressbar"')
      expect(content).toContain(':aria-valuenow="percentage"')
      expect(content).toContain('bg-gradient-to-r')
    })

    it('verifies CartDrawerItem marks flash sale items distinctly', () => {
      const fullPath = resolve(process.cwd(), 'app/features/cart/components/CartDrawerItem.vue')
      const content = readFileSync(fullPath, 'utf-8')

      expect(content).toContain('Flash Sale')
      expect(content).toContain('item.originalPriceCents')
    })
  })
})
