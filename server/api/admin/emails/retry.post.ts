import { defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'
import { retryEmailOutboxItem } from '../../../utils/email-outbox'

const retryBodySchema = z.object({
  id: z.string().uuid().optional(),
  max_attempts: z.number().int().min(1).max(10).default(3),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = retryBodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return errorResponse(event, 'Payload retry outbox tidak valid', parsed.error.flatten(), 400)
  }

  const client = serverSupabaseServiceRole<Database>(event)

  if (parsed.data.id) {
    const res = await retryEmailOutboxItem(client, parsed.data.id)
    if (!res.ok) {
      return errorResponse(event, res.message, null, 500)
    }
    return successResponse(res.message, { id: parsed.data.id, ok: true })
  }

  // Retry all failed emails with attempts < max_attempts
  const { data: failedItems, error } = await client
    .from('email_outbox')
    .select('id')
    .eq('status', 'failed')
    .lt('attempts', parsed.data.max_attempts)
    .limit(20)

  if (error) {
    return errorResponse(event, 'Gagal mengambil daftar email gagal', error.message, 500)
  }

  let retriedCount = 0
  let successCount = 0

  for (const item of failedItems || []) {
    retriedCount++
    const res = await retryEmailOutboxItem(client, item.id)
    if (res.ok) successCount++
  }

  return successResponse(
    `Proses retry selesai: ${successCount}/${retriedCount} email berhasil dikirim`,
    {
      retried: retriedCount,
      succeeded: successCount,
    },
  )
})
