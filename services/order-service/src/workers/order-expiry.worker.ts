import { CacheService } from '../cache/redis.client.js'
import { getSupabaseClient } from '../services/supabase.service.js'

export interface ExpirySweepResult {
  checkedAt: string
  cutoffTime: string
  scannedCount: number
  cancelledCount: number
  cancelledOrders: string[]
  errors: Array<{ orderId: string; error: string }>
}

/**
 * Worker responsible for auto-cancelling expired pending orders and restoring inventory
 */
export const OrderExpiryWorker = {
  /**
   * Sweeps pending orders older than expiryMinutes and triggers atomic cancellation & restock
   */
  async sweepExpiredOrders(expiryMinutes = 30): Promise<ExpirySweepResult> {
    const client = getSupabaseClient()
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - expiryMinutes * 60 * 1000)
    const cutoffIso = cutoffDate.toISOString()

    const result: ExpirySweepResult = {
      checkedAt: now.toISOString(),
      cutoffTime: cutoffIso,
      scannedCount: 0,
      cancelledCount: 0,
      cancelledOrders: [],
      errors: [],
    }

    // 1. Query pending orders that exceeded the payment timeout window
    const { data: expiredOrders, error: queryError } = await client
      .from('orders')
      .select('id, created_at, status')
      .eq('status', 'pending')
      .lt('created_at', cutoffIso)

    if (queryError) {
      throw new Error(`Failed to query expired orders: ${queryError.message}`)
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return result
    }

    result.scannedCount = expiredOrders.length

    // 2. Process cancellation and restock for each expired order
    for (const order of expiredOrders) {
      try {
        const { error: rpcError } = await client.rpc('handle_payment_webhook', {
          p_order_id: order.id,
          p_target_status: 'cancelled',
          p_payment_type: 'auto_timeout',
          p_midtrans_id: null,
        })

        if (rpcError) {
          result.errors.push({ orderId: order.id, error: rpcError.message })
        } else {
          result.cancelledCount++
          result.cancelledOrders.push(order.id)
        }
      } catch (err: any) {
        result.errors.push({ orderId: order.id, error: err.message || 'Unknown error' })
      }
    }

    // 3. If any orders were cancelled & restocked, invalidate catalog cache
    if (result.cancelledCount > 0) {
      await CacheService.invalidateCatalog()
    }

    return result
  },
}
