import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useInstantSearch } from '../../app/composables/useInstantSearch'

const { mockRouter, mockFetch } = await vi.hoisted(async () => {
  return {
    mockRouter: {
      push: vi.fn(),
    },
    mockFetch: vi.fn(),
  }
})

mockNuxtImport('useRouter', () => () => mockRouter)
mockNuxtImport('$fetch', () => mockFetch)

describe('Composable: useInstantSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('menginisialisasi state dengan nilai default yang tepat', () => {
    const query = ref('')
    const { isOpen, isLoading, products, categories, activeIndex, errorMessage } =
      useInstantSearch(query)

    expect(isOpen.value).toBe(false)
    expect(isLoading.value).toBe(false)
    expect(products.value).toEqual([])
    expect(categories.value).toEqual([])
    expect(activeIndex.value).toBe(-1)
    expect(errorMessage.value).toBeNull()
  })

  it('tidak memicu fetch jika query kurang dari 2 karakter', async () => {
    const query = ref('')
    const { isOpen } = useInstantSearch(query)

    query.value = 'a'
    await nextTick()
    vi.advanceTimersByTime(300)

    expect(mockFetch).not.toHaveBeenCalled()
    expect(isOpen.value).toBe(false)
  })

  it('menjalankan fetch dengan debounce 250ms saat query >= 2 karakter', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 'success',
      data: {
        products: [
          {
            id: 'p1',
            name: 'Mechanical Keyboard',
            slug: 'mechanical-keyboard',
            price: 750000,
            image_url: null,
            category: 'Tech & Gadget',
            stock: 5,
          },
        ],
        categories: [{ id: 'c1', name: 'Tech & Gadget', slug: 'tech' }],
        query: 'key',
      },
    })

    const query = ref('')
    const { isOpen, isLoading, products, categories } = useInstantSearch(query)

    query.value = 'key'
    await nextTick()
    expect(mockFetch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(250)
    await nextTick()
    await Promise.resolve()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/products/search-instant',
      expect.objectContaining({
        query: { q: 'key' },
      }),
    )
    expect(isOpen.value).toBe(true)
    expect(isLoading.value).toBe(false)
    expect(products.value).toHaveLength(1)
    expect(categories.value).toHaveLength(1)
  })

  it('menavigasi indeks aktif dengan navigateNext dan navigatePrev secara berputar', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 'success',
      data: {
        products: [
          {
            id: 'p1',
            name: 'Item 1',
            slug: 'item-1',
            price: 100,
            image_url: null,
            category: '',
            stock: 1,
          },
        ],
        categories: [{ id: 'c1', name: 'Cat 1', slug: 'cat-1' }],
        query: 'test',
      },
    })

    const query = ref('')
    const search = useInstantSearch(query)

    query.value = 'test'
    await nextTick()
    vi.advanceTimersByTime(250)
    await nextTick()
    await Promise.resolve()

    // Total item: 1 kategori + 1 produk + 1 footer = 3 item
    expect(search.totalNavigableItems.value).toBe(3)
    expect(search.activeIndex.value).toBe(-1)

    search.navigateNext()
    expect(search.activeIndex.value).toBe(0) // Kategori

    search.navigateNext()
    expect(search.activeIndex.value).toBe(1) // Produk

    search.navigateNext()
    expect(search.activeIndex.value).toBe(2) // Footer

    search.navigateNext()
    expect(search.activeIndex.value).toBe(0) // Wrap-around ke awal

    search.navigatePrev()
    expect(search.activeIndex.value).toBe(2) // Wrap-around mundur ke akhir
  })

  it('mengarahkan ke rute kategori saat item kategori dipilih', async () => {
    const query = ref('tech')
    const search = useInstantSearch(query)

    search.selectCategory({ name: 'Tech & Gadget', slug: 'tech' })

    expect(mockRouter.push).toHaveBeenCalledWith({ path: '/c/tech' })
    expect(search.isOpen.value).toBe(false)
  })

  it('mengarahkan ke rute produk saat item produk dipilih', async () => {
    const query = ref('desk')
    const search = useInstantSearch(query)

    search.selectProduct({
      id: 'prod-uuid',
      name: 'Solid Wood Desk',
      slug: 'solid-wood-desk',
      price: 2500000,
      image_url: null,
      category: 'Furnitur',
      stock: 3,
    })

    expect(mockRouter.push).toHaveBeenCalledWith({ path: '/product/solid-wood-desk' })
    expect(search.isOpen.value).toBe(false)
  })

  it('mengarahkan ke rute katalog saat submitFullSearch dipanggil', () => {
    const query = ref('kopi')
    const search = useInstantSearch(query)

    search.submitFullSearch()

    expect(mockRouter.push).toHaveBeenCalledWith({ path: '/katalog', query: { q: 'kopi' } })
    expect(search.isOpen.value).toBe(false)
  })
})
