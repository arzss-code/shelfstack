import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminOrderTable, {
  type AdminOrderRow,
} from '~/features/orders/components/AdminOrderTable.vue'

describe('AdminOrderTable Component', () => {
  const mockOrders: AdminOrderRow[] = [
    {
      id: 'order-12345678-abcd',
      user_id: 'user-001',
      status: 'pending',
      total_cents: 15000000,
      created_at: '2026-10-08T08:00:00Z',
      address: {
        name: 'Budi Santoso',
        city: 'Jakarta Selatan',
      },
      order_items: [{ id: 'item-1', qty: 2, price_cents: 7500000 }],
    },
    {
      id: 'order-87654321-efgh',
      user_id: 'user-002',
      status: 'completed',
      total_cents: 30000000,
      created_at: '2026-10-07T12:00:00Z',
      address: {
        name: 'Siti Rahma',
        city: 'Bandung',
      },
      order_items: [{ id: 'item-2', qty: 1, price_cents: 30000000 }],
    },
  ]

  const globalStubs = {
    UiBadge: {
      template: '<span class="ui-badge-stub" :data-variant="variant">{{ label }}</span>',
      props: ['label', 'variant'],
    },
    NuxtLink: {
      template: '<a :href="to"><slot /></a>',
      props: ['to'],
    },
  }

  it('renders order list rows accurately', () => {
    const wrapper = mount(AdminOrderTable, {
      props: {
        orders: mockOrders,
        loading: false,
        page: 1,
        pageSize: 15,
        totalOrders: 2,
        totalPages: 1,
      },
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('#order-12')
    expect(wrapper.text()).toContain('Budi Santoso')
    expect(wrapper.text()).toContain('Jakarta Selatan')
    expect(wrapper.text()).toContain('#order-87')
    expect(wrapper.text()).toContain('Siti Rahma')
    expect(wrapper.text()).toContain('Bandung')
  })

  it('formats Rupiah price correctly', () => {
    const wrapper = mount(AdminOrderTable, {
      props: {
        orders: mockOrders,
        loading: false,
        page: 1,
        pageSize: 15,
        totalOrders: 2,
        totalPages: 1,
      },
      global: {
        stubs: globalStubs,
      },
    })

    // 15000000 cents = Rp 150.000
    expect(wrapper.text()).toContain('150.000')
    // 30000000 cents = Rp 300.000
    expect(wrapper.text()).toContain('300.000')
  })

  it('renders empty state when orders list is empty', () => {
    const wrapper = mount(AdminOrderTable, {
      props: {
        orders: [],
        loading: false,
        page: 1,
        pageSize: 15,
        totalOrders: 0,
        totalPages: 1,
      },
      global: {
        stubs: globalStubs,
      },
    })

    expect(wrapper.text()).toContain('Tidak ada pesanan ditemukan')
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('emits prevPage and nextPage events when buttons clicked', async () => {
    const wrapper = mount(AdminOrderTable, {
      props: {
        orders: mockOrders,
        loading: false,
        page: 2,
        pageSize: 2,
        totalOrders: 6,
        totalPages: 3,
      },
      global: {
        stubs: globalStubs,
      },
    })

    const buttons = wrapper.findAll('button')
    const prevBtn = buttons.find((b) => b.text().includes('Sebelumnya'))
    const nextBtn = buttons.find((b) => b.text().includes('Berikutnya'))

    expect(prevBtn).toBeDefined()
    expect(nextBtn).toBeDefined()

    await prevBtn?.trigger('click')
    expect(wrapper.emitted('prevPage')).toBeTruthy()

    await nextBtn?.trigger('click')
    expect(wrapper.emitted('nextPage')).toBeTruthy()
  })
})
