import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { useRelatedProducts } from '../../app/composables/useRelatedProducts'
import ProductRelatedSection from '../../app/components/product/ProductRelatedSection.vue'
import type { Product } from '../../app/types/product'

const createMockProduct = (
  id: number,
  name: string,
  category_id = '28082f15-1fd6-425e-9f6e-ed197c591c39',
): Product => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-'),
  price: 1000000,
  stock: 10,
  category_id,
  image_url: `https://example.com/${id}.jpg`,
})

const mockProductA = createMockProduct(1, 'Mechanical Keyboard Master')
const mockProductB = createMockProduct(2, 'Studio Monitor Headphone')
const mockProductC = createMockProduct(3, 'Desk Pad Wool Felt')
const mockProductD = createMockProduct(4, 'Wireless Charger Dock')
const mockProductE = createMockProduct(
  5,
  'Precision Titanium Pen',
  '8d426592-2d81-4d0a-85a3-edae2803b8ad',
)
const mockProductF = createMockProduct(
  6,
  'Ergonomic Desk Chair',
  '0c6b1f1d-64ca-4c94-8666-91a97f8e4095',
)
const mockProductG = createMockProduct(7, 'Aluminum Laptop Stand')
const mockProductH = createMockProduct(8, 'Monitor Light Bar')

const { mockFetch } = vi.hoisted(() => {
  const fMock: any = vi.fn()
  fMock.create = () => fMock
  fMock.raw = vi.fn()
  return {
    mockFetch: fMock,
  }
})

vi.mock('ofetch', () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}))

mockNuxtImport('$fetch', () => mockFetch)
vi.stubGlobal('$fetch', mockFetch)

const globalStubs = {
  ProductCard: {
    template: `
      <div class="product-card-stub" :data-product-id="product.id">
        <span>{{ product.name }}</span>
      </div>
    `,
    props: ['product', 'hideActions'],
  },
  UiButton: {
    template: `
      <button type="button" class="ui-button-stub" @click="$emit('click', $event)">
        <slot />
      </button>
    `,
    props: ['variant', 'size', 'icon'],
  },
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}

describe('Product Related Recommendations (Backlog C-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useRelatedProducts composable', () => {
    it('computes categorySlug, categoryName, and viewAllUrl accurately', () => {
      const { categorySlug, categoryName, viewAllUrl } = useRelatedProducts(mockProductA)
      expect(categorySlug.value).toBe('tech')
      expect(categoryName.value).toBe('Tech & Gadget')
      expect(viewAllUrl.value).toBe('/c/tech')
    })

    it('filters out the current product from recommendations', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: [
          mockProductA,
          mockProductB,
          mockProductC,
          mockProductD,
          mockProductF,
          mockProductG,
          mockProductH,
        ],
      })

      const { relatedProducts, fetchRelated } = useRelatedProducts(mockProductA)
      await fetchRelated()

      expect(relatedProducts.value).toHaveLength(6)
      expect(relatedProducts.value.some((p) => p.id === mockProductA.id)).toBe(false)
      expect(relatedProducts.value.map((p) => p.id)).toEqual([2, 3, 4, 6, 7, 8])
    })

    it('supplements with general popular products when category has fewer than 6 candidates', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: [mockProductA, mockProductB],
      })
      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: [mockProductB, mockProductC, mockProductD, mockProductE, mockProductF, mockProductG],
      })

      const { relatedProducts, fetchRelated, status } = useRelatedProducts(mockProductA)
      await fetchRelated()

      expect(status.value).toBe('success')
      expect(relatedProducts.value).toHaveLength(6)
      const ids = relatedProducts.value.map((p) => p.id)
      expect(new Set(ids).size).toBe(6)
      expect(ids).not.toContain(mockProductA.id)
    })

    it('sets status to empty when no candidates are found', async () => {
      mockFetch.mockResolvedValueOnce({ status: 'success', data: [mockProductA] })
      mockFetch.mockResolvedValueOnce({ status: 'success', data: [mockProductA] })

      const { relatedProducts, fetchRelated, status, isEmpty } = useRelatedProducts(mockProductA)
      await fetchRelated()

      expect(relatedProducts.value).toHaveLength(0)
      expect(status.value).toBe('empty')
      expect(isEmpty.value).toBe(true)
    })

    it('handles network error gracefully and exposes isError', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Koneksi terputus'))

      const { status, isError, errorMessage, fetchRelated } = useRelatedProducts(mockProductA)
      await fetchRelated()

      expect(status.value).toBe('error')
      expect(isError.value).toBe(true)
      expect(errorMessage.value).toContain('Koneksi terputus')
    })
  })

  describe('ProductRelatedSection.vue component', () => {
    it('renders loading skeleton when fetching', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const wrapper = mount(ProductRelatedSection, {
        props: { product: mockProductA },
        global: { stubs: globalStubs },
      })
      await nextTick()

      expect(wrapper.find('[aria-label="Memuat rekomendasi produk terkait"]').exists()).toBe(true)
      expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('renders 6 ProductCard items on success', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: [mockProductB, mockProductC, mockProductD, mockProductE, mockProductF, mockProductG],
      })

      const wrapper = mount(ProductRelatedSection, {
        props: { product: mockProductA },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      const cards = wrapper.findAll('.product-card-stub')
      expect(cards).toHaveLength(6)
      expect(wrapper.text()).toContain('Koleksi Terkait')
      expect(wrapper.text()).toContain('Tech & Gadget')
    })

    it('renders error state and handles retry button', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Gagal mengambil data'))

      const wrapper = mount(ProductRelatedSection, {
        props: { product: mockProductA },
        global: { stubs: globalStubs },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Rekomendasi produk belum dapat dimuat saat ini.')
      const retryBtn = wrapper.find('.ui-button-stub')
      expect(retryBtn.exists()).toBe(true)

      mockFetch.mockResolvedValueOnce({
        status: 'success',
        data: [mockProductB, mockProductC, mockProductD, mockProductE, mockProductF, mockProductG],
      })
      await retryBtn.trigger('click')
      await flushPromises()

      expect(wrapper.findAll('.product-card-stub')).toHaveLength(6)
    })
  })

  describe('Architecture & Antislop Compliance', () => {
    it('enforces line limit <= 300 lines per file', () => {
      const composablePath = path.resolve(process.cwd(), 'app/composables/useRelatedProducts.ts')
      const componentPath = path.resolve(
        process.cwd(),
        'app/components/product/ProductRelatedSection.vue',
      )

      const composableLines = fs.readFileSync(composablePath, 'utf-8').split('\n').length
      const componentLines = fs.readFileSync(componentPath, 'utf-8').split('\n').length

      expect(composableLines).toBeLessThanOrEqual(300)
      expect(componentLines).toBeLessThanOrEqual(300)
    })

    it('ensures zero em dashes in implementation files', () => {
      const composablePath = path.resolve(process.cwd(), 'app/composables/useRelatedProducts.ts')
      const componentPath = path.resolve(
        process.cwd(),
        'app/components/product/ProductRelatedSection.vue',
      )

      const composableContent = fs.readFileSync(composablePath, 'utf-8')
      const componentContent = fs.readFileSync(componentPath, 'utf-8')

      expect(composableContent.includes('—')).toBe(false)
      expect(componentContent.includes('—')).toBe(false)
    })
  })
})
