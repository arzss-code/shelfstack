import crypto from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import {
  generateEmailSubject,
  generateEmailHtml,
  type TransactionalEmailType,
  type EmailOrderData,
} from '../../shared/utils/email-templates'
import { logger } from './logger'
import type {
  EmailDeliveryRecord,
  DispatchEmailOptions,
  DispatchOrderEmailOptions,
  EmailDispatchResult,
  RawDbOrder,
} from './email-types'
import { mapDbOrderToEmailData } from './email-mapper'

const MAX_DELIVERY_LOGS = 50
const deliveryLogs: EmailDeliveryRecord[] = []

export function getEmailDeliveryLogs(limit: number = MAX_DELIVERY_LOGS): EmailDeliveryRecord[] {
  return deliveryLogs.slice(0, Math.min(limit, MAX_DELIVERY_LOGS))
}

export function clearEmailDeliveryLogs(): void {
  deliveryLogs.length = 0
}

function recordDeliveryLog(record: EmailDeliveryRecord): void {
  deliveryLogs.unshift(record)
  if (deliveryLogs.length > MAX_DELIVERY_LOGS) {
    deliveryLogs.pop()
  }
}

export function resolveEmailConfig(options?: DispatchEmailOptions) {
  let envProvider = ''
  let envKey = ''
  let envFrom = ''
  let configAppUrl = ''
  let configSupportEmail = ''

  try {
    const config = useRuntimeConfig()
    if (typeof config.emailProvider === 'string') envProvider = config.emailProvider
    if (typeof config.resendApiKey === 'string') envKey = config.resendApiKey
    if (typeof config.emailFrom === 'string') envFrom = config.emailFrom
    if (typeof config.appUrl === 'string') configAppUrl = config.appUrl
    else if (typeof config.public?.siteUrl === 'string') configAppUrl = config.public.siteUrl
    if (typeof config.supportEmail === 'string') configSupportEmail = config.supportEmail
    else if (typeof config.public?.supportEmail === 'string') {
      configSupportEmail = config.public.supportEmail
    }
  } catch {
    // Context outside Nitro runtime (e.g. unit tests)
  }

  const apiKey = options?.apiKey || process.env.RESEND_API_KEY || envKey || ''
  const fromEmail =
    options?.fromEmail ||
    process.env.EMAIL_FROM ||
    envFrom ||
    'ShelfStack <noreply@shelfstack.atsiilaarya.me>'

  const raw = (
    options?.provider ||
    process.env.EMAIL_PROVIDER ||
    envProvider ||
    (apiKey ? 'resend' : 'mock')
  ).toLowerCase()

  const provider = raw === 'resend' && apiKey ? 'resend' : 'mock'
  const appUrl =
    options?.appUrl ||
    process.env.APP_URL ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    configAppUrl ||
    'https://shelfstack.atsiilaarya.me'
  const supportEmail =
    options?.supportEmail ||
    process.env.SUPPORT_EMAIL ||
    configSupportEmail ||
    'support@shelfstack.atsiilaarya.me'

  return { provider, apiKey, fromEmail, appUrl, supportEmail }
}

export async function sendViaResend(
  to: string,
  from: string,
  subject: string,
  html: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = 3_000,
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
      signal: AbortSignal.timeout(timeoutMs),
    })

    const data = (await res.json().catch(() => null)) as { id?: string; message?: string } | null
    if (!res.ok) {
      return { ok: false, error: data?.message || `HTTP ${res.status} from Resend API` }
    }
    return { ok: true, messageId: data?.id || `resend-${crypto.randomUUID()}` }
  } catch (err: unknown) {
    return {
      ok: false,
      error: `Resend request failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Dispatches transactional email asynchronously with strict fail-open resilience.
 */
export async function dispatchTransactionalEmail(
  type: TransactionalEmailType,
  order: EmailOrderData,
  options?: DispatchEmailOptions,
): Promise<EmailDispatchResult> {
  const startTime = Date.now()
  const recipient = options?.recipientEmail || order.customer_email || 'pelanggan@example.com'
  const { provider, apiKey, fromEmail, appUrl, supportEmail } = resolveEmailConfig(options)
  const fetchImpl = options?.fetchImpl || fetch
  const timeoutMs = options?.timeoutMs || 3_000

  let ok: boolean
  let messageId: string | null = null
  let errorMessage: string | null = null

  try {
    const subject = generateEmailSubject(type, order)
    const html = generateEmailHtml(type, order, { appUrl, supportEmail })

    if (provider === 'resend' && apiKey) {
      const res = await sendViaResend(
        recipient,
        fromEmail,
        subject,
        html,
        apiKey,
        fetchImpl,
        timeoutMs,
      )
      ok = res.ok
      messageId = res.messageId || null
      errorMessage = res.error || null
    } else {
      messageId = `mock-${crypto.randomUUID().slice(0, 8)}`
      ok = true
      logger.info(`[EmailDispatcher:Mock] Simulated ${type} email dispatch to ${recipient}`, {
        orderId: order.id,
        subject,
        provider: 'mock',
      })
    }
  } catch (err: unknown) {
    ok = false
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  const durationMs = Date.now() - startTime
  recordDeliveryLog({
    id: crypto.randomUUID(),
    orderId: order.id,
    recipientEmail: recipient,
    templateType: type,
    status: ok ? 'sent' : 'failed',
    provider,
    messageId,
    errorMessage,
    durationMs,
    createdAt: new Date().toISOString(),
  })

  if (!ok) {
    logger.warn('[EmailDispatcher] Transactional email dispatch failed (fail-open)', {
      orderId: order.id,
      templateType: type,
      recipient,
      provider,
      errorMessage,
      durationMs,
    })
  }

  return { ok, provider, messageId, error: errorMessage, durationMs }
}

const ORDER_SELECT_QUERY = `
  id, created_at, total_cents, subtotal_cents, discount_cents, coins_used,
  shipping_cost_cents, coupon_code, shipping_service, courier_code, tracking_number,
  address, user_id, items:order_items ( id, qty, price_cents, product:products ( name, image_url ) )
`

/**
 * Higher-level order lifecycle dispatcher that fetches order state from database
 * and triggers transactional email in a fail-open background manner.
 */
export async function dispatchOrderTransactionalEmail(
  client: SupabaseClient<Database>,
  orderId: string,
  type: TransactionalEmailType,
  options?: DispatchOrderEmailOptions,
): Promise<EmailDispatchResult> {
  try {
    const { data: order, error } = await client
      .from('orders')
      .select(ORDER_SELECT_QUERY)
      .eq('id', orderId)
      .maybeSingle()

    if (error || !order) {
      logger.warn('[EmailDispatcher] Order not found for email dispatch', {
        orderId,
        type,
        error: error?.message,
      })
      return {
        ok: false,
        provider: 'none',
        error: error?.message || 'Order not found',
        durationMs: 0,
      }
    }

    let customerEmail = options?.customerEmail
    if (!customerEmail && order.user_id) {
      try {
        const { data: authUser } = await client.auth.admin.getUserById(order.user_id)
        if (authUser?.user?.email) customerEmail = authUser.user.email
      } catch {
        // Fallback to address/default
      }
    }

    const emailOrderData = mapDbOrderToEmailData(order as unknown as RawDbOrder, customerEmail)
    return await dispatchTransactionalEmail(type, emailOrderData, {
      apiKey: options?.apiKey,
      fetchImpl: options?.fetchImpl,
      recipientEmail: customerEmail,
      appUrl: options?.appUrl,
      supportEmail: options?.supportEmail,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    logger.warn('[EmailDispatcher] Uncaught exception during email dispatch (fail-open)', {
      orderId,
      type,
      error: message,
    })
    return { ok: false, provider: 'none', error: message, durationMs: 0 }
  }
}
