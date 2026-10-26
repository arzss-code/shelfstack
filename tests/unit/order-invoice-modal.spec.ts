import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderInvoiceModal from '~/features/orders/components/OrderInvoiceModal.vue'
import type { Order } from '~/types/order'

describe('OrderInvoiceModal Component', () => {
  const mockOrder: Order = {
    id: 'ord-12345678-abcd',
    user_id: 'user-001',
    status: 'paid',
    total_cents: 25000000,
    created_at: '2026-10-08T10:00:00Z',
    paid_at: '2026-10-08T10:15:00Z',
    payment_type: 'bank_transfer',
    address: {
      name: 'Rian Pratama',
      phone: '081299998888',
      city: 'Jakarta Barat',
      street: 'Jl. Merdeka No. 45',
      postal: '11530',
    },
    items: [
      {
        id: 'item-1',
        qty: 1,
        price_cents: 25000000,
        product: {
          name: 'Keyboard Mekanikal Pro',
          image_url: 'https://example.com/keyboard.jpg',
        },
      },
    ],
  }

  const globalStubs = {
    UiModal: {
      template:
        '<div class="modal-stub"><slot name="header" /><slot /><slot name="footer" /></div>',
      props: ['visible', 'title', 'size'],
    },
    UiButton: {
      template: '<button class="ui-button-stub"><slot /></button>',
    },
  }

  it('renders invoice header, official company name, and invoice number', () => {
    const wrapper = mount(OrderInvoiceModal, {
      props: {
        visible: true,
        order: mockOrder,
      },
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('SHELFSTACK')
    expect(wrapper.text()).toContain('PT ShelfStack Niaga Digital')
    expect(wrapper.text()).toContain('INV-ORD-1234')
  })

  it('renders customer billing information accurately', () => {
    const wrapper = mount(OrderInvoiceModal, {
      props: {
        visible: true,
        order: mockOrder,
      },
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Rian Pratama')
    expect(wrapper.text()).toContain('081299998888')
    expect(wrapper.text()).toContain('Jakarta Barat')
  })

  it('renders itemized list, pricing, and grand total', () => {
    const wrapper = mount(OrderInvoiceModal, {
      props: {
        visible: true,
        order: mockOrder,
      },
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Keyboard Mekanikal Pro')
    // 25000000 cents = Rp 250.000
    expect(wrapper.text()).toContain('250.000')
  })
})
