import type { TransactionalEmailType } from '../../shared/utils/email-templates'

export interface EmailDeliveryRecord {
  id: string
  orderId: string
  recipientEmail: string
  templateType: TransactionalEmailType
  status: 'sent' | 'failed'
  provider: string
  messageId?: string | null
  errorMessage?: string | null
  durationMs: number
  createdAt: string
}

export interface DispatchEmailOptions {
  provider?: 'mock' | 'resend' | 'console'
  apiKey?: string
  fromEmail?: string
  recipientEmail?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export interface EmailDispatchResult {
  ok: boolean
  provider: string
  messageId?: string | null
  error?: string | null
  durationMs: number
}

export interface RawDbOrder {
  id: string
  created_at?: string | null
  total_cents: number
  subtotal_cents?: number
  discount_cents?: number
  coins_used?: number
  shipping_cost_cents?: number
  coupon_code?: string | null
  shipping_service?: string | null
  courier_code?: string | null
  tracking_number?: string | null
  address?: Record<string, unknown> | null
  user_id?: string
  items?: Array<{
    id?: string
    qty?: number
    price_cents?: number
    product?: {
      name?: string
      image_url?: string | null
    } | null
    variant?: {
      name?: string
    } | null
  }> | null
}
