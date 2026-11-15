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
