import type { Order } from '~/types/order'
import type { EmailOrderData, EmailOrderItem } from '~~/shared/utils/email-templates'

/**
 * Adapter mapper untuk menyelaraskan data Order dari sistem ke kontrak EmailOrderData
 * dengan data fallback tiruan untuk keperluan simulasi pratinjau di panel back-office.
 */
export const buildEmailOrderData = (order?: Order | null): EmailOrderData => {
  if (!order) {
    return {
      id: 'ord-sample-9921',
      customer_name: 'Budi Santoso',
      customer_email: 'budi.santoso@example.com',
      customer_phone: '081234567890',
      street: 'Jl. Sudirman No. 45 Blok B',
      city: 'Jakarta Selatan',
      postal: '12190',
      notes: 'Tolong bubble wrap tebal',
      shipping_service: 'Reguler',
      courier_code: 'jne',
      tracking_number: 'SS-JNE-88291024',
      items: [
        {
          name: 'Headphone Studio ANC',
          variantName: 'Matte Obsidian',
          quantity: 1,
          price: 2680000,
        },
        {
          name: 'Desk Pad Kulit Minimalis',
          variantName: 'Deep Walnut',
          quantity: 1,
          price: 350000,
        },
      ],
      subtotal_cents: 303000000,
      coupon_code: 'SHELFSTACK10',
      coupon_discount_cents: 5000000,
      coins_used: 100,
      coins_discount_cents: 1000000,
      shipping_fee_cents: 0,
      total_cents: 297000000,
    }
  }

  const items: EmailOrderItem[] = (order.items || []).map((i) => ({
    name: i.product?.name || 'Produk ShelfStack',
    variantName: i.variant?.name || null,
    quantity: i.qty,
    price: (i.price_cents || 0) / 100,
  }))

  return {
    id: order.id,
    customer_name: order.address?.name || 'Pelanggan',
    customer_email: 'pelanggan@example.com',
    customer_phone: order.address?.phone || '-',
    street: order.address?.street || '',
    city: order.address?.city || '',
    postal: order.address?.postal || '',
    notes: order.address?.note || null,
    shipping_service: order.shipping_service || 'Reguler',
    courier_code: order.courier_code || 'jne',
    tracking_number: order.tracking_number || 'SS-LOG-99281',
    items,
    subtotal_cents: order.subtotal_cents,
    coupon_code: order.coupon_code || null,
    coupon_discount_cents: order.discount_cents || 0,
    coins_used: order.coins_used || 0,
    coins_discount_cents: order.coins_discount_cents || 0,
    shipping_fee_cents: order.shipping_cost_cents || 0,
    total_cents: order.total_cents,
  }
}
