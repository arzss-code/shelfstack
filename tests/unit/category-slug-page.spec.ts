import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import CategorySlugPage from '../../app/pages/c/[slug].vue'
import UiBadge from '../../app/components/ui/UiBadge.vue'
import UiButton from '../../app/components/ui/UiButton.vue'
import UiEmptyState from '../../app/components/ui/UiEmptyState.vue'

const { mockRoute, mockSeoMeta, mockAsyncData } = await vi.hoisted(async () => {
  const { reactive, ref } = await import('vue')
  return {
    mockRoute: reactive({
      params: { slug: 'tech' },
      query: {},
      path: '/c/tech',
    }),
    mockSeoMeta: vi.fn(),
    mockAsyncData: vi.fn(() => ({
      data: ref({
        status: 'success',
        message: '',
        data: [
          {
            id: 21,
            name: 'Headphone Studio ANC',
            price: 1850000,
            stock: 25,
            image_url: 'https://example.com/headphone.jpg',
          },
        ],
        total: 1,
      }),
      pending: ref(false),
      refresh: vi.fn(),
    })),
  }
})

vi.stubGlobal('useState', (_key: string, init?: () => any) => ref(init ? init() : undefined))
mockNuxtImport(
  'useState',
  () =>
    <T>(_key: string, init?: () => T) =>
      ref(init ? init() : undefined),
)
mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useSeoMeta', () => mockSeoMeta)
mockNuxtImport('useAsyncData', () => mockAsyncData)

const globalOptions = {
  components: {
    UiBadge,
    UiButton,
    UiEmptyState,
  },
  stubs: {
    NuxtLink: {
      template: '<a :href="to" :data-to="to"><slot /></a>',
      props: ['to'],
    },
    ProductList: {
      template: '<div data-testid="mock-product-list"><slot /></div>',
      props: ['products', 'loading', 'density', 'hideActions'],
    },
  },
}

describe('Category Pretty Slug Route Page (app/pages/c/[slug].vue)', () => {
  beforeEach(() => {
    mockRoute.params = { slug: 'tech' }
    mockRoute.path = '/c/tech'
    mockSeoMeta.mockClear()
    mockAsyncData.mockClear()
  })

  it('renders category header, title, and products for valid category slug', () => {
    const wrapper = mount(CategorySlugPage, {
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('Tech & Gadget')
    expect(wrapper.text()).toContain('Kategori Resmi')
    expect(wrapper.text()).toContain('1 Produk Aktif')
    expect(wrapper.find('[data-testid="mock-product-list"]').exists()).toBe(true)

    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(Function),
        description: expect.any(Function),
      }),
    )
  })

  it('renders breadcrumb links to Home and Catalog', () => {
    const wrapper = mount(CategorySlugPage, {
      global: globalOptions,
    })

    const breadcrumbs = wrapper.findAll('nav[aria-label="Breadcrumb"] a')
    expect(breadcrumbs.length).toBeGreaterThanOrEqual(2)
    expect(breadcrumbs[0]?.attributes('data-to')).toBe('/')
    expect(breadcrumbs[1]?.attributes('data-to')).toBe('/katalog')
  })

  it('renders empty state when category slug is unknown', async () => {
    mockRoute.params = { slug: 'kategori-fiktif-xyz' }
    mockRoute.path = '/c/kategori-fiktif-xyz'

    const wrapper = mount(CategorySlugPage, {
      global: globalOptions,
    })

    expect(wrapper.text()).toContain('Kategori Tidak Ditemukan')
    expect(wrapper.text()).toContain("Kategori 'kategori-fiktif-xyz' tidak terdaftar")
    expect(wrapper.find('[data-testid="mock-product-list"]').exists()).toBe(false)
  })
})
