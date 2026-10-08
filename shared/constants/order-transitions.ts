export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
}

export function isAllowedTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_ORDER_TRANSITIONS[from] || []
  return allowed.includes(to)
}

export function getAvailableTransitions(currentStatus: OrderStatus): OrderStatus[] {
  return ALLOWED_ORDER_TRANSITIONS[currentStatus] || []
}
