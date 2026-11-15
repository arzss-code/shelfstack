import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { computed, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useCartStore } from '../../app/features/cart/stores/cart'
import {
  useCheckoutSummaryDisplay,
  createCheckoutPlacedSnapshot,
} from '../../app/composables/useCheckoutSummaryDisplay'

const { mockRouter, mockToast, mockFetch } = vi.hoisted(() => ({
  mockRouter: { push: vi.fn(), replace: vi.fn() },
  mockToast: {
    show: vi.fn(),
    add: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  mockFetch: vi.fn(),
}))

mockNuxtImport('useRouter', () => () => mockRouter)
mockNuxtImport('useUiToast', () => () => mockToast)
mockNuxtImport('$fetch', () => mockFetch)
vi.stubGlobal('$fetch', mockFetch)

describe('Checkout Drift Guard & Modular Summary Display', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('useCheckoutSummaryDisplay Sub-composable', () => {
    it('calculates display prices, item counts and free shipping badge correctly', () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 101,
        name: 'Desk Pad Mat',
        price: 250000,
        price_cents: 25000000,
        stock: 5,
        slug: 'desk-pad-mat',
      })

      const actualCoinsUsed = computed(() => 5000)
      const coinsDiscountCents = computed(() => 500000)
      const shippingFeeCents = computed(() => 0)
      const isFreeShipping = computed(() => true)
      const placedOrderSnapshot = ref(null)

      const summary = useCheckoutSummaryDisplay({
        cartStore: cart,
        actualCoinsUsed,
        coinsDiscountCents,
        shippingFeeCents,
        isFreeShipping,
        placedOrderSnapshot,
      })

      expect(summary.displayTotalItems.value).toBe(1)
      expect(summary.displayTotalPrice.value).toContain('250.000')
      expect(summary.displayIsFreeShipping.value).toBe(true)
      expect(summary.displayShippingFeeFormatted.value).toBe('Gratis Ongkir')
      expect(summary.displayFinalPrice.value).toContain('245.000')
    })

    it('creates immutable placed order snapshot matching checkout totals', () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 202,
        name: 'Solid Walnut Tray',
        price: 450000,
        price_cents: 45000000,
        stock: 10,
        slug: 'walnut-tray',
      })

      const snapshot = createCheckoutPlacedSnapshot({
        cartStore: cart,
        actualCoinsUsed: 0,
        coinsDiscountCents: 0,
        shippingFeeCents: 2000000,
        isFreeShipping: false,
        shippingService: 'reguler',
      })

      expect(snapshot.items.length).toBe(1)
      expect(snapshot.totalItems).toBe(1)
      expect(snapshot.isFreeShipping).toBe(false)
      expect(snapshot.shippingFeeFormatted).toContain('20.000')
      expect(snapshot.finalPriceFormatted).toContain('470.000')
    })
  })

  describe('Strict Architectural Governance & Line Limits', () => {
    const inspectedFiles = [
      'app/composables/useCheckoutOrder.ts',
      'app/composables/useCheckoutSummaryDisplay.ts',
      'server/api/orders/[id]/status.put.ts',
      'server/api/orders/[id]/tracking.get.ts',
      'tests/unit/checkout-drift-guard.spec.ts',
    ]

    it('ensures all touched files are strictly <= 300 lines', () => {
      for (const file of inspectedFiles) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        const lineCount = content.split('\n').length
        expect(
          lineCount,
          `File ${file} melebihi batas 300 baris (${lineCount} baris)`,
        ).toBeLessThanOrEqual(300)
      }
    })

    it('strictly prohibits em dashes across all touched files', () => {
      const emDashChar = String.fromCharCode(8212)
      for (const file of inspectedFiles) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        expect(
          content.includes(emDashChar),
          `File ${file} mengandung karakter em dash terlarang`,
        ).toBe(false)
      }
    })
  })
})
