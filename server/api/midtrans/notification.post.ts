import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { mapMidtransStatus, verifyMidtransSignature } from '../../utils/midtrans'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method !== 'POST') {
    return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
  }

  const config = useRuntimeConfig(event)
  const serverKey = config.midtransServerKey

  if (!serverKey) {
    return errorResponse(
      event,
      'Konfigurasi Midtrans Server Key belum disetel di server.',
      null,
      500,
    )
  }

  const body = await readBody(event)
  if (!body) {
    return errorResponse(event, 'Payload kosong', null, 400)
  }

  const {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    transaction_status: transactionStatus,
    fraud_status: fraudStatus,
    payment_type: paymentType,
    transaction_id: transactionId,
  } = body

  // 1. Verifikasi tanda tangan SHA-512
  const isValidSignature = verifyMidtransSignature({
    orderId,
    statusCode,
    grossAmount,
    serverKey,
    signatureKey,
  })

  if (!isValidSignature) {
    return errorResponse(event, 'Signature tidak valid. Akses webhook ditolak.', null, 403)
  }

  // 2. Pemetaan status transaksi
  const newStatus = mapMidtransStatus(transactionStatus, fraudStatus)

  // 3. Update status pesanan di database dengan service_role (karena webhook dipanggil oleh server Midtrans)
  const client = serverSupabaseServiceRole<Database>(event)

  const updatePayload = {
    status: newStatus,
    payment_type: paymentType || null,
    midtrans_id: transactionId || null,
    paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  const { data: updatedOrder, error: updateError } = await client
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select()
    .single()

  if (updateError) {
    return errorResponse(event, 'Gagal memperbarui status order di database', updateError, 500)
  }

  return successResponse('Status pesanan berhasil diperbarui', {
    order_id: orderId,
    status: updatedOrder.status,
  })
})
