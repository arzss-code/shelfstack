import type { EmailOrderData, EmailOrderItem } from '../../shared/utils/email-templates'
import type { RawDbOrder } from './email-types'

/**
 * Maps database order query results to the EmailOrderData contract.
 */
export function mapDbOrderToEmailData(order: RawDbOrder, customerEmail?: string): EmailOrderData {
  const address = order.address || {}
  const rawItems = order.items || []

  const items: EmailOrderItem[] = rawItems.map((item) => ({
    name: item.product?.name || 'Produk ShelfStack',
    quantity: item.qty || 1,
    price: (item.price_cents || 0) / 100,
    variantName: item.variant?.name || null,
    imageUrl: item.product?.image_url || null,
  }))

  const recipientEmail =
    customerEmail ||
    (typeof address.email === 'string' ? address.email : null) ||
    'pelanggan@example.com'

  const recipientName =
    (typeof address.name === 'string' ? address.name : null) || 'Pelanggan Setia'

  return {
    id: order.id,
    created_at: order.created_at || null,
    customer_name: recipientName,
    customer_email: recipientEmail,
    customer_phone: typeof address.phone === 'string' ? address.phone : '-',
    street: typeof address.street === 'string' ? address.street : '',
    city: typeof address.city === 'string' ? address.city : '',
    postal: typeof address.postal === 'string' ? address.postal : '',
    notes: typeof address.note === 'string' ? address.note : null,
    shipping_service: order.shipping_service || 'Reguler',
    courier_code: order.courier_code || 'jne',
    tracking_number: order.tracking_number || null,
    items,
    subtotal_cents: order.subtotal_cents ?? order.total_cents,
    coupon_code: order.coupon_code || null,
    coupon_discount_cents: order.discount_cents || 0,
    coins_used: order.coins_used || 0,
    coins_discount_cents: (order.coins_used || 0) * 100,
    shipping_fee_cents: order.shipping_cost_cents || 0,
    total_cents: order.total_cents,
  }
}
