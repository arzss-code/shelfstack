import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~~/server/utils/auth'
import { errorResponse, successResponse } from '~~/server/utils/response'

export default defineEventHandler(async (event) => {
  try {
    const { user, profile } = await requireUser(event)
    const targetUserId = user.id || profile.user_id

    let threadId: string | null = null
    try {
      const body = await readBody(event)
      if (body && typeof body === 'object' && body.thread_id) {
        threadId = body.thread_id
      }
    } catch {
      // Body tidak wajib disertakan
    }

    const client = serverSupabaseServiceRole<Database>(event)

    let threadQuery = client
      .from('support_threads')
      .select('id, unread_by_customer_count')
      .eq('customer_id', targetUserId)
      .is('deleted_at', null)

    if (threadId) {
      threadQuery = threadQuery.eq('id', threadId)
    }

    const { data: thread, error: fetchError } = await threadQuery.maybeSingle()

    if (fetchError) {
      return errorResponse(event, 'Gagal memverifikasi thread bantuan.', fetchError.message, 500)
    }

    if (!thread) {
      if (threadId) {
        return errorResponse(event, 'Thread bantuan tidak ditemukan.', null, 404)
      }
      return successResponse('Pesan telah ditandai terbaca', {
        success: true,
        unread_by_customer_count: 0,
      })
    }

    await client
      .from('support_threads')
      .update({
        unread_by_customer_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', thread.id)

    await client
      .from('support_messages')
      .update({
        is_read: true,
      })
      .eq('thread_id', thread.id)
      .eq('is_read', false)

    return successResponse('Pesan telah ditandai terbaca', {
      success: true,
      unread_by_customer_count: 0,
      thread_id: thread.id,
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan saat menandai pesan telah terbaca.',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
