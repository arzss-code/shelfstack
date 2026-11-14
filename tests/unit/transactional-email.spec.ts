import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminEmailPreviewModal from '../../app/components/admin/AdminEmailPreviewModal.vue'
import {
  generateEmailSubject,
  generateEmailHtml,
  type EmailOrderData,
} from '../../shared/utils/email-templates'
import { buildEmailOrderData } from '../../app/features/orders/utils/order-email'
import type { Order } from '../../app/types/order'

const mockToastAdd = vi.fn()

vi.mock('~/composables/useUiToast', () => ({
  useUiToast: () => ({
    add: mockToastAdd,
    show: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
  }),
}))

describe('Transactional Email Service & Preview Modal', () => {
  const sampleEmailOrder: EmailOrderData = {
    id: 'c1b48b11-9a72-4d6f-a119-a972efd79144',
    customer_name: 'Budi Santoso',
    customer_email: 'budi.santoso@example.com',
    customer_phone: '081234567890',
    street: 'Jl. Sudirman No. 45 Blok B',
    city: 'Jakarta Selatan',
    postal: '12190',
    notes: 'Tolong bubble wrap tebal',
    shipping_service: 'Reguler',
    courier_code: 'jne',
    tracking_number: 'SS-JNE-88291024',
    items: [
      {
        name: 'Headphone Studio ANC',
        variantName: 'Matte Obsidian',
        quantity: 1,
        price: 2680000,
      },
      {
        name: 'Desk Pad Kulit Minimalis',
        variantName: 'Deep Walnut',
        quantity: 2,
        price: 350000,
      },
    ],
    subtotal_cents: 338000000,
    coupon_code: 'HEMAT50K',
    coupon_discount_cents: 5000000,
    coins_used: 100,
    coins_discount_cents: 1000000,
    shipping_fee_cents: 0,
    total_cents: 332000000,
  }

  describe('generateEmailSubject', () => {
    it('generates correct subject for order_placed', () => {
      const subject = generateEmailSubject('order_placed', { id: sampleEmailOrder.id })
      expect(subject).toContain('Konfirmasi Pemesanan')
      expect(subject).toContain('#C1B48B11')
      expect(subject).toContain('[ShelfStack]')
    })

    it('generates correct subject for payment_success', () => {
      const subject = generateEmailSubject('payment_success', { id: sampleEmailOrder.id })
      expect(subject).toContain('Pembayaran Berhasil')
      expect(subject).toContain('#C1B48B11')
    })

    it('generates correct subject for order_shipped', () => {
      const subject = generateEmailSubject('order_shipped', { id: sampleEmailOrder.id })
      expect(subject).toContain('Pesanan Anda Sedang Dikirim')
      expect(subject).toContain('#C1B48B11')
    })
  })

  describe('generateEmailHtml', () => {
    it('generates clean HTML with order details and financial breakdown', () => {
      const html = generateEmailHtml('payment_success', sampleEmailOrder)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('SHELF')
      expect(html).toContain('Budi Santoso')
      expect(html).toContain('Headphone Studio ANC')
      expect(html).toContain('Matte Obsidian')
      expect(html).toContain('Desk Pad Kulit Minimalis')
      expect(html).toContain('Diskon Kupon (HEMAT50K)')
      expect(html).toContain('Potongan Koin (100 Koin)')
      expect(html).toContain('GRATIS')
      expect(html).toContain('Jl. Sudirman No. 45 Blok B')
      expect(html).toContain('color: #0066ff;')
      expect(html).toContain('white-space: nowrap;')
      expect(html).not.toContain('monospace')
    })

    it('includes tracking section only when type is order_shipped', () => {
      const shippedHtml = generateEmailHtml('order_shipped', sampleEmailOrder)
      expect(shippedHtml).toContain('Nomor Resi Pengiriman')
      expect(shippedHtml).toContain('SS-JNE-88291024')
      expect(shippedHtml).toContain('JNE')

      const placedHtml = generateEmailHtml('order_placed', sampleEmailOrder)
      expect(placedHtml).not.toContain('Nomor Resi Pengiriman')
    })
  })

  describe('AdminEmailPreviewModal Component', () => {
    const mockOrder: Order = {
      id: 'c1b48b11-9a72-4d6f-a119-a972efd79144',
      user_id: 'usr-1',
      status: 'shipped',
      total_cents: 332000000,
      total_price: 3320000,
      created_at: '2026-11-14T10:00:00Z',
      shipping_service: 'Reguler',
      courier_code: 'jne',
      tracking_number: 'SS-JNE-88291024',
      address: {
        name: 'Budi Santoso',
        phone: '081234567890',
        street: 'Jl. Sudirman No. 45 Blok B',
        city: 'Jakarta Selatan',
        postal: '12190',
      },
      items: [
        {
          id: 'item-1',
          order_id: 'c1b48b11-9a72-4d6f-a119-a972efd79144',
          product_id: 1,
          qty: 1,
          price_cents: 268000000,
          product: {
            id: 1,
            name: 'Headphone Studio ANC',
            slug: 'headphone-studio-anc',
            price: 2680000,
            stock: 10,
            image_url: null,
          },
        },
      ],
    }

    const globalStubs = {
      Teleport: true,
      ClientOnly: { template: '<slot />' },
      UiButton: {
        template: '<button type="button"><slot /></button>',
        props: ['variant', 'size', 'icon'],
      },
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('renders modal header and lifecycle tabs when show is true', () => {
      const wrapper = mount(AdminEmailPreviewModal, {
        props: { show: true, order: mockOrder },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Pratinjau Email Transaksional')
      expect(wrapper.text()).toContain('1. Pemesanan Baru')
      expect(wrapper.text()).toContain('2. Pembayaran Lunas')
      expect(wrapper.text()).toContain('3. Pesanan Dikirim')
      expect(wrapper.find('iframe').exists()).toBe(true)
    })

    it('switches between rendered visual iframe and raw HTML code view', async () => {
      const wrapper = mount(AdminEmailPreviewModal, {
        props: { show: true, order: mockOrder },
        global: { stubs: globalStubs },
      })

      expect(wrapper.find('iframe').exists()).toBe(true)
      expect(wrapper.find('pre').exists()).toBe(false)

      const toggleBtn = wrapper.findAll('button').find((b) => b.text().includes('Lihat HTML'))
      expect(toggleBtn).toBeDefined()

      await toggleBtn?.trigger('click')

      expect(wrapper.find('pre').exists()).toBe(true)
      expect(wrapper.find('iframe').exists()).toBe(false)
    })

    it('copies email HTML to clipboard on Salin Kode HTML click', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', {
        clipboard: {
          writeText: writeTextMock,
        },
      })

      const wrapper = mount(AdminEmailPreviewModal, {
        props: { show: true, order: mockOrder },
        global: { stubs: globalStubs },
      })

      const copyBtn = wrapper.findAll('button').find((b) => b.text().includes('Salin Kode HTML'))
      expect(copyBtn).toBeDefined()

      await copyBtn?.trigger('click')

      expect(writeTextMock).toHaveBeenCalledTimes(1)
      expect(mockToastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'HTML Disalin',
        }),
      )
    })

    it('emits close when Tutup Pratinjau is clicked', async () => {
      const wrapper = mount(AdminEmailPreviewModal, {
        props: { show: true, order: mockOrder },
        global: { stubs: globalStubs },
      })

      const closeBtn = wrapper.findAll('button').find((b) => b.text().includes('Tutup Pratinjau'))
      expect(closeBtn).toBeDefined()

      await closeBtn?.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('manages modal-open scroll lock and closes on Escape key', async () => {
      const wrapper = mount(AdminEmailPreviewModal, {
        props: { show: true, order: mockOrder },
        global: { stubs: globalStubs },
      })

      expect(document.documentElement.classList.contains('modal-open')).toBe(true)

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(wrapper.emitted('close')).toBeTruthy()

      await wrapper.setProps({ show: false })
      expect(document.documentElement.classList.contains('modal-open')).toBe(false)
    })

    it('renders full-screen overlay with z-[1000] for complete backdrop coverage', () => {
      const wrapper = mount(AdminEmailPreviewModal, {
        props: { show: true, order: mockOrder },
        global: { stubs: globalStubs },
      })

      const overlay = wrapper.find('.fixed.inset-0')
      expect(overlay.exists()).toBe(true)
      expect(overlay.classes()).toContain('z-[1000]')
      expect(overlay.classes()).toContain('bg-black/60')
    })

    it('adapts order data via buildEmailOrderData with correct fallbacks', () => {
      const adapted = buildEmailOrderData(mockOrder)
      expect(adapted.id).toBe(mockOrder.id)
      expect(adapted.items[0]?.name).toBe('Headphone Studio ANC')
      expect(adapted.items[0]?.price).toBe(2680000)

      const fallback = buildEmailOrderData(null)
      expect(fallback.id).toBe('ord-sample-9921')
      expect(fallback.customer_name).toBe('Budi Santoso')
      expect(fallback.items).toHaveLength(2)
    })
  })
})
