import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useKatalogFilters } from '../../app/composables/useKatalogFilters'
import KatalogPriceRangeFilter from '../../app/components/katalog/KatalogPriceRangeFilter.vue'
import KatalogActiveFilters from '../../app/components/katalog/KatalogActiveFilters.vue'

const { mockRoute, mockRouter } = await vi.hoisted(async () => {
  const { reactive } = await import('vue')
  return {
    mockRoute: reactive({
      query: {} as Record<string, string>,
    }),
    mockRouter: {
      replace: vi.fn(),
    },
  }
})

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useRouter', () => () => mockRouter)

describe('Katalog Price Range & In-Stock Only Filters Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
  })

  describe('Component: KatalogPriceRangeFilter', () => {
    it('merender quick chips dan memancarkan applyRange saat quick chip diklik', async () => {
      const wrapper = mount(KatalogPriceRangeFilter, {
        props: {
          selectedChip: 'all',
        },
      })

      const chips = wrapper.findAll('button')
      expect(chips.length).toBeGreaterThanOrEqual(4)

      // Klik chip "< Rp 250rb"
      const chipUnder250k = chips.find((b) => b.text().includes('< Rp 250rb'))
      expect(chipUnder250k).toBeDefined()
      await chipUnder250k?.trigger('click')

      expect(wrapper.emitted('applyRange')).toBeTruthy()
      expect(wrapper.emitted('applyRange')?.[0]).toEqual([undefined, 250000, 'under250k'])
    })

    it('memancarkan clearRange saat chip "Semua" diklik', async () => {
      const wrapper = mount(KatalogPriceRangeFilter, {
        props: {
          minPrice: 100000,
          maxPrice: 500000,
          selectedChip: 'custom',
        },
      })

      const chipSemua = wrapper.findAll('button').find((b) => b.text().includes('Semua'))
      await chipSemua?.trigger('click')

      expect(wrapper.emitted('clearRange')).toBeTruthy()
    })

    it('menerima input manual min-max dan memancarkan applyRange saat tombol Terapkan diklik', async () => {
      const wrapper = mount(KatalogPriceRangeFilter, {
        props: {
          selectedChip: 'all',
        },
      })

      const minInput = wrapper.find('input[aria-label="Harga minimum"]')
      const maxInput = wrapper.find('input[aria-label="Harga maksimum"]')

      await minInput.setValue('150000')
      await maxInput.setValue('450000')

      const applyBtn = wrapper.findAll('button').find((b) => b.text() === 'Terapkan')
      await applyBtn?.trigger('click')

      expect(wrapper.emitted('applyRange')).toBeTruthy()
      expect(wrapper.emitted('applyRange')?.[0]).toEqual([150000, 450000, 'custom'])
    })

    it('menampilkan pesan validasi jika harga minimum lebih besar dari maksimum', async () => {
      const wrapper = mount(KatalogPriceRangeFilter, {
        props: {
          selectedChip: 'all',
        },
      })

      const minInput = wrapper.find('input[aria-label="Harga minimum"]')
      const maxInput = wrapper.find('input[aria-label="Harga maksimum"]')

      await minInput.setValue('500000')
      await maxInput.setValue('200000')

      const applyBtn = wrapper.findAll('button').find((b) => b.text() === 'Terapkan')
      await applyBtn?.trigger('click')

      expect(wrapper.emitted('applyRange')).toBeFalsy()
      expect(wrapper.text()).toContain('Harga minimum tidak boleh lebih besar dari maksimum.')
    })
  })

  describe('Composable: useKatalogFilters Price & Stock Logic', () => {
    it('mengambil parameter min_price, max_price, dan stock_status dari route query', () => {
      mockRoute.query = {
        min_price: '250000',
        max_price: '1000000',
        stock_status: 'in_stock',
        price_chip: '250k-1m',
      }

      const filters = useKatalogFilters()
      expect(filters.minPrice.value).toBe(250000)
      expect(filters.maxPrice.value).toBe(1000000)
      expect(filters.selectedPriceChip.value).toBe('250k-1m')
      expect(filters.inStockOnly.value).toBe(true)

      expect(filters.queryParams.value.min_price).toBe(250000)
      expect(filters.queryParams.value.max_price).toBe(1000000)
      expect(filters.queryParams.value.stock_status).toBe('in_stock')
    })

    it('menghasilkan priceRangeLabel yang tepat sesuai pilihan filter', () => {
      const filters = useKatalogFilters()

      filters.handlePriceRangeApply(undefined, 250000, 'under250k')
      expect(filters.priceRangeLabel.value).toBe('< Rp 250rb')

      filters.handlePriceRangeApply(250000, 1000000, '250k-1m')
      expect(filters.priceRangeLabel.value).toBe('Rp 250rb - 1jt')

      filters.handlePriceRangeApply(1000000, undefined, 'above1m')
      expect(filters.priceRangeLabel.value).toBe('> Rp 1jt')
    })

    it('mengubah status inStockOnly via toggleInStockOnly dan menyinkronkan route query', () => {
      const filters = useKatalogFilters()
      expect(filters.inStockOnly.value).toBe(false)

      filters.toggleInStockOnly()
      expect(filters.inStockOnly.value).toBe(true)
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({ stock_status: 'in_stock' }),
        }),
      )

      filters.toggleInStockOnly()
      expect(filters.inStockOnly.value).toBe(false)
    })

    it('menghitung activeFiltersCount dengan memasukkan filter harga dan stok', () => {
      const filters = useKatalogFilters()
      expect(filters.activeFiltersCount.value).toBe(0)

      filters.handlePriceRangeApply(100000, 300000, 'custom')
      expect(filters.activeFiltersCount.value).toBe(1)

      filters.toggleInStockOnly()
      expect(filters.activeFiltersCount.value).toBe(2)

      filters.handleClearPriceRange()
      expect(filters.activeFiltersCount.value).toBe(1)
    })
  })

  describe('Component: KatalogActiveFilters Price & Stock Badges', () => {
    it('merender tag harga dan tag stok tersedia serta memancarkan event pembersihan', async () => {
      const wrapper = mount(KatalogActiveFilters, {
        props: {
          activeFiltersCount: 2,
          searchQuery: '',
          selectedCategory: 'all',
          priceRangeLabel: 'Rp 250rb - 1jt',
          inStockOnly: true,
          selectedRating: 'all',
        },
      })

      expect(wrapper.text()).toContain('Harga: Rp 250rb - 1jt')
      expect(wrapper.text()).toContain('Stok Tersedia')

      const buttons = wrapper.findAll('button')
      const clearPriceBtn = buttons.find((b) => b.attributes('aria-label') === 'Hapus filter harga')
      const clearStockBtn = buttons.find(
        (b) => b.attributes('aria-label') === 'Hapus filter stok tersedia',
      )

      await clearPriceBtn?.trigger('click')
      expect(wrapper.emitted('clearPriceRange')).toBeTruthy()

      await clearStockBtn?.trigger('click')
      expect(wrapper.emitted('clearInStock')).toBeTruthy()
    })
  })
})
