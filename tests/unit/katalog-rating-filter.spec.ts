import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useKatalogFilters, ratingOptions } from '../../app/composables/useKatalogFilters'
import KatalogActiveFilters from '../../app/components/katalog/KatalogActiveFilters.vue'
import KatalogSidebar from '../../app/components/katalog/KatalogSidebar.vue'

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

describe('Katalog Rating Filter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
  })

  describe('useKatalogFilters rating logic', () => {
    it('provides predefined ratingOptions', () => {
      expect(ratingOptions).toHaveLength(3)
      expect(ratingOptions[0]?.id).toBe('all')
      expect(ratingOptions[1]?.id).toBe('4.5')
      expect(ratingOptions[2]?.id).toBe('4.0')
    })

    it('initializes selectedRating with default or route query', () => {
      mockRoute.query = { rating: '4.5' }
      const filters = useKatalogFilters()
      expect(filters.selectedRating.value).toBe('4.5')
      expect(filters.queryParams.value.min_rating).toBe(4.5)
    })

    it('updates queryParams and triggers syncQuery when rating changes', () => {
      const filters = useKatalogFilters()
      expect(filters.selectedRating.value).toBe('all')
      expect(filters.queryParams.value.min_rating).toBeUndefined()

      filters.handleRatingUpdate('4.5')

      expect(filters.selectedRating.value).toBe('4.5')
      expect(filters.queryParams.value.min_rating).toBe(4.5)
      expect(mockRouter.replace).toHaveBeenCalledWith({
        query: { rating: '4.5' },
      })
    })

    it('increases activeFiltersCount when rating filter is active', () => {
      const filters = useKatalogFilters()
      expect(filters.activeFiltersCount.value).toBe(0)

      filters.handleRatingUpdate('4.0')
      expect(filters.activeFiltersCount.value).toBe(1)
    })

    it('clears rating filter on handleClearRating', () => {
      mockRoute.query = { rating: '4.5' }
      const filters = useKatalogFilters()

      filters.handleClearRating()

      expect(filters.selectedRating.value).toBe('all')
      expect(filters.queryParams.value.min_rating).toBeUndefined()
      expect(mockRouter.replace).toHaveBeenCalledWith({
        query: {},
      })
    })

    it('resets rating when resetAllFilters is called', () => {
      mockRoute.query = { rating: '4.5', q: 'meja' }
      const filters = useKatalogFilters()

      filters.resetAllFilters()

      expect(filters.selectedRating.value).toBe('all')
      expect(mockRouter.replace).toHaveBeenCalledWith({ query: {} })
    })
  })

  describe('KatalogActiveFilters component with rating', () => {
    const globalStubs = {
      UiTooltip: {
        template: '<div><slot /></div>',
        props: ['text', 'position'],
      },
    }

    it('renders rating pill when rating is selected', () => {
      const wrapper = mount(KatalogActiveFilters, {
        props: {
          activeFiltersCount: 1,
          searchQuery: '',
          selectedCategory: 'all',
          selectedPriceRange: 'all',
          selectedRating: '4.5',
          ratingLabel: 'Bintang 4.5 ke atas',
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Rating: Bintang 4.5 ke atas')
    })

    it('emits clearRating when rating tag close button is clicked', async () => {
      const wrapper = mount(KatalogActiveFilters, {
        props: {
          activeFiltersCount: 1,
          searchQuery: '',
          selectedCategory: 'all',
          selectedPriceRange: 'all',
          selectedRating: '4.5',
          ratingLabel: 'Bintang 4.5 ke atas',
        },
        global: { stubs: globalStubs },
      })

      const clearBtn = wrapper.find('button[aria-label="Hapus filter rating"]')
      expect(clearBtn.exists()).toBe(true)

      await clearBtn.trigger('click')

      expect(wrapper.emitted('clearRating')).toBeTruthy()
      expect(wrapper.emitted('clearRating')?.[0]).toEqual([])
    })
  })

  describe('KatalogSidebar component rating section', () => {
    const globalStubs = {
      UiCard: {
        template: '<div><slot /></div>',
        props: ['padded'],
      },
      UiRadio: {
        template:
          '<input type="radio" :value="value" @change="$emit(\'update:modelValue\', value)" />',
        props: ['modelValue', 'value', 'name', 'label'],
      },
    }

    it('renders rating section and emits update:selectedRating', async () => {
      const wrapper = mount(KatalogSidebar, {
        props: {
          categories: [{ id: 'all', label: 'Semua Kategori' }],
          selectedCategory: 'all',
          priceRanges: [{ id: 'all', label: 'Semua Harga' }],
          selectedPriceRange: 'all',
          ratingOptions,
          selectedRating: 'all',
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Rating Ulasan')
      expect(wrapper.text()).toContain('Bintang 4.5 ke atas')
      expect(wrapper.text()).toContain('Bintang 4.0 ke atas')

      const ratingButtons = wrapper.findAll('button')
      const targetButton = ratingButtons.find((b) => b.text().includes('Bintang 4.5 ke atas'))
      expect(targetButton).toBeDefined()

      await targetButton?.trigger('click')

      expect(wrapper.emitted('update:selectedRating')).toBeTruthy()
      expect(wrapper.emitted('update:selectedRating')?.[0]).toEqual(['4.5'])
    })
  })
})
