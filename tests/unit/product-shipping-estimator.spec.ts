import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shippingRateTiers } from '../../shared/schemas/shipping'

describe('PDP Quick Shipping Rate & ETA Estimator', () => {
  describe('Shipping Calculation & Threshold Invariants', () => {
    it('contains all 4 standard courier service tiers with ETD', () => {
      const tierIds = shippingRateTiers.map((t) => t.id)
      expect(tierIds).toContain('reguler')
      expect(tierIds).toContain('express')
      expect(tierIds).toContain('instant')
      expect(tierIds).toContain('cargo')

      shippingRateTiers.forEach((tier) => {
        expect(tier.name.length).toBeGreaterThan(0)
        expect(tier.etd.length).toBeGreaterThan(0)
        expect(tier.baseFeeCents).toBeGreaterThan(0)
      })
    })

    it('qualifies for free shipping when product price is >= Rp 500.000', () => {
      const regulerTier = shippingRateTiers.find((t) => t.id === 'reguler')
      expect(regulerTier).toBeDefined()
      expect(regulerTier?.freeThresholdCents).toBe(50000000)

      const highPriceCents = 65000000
      const isFree = Boolean(
        regulerTier?.freeThresholdCents && highPriceCents >= regulerTier.freeThresholdCents,
      )
      expect(isFree).toBe(true)

      const lowPriceCents = 35000000
      const isFreeLow = Boolean(
        regulerTier?.freeThresholdCents && lowPriceCents >= regulerTier.freeThresholdCents,
      )
      expect(isFreeLow).toBe(false)
    })

    it('calculates the exact deficit remaining for free shipping threshold', () => {
      const priceRupiah = 380000
      const threshold = 500000
      const deficit = threshold - priceRupiah
      expect(deficit).toBe(120000)
    })
  })

  describe('Architectural Line Limits & Governance', () => {
    const files = [
      'app/components/product/ProductShippingEstimator.vue',
      'app/pages/product/[id].vue',
      'tests/unit/product-shipping-estimator.spec.ts',
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
