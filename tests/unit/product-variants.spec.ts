import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useProductConfigurator } from '../../app/composables/useProductConfigurator'
import { buildCheckoutOrderPayload } from '../../app/utils/checkout-pricing'
import { checkoutItemSchema } from '../../shared/schemas/order'
import type { Product } from '../../app/types/product'

describe('Product Variants & SKU Matrix', () => {
  const sampleProduct: Product = {
    id: 1,
    name: 'Headphone Studio ANC',
    slug: 'headphone-studio-anc',
    price: 2680000,
    stock: 25,
    image_url: 'https://example.com/headphone.jpg',
    sku: 'SS-TECH-01',
    rating: 4.9,
    review_count: 120,
    variants: [
      {
        id: '28082f15-1fd6-425e-9f6e-ed197c591c31',
        product_id: 1,
        sku: 'SS-TECH-01-BLK',
        name: 'Matte Obsidian',
        price_cents: 268000000,
        stock: 15,
        attributes: { color: 'Matte Obsidian' },
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: '28082f15-1fd6-425e-9f6e-ed197c591c32',
        product_id: 1,
        sku: 'SS-TECH-01-SLV',
        name: 'Silver Frost',
        price_cents: 285000000,
        stock: 6,
        attributes: { color: 'Silver Frost' },
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ],
  }

  describe('useProductConfigurator with variants', () => {
    it('sets initial variant selection from first color option', () => {
      const productRef = ref(sampleProduct)
      const onAddToBag = vi.fn()
      const onBuyNow = vi.fn()

      const configurator = useProductConfigurator(() => productRef.value, {
        onAddToBag,
        onBuyNow,
      })

      expect(configurator.selectedColor.value).toBe('Matte Obsidian')
      expect(configurator.selectedVariant.value?.id).toBe('28082f15-1fd6-425e-9f6e-ed197c591c31')
      expect(configurator.effectivePrice.value).toBe(2680000)
      expect(configurator.effectiveStock.value).toBe(15)
      expect(configurator.effectiveSku.value).toBe('SS-TECH-01-BLK')
    })

    it('updates effective price, stock, and SKU when variant selection changes', () => {
      const productRef = ref(sampleProduct)
      const configurator = useProductConfigurator(() => productRef.value, {
        onAddToBag: vi.fn(),
        onBuyNow: vi.fn(),
      })

      configurator.selectedColor.value = 'Silver Frost'

      expect(configurator.selectedVariant.value?.id).toBe('28082f15-1fd6-425e-9f6e-ed197c591c32')
      expect(configurator.effectivePrice.value).toBe(2850000)
      expect(configurator.effectiveStock.value).toBe(6)
      expect(configurator.effectiveSku.value).toBe('SS-TECH-01-SLV')
    })

    it('emits payload with variant details on handleAddToBag', () => {
      const productRef = ref(sampleProduct)
      const onAddToBag = vi.fn()
      const configurator = useProductConfigurator(() => productRef.value, {
        onAddToBag,
        onBuyNow: vi.fn(),
      })

      configurator.selectedColor.value = 'Silver Frost'
      configurator.quantity.value = 2
      configurator.handleAddToBag()

      expect(onAddToBag).toHaveBeenCalledTimes(1)
      expect(onAddToBag).toHaveBeenCalledWith({
        quantity: 2,
        color: 'Silver Frost',
        material: expect.any(String),
        variantId: '28082f15-1fd6-425e-9f6e-ed197c591c32',
        variantName: 'Silver Frost',
        sku: 'SS-TECH-01-SLV',
        price: 2850000,
      })
    })

    it('falls back to product base values when product has no variants', () => {
      const simpleProduct: Product = {
        id: 2,
        name: 'Desk Pad Kulit Minimalis',
        slug: 'desk-pad-kulit',
        price: 350000,
        stock: 20,
        image_url: null,
        sku: 'SS-HOME-02',
      }
      const productRef = ref(simpleProduct)
      const configurator = useProductConfigurator(() => productRef.value, {
        onAddToBag: vi.fn(),
        onBuyNow: vi.fn(),
      })

      expect(configurator.selectedVariant.value).toBeNull()
      expect(configurator.effectivePrice.value).toBe(350000)
      expect(configurator.effectiveStock.value).toBe(20)
      expect(configurator.effectiveSku.value).toBe('SS-HOME-02')
    })
  })

  describe('Order payload and schema with variants', () => {
    it('maps variantId to variant_id in buildCheckoutOrderPayload', () => {
      const payload = buildCheckoutOrderPayload({
        items: [
          {
            productId: 1,
            name: 'Headphone Studio ANC',
            price: 2850000,
            quantity: 2,
            stock: 6,
            variantId: '28082f15-1fd6-425e-9f6e-ed197c591c32',
          },
          {
            productId: 2,
            name: 'Desk Pad Kulit Minimalis',
            price: 350000,
            quantity: 1,
            stock: 20,
          },
        ],
        address: {
          name: 'Budi Santoso',
          phone: '081234567890',
          street: 'Jl. Sudirman No. 45 Blok B',
          city: 'Jakarta Selatan',
          postal: '12190',
        },
        shippingService: 'reguler',
        coinsUsed: 0,
      })

      expect(payload.items).toHaveLength(2)
      expect(payload.items[0]).toEqual({
        product_id: 1,
        qty: 2,
        variant_id: '28082f15-1fd6-425e-9f6e-ed197c591c32',
      })
      expect(payload.items[1]).toEqual({
        product_id: 2,
        qty: 1,
        variant_id: undefined,
      })
    })

    it('validates checkoutItemSchema with valid UUID variant_id', () => {
      const validItem = {
        product_id: 1,
        qty: 1,
        variant_id: '28082f15-1fd6-425e-9f6e-ed197c591c32',
      }
      expect(checkoutItemSchema.safeParse(validItem).success).toBe(true)
    })

    it('rejects checkoutItemSchema with invalid UUID variant_id', () => {
      const invalidItem = {
        product_id: 1,
        qty: 1,
        variant_id: 'invalid-non-uuid',
      }
      expect(checkoutItemSchema.safeParse(invalidItem).success).toBe(false)
    })
  })
})
