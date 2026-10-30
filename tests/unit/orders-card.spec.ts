import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderCard from '~/features/orders/components/OrderCard.vue'
import type { Order } from '~/types/order'

describe('OrderCard Component', () => {
  const mockOrderWithItems: Order = {
    id: '12345678-aaaa-bbbb-cccc-dddddddddddd',
    user_id: 'user-001',
    status: 'paid',
    total_cents: 25000000,
    created_at: '2026-10-20T10:00:00Z',
    address: {
      name: 'Ahmad Dahlan',
      phone: '08123456789',
      street: 'Jl. Merdeka No. 10',
      city: 'Surabaya',
      postal: '60111',
    },
    items: [
      {
        id: 'item-1',
        order_id: '12345678-aaaa-bbbb-cccc-dddddddddddd',
        product_id: 101,
        qty: 2,
        price_cents: 10000000,
        product: {
          id: 101,
          name: 'Mechanical Keyboard Pro',
          image_url: 'https://images.unsplash.com/photo-keyboard.jpg',
        },
      },
      {
        id: 'item-2',
        order_id: '12345678-aaaa-bbbb-cccc-dddddddddddd',
        product_id: 102,
        qty: 1,
        price_cents: 5000000,
        product: {
          id: 102,
          name: 'Desk Mat Minimalist',
          image_url: null,
        },
      },
    ],
  }

  const globalStubs = {
    UiBadge: {
      template: '<span class="ui-badge" :data-variant="variant">{{ label }}</span>',
      props: ['label', 'variant'],
    },
    UiButton: {
      template:
        '<button class="ui-button" :data-variant="variant" :data-loading="loading" @click="$emit(\'click\', $event)"><slot /></button>',
      props: ['variant', 'to', 'size', 'icon', 'iconPos', 'loading'],
    },
    NuxtLink: {
      template: '<a :href="to"><slot /></a>',
      props: ['to'],
    },
  }

  it('renders order id and transaction status badge correctly ("Diproses" instead of "Lunas")', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrderWithItems },
      global: { stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('12345678')

    const badge = wrapper.find('.ui-badge')
    expect(badge.exists()).toBe(true)
    // Sesuai permintaan user: status transaksi ("Diproses"), bukan sekadar "Lunas"
    expect(badge.text()).toBe('Diproses')
    expect(badge.attributes('data-variant')).toBe('info')
  })

  it('renders product thumbnail image, name, and calculation correctly', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrderWithItems },
      global: { stubs: globalStubs },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://images.unsplash.com/photo-keyboard.jpg')
    expect(wrapper.text()).toContain('Mechanical Keyboard Pro')
    expect(wrapper.text()).toContain('2 barang x')
  })

  it('indicates extra items in the order cleanly', () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrderWithItems },
      global: { stubs: globalStubs },
    })

    // Total 2 item, 1 primary + 1 extra
    expect(wrapper.text()).toContain('1 produk lainnya dalam pesanan ini')
    expect(wrapper.text()).toContain('Total Belanja (3 barang)')
  })

  it('shows "Bayar" action button and emits pay event when clicked', async () => {
    const pendingOrder: Order = {
      ...mockOrderWithItems,
      status: 'pending',
    }

    const wrapper = mount(OrderCard, {
      props: { order: pendingOrder, isPaying: false },
      global: { stubs: globalStubs },
    })

    const badge = wrapper.find('.ui-badge')
    expect(badge.text()).toBe('Menunggu Pembayaran')
    expect(badge.attributes('data-variant')).toBe('warning')

    const buttons = wrapper.findAll('.ui-button')
    const buttonTexts = buttons.map((b) => b.text())
    expect(buttonTexts).toContain('Bayar')
    expect(buttonTexts).toContain('Detail')

    const payButton = buttons.find((b) => b.text().includes('Bayar'))
    expect(payButton).toBeDefined()
    await payButton?.trigger('click')

    expect(wrapper.emitted('pay')).toBeTruthy()
    expect(wrapper.emitted('pay')?.[0]).toEqual([pendingOrder])
  })

  it('reflects isPaying prop on Bayar button loading state', () => {
    const pendingOrder: Order = {
      ...mockOrderWithItems,
      status: 'pending',
    }

    const wrapper = mount(OrderCard, {
      props: { order: pendingOrder, isPaying: true },
      global: { stubs: globalStubs },
    })

    const payButton = wrapper.findAll('.ui-button').find((b) => b.text().includes('Bayar'))
    expect(payButton?.attributes('data-loading')).toBe('true')
  })

  it('emits select event when user clicks the card', async () => {
    const wrapper = mount(OrderCard, {
      props: { order: mockOrderWithItems },
      global: { stubs: globalStubs },
    })

    await wrapper.find('article').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual([mockOrderWithItems])
  })

  it('shows appropriate status badges across all transaction life cycle statuses', () => {
    const statuses: Array<{
      status: Order['status']
      expectedLabel: string
      expectedVariant: string
    }> = [
      { status: 'pending', expectedLabel: 'Menunggu Pembayaran', expectedVariant: 'warning' },
      { status: 'paid', expectedLabel: 'Diproses', expectedVariant: 'info' },
      { status: 'shipped', expectedLabel: 'Dikirim', expectedVariant: 'info' },
      { status: 'completed', expectedLabel: 'Selesai', expectedVariant: 'success' },
      { status: 'cancelled', expectedLabel: 'Dibatalkan', expectedVariant: 'danger' },
    ]

    for (const item of statuses) {
      const order: Order = { ...mockOrderWithItems, status: item.status }
      const wrapper = mount(OrderCard, {
        props: { order },
        global: { stubs: globalStubs },
      })
      const badge = wrapper.find('.ui-badge')
      expect(badge.text()).toBe(item.expectedLabel)
      expect(badge.attributes('data-variant')).toBe(item.expectedVariant)
    }
  })

  it('renders shipping logistics info (courier, resi, and current location) when tracking_number is present', () => {
    const shippedOrder: Order = {
      ...mockOrderWithItems,
      status: 'shipped',
      tracking_number: 'SS-JNE-9912039123',
      courier_name: 'JNE Express',
      courier_code: 'jne',
      checkpoints: [
        {
          id: 'cp-1',
          order_id: mockOrderWithItems.id,
          tracking_number: 'SS-JNE-9912039123',
          status: 'in_transit',
          title: 'Sedang Transit Menuju Surabaya',
          description: 'Paket dalam perjalanan via jalur darat.',
          location: 'Hub Transit Semarang',
          created_at: '2026-10-21T14:30:00Z',
        },
      ],
    }

    const wrapper = mount(OrderCard, {
      props: { order: shippedOrder },
      global: { stubs: globalStubs },
    })

    expect(wrapper.text()).toContain('JNE Express')
    expect(wrapper.text()).toContain('SS-JNE-9912039123')
    expect(wrapper.text()).toContain('Lokasi:')
    expect(wrapper.text()).toContain('Hub Transit Semarang')
    expect(wrapper.text()).toContain('Sedang Transit Menuju Surabaya')
    expect(wrapper.text()).toContain('Salin')
    expect(wrapper.text()).toContain('Lacak Detail')

    const buttons = wrapper.findAll('.ui-button')
    const buttonTexts = buttons.map((b) => b.text())
    expect(buttonTexts).toContain('Lacak')
    expect(buttonTexts).toContain('Detail')
  })

  it('renders "Beri Ulasan" button on completed order and emits review event when clicked', async () => {
    const completedOrder: Order = {
      ...mockOrderWithItems,
      status: 'completed',
    }

    const wrapper = mount(OrderCard, {
      props: { order: completedOrder },
      global: { stubs: globalStubs },
    })

    const buttons = wrapper.findAll('.ui-button')
    const reviewButton = buttons.find((b) => b.text().includes('Beri Ulasan'))
    expect(reviewButton).toBeDefined()
    expect(reviewButton?.exists()).toBe(true)

    await reviewButton?.trigger('click')
    expect(wrapper.emitted('review')).toBeTruthy()
    expect(wrapper.emitted('review')?.[0]).toEqual([completedOrder])
  })
})
