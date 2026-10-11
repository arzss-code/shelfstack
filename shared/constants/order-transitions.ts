export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded'

/**
 * Matriks Transisi Status Resmi untuk Domain Lifecycle
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'refunded'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
  refunded: [],
}

/**
 * Matriks Transisi Status Khusus Aksi Manual Administrator
 * - Admin dilarang menandai pending -> paid secara manual tanpa verifikasi gateway
 */
export const ALLOWED_ADMIN_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['cancelled'],
  paid: ['shipped', 'refunded'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
  refunded: [],
}

export function isAllowedTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_ORDER_TRANSITIONS[from] || []
  return allowed.includes(to)
}

export function isAllowedAdminTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_ADMIN_ORDER_TRANSITIONS[from] || []
  return allowed.includes(to)
}

export function getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return ALLOWED_ORDER_TRANSITIONS[currentStatus] || []
}

export function getAvailableAdminTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return ALLOWED_ADMIN_ORDER_TRANSITIONS[currentStatus] || []
}
