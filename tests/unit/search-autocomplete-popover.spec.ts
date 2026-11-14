import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchAutocompletePopover from '../../app/components/search/SearchAutocompletePopover.vue'
import type { InstantSearchProduct, InstantSearchCategory } from '../../shared/types/search'

describe('Component: SearchAutocompletePopover', () => {
  const defaultProps = {
    isOpen: true,
    isLoading: false,
    errorMessage: null,
    query: 'kopi',
    products: [] as InstantSearchProduct[],
    categories: [] as InstantSearchCategory[],
    activeIndex: -1,
  }

  const globalMountOptions = {
    global: {
      stubs: {
        NuxtLink: {
          template: '<a><slot /></a>',
        },
      },
    },
  }

  it('tidak merender kontainer saat isOpen false', () => {
    const wrapper = mount(SearchAutocompletePopover, {
      ...globalMountOptions,
      props: { ...defaultProps, isOpen: false },
    })

    expect(wrapper.find('#instant-search-popover').exists()).toBe(false)
  })

  it('merender loading skeleton saat isLoading bernilai true', () => {
    const wrapper = mount(SearchAutocompletePopover, {
      ...globalMountOptions,
      props: { ...defaultProps, isLoading: true },
    })

    const popover = wrapper.find('#instant-search-popover')
    expect(popover.exists()).toBe(true)
    expect(popover.attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('merender pesan error dan tombol coba lagi saat errorMessage ada', async () => {
    const wrapper = mount(SearchAutocompletePopover, {
      ...globalMountOptions,
      props: { ...defaultProps, errorMessage: 'Koneksi terputus' },
    })

    expect(wrapper.text()).toContain('Koneksi terputus')
    const retryBtn = wrapper.find('button')
    expect(retryBtn.text()).toBe('Coba lagi')

    await retryBtn.trigger('click')
    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('merender status kosong saat tidak ada produk dan kategori yang cocok', () => {
    const wrapper = mount(SearchAutocompletePopover, {
      ...globalMountOptions,
      props: { ...defaultProps, products: [], categories: [] },
    })

    expect(wrapper.text()).toContain('Tidak ada produk untuk "kopi"')
    expect(wrapper.text()).toContain('Buka Katalog Lengkap')
  })

  it('merender kategori, produk, harga terformat rupiah, dan footer saat hasil tersedia', async () => {
    const mockCategories: InstantSearchCategory[] = [
      { id: 'c1', name: 'Rumah & Dapur', slug: 'home' },
    ]
    const mockProducts: InstantSearchProduct[] = [
      {
        id: 'p1',
        name: 'V60 Coffee Dripper',
        slug: 'v60-coffee-dripper',
        price: 250000,
        image_url: 'https://example.com/v60.jpg',
        category: 'Rumah & Dapur',
        stock: 8,
      },
      {
        id: 'p2',
        name: 'Manual Grinder Kopi',
        slug: 'manual-grinder',
        price: 450000,
        image_url: null,
        category: 'Rumah & Dapur',
        stock: 0, // Habis
      },
    ]

    const wrapper = mount(SearchAutocompletePopover, {
      ...globalMountOptions,
      props: {
        ...defaultProps,
        categories: mockCategories,
        products: mockProducts,
        activeIndex: 0,
      },
    })

    expect(wrapper.text()).toContain('Kategori')
    expect(wrapper.text()).toContain('Rumah & Dapur')
    expect(wrapper.text()).toContain('V60 Coffee Dripper')
    expect(wrapper.text()).toContain('250.000')
    expect(wrapper.text()).toContain('Manual Grinder Kopi')
    expect(wrapper.text()).toContain('Habis') // Badge stok habis
    expect(wrapper.text()).toContain('Lihat semua hasil untuk "kopi"')

    // Cek ARIA listbox & option
    const popover = wrapper.find('#instant-search-popover')
    expect(popover.attributes('role')).toBe('listbox')

    const options = wrapper.findAll('[role="option"]')
    expect(options.length).toBe(4) // 1 kategori + 2 produk + 1 footer
    expect(options[0]?.attributes('aria-selected')).toBe('true') // index 0 dipilih
    expect(options[1]?.attributes('aria-selected')).toBe('false')

    // Klik kategori
    await options[0]?.trigger('click')
    expect(wrapper.emitted('selectCategory')?.[0]?.[0]).toEqual(mockCategories[0])

    // Klik produk
    await options[1]?.trigger('click')
    expect(wrapper.emitted('selectProduct')?.[0]?.[0]).toEqual(mockProducts[0])

    // Klik footer
    await options[3]?.trigger('click')
    expect(wrapper.emitted('submitSearch')?.[0]?.[0]).toBe('kopi')
  })
})
