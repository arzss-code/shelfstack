import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OrderDetailPaymentCard from '~/features/orders/components/OrderDetailPaymentCard.vue'
import type { Order } from '~/types/order'

describe('OrderDetailPaymentCard Component', () => {
  const baseOrder: Order = {
    id: 'f87a8f90-1234-4567-89ab-cdef01234567',
    user_id: 'user-001',
    status: 'pending',
    total_cents: 35500000,
    subtotal_cents: 34000000,
    shipping_cost_cents: 1500000,
    shipping_service: 'reguler',
    payment_type: 'midtrans',
    created_at: '2026-11-06T10:00:00Z',
    items: [],
  }

  const globalStubs = {
    UiBadge: {
      props: ['variant', 'label'],
      template: '<span class="ui-badge" :data-variant="variant">{{ label }}</span>',
    },
    UiButton: {
      props: ['variant', 'size', 'icon', 'loading', 'disabled', 'to'],
      template:
        '<button class="ui-button" :data-variant="variant" :disabled="disabled"><slot /></button>',
    },
  }

  const defaultProps = {
    order: baseOrder,
    isPaying: false,
    isCancelling: false,
    isManualChecking: false,
    getPaymentStatusBadge: () => ({ variant: 'warning' as const, label: 'Menunggu Pembayaran' }),
    formatShippingServiceName: (svc?: string | null) => (svc === 'reguler' ? 'Reguler' : 'Ekspres'),
    returnEligibility: null,
    returnTicket: null,
  }

  it('merender elemen root aside dengan kelas tata letak lg:col-span-4 dan w-full', () => {
    const wrapper = mount(OrderDetailPaymentCard, {
      props: defaultProps,
      global: { stubs: globalStubs },
    })

    const aside = wrapper.find('aside')
    expect(aside.exists()).toBe(true)
    expect(aside.classes()).toContain('lg:col-span-4')
    expect(aside.classes()).toContain('w-full')
    expect(aside.classes()).toContain('sticky')
  })

  it('merender rincian harga subtotal, biaya pengiriman, dan total tagihan secara akurat', () => {
    const wrapper = mount(OrderDetailPaymentCard, {
      props: defaultProps,
      global: { stubs: globalStubs },
    })

    const text = wrapper.text().replace(/\u00a0/g, ' ')
    expect(text).toContain('Ringkasan Pembayaran')
    expect(text).toContain('Subtotal Produk')
    expect(text).toContain('Biaya Pengiriman')
    expect(text).toContain('Total Tagihan')
    expect(text).toContain('Rp 355.000')
  })

  it('merender tombol aksi status pending dan memancarkan event dengan tepat saat diklik', async () => {
    const wrapper = mount(OrderDetailPaymentCard, {
      props: defaultProps,
      global: { stubs: globalStubs },
    })

    const buttons = wrapper.findAll('button')
    const payBtn = buttons.find((b) => b.text().includes('Bayar Sekarang'))
    const checkBtn = buttons.find((b) => b.text().includes('Cek Status Pembayaran'))
    const cancelBtn = buttons.find((b) => b.text().includes('Batalkan Pesanan'))

    expect(payBtn?.exists()).toBe(true)
    expect(checkBtn?.exists()).toBe(true)
    expect(cancelBtn?.exists()).toBe(true)

    await payBtn?.trigger('click')
    expect(wrapper.emitted('pay')).toHaveLength(1)

    await checkBtn?.trigger('click')
    expect(wrapper.emitted('checkStatus')).toHaveLength(1)

    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('openCancelModal')).toHaveLength(1)
  })

  it('merender tombol retur saat order completed dan eligible', async () => {
    const wrapper = mount(OrderDetailPaymentCard, {
      props: {
        ...defaultProps,
        order: { ...baseOrder, status: 'completed' },
        returnEligibility: { isEligible: true, remainingDays: 7 },
      },
      global: { stubs: globalStubs },
    })

    const returnBtn = wrapper.findAll('button').find((b) => b.text().includes('Ajukan Komplain'))
    expect(returnBtn?.exists()).toBe(true)

    await returnBtn?.trigger('click')
    expect(wrapper.emitted('openReturnModal')).toHaveLength(1)
  })

  it('merender tombol Beli Lagi saat order cancelled', async () => {
    const wrapper = mount(OrderDetailPaymentCard, {
      props: {
        ...defaultProps,
        order: { ...baseOrder, status: 'cancelled' },
      },
      global: { stubs: globalStubs },
    })

    const reorderBtn = wrapper.findAll('button').find((b) => b.text().includes('Beli Lagi'))
    expect(reorderBtn?.exists()).toBe(true)

    await reorderBtn?.trigger('click')
    expect(wrapper.emitted('reorder')).toHaveLength(1)
  })

  it('merender baris diskon voucher dan potongan koin saat order memiliki diskon tersebut', () => {
    const discountedOrder: Order = {
      ...baseOrder,
      subtotal_cents: 10000000,
      discount_cents: 2000000,
      coupon_code: 'HEMAT20',
      coins_used: 5000,
      coins_discount_cents: 500000,
      shipping_cost_cents: 1000000,
      total_cents: 8500000,
    }

    const wrapper = mount(OrderDetailPaymentCard, {
      props: {
        ...defaultProps,
        order: discountedOrder,
      },
      global: { stubs: globalStubs },
    })

    const text = wrapper.text().replace(/\u00a0/g, ' ')
    expect(text).toContain('Diskon Voucher (HEMAT20)')
    expect(text).toContain('-Rp 20.000')
    expect(text).toContain('Potongan Koin')
    expect(text).toContain('5.000 Koin')
    expect(text).toContain('-Rp 5.000')
  })
})
