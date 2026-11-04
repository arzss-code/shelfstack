import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { updateReturnTrackingSchema } from '../../../../../shared/schemas/return-request'
import { requireUser } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { createNotification } from '../../../../utils/notifications'
import { logger } from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id
  const client = await serverSupabaseClient<Database>(event)

  // 1. Validasi body
  const body = await readBody(event)
  const parseResult = updateReturnTrackingSchema.safeParse(body)
  if (!parseResult.success) {
    return errorResponse(
      event,
      parseResult.error.issues[0]?.message || 'Data resi pengiriman tidak valid',
      parseResult.error.issues,
      400,
    )
  }
  const payload = parseResult.data

  // 2. Ambil tiket retur
  const { data: returnTicket, error: fetchError } = await client
    .from('return_requests')
    .select('*')
    .eq('order_id', orderId)
    .eq('user_id', targetUserId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) {
    return errorResponse(event, 'Gagal mengambil data tiket retur', fetchError.message, 500)
  }

  if (!returnTicket) {
    return errorResponse(event, 'Tiket retur tidak ditemukan untuk pesanan ini', null, 404)
  }

  // 3. Hanya status 'approved' yang boleh menginput nomor resi kirim balik
  if (returnTicket.status !== 'approved') {
    return errorResponse(
      event,
      `Nomor resi hanya dapat diinput jika pengajuan berstatus disetujui (saat ini: ${returnTicket.status})`,
      null,
      422,
    )
  }

  // 4. Update data resi pengembalian
  const { data: updatedTicket, error: updateError } = await client
    .from('return_requests')
    .update({
      return_courier: payload.return_courier,
      return_tracking_number: payload.return_tracking_number,
      updated_at: new Date().toISOString(),
    })
    .eq('id', returnTicket.id)
    .select()
    .single()

  if (updateError) {
    return errorResponse(
      event,
      'Gagal memperbarui nomor resi pengembalian',
      updateError.message,
      500,
    )
  }

  // 5. Kirim notifikasi konfirmasi
  await createNotification(client, {
    user_id: targetUserId,
    title: 'Resi Pengembalian Tercatat',
    message: `Resi ${payload.return_courier.toUpperCase()} (${payload.return_tracking_number}) telah tercatat. Tim gudang kami akan mengonfirmasi ketika paket tiba.`,
    type: 'system',
    reference_id: returnTicket.id,
    reference_url: `/orders/${orderId}`,
  }).catch((err) => {
    logger.warn('[RMA] Gagal membuat notifikasi resi balik', {}, err)
  })

  return successResponse('Nomor resi pengembalian berhasil disimpan', updatedTicket)
})
