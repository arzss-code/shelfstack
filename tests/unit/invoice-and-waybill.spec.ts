import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Order } from '~/types/order'
import { renderBarcodeSvg, renderQrCodeSvg } from '~/features/orders/utils/logistics-vector'
import AdminShippingLabelModal from '~/features/orders/components/AdminShippingLabelModal.vue'
import OrderInvoiceModal from '~/features/orders/components/OrderInvoiceModal.vue'

const globalStubs = {
  UiModal: {
    template: `
      <div v-if="visible" class="ui-modal-stub">
        <header><slot name="header">{{ title }}</slot></header>
        <div><slot /></div>
        <footer><slot name="footer" /></footer>
      </div>
    `,
    props: ['visible', 'title', 'size'],
  },
  UiButton: {
    template: '<button :class="variant" @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'size', 'icon', 'disabled'],
    emits: ['click'],
  },
  UiBadge: {
    template: '<span class="ui-badge">{{ label }}</span>',
    props: ['label', 'variant', 'size'],
  },
}

const mockOrder: Order = {
  id: 'ord-test-waybill-123456',
  user_id: 'usr-999',
  status: 'shipped',
  total_cents: 25000000,
  subtotal_cents: 24000000,
  shipping_cost_cents: 2000000,
  shipping_discount_cents: 1000000,
  discount_cents: 0,
  tax_cents: 0,
  created_at: '2026-11-14T08:00:00Z',
  paid_at: '2026-11-14T08:15:00Z',
  courier_name: 'SiCepat REG',
  courier_code: 'sicepat',
  shipping_service: 'reguler',
  tracking_number: 'SPXID0987654321',
  address: {
    name: 'Budi Santoso',
    phone: '081298765432',
    street: 'Jl. Merdeka Barat No. 10',
    city: 'Bandung',
    postal: '40115',
    note: 'Titipkan ke pos satpam cluster B',
  },
  items: [
    {
      id: 'item-1',
      order_id: 'ord-test-waybill-123456',
      product_id: 101,
      qty: 2,
      price_cents: 7000000,
      product: {
        id: 101,
        name: 'Ergonomic Mechanical Keyboard',
        price_cents: 7000000,
        image_url: 'https://example.com/keyboard.jpg',
      },
    },
    {
      id: 'item-2',
      order_id: 'ord-test-waybill-123456',
      product_id: 102,
      qty: 1,
      price_cents: 10000000,
      product: {
        id: 102,
        name: 'Desk Mat Minimalist Felt',
        price_cents: 10000000,
        image_url: 'https://example.com/mat.jpg',
      },
    },
  ],
}

describe('Logistics Vector Generator', () => {
  describe('renderBarcodeSvg', () => {
    it('menghasilkan markup SVG Code 128 yang valid dengan quiet zones dan crisp edges', () => {
      const svg = renderBarcodeSvg('SPXID0987654321', { height: 44, moduleWidth: 2 })
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
      expect(svg).toContain('viewBox="0 0')
      expect(svg).toContain('shape-rendering="crispEdges"')
      expect(svg).toContain('<rect')
      expect(svg).toContain('<text')
      expect(svg).toContain('SPXID0987654321')
    })

    it('dapat menyembunyikan label teks jika showText bernilai false', () => {
      const svg = renderBarcodeSvg('TESTAWB', { showText: false })
      expect(svg).not.toContain('<text')
      expect(svg).toContain('<rect')
    })

    it('menangani input kosong atau simbol khusus dengan fallback aman', () => {
      const svg = renderBarcodeSvg('', { showText: true })
      expect(svg).toContain('000000')
      expect(svg).toContain('<svg')
    })
  })

  describe('renderQrCodeSvg', () => {
    it('menghasilkan matriks 21x21 QR code deterministik dengan finder patterns', () => {
      const svg = renderQrCodeSvg('https://shelfstack.atsiilaarya.me/tracking?order_id=ord-123', {
        size: 68,
      })
      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
      expect(svg).toContain('viewBox="0 0 21 21"')
      expect(svg).toContain('width="68"')
      expect(svg).toContain('height="68"')
      expect(svg).toContain('<rect')
    })

    it('menerapkan kelas kustom dan ukuran default yang ditentukan', () => {
      const svg = renderQrCodeSvg('TEST-QR', { className: 'custom-qr-class' })
      expect(svg).toContain('class="custom-qr-class"')
      expect(svg).toContain('width="80"')
    })
  })
})

describe('AdminShippingLabelModal.vue (Thermal A6 Waybill)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('merender atribut logistik lengkap: kurir, hub routing, barcode, dan instruksi kurir', () => {
    const wrapper = mount(AdminShippingLabelModal, {
      props: { visible: true, order: mockOrder },
      global: { stubs: globalStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('SiCepat REG')
    expect(text).toContain('REGULER')
    expect(text).toContain('JKT > BANDUNG')
    expect(text).toContain('Budi Santoso')
    expect(text).toContain('081298765432')
    expect(text).toContain('Jl. Merdeka Barat No. 10')
    expect(text).toContain('Bandung')
    expect(text).toContain('ShelfStack Logistics Hub')
    expect(text).toContain('Titipkan ke pos satpam cluster B')
    expect(text).toContain('ISI PAKET (3 BARANG)')
    expect(text).toContain('Ergonomic Mechanical Keyboard')
    expect(text).toContain('Desk Mat Minimalist Felt')
    expect(text).toContain('Scan Resi Resmi')
  })

  it('menangani pesanan tanpa catatan kurir dengan bersih', () => {
    const orderWithoutNote: Order = {
      ...mockOrder,
      address: { ...mockOrder.address!, note: null },
    }
    const wrapper = mount(AdminShippingLabelModal, {
      props: { visible: true, order: orderWithoutNote },
      global: { stubs: globalStubs },
    })

    expect(wrapper.text()).not.toContain('CATATAN KURIR')
  })

  it('memanggil window.print() saat tombol cetak diklik', async () => {
    const printMock = vi.fn()
    window.print = printMock

    const wrapper = mount(AdminShippingLabelModal, {
      props: { visible: true, order: mockOrder },
      global: { stubs: globalStubs },
    })

    const printButtons = wrapper.findAll('button').filter((btn) => btn.text().includes('Cetak'))
    expect(printButtons.length).toBeGreaterThan(0)
    await printButtons[0].trigger('click')

    expect(printMock).toHaveBeenCalled()
  })

  it('memancarkan update:visible saat tombol tutup diklik', async () => {
    const wrapper = mount(AdminShippingLabelModal, {
      props: { visible: true, order: mockOrder },
      global: { stubs: globalStubs },
    })

    const closeButton = wrapper.findAll('button').find((btn) => btn.text().includes('Tutup'))
    expect(closeButton).toBeDefined()
    await closeButton!.trigger('click')

    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')![0]).toEqual([false])
  })
})

describe('OrderInvoiceModal.vue (Verifikasi Dokumen Resmi)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('merender kotak verifikasi QR dokumen dan rincian transaksi invoice', () => {
    const wrapper = mount(OrderInvoiceModal, {
      props: { visible: true, order: mockOrder },
      global: { stubs: globalStubs },
    })

    const text = wrapper.text()
    expect(text).toContain('FAKTUR PENJUALAN')
    expect(text).toContain('INV-ORD-TEST')
    expect(text).toContain('Verifikasi Dokumen')
    expect(text).toContain('Pindai kode QR untuk memvalidasi keaslian transaksi digital ini')
    expect(text).toContain('REF: ORD-TEST')
    expect(text).toContain('Ergonomic Mechanical Keyboard')
  })

  it('memanggil window.print() saat tombol cetak invoice ditekan', async () => {
    const printMock = vi.fn()
    window.print = printMock

    const wrapper = mount(OrderInvoiceModal, {
      props: { visible: true, order: mockOrder },
      global: { stubs: globalStubs },
    })

    const printButton = wrapper.findAll('button').find((btn) => btn.text().includes('Cetak'))
    expect(printButton).toBeDefined()
    await printButton!.trigger('click')

    expect(printMock).toHaveBeenCalled()
  })
})
