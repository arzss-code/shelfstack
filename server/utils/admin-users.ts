import type { AdminCustomerSummary, AdminCrmMetrics } from '~~/shared/types/admin-crm'

export interface RawProfile {
  id: string
  user_id?: string
  full_name?: string | null
  email?: string | null
  role?: string | null
  avatar_url?: string | null
  created_at?: string | null
}

export interface RawOrderSummary {
  id: string
  user_id: string
  status: string
  total_cents: number
  created_at?: string | null
}

export function formatRupiahCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calculateCustomerAggregations(
  profiles: RawProfile[],
  orders: RawOrderSummary[],
): AdminCustomerSummary[] {
  // Map orders grouped by user_id
  const ordersByUser = new Map<string, RawOrderSummary[]>()

  for (const o of orders) {
    if (!o.user_id) continue
    const existing = ordersByUser.get(o.user_id) || []
    existing.push(o)
    ordersByUser.set(o.user_id, existing)
  }

  return profiles.map((p) => {
    const uid = p.user_id || p.id
    const userOrders = ordersByUser.get(uid) || ordersByUser.get(p.id) || []
    const totalOrders = userOrders.length

    // Hanya pesanan paid, shipped, atau completed yang dihitung ke LTV
    const completedOrdersList = userOrders.filter((o) =>
      ['paid', 'shipped', 'completed'].includes(o.status),
    )
    const completedOrders = completedOrdersList.length

    const totalSpentCents = completedOrdersList.reduce((sum, o) => sum + (o.total_cents || 0), 0)

    // Cari tanggal pesanan terakhir
    let lastOrderAt: string | null = null
    if (userOrders.length > 0) {
      const sorted = [...userOrders].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      )
      lastOrderAt = sorted[0]?.created_at || null
    }

    const fullName = p.full_name?.trim() || p.email?.split('@')[0] || 'Pelanggan'
    const email = p.email?.trim() || '-'

    return {
      userId: uid,
      fullName,
      email,
      role: p.role || 'customer',
      avatarUrl: p.avatar_url || null,
      createdAt: p.created_at || new Date().toISOString(),
      totalOrders,
      completedOrders,
      totalSpentCents,
      formattedLtv: formatRupiahCurrency(totalSpentCents / 100),
      lastOrderAt,
    }
  })
}

export function filterAndSortCustomers(
  customers: AdminCustomerSummary[],
  options: {
    search?: string
    sort?: 'ltv_desc' | 'orders_desc' | 'latest' | 'name_asc'
  },
): AdminCustomerSummary[] {
  let list = [...customers]

  if (options.search && options.search.trim()) {
    const q = options.search.trim().toLowerCase()
    list = list.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q),
    )
  }

  const sortKey = options.sort || 'ltv_desc'
  list.sort((a, b) => {
    if (sortKey === 'ltv_desc') {
      return b.totalSpentCents - a.totalSpentCents
    }
    if (sortKey === 'orders_desc') {
      return b.totalOrders - a.totalOrders
    }
    if (sortKey === 'name_asc') {
      return a.fullName.localeCompare(b.fullName)
    }
    // latest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return list
}

export function calculateCrmMetrics(customers: AdminCustomerSummary[]): AdminCrmMetrics {
  const totalCustomers = customers.length
  const totalRevenueCents = customers.reduce((sum, c) => sum + c.totalSpentCents, 0)
  const averageLtvCents = totalCustomers > 0 ? Math.round(totalRevenueCents / totalCustomers) : 0
  const activeOrderingCustomers = customers.filter((c) => c.totalOrders > 0).length

  return {
    totalCustomers,
    totalRevenueCents,
    formattedTotalRevenue: formatRupiahCurrency(totalRevenueCents / 100),
    averageLtvCents,
    formattedAverageLtv: formatRupiahCurrency(averageLtvCents / 100),
    activeOrderingCustomers,
  }
}
