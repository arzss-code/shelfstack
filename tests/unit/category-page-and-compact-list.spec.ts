import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import CategoryToolbar from '../../app/components/category/CategoryToolbar.vue'
import ProductList from '../../app/features/products/components/ProductList.vue'
import ProductCard from '../../app/features/products/components/ProductCard.vue'
import ProductCompactList from '../../app/features/products/components/ProductCompactList.vue'
import ProductCompactCard from '../../app/features/products/components/ProductCompactCard.vue'
import { useKatalogFilters } from '../../app/composables/useKatalogFilters'
import { formatRupiah } from '../../app/utils/format'
import type { Product } from '../../app/types/product'

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
mockNuxtImport('useUiToast', () => () => ({ show: vi.fn() }))
mockNuxtImport('useCartStore', () => () => ({
  addItem: vi.fn(),
}))

const sampleProduct: Product = {
  id: 101,
  name: 'Minimalist Aluminum Laptop Stand',
  price: 450000,
  stock: 8,
  slug: 'minimalist-aluminum-laptop-stand',
  description: 'Dudukan laptop aluminium CNC presisi untuk postur kerja ergonomis.',
  image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
  rating: 4.8,
  review_count: 24,
  sold_count: 140,
  category_id: 'cat-uuid-1',
  sku: 'STK-ALU-01',
  weight_grams: 650,
  specs: { material: 'Anodized Aluminum' },
  gallery_urls: [],
  is_featured: true,
}

const globalStubs = {
  stubs: {
    NuxtLink: {
      template: '<a :href="to"><slot /></a>',
      props: ['to'],
    },
  },
}

describe('Category Page & Compact List View Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    mockRoute.query = {}
  })

  describe('Component: CategoryToolbar.vue', () => {
    const sortOptions = [
      { id: 'featured', label: 'Pilihan Kurator' },
      { id: 'popular', label: 'Paling Populer' },
      { id: 'price-low', label: 'Harga: Rendah ke Tinggi' },
    ]

    it('merender informasi jumlah produk dan status stok', () => {
      const wrapper = mount(CategoryToolbar, {
        props: {
          selectedSort: 'featured',
          sortOptions,
          inStockOnly: true,
          viewMode: 'grid',
          totalCount: 20,
          displayedCount: 16,
        },
        global: globalStubs,
      })

      expect(wrapper.text()).toContain('16 dari 20 Produk')
      expect(wrapper.text()).toContain('Stok Tersedia')
    })

    it('memancarkan update:inStockOnly saat tombol stok diklik', async () => {
      const wrapper = mount(CategoryToolbar, {
        props: {
          selectedSort: 'featured',
          sortOptions,
          inStockOnly: false,
          viewMode: 'grid',
          totalCount: 20,
          displayedCount: 16,
        },
        global: globalStubs,
      })

      const stockBtn = wrapper.findAll('button').find((b) => b.text().includes('Stok Tersedia'))
      expect(stockBtn).toBeDefined()
      await stockBtn?.trigger('click')

      expect(wrapper.emitted('update:inStockOnly')).toBeTruthy()
      expect(wrapper.emitted('update:inStockOnly')?.[0]).toEqual([true])
    })

    it('memancarkan update:viewMode saat tombol switcher tampilan diklik', async () => {
      const wrapper = mount(CategoryToolbar, {
        props: {
          selectedSort: 'featured',
          sortOptions,
          inStockOnly: false,
          viewMode: 'grid',
          totalCount: 20,
          displayedCount: 16,
        },
        global: globalStubs,
      })

      const listBtn = wrapper.find('button[aria-label="Tampilan List"]')
      expect(listBtn.exists()).toBe(true)
      expect(listBtn.attributes('aria-pressed')).toBe('false')
      await listBtn.trigger('click')

      expect(wrapper.emitted('update:viewMode')).toBeTruthy()
      expect(wrapper.emitted('update:viewMode')?.[0]).toEqual(['list'])
    })

    it('merender filter harga, rating, pencarian kategori, status live, dan tombol reset aktif', async () => {
      const wrapper = mount(CategoryToolbar, {
        props: {
          selectedSort: 'featured',
          sortOptions,
          inStockOnly: true,
          viewMode: 'grid',
          totalCount: 12,
          displayedCount: 6,
          searchQuery: 'keyboard',
          selectedPricePreset: 'above1m',
          selectedRating: '4.5',
          categoryName: 'Tech & Gadget',
        },
        global: globalStubs,
      })

      expect(wrapper.find('[role="status"]').text()).toContain('6 dari 12 Produk')
      expect(wrapper.text()).toContain('Kata kunci: "keyboard"')
      expect(wrapper.text()).toContain('> Rp 1jt')
      expect(wrapper.text()).toContain('Bintang 4.5+')

      const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset Filter'))
      expect(resetBtn).toBeDefined()
      await resetBtn?.trigger('click')
      expect(wrapper.emitted('resetFilters')).toBeTruthy()
    })
  })

  describe('Component: ProductList.vue (6-Column Dense Category Mode) & ProductCard.vue', () => {
    it('merender grid 6 kolom responsif dan 12 skeleton pada density="dense"', () => {
      const loadingWrapper = mount(ProductList, {
        props: {
          products: [],
          loading: true,
          density: 'dense',
          hideActions: true,
        },
        global: globalStubs,
      })

      expect(loadingWrapper.findAll('.animate-pulse').length).toBe(12)
      expect(loadingWrapper.find('.lg\\:grid-cols-6').exists()).toBe(true)

      const gridWrapper = mount(ProductList, {
        props: {
          products: [sampleProduct],
          loading: false,
          density: 'dense',
          hideActions: true,
        },
        global: globalStubs,
      })
      expect(gridWrapper.find('.lg\\:grid-cols-6').exists()).toBe(true)
    })

    it('merender tautan kartu ProductCard tanpa tabindex="-1" agar dapat diakses keyboard', () => {
      const wrapper = mount(ProductCard, {
        props: {
          product: sampleProduct,
          hideActions: true,
          dense: true,
        },
        global: globalStubs,
      })

      const link = wrapper.find('a')
      expect(link.exists()).toBe(true)
      expect(link.attributes('tabindex')).toBeUndefined()
    })

    it('tidak menampilkan copy admin dashboard pada empty state etalase publik', () => {
      const wrapper = mount(ProductList, {
        props: {
          products: [],
          loading: false,
          density: 'dense',
          hideActions: true,
        },
        global: globalStubs,
      })

      expect(wrapper.text()).not.toContain('dashboard manajemen katalog')
    })
  })

  describe('Component: ProductCompactCard.vue & ProductCompactList.vue', () => {
    it('merender loading skeleton saat loading=true', () => {
      const wrapper = mount(ProductCompactList, {
        props: {
          products: [],
          loading: true,
        },
        global: globalStubs,
      })

      expect(wrapper.findAll('.animate-pulse').length).toBe(6)
    })

    it('merender empty state saat produk kosong dan loading=false', () => {
      const wrapper = mount(ProductCompactList, {
        props: {
          products: [],
          loading: false,
        },
        global: globalStubs,
      })

      expect(wrapper.text()).toContain('Tidak ada produk ditemukan')
    })

    it('merender kartu compact dengan nama produk dan harga rupiah yang presisi', () => {
      const wrapper = mount(ProductCompactCard, {
        props: {
          product: sampleProduct,
          hideActions: true,
        },
        global: globalStubs,
      })

      expect(wrapper.text()).toContain('Minimalist Aluminum Laptop Stand')
      expect(wrapper.text()).toContain(formatRupiah(sampleProduct.price))
      expect(wrapper.text()).toContain('4.8')
      expect(wrapper.text()).toContain('Tersedia')
      expect(wrapper.text()).toContain('+ Keranjang')

      // Verifikasi aksesibilitas keyboard: tautan utama tidak diblokir dengan tabindex="-1"
      const link = wrapper.find('a')
      expect(link.attributes('tabindex')).toBeUndefined()
    })
  })

  describe('Composable: useKatalogFilters viewMode extension', () => {
    it('menginisialisasi viewMode dari query URL jika tersedia', () => {
      mockRoute.query = { view: 'list' }
      const { viewMode } = useKatalogFilters()
      expect(viewMode.value).toBe('list')
    })

    it('menyinkronkan viewMode ke URL query saat fungsi syncQuery dijalankan', () => {
      const { viewMode, handleSortUpdate } = useKatalogFilters()
      viewMode.value = 'list'
      handleSortUpdate('price-low')

      expect(mockRouter.replace).toHaveBeenCalledWith({
        query: expect.objectContaining({
          view: 'list',
          sort: 'price-low',
        }),
      })
    })
  })
})
