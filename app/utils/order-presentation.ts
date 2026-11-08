import type { Order, OrderStatus } from '~/types/order'

/**
 * Order Presentation Deep Module
 * Formatting, labels, status badge styling, and timeline step calculations for orders.
 */

export function formatOrderStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Menunggu Pembayaran'
    case 'paid':
      return 'Dibayar'
    case 'shipped':
      return 'Dikirim'
    case 'completed':
      return 'Selesai'
    case 'cancelled':
      return 'Dibatalkan'
    case 'refunded':
      return 'Dikembalikan'
    default:
      return status
  }
}

export function formatShippingServiceLabel(service?: string | null): string {
  switch (service) {
    case 'instan':
      return 'Pengiriman Instan'
    case 'same_day':
      return 'Same Day'
    case 'next_day':
      return 'Next Day'
    case 'cargo':
      return 'Kargo'
    case 'reguler':
    default:
      return 'Reguler'
  }
}

export function formatPaymentTypeLabel(type?: string | null): string {
  if (!type) return 'Midtrans Snap'
  const lower = type.toLowerCase()
  if (lower.includes('gopay')) return 'GoPay / QRIS'
  if (lower.includes('qris')) return 'QRIS'
  if (lower.includes('bca')) return 'BCA Virtual Account'
  if (lower.includes('bni')) return 'BNI Virtual Account'
  if (lower.includes('bri')) return 'BRI Virtual Account'
  if (lower.includes('mandiri')) return 'Mandiri Bill'
  if (lower.includes('permata')) return 'Permata VA'
  if (lower.includes('bank_transfer') || lower.includes('echannel')) return 'Virtual Account'
  if (lower.includes('credit_card') || lower.includes('cstore')) return 'Kartu Kredit / Debit'
  return type
}

export interface OrderTimelineStep {
  key: string
  label: string
  description: string
  isDone: boolean
  isCurrent: boolean
}

export function buildOrderTimelineSteps(status: string): OrderTimelineStep[] {
  const steps: OrderTimelineStep[] = [
    {
      key: 'created',
      label: 'Pesanan Dibuat',
      description: 'Menunggu konfirmasi pembayaran',
      isDone: status !== 'pending' && status !== 'cancelled',
      isCurrent: status === 'pending',
    },
    {
      key: 'paid',
      label: 'Pembayaran Diterima',
      description: 'Pesanan sedang dikemas oleh tim gudang',
      isDone: ['shipped', 'completed'].includes(status),
      isCurrent: status === 'paid',
    },
    {
      key: 'shipped',
      label: 'Dalam Pengiriman',
      description: 'Pesanan sedang diantar oleh kurir',
      isDone: status === 'completed',
      isCurrent: status === 'shipped',
    },
    {
      key: 'completed',
      label: 'Pesanan Selesai',
      description: 'Pesanan telah diterima oleh pembeli',
      isDone: status === 'completed',
      isCurrent: status === 'completed',
    },
  ]

  return steps
}

export function resolveLatestCheckpointLocation(
  checkpoints: Array<{ location?: string; title?: string; created_at: string }>,
  orderStatus?: string,
  city?: string,
): string {
  if (checkpoints.length > 0) {
    const latest = [...checkpoints].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]
    if (latest?.location) return latest.location
  }

  if (orderStatus === 'completed') {
    return city ? `Diterima di ${city}` : 'Telah Diterima'
  }
  if (orderStatus === 'shipped') {
    return city ? `Menuju ${city}` : 'Dalam Pengiriman'
  }
  return 'Gudang Pengiriman ShelfStack'
}

export function formatOrderDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateStr
  }
}

export function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return { variant: 'success' as const, label: 'Lunas' }
    case 'shipped':
      return { variant: 'info' as const, label: 'Dikirim' }
    case 'completed':
      return { variant: 'success' as const, label: 'Selesai' }
    case 'cancelled':
      return { variant: 'danger' as const, label: 'Dibatalkan' }
    case 'refunded':
      return { variant: 'default' as const, label: 'Dikembalikan' }
    case 'pending':
    default:
      return { variant: 'warning' as const, label: 'Menunggu Pembayaran' }
  }
}

export function getPaymentStatusBadge(orderData: { status: string; paid_at?: string | null }) {
  if (orderData.status === 'refunded') {
    return { variant: 'default' as const, label: 'Dikembalikan' }
  }
  if (orderData.status === 'cancelled') {
    return { variant: 'default' as const, label: 'Belum Dibayar' }
  }
  if (orderData.paid_at || ['paid', 'shipped', 'completed'].includes(orderData.status)) {
    return { variant: 'success' as const, label: 'Lunas' }
  }
  return { variant: 'warning' as const, label: 'Menunggu Pembayaran' }
}

export function getTimelineSegmentColor(idx: number, status?: string): string {
  if (!status || status === 'cancelled') return 'bg-brand-hairsoft'
  if (idx === 0) return 'bg-emerald-600'
  if (idx === 1)
    return ['paid', 'shipped', 'completed'].includes(status)
      ? 'bg-emerald-600'
      : 'bg-brand-hairsoft'
  if (idx === 2)
    return ['shipped', 'completed'].includes(status) ? 'bg-emerald-600' : 'bg-brand-hairsoft'
  return 'bg-brand-hairsoft'
}

export interface OrderStatusCounts {
  all: number
  pending: number
  paid: number
  shipped: number
  completed: number
  cancelled: number
  [key: string]: number
}

export function createOrderTabItems(counts: OrderStatusCounts) {
  const countPending = counts.pending || 0
  return [
    { value: 'all', label: 'Semua', count: counts.all || 0 },
    {
      value: 'pending',
      label: 'Belum Bayar',
      count: countPending,
      countTone: countPending > 0 ? ('danger' as const) : ('neutral' as const),
    },
    { value: 'paid', label: 'Diproses', count: counts.paid || 0 },
    { value: 'shipped', label: 'Dikirim', count: counts.shipped || 0 },
    { value: 'completed', label: 'Selesai', count: counts.completed || 0 },
    { value: 'cancelled', label: 'Dibatalkan', count: counts.cancelled || 0 },
  ]
}

export function filterOrdersByQuery(orders: Order[], rawQuery: string): Order[] {
  const query = rawQuery.trim().toLowerCase()
  if (!query) return orders
  return orders.filter((o) => {
    const matchId = o.id.toLowerCase().includes(query)
    const matchAddress =
      o.address?.name?.toLowerCase().includes(query) ||
      o.address?.city?.toLowerCase().includes(query)
    const matchItems = o.items?.some((item) => item.product?.name?.toLowerCase().includes(query))
    return matchId || matchAddress || matchItems
  })
}

export async function queryOrdersApi(from: number, to: number, statusTab?: string, batchSize = 5) {
  const params: Record<string, string | number> = { from, to }
  if (statusTab && statusTab !== 'all') params.status = statusTab
  const res = await $fetch<{
    status: string
    data: { orders: Order[]; counts: OrderStatusCounts; has_more: boolean } | Order[]
  }>('/api/orders', { params })
  const list = Array.isArray(res.data) ? res.data : res.data?.orders || []
  const counts = !Array.isArray(res.data) ? res.data?.counts : undefined
  const hasMore =
    !Array.isArray(res.data) && res.data?.has_more !== undefined
      ? res.data.has_more
      : list.length >= batchSize
  return { list, counts, hasMore }
}

export async function syncOrderPaymentStatus(orderId: string): Promise<{
  status: OrderStatus
  is_paid: boolean
  payment_type?: string
} | null> {
  try {
    const res = await $fetch<{
      status: string
      data: { status: OrderStatus; is_paid: boolean; payment_type?: string }
    }>(`/api/orders/${orderId}/check-payment-status`, { method: 'POST' })
    return res.data || null
  } catch {
    return null
  }
}

export interface OrderStep {
  title: string
  description: string
  timestamp?: string
  isCompleted: boolean
  isActive: boolean
}

export function computeOrderDetailSteps(order: Order): OrderStep[] {
  const status = order.status
  const isPaid = ['paid', 'shipped', 'completed'].includes(status)
  const isShipped = ['shipped', 'completed'].includes(status)
  const isCompleted = status === 'completed'
  const isPending = status === 'pending'

  return [
    {
      title: 'Dipesan',
      description: 'Pesanan resmi dibuat',
      timestamp: formatOrderDate(order.created_at),
      isCompleted: true,
      isActive: false,
    },
    {
      title: 'Dibayar',
      description: isPaid ? 'Pembayaran terverifikasi' : 'Menunggu pembayaran',
      timestamp: order.paid_at ? formatOrderDate(order.paid_at) : undefined,
      isCompleted: isPaid,
      isActive: isPending,
    },
    {
      title: 'Dikirim',
      description: isShipped
        ? 'Pesanan dalam pengiriman'
        : isPaid
          ? 'Sedang disiapkan seller'
          : 'Menunggu diproses',
      isCompleted: isShipped,
      isActive: isPaid && !isShipped,
    },
    {
      title: 'Selesai',
      description: isCompleted ? 'Pesanan telah diterima' : 'Konfirmasi penerimaan',
      isCompleted: isCompleted,
      isActive: isShipped && !isCompleted,
    },
  ]
}
