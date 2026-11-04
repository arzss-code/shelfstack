import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { sendSupportMessageSchema } from '~~/shared/schemas/support-chat'
import { requireUser } from '~~/server/utils/auth'
import { errorResponse, successResponse } from '~~/server/utils/response'
import { WELCOME_BOT_MESSAGE } from '~~/server/utils/support-chat'

type SupportThreadUpdate = Database['public']['Tables']['support_threads']['Update']

export default defineEventHandler(async (event) => {
  try {
    const { user, profile } = await requireUser(event)
    const targetUserId = user.id || profile.user_id

    const body = await readBody(event)
    const parsed = sendSupportMessageSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        event,
        parsed.error.issues[0]?.message || 'Data pesan tidak valid.',
        parsed.error.flatten().fieldErrors,
        400,
      )
    }

    const payload = parsed.data
    const client = serverSupabaseServiceRole<Database>(event)

    let { data: thread } = await client
      .from('support_threads')
      .select('*')
      .eq('customer_id', targetUserId)
      .is('deleted_at', null)
      .maybeSingle()

    if (!thread) {
      const { data: newThread, error: createError } = await client
        .from('support_threads')
        .insert({
          customer_id: targetUserId,
          status: 'open',
          attached_order_id: payload.attached_order_id || null,
          attached_product_id: payload.attached_product_id || null,
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
          return errorResponse(event, 'Gagal membuat thread bantuan.', createError.message, 500)
        }
      } else {
        thread = newThread
      }
    } else {
      const updateFields: SupportThreadUpdate = {}
      if (payload.attached_order_id && !thread.attached_order_id) {
        updateFields.attached_order_id = payload.attached_order_id
      }
      if (payload.attached_product_id && !thread.attached_product_id) {
        updateFields.attached_product_id = payload.attached_product_id
      }
      if (Object.keys(updateFields).length > 0) {
        await client.from('support_threads').update(updateFields).eq('id', thread.id)
      }
    }

    const { count: existingCount } = await client
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', thread.id)
      .is('deleted_at', null)

    const isFirstMessage = (existingCount ?? 0) === 0

    let attachmentType = payload.attachment_type || null
    if (!attachmentType && payload.attachment_url) {
      attachmentType = 'image'
    }

    const { data: customerMessage, error: insertError } = await client
      .from('support_messages')
      .insert({
        thread_id: thread.id,
        sender_type: 'customer',
        sender_id: targetUserId,
        message_text: payload.message_text,
        attachment_url: payload.attachment_url || null,
        attachment_type: attachmentType,
        is_read: false,
      })
      .select('*')
      .single()

    if (insertError) {
      return errorResponse(event, 'Gagal mengirim pesan bantuan.', insertError.message, 500)
    }

    let systemMessage = null
    if (isFirstMessage) {
      const { data: existingSystemMsg } = await client
        .from('support_messages')
        .select('*')
        .eq('thread_id', thread.id)
        .eq('sender_type', 'system')
        .maybeSingle()

      if (!existingSystemMsg) {
        const { data: newSystemMsg } = await client
          .from('support_messages')
          .insert({
            thread_id: thread.id,
            sender_type: 'system',
            sender_id: null,
            message_text: WELCOME_BOT_MESSAGE,
            is_read: true,
          })
          .select('*')
          .single()

        systemMessage = newSystemMsg
      } else {
        systemMessage = existingSystemMsg
      }
    }

    return successResponse('Pesan berhasil dikirim', {
      message: customerMessage,
      system_message: systemMessage,
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan internal saat mengirim pesan.',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
