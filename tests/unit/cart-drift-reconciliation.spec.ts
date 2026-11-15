import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { cartReconcileRequestSchema } from '../../shared/schemas/cart-reconcile'
import { useCartStore } from '../../app/features/cart/stores/cart'
import { useCartReconciliation } from '../../app/features/cart/composables/useCartReconciliation'

const { mockFetch, mockToast } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockToast: {
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

mockNuxtImport('useUiToast', () => () => mockToast)
mockNuxtImport('$fetch', () => mockFetch)
vi.stubGlobal('$fetch', mockFetch)

describe('Cart Drift & Inventory Reconciliation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Zod Schema Validation (shared/schemas/cart-reconcile.ts)', () => {
    it('validates a correct reconcile payload', () => {
      const payload = {
        items: [
          { productId: 101, quantity: 2, priceCents: 5000000 },
          { productId: 102, quantity: 1, priceCents: 12000000 },
        ],
      }
      const parsed = cartReconcileRequestSchema.safeParse(payload)
      expect(parsed.success).toBe(true)
    })

    it('rejects invalid quantities or negative price', () => {
      const invalidQty = cartReconcileRequestSchema.safeParse({
        items: [{ productId: 101, quantity: 0, priceCents: 1000 }],
      })
      expect(invalidQty.success).toBe(false)

      const invalidPrice = cartReconcileRequestSchema.safeParse({
        items: [{ productId: 101, quantity: 1, priceCents: -50 }],
      })
      expect(invalidPrice.success).toBe(false)
    })

    it('rejects arrays exceeding maximum limit of 50 items', () => {
      const tooMany = Array.from({ length: 51 }, (_, idx) => ({
        productId: idx + 1,
        quantity: 1,
        priceCents: 10000,
      }))
      const parsed = cartReconcileRequestSchema.safeParse({ items: tooMany })
      expect(parsed.success).toBe(false)
    })
  })

  describe('useCartReconciliation Composable', () => {
    it('reconciles price changes and updates cart store item with warning', async () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 10,
        name: 'Ergonomic Chair',
        price: 1500000,
        price_cents: 150000000,
        stock: 5,
        slug: 'ergonomic-chair',
      })

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          hasDrift: true,
          warnings: ['Harga Ergonomic Chair diperbarui menjadi Rp 1.650.000.'],
          hasOutOfStockItems: false,
          items: [
            {
              productId: 10,
              variantId: null,
              name: 'Ergonomic Chair',
              requestedQuantity: 1,
              currentStock: 5,
              adjustedQuantity: 1,
              currentPriceCents: 165000000,
              previousPriceCents: 150000000,
              priceChanged: true,
              stockReduced: false,
              isOutOfStock: false,
              isUnavailable: false,
            },
          ],
        },
      })

      const { reconcileCart, driftWarnings, hasOutOfStockItems } = useCartReconciliation()
      const result = await reconcileCart()

      expect(result).toBe(true)
      expect(cart.items[0]?.price).toBe(1650000)
      expect(cart.items[0]?.priceCents).toBe(165000000)
      expect(driftWarnings.value.length).toBe(1)
      expect(driftWarnings.value[0]).toContain('diperbarui')
      expect(hasOutOfStockItems.value).toBe(false)
    })

    it('clamps quantity and flags out of stock if live stock is 0', async () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 20,
        name: 'Desk Pad',
        price: 250000,
        price_cents: 25000000,
        stock: 4,
        slug: 'desk-pad',
      })

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: {
          hasDrift: true,
          warnings: ['Stok Desk Pad saat ini habis.'],
          hasOutOfStockItems: true,
          items: [
            {
              productId: 20,
              variantId: null,
              name: 'Desk Pad',
              requestedQuantity: 1,
              currentStock: 0,
              adjustedQuantity: 0,
              currentPriceCents: 25000000,
              previousPriceCents: 25000000,
              priceChanged: false,
              stockReduced: true,
              isOutOfStock: true,
              isUnavailable: false,
            },
          ],
        },
      })

      const { reconcileCart, hasOutOfStockItems, outOfStockItems } = useCartReconciliation()
      await reconcileCart()

      expect(hasOutOfStockItems.value).toBe(true)
      expect(outOfStockItems.value.length).toBe(1)
      expect(cart.items[0]?.stock).toBe(0)
    })

    it('returns false and does not throw on network failure', async () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 30,
        name: 'Monitor Lightbar',
        price: 500000,
        price_cents: 50000000,
        stock: 3,
        slug: 'lightbar',
      })

      mockFetch.mockRejectedValueOnce(new Error('Network offline'))

      const { reconcileCart, isReconciling } = useCartReconciliation()
      const res = await reconcileCart()

      expect(res).toBe(false)
      expect(isReconciling.value).toBe(false)
      expect(cart.items.length).toBe(1)
    })
  })

  describe('Strict Governance & Antislop Compliance', () => {
    const inspectedFiles = [
      'app/components/cart/CartSummarySidebar.vue',
      'app/features/cart/components/CartDrawer.vue',
      'app/features/cart/components/CartDrawerItem.vue',
      'app/features/cart/stores/cart.ts',
      'app/pages/cart.vue',
      'app/features/cart/composables/useCartReconciliation.ts',
      'server/api/cart/reconcile.post.ts',
      'shared/schemas/cart-reconcile.ts',
    ]

    it('ensures all modified/created files are <= 300 lines', () => {
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

    it('strictly prohibits em dashes in all inspected files', () => {
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
