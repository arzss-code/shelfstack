import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import HelpPage from '../../app/pages/help.vue'
import UiTabs from '../../app/components/ui/UiTabs.vue'
import UiInput from '../../app/components/ui/UiInput.vue'
import UiBadge from '../../app/components/ui/UiBadge.vue'
import UiButton from '../../app/components/ui/UiButton.vue'
import UiEmptyState from '../../app/components/ui/UiEmptyState.vue'

// Gunakan vi.hoisted dengan import reactive dari vue agar watch(() => route.hash) reaktif
const { mockRoute, mockSeoMeta } = await vi.hoisted(async () => {
  const { reactive } = await import('vue')
  return {
    mockRoute: reactive({
      hash: '',
      path: '/help',
      query: {},
    }),
    mockSeoMeta: vi.fn(),
  }
})

mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useSeoMeta', () => mockSeoMeta)

const globalOptions = {
  components: {
    UiTabs,
    UiInput,
    UiBadge,
    UiButton,
    UiEmptyState,
  },
  stubs: {
    NuxtLink: {
      template: '<a :href="to" :data-to="to"><slot /></a>',
      props: ['to'],
    },
  },
}

describe('Help Center Page (app/pages/help.vue)', () => {
  beforeEach(() => {
    mockRoute.hash = ''
    mockRoute.path = '/help'
    mockRoute.query = {}
    mockSeoMeta.mockClear()
  })

  it('renders all 15 FAQ items and header correctly on initial load', () => {
    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })

    // Verifikasi pemanggilan useSeoMeta
    expect(mockSeoMeta).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pusat Bantuan & Kebijakan - ShelfStack',
      }),
    )

    // Header & Hero
    expect(wrapper.find('h1').text()).toContain('Ada yang Bisa Kami Bantu?')
    expect(wrapper.text()).toContain('Pusat Bantuan & Kebijakan')

    // 15 FAQ items total (3 items x 5 categories)
    const faqItems = wrapper.findAll('[data-testid="faq-item"]')
    expect(faqItems.length).toBe(15)

    // Quick Support banner
    expect(wrapper.text()).toContain('Masih Butuh Bantuan?')
    const contactBtn = wrapper.find('[data-testid="btn-contact"]')
    const trackingBtn = wrapper.find('[data-testid="btn-tracking"]')
    expect(contactBtn.exists()).toBe(true)
    expect(trackingBtn.exists()).toBe(true)
  })

  it('filters FAQ items by real-time search query', async () => {
    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })

    const searchInput = wrapper.find('[data-testid="help-search-input"] input')
    expect(searchInput.exists()).toBe(true)

    // Cari dengan kata kunci "Midtrans"
    await searchInput.setValue('Midtrans')
    await flushPromises()

    const midtransItems = wrapper.findAll('[data-testid="faq-item"]')
    expect(midtransItems.length).toBeGreaterThan(0)
    midtransItems.forEach((item) => {
      expect(item.text().toLowerCase()).toContain('midtrans')
    })

    // Cari dengan kata kunci "resi"
    await searchInput.setValue('resi')
    await flushPromises()

    const resiItems = wrapper.findAll('[data-testid="faq-item"]')
    expect(resiItems.length).toBeGreaterThan(0)
    resiItems.forEach((item) => {
      expect(item.text().toLowerCase()).toContain('resi')
    })

    // Reset pencarian via tombol reset
    const resetBtn = wrapper.find('[data-testid="btn-reset-search"]')
    expect(resetBtn.exists()).toBe(true)
    await resetBtn.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="faq-item"]').length).toBe(15)
  })

  it('shows empty state when search query yields no results', async () => {
    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })

    const searchInput = wrapper.find('[data-testid="help-search-input"] input')
    await searchInput.setValue('kata-kunci-tidak-ada-dalam-database-999')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="faq-item"]').length).toBe(0)
    expect(wrapper.text()).toContain('Pertanyaan Tidak Ditemukan')

    // Klik tombol reset pada empty state
    const emptyStateActionBtn = wrapper.find('button.bg-brand-canvas-soft')
    expect(emptyStateActionBtn.exists()).toBe(true)
    await emptyStateActionBtn.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="faq-item"]').length).toBe(15)
  })

  it('switches categories using tabs and filters items accordingly', async () => {
    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })

    // Pindah ke kategori "Pengiriman"
    const tabs = wrapper.findAll('button[role="tab"]')
    const pengirimanTab = tabs.find((t) => t.text().includes('Pengiriman'))
    expect(pengirimanTab).toBeDefined()

    await pengirimanTab?.trigger('click')
    await flushPromises()

    const pengirimanItems = wrapper.findAll('[data-testid="faq-item"]')
    expect(pengirimanItems.length).toBe(3)
    pengirimanItems.forEach((item) => {
      expect(item.attributes('data-category')).toBe('pengiriman')
    })

    // Pindah ke kategori "Garansi"
    const garansiTab = tabs.find((t) => t.text().includes('Garansi'))
    expect(garansiTab).toBeDefined()

    await garansiTab?.trigger('click')
    await flushPromises()

    const garansiItems = wrapper.findAll('[data-testid="faq-item"]')
    expect(garansiItems.length).toBe(3)
    garansiItems.forEach((item) => {
      expect(item.attributes('data-category')).toBe('garansi')
    })

    // Pindah ke kategori "Pembayaran"
    const pembayaranTab = tabs.find((t) => t.text().includes('Pembayaran'))
    expect(pembayaranTab).toBeDefined()

    await pembayaranTab?.trigger('click')
    await flushPromises()

    const pembayaranItems = wrapper.findAll('[data-testid="faq-item"]')
    expect(pembayaranItems.length).toBe(3)
    pembayaranItems.forEach((item) => {
      expect(item.attributes('data-category')).toBe('pembayaran')
    })

    // Pindah ke kategori "Pengembalian"
    const pengembalianTab = tabs.find((t) => t.text().includes('Pengembalian'))
    expect(pengembalianTab).toBeDefined()

    await pengembalianTab?.trigger('click')
    await flushPromises()

    const pengembalianItems = wrapper.findAll('[data-testid="faq-item"]')
    expect(pengembalianItems.length).toBe(3)
    pengembalianItems.forEach((item) => {
      expect(item.attributes('data-category')).toBe('pengembalian')
    })

    // Pindah kembali ke "Semua"
    const semuaTab = tabs.find((t) => t.text().includes('Semua'))
    expect(semuaTab).toBeDefined()

    await semuaTab?.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('[data-testid="faq-item"]').length).toBe(15)
  })

  it('toggles accordion items expansion smoothly with accessible aria attributes', async () => {
    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })

    const firstToggleBtn = wrapper.findAll('[data-testid="faq-toggle-button"]')[0]
    expect(firstToggleBtn.exists()).toBe(true)

    // Awalnya tertutup (aria-expanded = false)
    expect(firstToggleBtn.attributes('aria-expanded')).toBe('false')
    const firstPanel = wrapper.findAll('[data-testid="faq-answer-panel"]')[0]
    expect(firstPanel.attributes('style')).toContain('display: none')

    // Klik untuk membuka
    await firstToggleBtn.trigger('click')
    await flushPromises()

    expect(firstToggleBtn.attributes('aria-expanded')).toBe('true')
    expect(firstPanel.attributes('style') || '').not.toContain('display: none')

    // Klik lagi untuk menutup
    await firstToggleBtn.trigger('click')
    await flushPromises()

    expect(firstToggleBtn.attributes('aria-expanded')).toBe('false')
    expect(firstPanel.attributes('style')).toContain('display: none')
  })

  it('supports Buka Semua and Tutup Semua buttons', async () => {
    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })

    const expandAllBtn = wrapper.find('[data-testid="btn-expand-all"]')
    const collapseAllBtn = wrapper.find('[data-testid="btn-collapse-all"]')

    expect(expandAllBtn.exists()).toBe(true)
    expect(collapseAllBtn.exists()).toBe(true)

    // Klik Buka Semua
    await expandAllBtn.trigger('click')
    await flushPromises()

    const allButtonsAfterExpand = wrapper.findAll('[data-testid="faq-toggle-button"]')
    allButtonsAfterExpand.forEach((btn) => {
      expect(btn.attributes('aria-expanded')).toBe('true')
    })

    // Klik Tutup Semua
    await collapseAllBtn.trigger('click')
    await flushPromises()

    const allButtonsAfterCollapse = wrapper.findAll('[data-testid="faq-toggle-button"]')
    allButtonsAfterCollapse.forEach((btn) => {
      expect(btn.attributes('aria-expanded')).toBe('false')
    })
  })

  it('synchronizes selected category from URL hash on mount', async () => {
    mockRoute.hash = '#pengembalian'

    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })
    await flushPromises()

    const items = wrapper.findAll('[data-testid="faq-item"]')
    expect(items.length).toBe(3)
    items.forEach((item) => {
      expect(item.attributes('data-category')).toBe('pengembalian')
    })
  })

  it('reacts dynamically to URL hash changes', async () => {
    mockRoute.hash = '#pengiriman'

    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })
    await flushPromises()

    expect(wrapper.findAll('[data-testid="faq-item"]').length).toBe(3)
    wrapper.findAll('[data-testid="faq-item"]').forEach((item) => {
      expect(item.attributes('data-category')).toBe('pengiriman')
    })

    // Simulasi perubahan hash ke #garansi
    mockRoute.hash = '#garansi'
    await flushPromises()

    expect(wrapper.findAll('[data-testid="faq-item"]').length).toBe(3)
    wrapper.findAll('[data-testid="faq-item"]').forEach((item) => {
      expect(item.attributes('data-category')).toBe('garansi')
    })
  })

  it('contains interactive links to /tracking and /contact within relevant FAQ items', () => {
    const wrapper = mount(HelpPage, {
      global: globalOptions,
    })

    const trackingLinks = wrapper.findAll('a[data-to="/tracking"]')
    expect(trackingLinks.length).toBeGreaterThan(0)

    const contactLinks = wrapper.findAll('a[data-to="/contact"]')
    expect(contactLinks.length).toBeGreaterThan(0)
  })
})
