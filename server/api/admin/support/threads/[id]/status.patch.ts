import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { updateThreadStatusSchema } from '~~/shared/schemas/support-chat'
import { requireAdmin } from '~~/server/utils/auth'
import { errorResponse, successResponse } from '~~/server/utils/response'

type SupportThreadUpdate = Database['public']['Tables']['support_threads']['Update']

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
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
    const parseResult = updateThreadStatusSchema.safeParse(body)
    if (!parseResult.success) {
      return errorResponse(
        event,
        parseResult.error.issues[0]?.message || 'Status thread bantuan tidak valid.',
        parseResult.error.flatten().fieldErrors,
        400,
      )
    }

    const payload = parseResult.data

    const updateData: SupportThreadUpdate = {
      status: payload.status,
      updated_at: new Date().toISOString(),
    }

    if (payload.status === 'resolved') {
      updateData.unread_by_admin_count = 0
    }

    const { data: updatedThread, error: updateError } = await client
      .from('support_threads')
      .update(updateData)
      .eq('id', threadId)
      .select()
      .single()

    if (updateError) {
      return errorResponse(
        event,
        'Gagal memperbarui status thread bantuan.',
        updateError.message,
        500,
      )
    }

    const systemNoteText =
      payload.status === 'resolved'
        ? 'Percakapan telah diselesaikan oleh tim Customer Support.'
        : `Status percakapan diperbarui menjadi: ${payload.status}`

    await client.from('support_messages').insert({
      thread_id: threadId,
      sender_type: 'system',
      sender_id: null,
      message_text: systemNoteText,
      is_read: false,
    })

    return successResponse('Status thread berhasil diperbarui', {
      thread: updatedThread,
      ...updatedThread,
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan internal saat memperbarui status thread.',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
