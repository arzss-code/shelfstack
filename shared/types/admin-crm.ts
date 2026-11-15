export interface AdminCustomerSummary {
  userId: string
  fullName: string
  email: string
  role: string
  avatarUrl: string | null
  createdAt: string
  totalOrders: number
  completedOrders: number
  totalSpentCents: number
  formattedLtv: string
  lastOrderAt: string | null
}

export interface AdminCrmMetrics {
  totalCustomers: number
  totalRevenueCents: number
  formattedTotalRevenue: string
  averageLtvCents: number
  formattedAverageLtv: string
  activeOrderingCustomers: number
}

export interface AdminCustomersResponse {
  customers: AdminCustomerSummary[]
  metrics: AdminCrmMetrics
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Customer360RecentOrder {
  id: string
  status: string
  totalCents: number
  formattedTotal: string
  createdAt: string
  itemCount: number
}

export interface Customer360Detail {
  userId: string
  fullName: string
  email: string | null
  avatarUrl: string | null
  role: string
  joinedAt: string
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  cancelledOrders: number
  totalSpentCents: number
  formattedLtv: string
  averageOrderValueCents: number
  formattedAov: string
  loyaltyCoinBalance: number
  recentOrders: Customer360RecentOrder[]
  supportTicketsCount: number
}
