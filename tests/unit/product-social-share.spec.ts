import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductSocialShare from '../../app/components/product/ProductSocialShare.vue'
import { formatRupiah } from '../../app/utils/format'
import type { Product } from '../../app/types/product'

const mockToastAdd = vi.fn()

vi.mock('~/composables/useUiToast', () => ({
  useUiToast: () => ({
    add: mockToastAdd,
    show: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  }),
}))

describe('ProductSocialShare.vue', () => {
  const sampleProduct: Product = {
    id: 1,
    name: 'Headphone Studio ANC',
    slug: 'headphone-studio-anc',
    price: 2680000,
    stock: 15,
    image_url: 'https://example.com/headphone.jpg',
  }

  const globalStubs = {
    UiTooltip: {
      template: '<div><slot /></div>',
      props: ['text', 'position'],
    },
    UiButton: {
      template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
      props: ['variant', 'size', 'icon'],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('open', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders WhatsApp and Copy Link action buttons', () => {
    const wrapper = mount(ProductSocialShare, {
      props: { product: sampleProduct },
      global: { stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('Bagikan Produk:')
    expect(wrapper.text()).toContain('WhatsApp')
    expect(wrapper.text()).toContain('Salin Tautan')
  })

  it('opens WhatsApp direct link with formatted product details on click', async () => {
    const wrapper = mount(ProductSocialShare, {
      props: { product: sampleProduct },
      global: { stubs: globalStubs },
    })

    const waButton = wrapper.find('button[aria-label="Bagikan produk ke WhatsApp"]')
    expect(waButton.exists()).toBe(true)

    await waButton.trigger('click')

    expect(window.open).toHaveBeenCalledTimes(1)
    const openedUrl = (window.open as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[0] as string
    expect(openedUrl).toContain('https://api.whatsapp.com/send?text=')
    expect(decodeURIComponent(openedUrl)).toContain('Headphone Studio ANC')
    expect(decodeURIComponent(openedUrl)).toContain(formatRupiah(sampleProduct.price))
    expect(decodeURIComponent(openedUrl)).toContain(
      'https://shelfstack.co.id/product/headphone-studio-anc',
    )
  })

  it('copies URL to clipboard and triggers success toast notification', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    const wrapper = mount(ProductSocialShare, {
      props: { product: sampleProduct },
      global: { stubs: globalStubs },
    })

    const copyButton = wrapper.find('button[aria-label="Salin tautan produk"]')
    await copyButton.trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(writeTextMock).toHaveBeenCalledWith(
      'https://shelfstack.co.id/product/headphone-studio-anc',
    )
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Tautan Disalin',
      }),
    )
  })

  it('shows error toast when copying to clipboard fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'))
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    const wrapper = mount(ProductSocialShare, {
      props: { product: sampleProduct },
      global: { stubs: globalStubs },
    })

    const copyButton = wrapper.find('button[aria-label="Salin tautan produk"]')
    await copyButton.trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Gagal Menyalin',
      }),
    )
  })

  it('invokes native navigator.share when available and clicked', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', {
      share: shareMock,
    })

    const wrapper = mount(ProductSocialShare, {
      props: { product: sampleProduct },
      global: { stubs: globalStubs },
    })

    const nativeShareButton = wrapper.find('button[aria-label="Buka dialog bagikan peramban"]')
    expect(nativeShareButton.exists()).toBe(true)

    await nativeShareButton.trigger('click')

    expect(shareMock).toHaveBeenCalledWith({
      title: 'Headphone Studio ANC',
      text: 'Beli Headphone Studio ANC di ShelfStack',
      url: 'https://shelfstack.co.id/product/headphone-studio-anc',
    })
  })
})
