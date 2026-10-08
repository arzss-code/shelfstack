import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from '../config.js'
import { extractBaseOrderId } from '../utils/midtrans.js'

let supabaseInstance: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured to connect to database.',
    )
  }

  supabaseInstance = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return supabaseInstance
}

export function setSupabaseClient(client: SupabaseClient | null) {
  supabaseInstance = client
}

export interface ProcessWebhookParams {
  orderId: string
  targetStatus: 'pending' | 'paid' | 'cancelled'
  paymentType?: string | null
  midtransId?: string | null
}

export async function processPaymentWebhook(params: ProcessWebhookParams) {
  const client = getSupabaseClient()
  const baseOrderId = extractBaseOrderId(params.orderId)

  const { data: rpcResult, error: rpcError } = await client.rpc('handle_payment_webhook', {
    p_order_id: baseOrderId,
    p_target_status: params.targetStatus,
    p_payment_type: params.paymentType ?? null,
    p_midtrans_id: params.midtransId ?? null,
  })

  // Defensive fallback if RPC is not present
  if (rpcError) {
    const { data: updatedOrder, error: updateError } = await client
      .from('orders')
      .update({
        status: params.targetStatus,
        payment_type: params.paymentType ?? null,
        midtrans_id: params.midtransId ?? null,
        paid_at: params.targetStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', baseOrderId)
      .select('id, status')
      .single()

    if (updateError) {
      throw new Error(`Failed to update order status in database: ${updateError.message}`)
    }

    return {
      orderId: params.orderId,
      status: updatedOrder.status,
      method: 'direct_fallback',
    }
  }

  return {
    orderId: params.orderId,
    status: params.targetStatus,
    rpcResult,
    method: 'atomic_rpc',
  }
}
