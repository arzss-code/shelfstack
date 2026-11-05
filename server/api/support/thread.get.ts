import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '~~/server/utils/auth'
import { errorResponse, successResponse } from '~~/server/utils/response'

export default defineEventHandler(async (event) => {
  try {
    const { user, profile } = await requireUser(event)
    const targetUserId = user.id || profile.user_id

    const client = serverSupabaseServiceRole<Database>(event)

    const { data: initialThread, error: fetchError } = await client
      .from('support_threads')
      .select('*')
      .eq('customer_id', targetUserId)
      .is('deleted_at', null)
      .maybeSingle()

    if (fetchError) {
      return errorResponse(event, 'Gagal memuat thread bantuan.', fetchError.message, 500)
    }

    let thread = initialThread

    if (!thread) {
      const { data: newThread, error: createError } = await client
        .from('support_threads')
        .insert({
          customer_id: targetUserId,
          status: 'open',
        })
        .select('*')
        .single()

      if (createError) {
        const { data: fallbackThread } = await client
          .from('support_threads')
          .select('*')
          .eq('customer_id', targetUserId)
          .is('deleted_at', null)
          .maybeSingle()

        if (fallbackThread) {
          thread = fallbackThread
        } else {
          return errorResponse(
            event,
            'Gagal membuat thread bantuan baru.',
            createError.message,
            500,
          )
        }
      } else {
        thread = newThread
      }
    }

    const { data: rawMessages, error: messagesError } = await client
      .from('support_messages')
      .select('*')
      .eq('thread_id', thread.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (messagesError) {
      return errorResponse(event, 'Gagal memuat pesan bantuan.', messagesError.message, 500)
    }

    const messages = (rawMessages || []).reverse()

    return successResponse('Thread bantuan berhasil dimuat', {
      thread,
      messages,
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan internal saat memuat thread bantuan.',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
