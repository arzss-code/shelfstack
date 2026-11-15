import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '~~/server/utils/auth'
import { errorResponse, successResponse } from '~~/server/utils/response'

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
      .select('*')
      .eq('id', threadId)
      .is('deleted_at', null)
      .maybeSingle()

    if (threadError) {
      return errorResponse(event, 'Gagal memuat data thread bantuan.', threadError.message, 500)
    }
    if (!thread) {
      return errorResponse(event, 'Thread bantuan tidak ditemukan.', null, 404)
    }

    if (thread.unread_by_admin_count > 0) {
      await client
        .from('support_threads')
        .update({
          unread_by_admin_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId)

      await client
        .from('support_messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .eq('is_read', false)
    }

    const { data: rawMessages, error: msgError } = await client
      .from('support_messages')
      .select('*')
      .eq('thread_id', threadId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (msgError) {
      return errorResponse(event, 'Gagal memuat riwayat pesan bantuan.', msgError.message, 500)
    }

    const { data: profile } = await client
      .from('profiles')
      .select('id, user_id, full_name, avatar_url, role')
      .eq('user_id', thread.customer_id)
      .maybeSingle()

    let customerEmail = 'customer@shelfstack.atsiilaarya.me'
    try {
      const { data: userData } = await (client as any).auth.admin.getUserById(thread.customer_id)
      if (userData?.user?.email) {
        customerEmail = userData.user.email
      }
    } catch {
      // Abaikan kegagalan baca email di lingkungan pengujian
    }

    const { count: orderCount } = await client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', thread.customer_id)

    let attachedOrder = null
    if (thread.attached_order_id) {
      const { data: orderData } = await client
        .from('orders')
        .select('id, total_cents, status, created_at')
        .eq('id', thread.attached_order_id)
        .maybeSingle()

      if (orderData) {
        attachedOrder = {
          id: orderData.id,
          order_number: `ORD-${orderData.id.slice(0, 8).toUpperCase()}`,
          total_cents: orderData.total_cents,
          status: orderData.status,
          created_at: orderData.created_at,
        }
      }
    }

    let attachedProduct = null
    if (thread.attached_product_id) {
      const { data: prodData } = await client
        .from('products')
        .select('id, name, price_cents, image_url')
        .eq('id', thread.attached_product_id)
        .maybeSingle()

      if (prodData) {
        attachedProduct = {
          id: prodData.id,
          title: prodData.name || 'Produk ShelfStack',
          price_cents: prodData.price_cents || 0,
          image_url: prodData.image_url || null,
        }
      }
    }

    const enrichedMessages = (rawMessages || []).map((m) => {
      const enriched = { ...m } as any
      if (m.attachment_type === 'order_card' && attachedOrder) {
        enriched.attached_order = attachedOrder
      } else if (m.attachment_type === 'product_card' && attachedProduct) {
        enriched.attached_product = attachedProduct
      } else if (
        attachedOrder &&
        m.sender_type === 'customer' &&
        m.message_text.includes('Pesanan')
      ) {
        enriched.attached_order = attachedOrder
      } else if (
        attachedProduct &&
        m.sender_type === 'customer' &&
        m.message_text.includes('Produk')
      ) {
        enriched.attached_product = attachedProduct
      }
      return enriched
    })

    return successResponse('Riwayat pesan berhasil dimuat', {
      thread: {
        ...thread,
        unread_by_admin_count: 0,
      },
      customer: {
        id: thread.customer_id,
        full_name: profile?.full_name || 'Pelanggan ShelfStack',
        email: customerEmail,
        avatar_url: profile?.avatar_url || null,
        total_orders: orderCount ?? 0,
      },
      messages: enrichedMessages,
      attached_order: attachedOrder,
      attached_product: attachedProduct,
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan internal saat memuat percakapan bantuan.',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
