import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { computed, reactive, ref } from 'vue'
import WishlistPage from '~/pages/wishlist.vue'
import type { WishlistItem } from '~/features/wishlist/stores/wishlist'

const {
  mockConfirmRequire,
  mockToastAdd,
  mockNavigateTo,
  mockRouterReplace,
  mockRouteQuery,
  mockWishlistState,
  mockCartState,
} = vi.hoisted(() => ({
  mockConfirmRequire: vi.fn(),
  mockToastAdd: vi.fn(),
  mockNavigateTo: vi.fn(),
  mockRouterReplace: vi.fn(),
  mockRouteQuery: { value: {} as Record<string, string> },
  mockWishlistState: {
    items: [] as WishlistItem[],
    isSyncing: false,
    initWishlist: vi.fn(),
    moveToCart: vi.fn(() => true),
    moveAllToCart: vi.fn(() => 1),
    removeItem: vi.fn(() => true),
    clearWishlist: vi.fn(),
  },
  mockCartState: {
    isDrawerOpen: false,
  },
}))

mockNuxtImport('useHead', () => vi.fn())
mockNuxtImport('useUiToast', () => () => ({ add: mockToastAdd }))
mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useRoute', () => () => ({ query: mockRouteQuery.value }))
mockNuxtImport('useRouter', () => () => ({ replace: mockRouterReplace }))

vi.mock('~/features/wishlist/stores/wishlist', () => ({
  useWishlistStore: () => {
    const items = ref(mockWishlistState.items)
    const isSyncing = ref(mockWishlistState.isSyncing)
    return reactive({
      items,
      isSyncing,
      totalItems: computed(() => items.value.length),
      isEmpty: computed(() => items.value.length === 0),
      initWishlist: mockWishlistState.initWishlist,
      moveToCart: mockWishlistState.moveToCart,
      moveAllToCart: mockWishlistState.moveAllToCart,
      removeItem: mockWishlistState.removeItem,
      clearWishlist: mockWishlistState.clearWishlist,
    })
  },
}))

vi.mock('~/features/cart/stores/cart', () => ({
  useCartStore: () => mockCartState,
}))

vi.mock('~/composables/useUiConfirm', () => ({
  useUiConfirm: () => ({
    require: mockConfirmRequire,
  }),
}))

const sampleItems = (): WishlistItem[] => [
  {
    productId: 1,
    name: 'Keyboard Mekanikal 75%',
    slug: 'keyboard-75',
    price: 1450000,
    priceCents: 145000000,
    imageUrl: '/images/products/keyboard-75-black.jpg',
    stock: 12,
    categoryName: 'Tech & Gadget',
    rating: 4.9,
    reviewCount: 18,
    addedAt: '2026-11-24T02:00:00.000Z',
  },
  {
    productId: 2,
    name: 'Stand Laptop Aluminium',
    slug: 'stand-laptop',
    price: 320000,
    priceCents: 32000000,
    imageUrl: '/images/products/laptop-stand-silver.jpg',
    stock: 0,
    categoryName: 'Tech & Gadget',
    rating: 0,
    reviewCount: 0,
    addedAt: '2026-11-24T01:00:00.000Z',
  },
  {
    productId: 3,
    name: 'Headphone Studio ANC',
    slug: 'headphone-anc',
    price: 2680000,
    priceCents: 268000000,
    imageUrl: '/images/products/headphone-anc-black.jpg',
    stock: 4,
    categoryName: 'Audio Studio',
    rating: 4.8,
    reviewCount: 9,
    addedAt: '2026-11-24T03:00:00.000Z',
  },
]

const mountPage = () =>
  mount(WishlistPage, {
    global: {
      stubs: {
        AccountSidebar: { template: '<aside data-test="sidebar" />' },
        NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        UiCard: { props: ['padded'], template: '<div data-test="card"><slot /></div>' },
        UiButton: {
          props: ['disabled', 'icon', 'variant', 'size'],
          emits: ['click'],
          template:
            '<button type="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        },
        UiSelect: {
          props: ['id', 'modelValue', 'options', 'prefix', 'size', 'align', 'title'],
          emits: ['update:modelValue'],
          template:
            '<select :id="id" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select>',
        },
        UiEmptyState: {
          props: ['title', 'actionLabel'],
          emits: ['action'],
          template:
            '<div data-test="empty"><span>{{ title }}</span><button type="button" @click="$emit(\'action\')">{{ actionLabel }}</button></div>',
        },
        UiSkeleton: { template: '<div data-test="skeleton" />' },
      },
    },
  })

describe('WishlistPage compact informative rows, filters, and interactions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockRouteQuery.value = {}
    mockWishlistState.items = []
    mockWishlistState.isSyncing = false
    mockCartState.isDrawerOpen = false
  })

  it('renders loading skeleton while syncing an empty wishlist', () => {
    mockWishlistState.isSyncing = true
    const wrapper = mountPage()

    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="skeleton"]').length).toBeGreaterThan(0)
  })

  it('renders UiEmptyState when wishlist is empty and hides filter toolbar', () => {
    const wrapper = mountPage()
    expect(wrapper.find('[data-test="empty"]').text()).toContain('Belum Ada Produk Tersimpan')
    expect(wrapper.find('.wishlist-toolbar').exists()).toBe(false)
  })

  it('renders compact rows with title-first hierarchy, real metadata, and confirmation on clear', async () => {
    mockWishlistState.items = sampleItems()

    const wrapper = mountPage()
    const rows = wrapper.findAll('article.wishlist-row')
    expect(rows).toHaveLength(3)

    // Default sort is newest addedAt: Headphone (03:00), Keyboard (02:00), Stand (01:00)
    expect(rows[0]!.find('h2').text()).toContain('Headphone Studio ANC')
    expect(rows[0]!.find('img').attributes('width')).toBe('72')
    expect(rows[0]!.find('img').attributes('height')).toBe('72')

    // Informative metadata: stock, category, real rating, saved date
    expect(wrapper.text()).toContain('2 siap dibeli')
    expect(wrapper.text()).toContain('1 habis')
    expect(rows[0]!.text()).toContain('Sisa 4')
    expect(rows[0]!.text()).toContain('Audio Studio')
    expect(rows[0]!.text()).toContain('4.8')
    expect(rows[0]!.text()).toContain('Disimpan')
    expect(rows[1]!.text()).toContain('Stok 12')
    expect(rows[1]!.text()).toContain('4.9')
    expect(rows[2]!.text()).toContain('Stok Habis')
    expect(rows[2]!.find('button.wishlist-cta').attributes('disabled')).toBeDefined()

    // Destructive clear action asks confirmation instead of wiping immediately
    const clearBtn = wrapper.findAll('button').find((b) => b.text().includes('Kosongkan'))
    await clearBtn!.trigger('click')
    expect(mockConfirmRequire).toHaveBeenCalledTimes(1)
    expect(mockWishlistState.clearWishlist).not.toHaveBeenCalled()

    const confirmOpts = mockConfirmRequire.mock.calls[0]?.[0]
    confirmOpts.accept()
    expect(mockWishlistState.clearWishlist).toHaveBeenCalledTimes(1)
  })

  it('filters by stock chip, searches by name, sorts by price, syncs URL query, and resets empty results', async () => {
    mockWishlistState.items = sampleItems()
    const wrapper = mountPage()

    const availableChip = wrapper
      .findAll('button.wishlist-chip')
      .find((b) => b.text().includes('Siap Dibeli'))
    await availableChip!.trigger('click')
    expect(wrapper.findAll('article.wishlist-row')).toHaveLength(2)
    expect(mockRouterReplace).toHaveBeenLastCalledWith({ query: { stock: 'available' } })

    await wrapper.find('#wishlist-sort').setValue('price_asc')
    const sortedRows = wrapper.findAll('article.wishlist-row')
    expect(sortedRows[0]!.text()).toContain('Keyboard Mekanikal 75%')
    expect(sortedRows[1]!.text()).toContain('Headphone Studio ANC')
    expect(mockRouterReplace).toHaveBeenLastCalledWith({
      query: { stock: 'available', sort: 'price_asc' },
    })

    await wrapper.find('#wishlist-search').setValue('tidak-ada-produk')
    expect(wrapper.find('[data-test="empty"]').text()).toContain('Tidak Ada Produk yang Cocok')

    await wrapper.find('[data-test="empty"] button').trigger('click')
    expect(wrapper.findAll('article.wishlist-row')).toHaveLength(3)
    expect(mockRouterReplace).toHaveBeenLastCalledWith({ query: {} })
  })
})
