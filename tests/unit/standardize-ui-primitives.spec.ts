import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Design System & UI Primitives Standardization Suite', () => {
  const refactoredFiles = [
    'app/components/product/ProductShippingEstimator.vue',
    'app/components/admin/users/AdminCustomer360Drawer.vue',
    'app/components/promotions/ProductFlashSaleBanner.vue',
    'app/components/home/HomeFlashDeals.vue',
    'app/pages/admin/users.vue',
    'app/features/orders/components/OrderPaymentCountdownCard.vue',
  ]

  describe('Architectural Line Limits & Code Cleanliness', () => {
    it('ensures all refactored component files are strictly <= 300 lines', () => {
      for (const file of refactoredFiles) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        expect(lines, `File ${file} exceeds 300 lines limit (${lines})`).toBeLessThanOrEqual(300)
      }
    })

    it('strictly prohibits em dashes in all refactored component files', () => {
      const emDash = String.fromCharCode(8212)
      for (const file of refactoredFiles) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        expect(content.includes(emDash), `File ${file} contains forbidden em dash`).toBe(false)
      }
    })
  })

  describe('Official UI Primitives Adoption Audit', () => {
    it('verifies ProductShippingEstimator uses UiSelect, UiBadge, and UiAlert instead of raw HTML elements', () => {
      const fullPath = resolve(process.cwd(), 'app/components/product/ProductShippingEstimator.vue')
      const content = readFileSync(fullPath, 'utf-8')

      // Must use UiSelect and not raw <select>
      expect(content).toContain('<UiSelect')
      expect(content).not.toMatch(/<select[\s>]/)

      // Must use UiBadge and UiAlert
      expect(content).toContain('<UiBadge')
      expect(content).toContain('<UiAlert')
    })

    it('verifies AdminCustomer360Drawer uses UiIconButton and UiBadge primitives', () => {
      const fullPath = resolve(
        process.cwd(),
        'app/components/admin/users/AdminCustomer360Drawer.vue',
      )
      const content = readFileSync(fullPath, 'utf-8')

      // Must use UiIconButton for close button
      expect(content).toContain('<UiIconButton')

      // Must use UiBadge for customer role and order statuses
      expect(content).toContain('<UiBadge')
    })

    it('verifies ProductFlashSaleBanner and HomeFlashDeals use UiBadge and UiButton', () => {
      const bannerPath = resolve(
        process.cwd(),
        'app/components/promotions/ProductFlashSaleBanner.vue',
      )
      const bannerContent = readFileSync(bannerPath, 'utf-8')
      expect(bannerContent).toContain('<UiBadge')

      const homeDealsPath = resolve(process.cwd(), 'app/components/home/HomeFlashDeals.vue')
      const homeDealsContent = readFileSync(homeDealsPath, 'utf-8')
      expect(homeDealsContent).toContain('<UiBadge')
      expect(homeDealsContent).toContain('<UiButton')
    })

    it('verifies Admin users page uses UiBadge for order count badges', () => {
      const usersPath = resolve(process.cwd(), 'app/pages/admin/users.vue')
      const content = readFileSync(usersPath, 'utf-8')
      expect(content).toContain('<UiBadge')
    })
  })
})
