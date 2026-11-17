import { defineEventHandler, readBody } from 'h3'
import { contactMessageSchema } from '../../shared/schemas/contact'
import { errorResponse, successResponse } from '../utils/response'
import { logger } from '../utils/logger'

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

  logger.info('Pesan formulir kontak berhasil diterima', {
    event: 'contact_form_submitted',
    name,
    emailMasked: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    category,
    orderNumber: orderNumber || undefined,
    messageLength: message.length,
  })

  return successResponse(
    'Pesan Anda berhasil diterima. Tim dukungan ShelfStack akan merespons dalam 1x24 jam kerja.',
    {
      ticket_id: `CTK-${Date.now().toString(36).toUpperCase()}`,
      received_at: new Date().toISOString(),
    },
  )
})
