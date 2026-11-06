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

export async function pingSupabase(timeoutMs = 3000): Promise<boolean> {
  try {
    const client = getSupabaseClient()
    const checkPromise = async () => {
      const { error } = await client.from('categories').select('id').limit(1)
      if (error) throw new Error(error.message)
      return true
    }
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database connectivity check timed out')), timeoutMs),
    )
    await Promise.race([checkPromise(), timeoutPromise])
    return true
  } catch {
    return false
  }
}

export interface ProcessWebhookParams {
  orderId: string
  targetStatus: 'pending' | 'paid' | 'cancelled'
  paymentType?: string | null
  midtransId?: string | null
}

export interface ProcessWebhookResult {
  orderId: string
  status: 'pending' | 'paid' | 'cancelled'
  rpcResult: string
  method: 'atomic_rpc'
}

export async function processPaymentWebhook(
  params: ProcessWebhookParams,
): Promise<ProcessWebhookResult> {
  const client = getSupabaseClient()
  const baseOrderId = extractBaseOrderId(params.orderId)

  const { data: rpcResult, error: rpcError } = await client.rpc('handle_payment_webhook', {
    p_order_id: baseOrderId,
    p_target_status: params.targetStatus,
    p_payment_type: params.paymentType ?? null,
    p_midtrans_id: params.midtransId ?? null,
  })

  if (rpcError) {
    throw new Error(`Failed to execute handle_payment_webhook RPC: ${rpcError.message}`)
  }

  return {
    orderId: baseOrderId,
    status: params.targetStatus,
    rpcResult: typeof rpcResult === 'string' ? rpcResult : 'UNKNOWN_RPC_RESULT',
    method: 'atomic_rpc',
  }
}
