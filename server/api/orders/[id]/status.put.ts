import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  isAllowedTransition,
  type OrderStatus,
} from '../../../../shared/constants/order-transitions'

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

  const client = await serverSupabaseClient<Database>(event)

  // 1. Ambil status pesanan saat ini
  const { data: currentOrder, error: fetchError } = await client
    .from('orders')
    .select('id, status, user_id, total_cents')
    .eq('id', orderId)
    .single()

  if (fetchError || !currentOrder) {
    return errorResponse(event, 'Pesanan tidak ditemukan', fetchError, 404)
  }

  // 2. Validasi transisi status hukum (legal transition state machine)
  const currentStatus = currentOrder.status as OrderStatus
  if (!isAllowedTransition(currentStatus, targetStatus)) {
    return errorResponse(
      event,
      `Transisi status tidak diizinkan: ${currentStatus} -> ${targetStatus}`,
      { current_status: currentStatus, target_status: targetStatus },
      400,
    )
  }

  // 3. Jika target pembatalan ('cancelled'), delegasikan ke RPC atomik cancel_order (restock otomatis)
  if (targetStatus === 'cancelled') {
    const { error: cancelError } = await client.rpc('cancel_order', {
      p_order_id: orderId,
      p_reason: reason || 'Pesanan dibatalkan oleh Admin',
    })

    if (cancelError) {
      return errorResponse(
        event,
        cancelError.message || 'Gagal membatalkan pesanan',
        cancelError,
        400,
      )
    }

    return successResponse('Pesanan berhasil dibatalkan dan stok produk dikembalikan', {
      order_id: orderId,
      status: 'cancelled',
    })
  }

  // 4. Update status ke database
  const updatePayload: Database['public']['Tables']['orders']['Update'] = {
    status: targetStatus,
    updated_at: new Date().toISOString(),
  }

  if (targetStatus === 'paid') {
    updatePayload.paid_at = new Date().toISOString()
  }

  const { error: updateError } = await client.from('orders').update(updatePayload).eq('id', orderId)

  if (updateError) {
    return errorResponse(event, 'Gagal memperbarui status pesanan', updateError, 500)
  }

  // 5. Catat audit log di activity_logs
  try {
    const deviceInfo = getDeviceInfo(event)
    await client.from('activity_logs').insert({
      entity_type: 'order',
      entity_id: 0,
      action: 'UPDATE',
      description:
        reason ||
        `Status pesanan diubah dari ${currentStatus} ke ${targetStatus} oleh Administrator`,
      old_data: { order_id: orderId, status: currentStatus },
      new_data: { order_id: orderId, status: targetStatus },
      ip_address: deviceInfo.ipAddress,
      browser: deviceInfo.browser,
      platform: deviceInfo.platform,
    })
  } catch {
    // Audit log failure shouldn't rollback status update
  }

  return successResponse(`Status pesanan berhasil diperbarui menjadi ${targetStatus}`, {
    order_id: orderId,
    status: targetStatus,
  })
})
