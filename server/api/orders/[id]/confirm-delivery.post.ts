import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { logger } from '../../../utils/logger'
import { enrichRecentOrderActivityDevice } from '../../../utils/activity-log'

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)
  const orderId = getRouterParam(event, 'id')

  if (!orderId) {
    return errorResponse(event, 'ID pesanan diperlukan', null, 400)
  }

  const client = serverSupabaseServiceRole<Database>(event)

  // 1. Verifikasi kepemilikan dan status pesanan saat ini
  const { data: order, error: fetchErr } = await client
    .from('orders')
    .select('id, user_id, status')
    .eq('id', orderId)
    .single()

  if (fetchErr || !order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', fetchErr, 404)
  }

  // Hanya pemilik pesanan atau admin yang dapat mengonfirmasi penerimaan
  if (order.user_id !== user.id && profile.role !== 'admin') {
    return errorResponse(event, 'Akses pesanan ditolak', null, 403)
  }

  if (order.status !== 'shipped') {
    return errorResponse(
      event,
      `Hanya pesanan yang sedang dikirim (shipped) yang dapat dikonfirmasi telah diterima. Status saat ini: ${order.status}`,
      null,
      400,
    )
  }

  // 2. Eksekusi transisi status atomik via database RPC transition_order_status
  // Transisi ini otomatis mencairkan koin loyalitas (1% cashback) dan mencatat mutasi kas
  const { data: rpcData, error: rpcErr } = await client.rpc('transition_order_status', {
    p_order_id: orderId,
    p_target_status: 'completed',
    p_reason: 'Konfirmasi penerimaan oleh pelanggan',
  })

  if (rpcErr) {
    logger.error(
      '[confirm-delivery] RPC transition_order_status failed',
      {
        requestId: event.context?.requestId,
        orderId,
      },
      rpcErr,
    )
    return errorResponse(
      event,
      'Gagal memproses konfirmasi penerimaan pesanan di database.',
      rpcErr,
      500,
    )
  }

  await enrichRecentOrderActivityDevice(event, orderId, client)

  // 3. Notifikasi in-app perayaan penyelesaian pesanan & ajakan review
  await createNotification(client, {
    user_id: order.user_id,
    title: 'Pesanan Selesai',
    message: `Pesanan ${orderId} telah selesai diterima. Koin loyalitas telah ditambahkan ke akun Anda. Bagikan pengalaman Anda dengan memberi ulasan produk.`,
    type: 'order_completed',
    reference_id: orderId,
    reference_url: `/orders/${orderId}`,
  }).catch((err) => {
    logger.warn('Gagal membuat notifikasi order_completed', {}, err)
  })

  return successResponse('Pesanan berhasil dikonfirmasi telah diterima', {
    order_id: orderId,
    status: 'completed',
    result: rpcData,
  })
})
