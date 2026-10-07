import { describe, it, expect } from 'vitest'

interface OrderRecord {
  id: string
  user_id: string
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  total_cents: number
  created_at: string
}

interface ProductRecord {
  id: number
  name: string
  stock: number
  deleted_at: string | null
}

interface ProfileRecord {
  id: string
  role: 'admin' | 'customer'
}

export function computeAdminStats(
  orders: OrderRecord[],
  products: ProductRecord[],
  profiles: ProfileRecord[],
  currentDate = new Date(),
) {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

  const paidStatuses = new Set(['paid', 'shipped', 'completed'])

  const monthlyRevenueCents = orders
    .filter((o) => paidStatuses.has(o.status) && new Date(o.created_at) >= startOfMonth)
    .reduce((sum, o) => sum + o.total_cents, 0)

  const totalRevenueCents = orders
    .filter((o) => paidStatuses.has(o.status))
    .reduce((sum, o) => sum + o.total_cents, 0)

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length

  const lowStockProductsCount = products.filter((p) => p.deleted_at === null && p.stock < 5).length

  const totalCustomersCount = profiles.filter((p) => p.role === 'customer').length

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  return {
    revenue: {
      monthly_cents: monthlyRevenueCents,
      total_cents: totalRevenueCents,
    },
    counts: {
      pending_orders: pendingOrdersCount,
      low_stock_products: lowStockProductsCount,
      total_customers: totalCustomersCount,
      total_orders: orders.length,
    },
    recent_orders: recentOrders,
  }
}

describe('Admin Stats KPI Aggregation (D-01)', () => {
  const mockOrders: OrderRecord[] = [
    {
      id: 'ord-1',
      user_id: 'u-1',
      status: 'completed',
      total_cents: 5000000,
      created_at: '2026-10-02T10:00:00Z',
    },
    {
      id: 'ord-2',
      user_id: 'u-2',
      status: 'paid',
      total_cents: 2500000,
      created_at: '2026-10-05T12:00:00Z',
    },
    {
      id: 'ord-3',
      user_id: 'u-3',
      status: 'pending',
      total_cents: 1000000,
      created_at: '2026-10-06T08:00:00Z',
    },
    {
      id: 'ord-4',
      user_id: 'u-4',
      status: 'cancelled',
      total_cents: 3000000,
      created_at: '2026-10-01T09:00:00Z',
    },
    {
      id: 'ord-old',
      user_id: 'u-1',
      status: 'completed',
      total_cents: 4000000,
      created_at: '2026-08-15T10:00:00Z',
    },
  ]

  const mockProducts: ProductRecord[] = [
    { id: 1, name: 'Product A', stock: 2, deleted_at: null },
    { id: 2, name: 'Product B', stock: 0, deleted_at: null },
    { id: 3, name: 'Product C', stock: 15, deleted_at: null },
    { id: 4, name: 'Product D', stock: 1, deleted_at: '2026-10-01T00:00:00Z' }, // Soft deleted
  ]

  const mockProfiles: ProfileRecord[] = [
    { id: 'p-1', role: 'admin' },
    { id: 'p-2', role: 'customer' },
    { id: 'p-3', role: 'customer' },
  ]

  const testDate = new Date('2026-10-07T12:00:00Z')

  it('calculates monthly revenue excluding pending, cancelled, and past months', () => {
    const stats = computeAdminStats(mockOrders, mockProducts, mockProfiles, testDate)

    // Only ord-1 (5,000,000) and ord-2 (2,500,000) count for October
    expect(stats.revenue.monthly_cents).toBe(7500000)

    // Total revenue includes ord-old (4,000,000) as well
    expect(stats.revenue.total_cents).toBe(11500000)
  })

  it('counts pending orders accurately', () => {
    const stats = computeAdminStats(mockOrders, mockProducts, mockProfiles, testDate)
    expect(stats.counts.pending_orders).toBe(1)
  })

  it('counts low stock products (<5) excluding soft-deleted ones', () => {
    const stats = computeAdminStats(mockOrders, mockProducts, mockProfiles, testDate)
    // Product A (stock 2) + Product B (stock 0) = 2. Product D is deleted.
    expect(stats.counts.low_stock_products).toBe(2)
  })

  it('counts customers excluding admins', () => {
    const stats = computeAdminStats(mockOrders, mockProducts, mockProfiles, testDate)
    expect(stats.counts.total_customers).toBe(2)
  })

  it('returns recent orders sorted descending and capped at 8', () => {
    const stats = computeAdminStats(mockOrders, mockProducts, mockProfiles, testDate)
    expect(stats.recent_orders.length).toBeLessThanOrEqual(8)
    expect(stats.recent_orders[0].id).toBe('ord-3') // 2026-10-06 is most recent
  })
})
