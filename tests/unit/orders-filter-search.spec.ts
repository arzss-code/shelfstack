import { describe, it, expect } from 'vitest'
import type { Order } from '~/types/order'

describe('Orders Page Filtering & Search Logic', () => {
  const mockOrders: Order[] = [
    {
      id: 'ord-1111-pending',
      user_id: 'user-1',
      status: 'pending',
      total_cents: 10000000,
      created_at: '2026-10-20T10:00:00Z',
      address: {
        name: 'Ahmad Santoso',
        phone: '08123456789',
        street: 'Jl. Melati',
        city: 'Jakarta',
        postal: '10110',
      },
      items: [
        {
          id: 'item-1',
          order_id: 'ord-1111-pending',
          product_id: 1,
          qty: 1,
          price_cents: 10000000,
          product: { id: 1, name: 'Smartwatch V2', image_url: '/img1.jpg' },
        },
      ],
    },
    {
      id: 'ord-2222-paid',
      user_id: 'user-1',
      status: 'paid',
      total_cents: 25000000,
      created_at: '2026-10-21T11:00:00Z',
      address: {
        name: 'Budi Pratama',
        phone: '08123456780',
        street: 'Jl. Mawar',
        city: 'Surabaya',
        postal: '60111',
      },
      items: [
        {
          id: 'item-2',
          order_id: 'ord-2222-paid',
          product_id: 2,
          qty: 2,
          price_cents: 12500000,
          product: { id: 2, name: 'Mechanical Keyboard RGB', image_url: '/img2.jpg' },
        },
      ],
    },
    {
      id: 'ord-3333-completed',
      user_id: 'user-1',
      status: 'completed',
      total_cents: 5000000,
      created_at: '2026-10-22T12:00:00Z',
      address: {
        name: 'Citra Dewi',
        phone: '08123456781',
        street: 'Jl. Anggrek',
        city: 'Bandung',
        postal: '40111',
      },
      items: [
        {
          id: 'item-3',
          order_id: 'ord-3333-completed',
          product_id: 3,
          qty: 1,
          price_cents: 5000000,
          product: { id: 3, name: 'Minimalist Mousepad', image_url: null },
        },
      ],
    },
    {
      id: 'ord-4444-cancelled',
      user_id: 'user-1',
      status: 'cancelled',
      total_cents: 8000000,
      created_at: '2026-10-23T13:00:00Z',
      address: {
        name: 'Ahmad Santoso',
        phone: '08123456789',
        street: 'Jl. Melati',
        city: 'Jakarta',
        postal: '10110',
      },
      items: [
        {
          id: 'item-4',
          order_id: 'ord-4444-cancelled',
          product_id: 4,
          qty: 1,
          price_cents: 8000000,
          product: { id: 4, name: 'Wireless Earbuds', image_url: '/img4.jpg' },
        },
      ],
    },
  ]

  const filterOrders = (orders: Order[], activeTab: string, query: string) => {
    let result = orders

    if (activeTab !== 'all') {
      result = result.filter((o) => o.status === activeTab)
    }

    const cleanQuery = query.trim().toLowerCase()
    if (cleanQuery) {
      result = result.filter((o) => {
        const matchId = o.id.toLowerCase().includes(cleanQuery)
        const matchAddress =
          o.address?.name?.toLowerCase().includes(cleanQuery) ||
          o.address?.city?.toLowerCase().includes(cleanQuery)
        const matchItems = o.items?.some((item) =>
          item.product?.name?.toLowerCase().includes(cleanQuery),
        )
        return matchId || matchAddress || matchItems
      })
    }

    return result
  }

  it('filters orders by status tab correctly', () => {
    expect(filterOrders(mockOrders, 'all', '')).toHaveLength(4)
    expect(filterOrders(mockOrders, 'pending', '')).toHaveLength(1)
    expect(filterOrders(mockOrders, 'pending', '')[0]?.id).toBe('ord-1111-pending')
    expect(filterOrders(mockOrders, 'paid', '')).toHaveLength(1)
    expect(filterOrders(mockOrders, 'paid', '')[0]?.id).toBe('ord-2222-paid')
    expect(filterOrders(mockOrders, 'completed', '')).toHaveLength(1)
    expect(filterOrders(mockOrders, 'cancelled', '')).toHaveLength(1)
    expect(filterOrders(mockOrders, 'shipped', '')).toHaveLength(0)
  })

  it('searches orders by order id keyword', () => {
    const results = filterOrders(mockOrders, 'all', '2222')
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe('ord-2222-paid')
  })

  it('searches orders by product name inside order items', () => {
    const results = filterOrders(mockOrders, 'all', 'Keyboard')
    expect(results).toHaveLength(1)
    expect(results[0]?.id).toBe('ord-2222-paid')

    const resultsEarbuds = filterOrders(mockOrders, 'all', 'earbuds')
    expect(resultsEarbuds).toHaveLength(1)
    expect(resultsEarbuds[0]?.id).toBe('ord-4444-cancelled')
  })

  it('searches orders by recipient name and city', () => {
    const resultsName = filterOrders(mockOrders, 'all', 'Ahmad')
    expect(resultsName).toHaveLength(2)

    const resultsCity = filterOrders(mockOrders, 'all', 'Bandung')
    expect(resultsCity).toHaveLength(1)
    expect(resultsCity[0]?.id).toBe('ord-3333-completed')
  })

  it('combines status tab and search query accurately', () => {
    // Both 'Ahmad' orders: one pending, one cancelled
    const pendingAhmad = filterOrders(mockOrders, 'pending', 'Ahmad')
    expect(pendingAhmad).toHaveLength(1)
    expect(pendingAhmad[0]?.id).toBe('ord-1111-pending')

    const cancelledAhmad = filterOrders(mockOrders, 'cancelled', 'Ahmad')
    expect(cancelledAhmad).toHaveLength(1)
    expect(cancelledAhmad[0]?.id).toBe('ord-4444-cancelled')

    const paidAhmad = filterOrders(mockOrders, 'paid', 'Ahmad')
    expect(paidAhmad).toHaveLength(0)
  })

  it('calculates tab counts accurately across statuses', () => {
    const countPending = mockOrders.filter((o) => o.status === 'pending').length
    const countPaid = mockOrders.filter((o) => o.status === 'paid').length
    const countCompleted = mockOrders.filter((o) => o.status === 'completed').length
    const countCancelled = mockOrders.filter((o) => o.status === 'cancelled').length

    expect(countPending).toBe(1)
    expect(countPaid).toBe(1)
    expect(countCompleted).toBe(1)
    expect(countCancelled).toBe(1)
    expect(mockOrders.length).toBe(4)
  })
})
