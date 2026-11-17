import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export async function getSupportOrder(
  client: SupabaseClient<Database>,
  customerId: string,
  orderId: string,
) {
  try {
    const { data: order, error } = await client
      .from('orders')
      .select('id, total_cents, status, created_at')
      .eq('id', orderId)
      .eq('user_id', customerId)
      .maybeSingle()

    if (error) throw error
    if (!order) return null

    return {
      id: order.id,
      order_number: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
      total_cents: order.total_cents,
      status: order.status,
    }
  } catch {
    throw new Error('Gagal memuat lampiran pesanan.')
  }
}
