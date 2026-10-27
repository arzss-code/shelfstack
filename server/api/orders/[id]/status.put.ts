import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import type { OrderStatus } from '../../../../shared/constants/order-transitions'

export default defineEventHandler(async (event) => {
  // Hanya administrator yang dapat memperbarui status pesanan secara manual
  await requireAdmin(event)

  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const body = await readBody(event)
  const targetStatus = body?.status as OrderStatus
  const reason = (body?.reason as string) || ''

  if (!targetStatus) {
    return errorResponse(event, 'Status target wajib disertakan', null, 400)
  }

  const validStatuses: OrderStatus[] = [
    'pending',
    'paid',
    'shipped',
    'completed',
    'cancelled',
    'refunded',
  ]
  if (!validStatuses.includes(targetStatus)) {
    return errorResponse(event, `Status target tidak valid: ${targetStatus}`, null, 400)
  }

  // Task 07.4: Jalur admin terisolasi menggunakan service role setelah otorisasi requireAdmin lulus
  const client = serverSupabaseServiceRole<Database>(event)

  // Eksekusi transisi status atomik via database RPC transition_order_status
  // RPC mengunci baris order dengan FOR UPDATE untuk mencegah TOCTOU race conditions
  const { data, error: rpcError } = await client.rpc('transition_order_status', {
    p_order_id: orderId,
    p_target_status: targetStatus,
    p_reason: reason || undefined,
  })

  if (rpcError) {
    const errorMsg = rpcError.message || 'Gagal memperbarui status pesanan'

    if (errorMsg.includes('ORDER_NOT_FOUND')) {
      return errorResponse(event, 'Pesanan tidak ditemukan', rpcError, 404)
    }

    if (errorMsg.includes('FORBIDDEN_NOT_ADMIN')) {
      return errorResponse(event, 'Akses ditolak. Hanya admin.', rpcError, 403)
    }

    if (
      errorMsg.includes('INVALID_ORDER_TRANSITION') ||
      errorMsg.includes('ADMIN_PAYMENT_OVERRIDE_DISABLED') ||
      errorMsg.includes('DIRECT_STATUS_MUTATION_FORBIDDEN') ||
      errorMsg.includes('TERMINAL_ORDER_STATE')
    ) {
      return errorResponse(event, errorMsg, rpcError, 409)
    }

    return errorResponse(event, errorMsg, rpcError, 500)
  }

  const result = data as {
    order_id: string
    current_status: string
    previous_status: string
    no_op: boolean
    message: string
  }

  // Buat notifikasi otomatis ke pelanggan saat status berubah
  if (!result.no_op && result.current_status !== result.previous_status) {
    const { data: orderData } = await client
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .maybeSingle()

    if (orderData?.user_id) {
      let notifTitle = 'Pembaruan Pesanan'
      let notifMessage = `Status pesanan ${orderId} telah diperbarui menjadi ${result.current_status}.`
      let notifType: 'order_shipped' | 'order_completed' | 'order_cancelled' | 'system' = 'system'

      if (result.current_status === 'shipped') {
        notifTitle = 'Pesanan Sedang Dikirim'
        notifMessage = `Pesanan ${orderId} telah diserahkan ke kurir dan sedang dalam perjalanan.`
        notifType = 'order_shipped'
      } else if (result.current_status === 'completed') {
        notifTitle = 'Pesanan Telah Selesai'
        notifMessage = `Pesanan ${orderId} telah selesai diterima. Terima kasih!`
        notifType = 'order_completed'
      } else if (result.current_status === 'cancelled') {
        notifTitle = 'Pesanan Dibatalkan'
        notifMessage = `Pesanan ${orderId} telah dibatalkan.${reason ? ` Alasan: ${reason}` : ''}`
        notifType = 'order_cancelled'
      }

      await createNotification(client, {
        user_id: orderData.user_id,
        title: notifTitle,
        message: notifMessage,
        type: notifType,
        reference_id: orderId,
        reference_url: `/orders/${orderId}`,
      }).catch((err) => {
        logger.warn('Gagal membuat notifikasi transisi status order', {}, err)
      })
    }
  }

  return successResponse(
    result.message || `Status pesanan berhasil diperbarui menjadi ${targetStatus}`,
    {
      order_id: orderId,
      status: result.current_status,
      previous_status: result.previous_status,
      no_op: result.no_op,
    },
  )
})
