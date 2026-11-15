import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import fs from 'node:fs'
import path from 'node:path'
import { useRecentSearches, POPULAR_SEARCH_TAGS } from '../../app/composables/useRecentSearches'
import { useRecentlyViewed } from '../../app/composables/useRecentlyViewed'
import ProductRecentlyViewedSection from '../../app/components/product/ProductRecentlyViewedSection.vue'
import SearchAutocompletePopover from '../../app/components/search/SearchAutocompletePopover.vue'

describe('Recent Searches & Recently Viewed Products Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('useRecentSearches Composable', () => {
    it('menginisialisasi daftar pencarian kosong dan mengekspos tag pencarian populer', () => {
      const { recentSearches, popularTags } = useRecentSearches()
      expect(recentSearches.value).toEqual([])
      expect(popularTags).toEqual(POPULAR_SEARCH_TAGS)
      expect(popularTags.length).toBeGreaterThanOrEqual(4)
    })

    it('menambahkan kata kunci pencarian, melakukan trim, mengabaikan query pendek (<2 karakter), dan mendeduplikasi', () => {
      const { recentSearches, addSearch } = useRecentSearches()

      addSearch('  ')
      expect(recentSearches.value).toHaveLength(0)

      addSearch('a')
      expect(recentSearches.value).toHaveLength(0)

      addSearch('keyboard')
      expect(recentSearches.value).toEqual(['keyboard'])

      addSearch('monitor stand')
      expect(recentSearches.value).toEqual(['monitor stand', 'keyboard'])

      // Deduplikasi case-insensitive: 'KEYBOARD' harus naik ke posisi pertama tanpa duplikat
      addSearch('KEYBOARD')
      expect(recentSearches.value).toEqual(['KEYBOARD', 'monitor stand'])
    })

    it('membatasi riwayat pencarian maksimal 6 item unik', () => {
      const { recentSearches, addSearch } = useRecentSearches()
      const terms = ['item 1', 'item 2', 'item 3', 'item 4', 'item 5', 'item 6', 'item 7']
      for (const t of terms) {
        addSearch(t)
      }
      expect(recentSearches.value).toHaveLength(6)
      expect(recentSearches.value[0]).toBe('item 7')
      expect(recentSearches.value).not.toContain('item 1')
    })

    it('dapat menghapus satu kata kunci dan mengosongkan seluruh riwayat', () => {
      const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches()
      addSearch('desk mat')
      addSearch('mousepad')
      expect(recentSearches.value).toHaveLength(2)

      removeSearch('desk mat')
      expect(recentSearches.value).toEqual(['mousepad'])

      clearSearches()
      expect(recentSearches.value).toEqual([])
      expect(localStorage.getItem('shelfstack_recent_searches')).toBeNull()
    })
  })

  describe('useRecentlyViewed Composable', () => {
    it('menginisialisasi riwayat produk terakhir dilihat dari localStorage', () => {
      const { recentlyViewed } = useRecentlyViewed()
      expect(recentlyViewed.value).toEqual([])
    })

    it('menambahkan item produk, mendeduplikasi ID, dan membatasi maksimal 8 item', () => {
      const { recentlyViewed, addItem } = useRecentlyViewed()

      addItem({
        id: 'p-1',
        name: 'Keychron K2',
        price: 1200000,
        stock: 5,
      })
      expect(recentlyViewed.value).toHaveLength(1)
      expect(recentlyViewed.value[0]?.name).toBe('Keychron K2')

      // Tambah item kedua
      addItem({
        id: 'p-2',
        name: 'Desk Mat Minimalis',
        price: 250000,
        stock: 10,
      })
      expect(recentlyViewed.value).toHaveLength(2)
      expect(recentlyViewed.value[0]?.name).toBe('Desk Mat Minimalis')

      // Tambah item p-1 lagi: harus pindah ke paling depan tanpa duplikat
      addItem({
        id: 'p-1',
        name: 'Keychron K2 Updated',
        price: 1250000,
        stock: 4,
      })
      expect(recentlyViewed.value).toHaveLength(2)
      expect(recentlyViewed.value[0]?.id).toBe('p-1')
      expect(recentlyViewed.value[0]?.name).toBe('Keychron K2 Updated')

      // Uji limit 8 item
      for (let i = 3; i <= 10; i++) {
        addItem({ id: `p-${i}`, name: `Produk ${i}`, price: 100000 * i, stock: 5 })
      }
      expect(recentlyViewed.value).toHaveLength(8)
      expect(recentlyViewed.value[0]?.id).toBe('p-10')
    })

    it('dapat menghapus satu item berdasarkan ID dan mengosongkan seluruh riwayat produk', () => {
      const { recentlyViewed, addItem, removeItem, clearRecentlyViewed } = useRecentlyViewed()
      addItem({ id: 'prod-a', name: 'Barang A', price: 50000, stock: 2 })
      addItem({ id: 'prod-b', name: 'Barang B', price: 75000, stock: 3 })
      expect(recentlyViewed.value).toHaveLength(2)

      removeItem('prod-a')
      expect(recentlyViewed.value).toHaveLength(1)
      expect(recentlyViewed.value[0]?.id).toBe('prod-b')

      clearRecentlyViewed()
      expect(recentlyViewed.value).toHaveLength(0)
      expect(localStorage.getItem('shelfstack_recently_viewed')).toBeNull()
    })
  })

  describe('Component Rendering & Micro-Interactions', () => {
    it('ProductRecentlyViewedSection tidak merender markup jika riwayat kosong atau hanya produk aktif', () => {
      const wrapperEmpty = mount(ProductRecentlyViewedSection, {
        props: { currentProductId: 'p-100' },
      })
      expect(wrapperEmpty.find('section').exists()).toBe(false)
    })

    it('SearchAutocompletePopover menampilkan Pencarian Terakhir dan Pencarian Populer saat query kosong (<2 karakter)', () => {
      const wrapper = mount(SearchAutocompletePopover, {
        props: {
          isOpen: true,
          isLoading: false,
          errorMessage: null,
          query: '',
          products: [],
          categories: [],
          activeIndex: -1,
          recentSearches: ['mechanical keyboard', 'ergonomic mouse'],
          popularTags: ['Desk Mat', 'Monitor Stand'],
        },
      })

      expect(wrapper.text()).toContain('Pencarian Terakhir')
      expect(wrapper.text()).toContain('mechanical keyboard')
      expect(wrapper.text()).toContain('ergonomic mouse')
      expect(wrapper.text()).toContain('Pencarian Populer')
      expect(wrapper.text()).toContain('Desk Mat')
      expect(wrapper.text()).toContain('Monitor Stand')
    })

    it('SearchAutocompletePopover meng-emit selectTag saat tag pencarian diklik', async () => {
      const wrapper = mount(SearchAutocompletePopover, {
        props: {
          isOpen: true,
          isLoading: false,
          errorMessage: null,
          query: '',
          products: [],
          categories: [],
          activeIndex: -1,
          recentSearches: ['usb hub'],
          popularTags: ['Desk Mat'],
        },
      })

      const tagButton = wrapper.findAll('button').find((b) => b.text().includes('usb hub'))
      expect(tagButton).toBeDefined()
      await tagButton?.trigger('click')

      expect(wrapper.emitted('selectTag')).toBeTruthy()
      expect(wrapper.emitted('selectTag')?.[0]).toEqual(['usb hub'])
    })
  })

  describe('SOP Constraints & Architecture Verification', () => {
    it('memastikan semua file implementasi baru dan termodifikasi mematuhi batas <= 300 baris dan bebas dari em dash', () => {
      const files = [
        'app/composables/useRecentSearches.ts',
        'app/composables/useRecentlyViewed.ts',
        'app/composables/useInstantSearch.ts',
        'app/components/search/SearchAutocompletePopover.vue',
        'app/components/navbar/NavbarSearchBar.vue',
        'app/components/product/ProductRecentlyViewedSection.vue',
        'app/pages/product/[id].vue',
        'tests/unit/recent-searches-and-recently-viewed.spec.ts',
      ]

      for (const rel of files) {
        const fullPath = path.resolve(process.cwd(), rel)
        const content = fs.readFileSync(fullPath, 'utf-8')
        const lineCount = content.split('\n').length
        expect(
          lineCount,
          `${rel} melebihi batas 300 baris (tercatat: ${lineCount})`,
        ).toBeLessThanOrEqual(300)
        expect(content, `${rel} mengandung karakter em dash terlarang`).not.toContain('\u2014')
        expect(content, `${rel} mengandung tipe any terlarang`).not.toMatch(
          /:\s*any\b|\bas\s+any\b/,
        )
      }
    })
  })
})
