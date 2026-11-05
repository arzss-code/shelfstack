import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { adminSendSupportMessageSchema } from '~~/shared/schemas/support-chat'
import { requireAdmin } from '~~/server/utils/auth'
import { errorResponse, successResponse } from '~~/server/utils/response'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAdmin(event)
    const client = serverSupabaseServiceRole<Database>(event)

    const threadId = getRouterParam(event, 'id')
    if (!threadId || !z.string().uuid().safeParse(threadId).success) {
      return errorResponse(event, 'ID thread bantuan tidak valid.', null, 400)
    }

    const { data: thread, error: threadError } = await client
      .from('support_threads')
      .select('id, status, customer_id')
      .eq('id', threadId)
      .is('deleted_at', null)
      .maybeSingle()

    if (threadError) {
      return errorResponse(event, 'Gagal memverifikasi thread bantuan.', threadError.message, 500)
    }
    if (!thread) {
      return errorResponse(event, 'Thread bantuan tidak ditemukan.', null, 404)
    }

    const body = await readBody(event)
    const parseResult = adminSendSupportMessageSchema.safeParse(body)
    if (!parseResult.success) {
      return errorResponse(
        event,
        parseResult.error.issues[0]?.message || 'Data balasan tidak valid.',
        parseResult.error.flatten().fieldErrors,
        400,
      )
    }

    const payload = parseResult.data

    const { data: newMessage, error: insertError } = await client
      .from('support_messages')
      .insert({
        thread_id: threadId,
        sender_type: 'admin',
        sender_id: user.id,
        message_text: payload.message_text,
        attachment_url: payload.attachment_url || null,
        attachment_type: payload.attachment_url ? payload.attachment_type || 'image' : null,
        is_read: false,
      })
      .select()
      .single()

    if (insertError) {
      return errorResponse(event, 'Gagal mengirim balasan ke pelanggan.', insertError.message, 500)
    }

    return successResponse('Balasan berhasil dikirim ke pelanggan', {
      message: newMessage,
      ...newMessage,
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan internal saat mengirim balasan.',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
