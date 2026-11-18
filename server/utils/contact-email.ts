import crypto from 'node:crypto'
import { logger } from './logger'
import { resolveEmailConfig, sendViaResend } from './email-dispatcher'
import type { EmailDispatchResult } from './email-types'

export interface ContactEmailNotificationPayload {
  ticketCode: string
  name: string
  email: string
  category: string
  orderNumber?: string | null
  message: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Mengirim notifikasi pesan kontak baru ke alamat SUPPORT_EMAIL secara fail-open.
 */
export async function dispatchContactNotificationEmail(
  payload: ContactEmailNotificationPayload,
): Promise<EmailDispatchResult> {
  const startTime = Date.now()
  const { provider, apiKey, fromEmail, supportEmail } = resolveEmailConfig()
  const subject = `[ShelfStack Kontak #${payload.ticketCode}] ${payload.category} dari ${payload.name}`
  const html = [
    `<p><strong>Tiket:</strong> ${escapeHtml(payload.ticketCode)}</p>`,
    `<p><strong>Pengirim:</strong> ${escapeHtml(payload.name)} (${escapeHtml(payload.email)})</p>`,
    `<p><strong>Kategori:</strong> ${escapeHtml(payload.category)}</p>`,
    payload.orderNumber
      ? `<p><strong>Nomor Pesanan:</strong> ${escapeHtml(payload.orderNumber)}</p>`
      : '',
    `<p><strong>Pesan:</strong><br/>${escapeHtml(payload.message).replace(/\n/g, '<br/>')}</p>`,
  ]
    .filter(Boolean)
    .join('\n')

  if (provider === 'resend' && apiKey) {
    const res = await sendViaResend(supportEmail, fromEmail, subject, html, apiKey)
    if (!res.ok) {
      logger.warn('[ContactEmail] Gagal mengirim alert ke support email', {
        ticketCode: payload.ticketCode,
        error: res.error,
      })
    }
    return {
      ok: res.ok,
      provider,
      messageId: res.messageId || null,
      error: res.error || null,
      durationMs: Date.now() - startTime,
    }
  }

  logger.info(`[ContactEmail:Mock] Simulasi alert tiket kontak ${payload.ticketCode}`, {
    ticketCode: payload.ticketCode,
    supportEmail,
    provider: 'mock',
  })

  return {
    ok: true,
    provider: 'mock',
    messageId: `mock-ctk-${crypto.randomUUID().slice(0, 8)}`,
    error: null,
    durationMs: Date.now() - startTime,
  }
}
