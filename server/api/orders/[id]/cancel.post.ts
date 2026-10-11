import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { logger } from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse(event, 'ID pesanan diperlukan', null, 400)
  }

  const body = await readBody(event).catch(() => ({}))
  const reason = typeof body?.reason === 'string' ? body.reason : 'Dibatalkan oleh pelanggan'

  // Verifikasi keberadaan dan hak akses pesanan
  const { data: order, error: fetchErr } = await client
    .from('orders')
    .select('id, user_id, status')
    .eq('id', id)
    .single()

  if (fetchErr || !order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', fetchErr, 404)
  }

  if (order.user_id !== user.id && profile.role !== 'admin') {
    return errorResponse(event, 'Akses pesanan ditolak', null, 403)
  }

  if (order.status !== 'pending') {
    return errorResponse(
      event,
      `Hanya pesanan pending yang dapat dibatalkan (status saat ini: ${order.status})`,
      null,
      400,
    )
  }

  // Panggil RPC cancel_order untuk restock atomik & audit log
  const { error: rpcErr } = await client.rpc('cancel_order', {
    p_order_id: id,
    p_reason: reason,
  })

  if (rpcErr) {
    logger.error(
      '[cancel_order] RPC execution failed',
      {
        requestId: event.context?.requestId,
        orderId: id,
      },
      rpcErr,
    )
    return errorResponse(
      event,
      'Gagal memproses pembatalan pesanan. Silakan coba beberapa saat lagi.',
      null,
      500,
    )
  }

  return successResponse('Pesanan berhasil dibatalkan', {
    order_id: id,
    status: 'cancelled',
  })
})
