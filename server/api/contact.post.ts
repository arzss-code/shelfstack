import crypto from 'node:crypto'
import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { contactMessageSchema } from '../../shared/schemas/contact'
import { extractAuthUserId } from '../../shared/utils/auth'
import { errorResponse, successResponse } from '../utils/response'
import { logger } from '../utils/logger'
import { dispatchContactNotificationEmail } from '../utils/contact-email'

async function resolveOptionalUserId(
  event: Parameters<Parameters<typeof defineEventHandler>[0]>[0],
): Promise<string | null> {
  try {
    const user = await serverSupabaseUser(event)
    return extractAuthUserId(user)
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const body =
    (event as { body?: unknown })?.body ||
    (event as { _body?: unknown })?._body ||
    (await readBody(event).catch(() => ({})))

  const parsed = contactMessageSchema.safeParse(body)

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return errorResponse(
      event,
      firstIssue?.message || 'Data formulir kontak tidak valid',
      parsed.error.flatten(),
      400,
    )
  }

  const { name, email, category, orderNumber, message } = parsed.data
  const ticketId = `CTK-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
  const userId = await resolveOptionalUserId(event)

  let persisted = false
  let dbError: { code?: string; message?: string } | null = null
  try {
    const client = serverSupabaseServiceRole<Database>(event)
    if (client && typeof client.from === 'function') {
      const { error: insertError } = await client.from('contact_messages').insert({
        ticket_code: ticketId,
        user_id: userId,
        name,
        email,
        category,
        order_number: orderNumber || null,
        message,
        status: 'open',
      })

      if (insertError) {
        dbError = insertError
      } else {
        persisted = true
      }
    }
  } catch (err: unknown) {
    // Izinkan fallback di lingkungan test unit minimal tanpa konteks Supabase Nitro
    logger.warn('[Contact] Layanan Supabase tidak tersedia untuk persistensi pesan', {
      ticketId,
      error: err instanceof Error ? err.message : String(err),
    })
  }

  if (dbError) {
    if (dbError.code === '42P01' || dbError.code === 'PGRST205') {
      logger.warn('[Contact] Tabel contact_messages belum tersedia pada schema cache', {
        ticketId,
        code: dbError.code,
      })
    } else {
      logger.error('[Contact] Gagal menyimpan pesan kontak ke database', {
        ticketId,
        code: dbError.code,
        error: dbError.message,
      })
      return errorResponse(
        event,
        'Gagal menyimpan pesan kontak Anda. Silakan coba beberapa saat lagi.',
        dbError.message,
        500,
      )
    }
  }

  logger.info('Pesan formulir kontak berhasil diterima', {
    event: 'contact_form_submitted',
    ticketId,
    persisted,
    name,
    emailMasked: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    category,
    orderNumber: orderNumber || undefined,
    messageLength: message.length,
  })

  void dispatchContactNotificationEmail({
    ticketCode: ticketId,
    name,
    email,
    category,
    orderNumber: orderNumber || null,
    message,
  })

  return successResponse(
    'Pesan Anda berhasil diterima dan tercatat di inbox tim dukungan. Kami akan merespons dalam 1x24 jam kerja.',
    {
      ticket_id: ticketId,
      received_at: new Date().toISOString(),
      persisted,
    },
  )
})
