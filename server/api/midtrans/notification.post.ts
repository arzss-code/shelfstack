import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  extractBaseOrderId,
  isMidtransRefundNotification,
  mapMidtransStatus,
  parseAmountToCents,
  parseMidtransRefundNotification,
  verifyMidtransSignature,
} from '../../utils/midtrans'
import { logger } from '../../utils/logger'
import { metrics } from '../../utils/metrics'
import { dispatchOrderTransactionalEmail } from '../../utils/email-dispatcher'

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

  // 1. Verifikasi tanda tangan SHA-512 menggunakan orderId asli dari payload
  const isValidSignature = verifyMidtransSignature({
    orderId,
    statusCode,
    grossAmount,
    serverKey,
    signatureKey,
  })

  if (!isValidSignature) {
    metrics.recordWebhook(false)
    return errorResponse(event, 'Signature tidak valid. Akses webhook ditolak.', null, 403)
  }

  const baseOrderId = extractBaseOrderId(orderId)
  const client = serverSupabaseServiceRole<Database>(event)

  // 2. Deteksi apakah ini merupakan notifikasi REFUND
  if (isMidtransRefundNotification(body)) {
    const parsedRefund = parseMidtransRefundNotification(body)
    const eventKey = `midtrans:refund:${baseOrderId}:${parsedRefund.stage}:${parsedRefund.refundKey || parsedRefund.gatewayRefundId || transactionId || statusCode}:${transactionStatus}`
    const refundAmountCents = parseAmountToCents(
      parsedRefund.refundAmount ??
        (body?.refund_amount ? Number(body.refund_amount) : undefined) ??
        grossAmount,
    )

    const { data: refundResult, error: refundRpcError } = await client.rpc(
      'handle_refund_webhook',
      {
        p_order_id: baseOrderId,
        p_refund_key: parsedRefund.refundKey || null,
        p_gateway_refund_id: parsedRefund.gatewayRefundId || null,
        p_is_success: parsedRefund.isSuccess,
        p_failure_reason: parsedRefund.failureReason || null,
        p_event_key: eventKey,
        p_payload_summary: {
          stage: parsedRefund.stage,
          transaction_status: transactionStatus,
          status_code: statusCode,
          refund_key: body.refund_key,
          refund_chargeback_id: body.refund_chargeback_id,
          bank_confirmed_at: parsedRefund.bankConfirmedAt,
          gross_amount: grossAmount,
          refund_amount_cents: refundAmountCents,
        },
        p_stage: parsedRefund.stage,
        p_bank_confirmed_at: parsedRefund.bankConfirmedAt || null,
        p_refund_amount_cents: refundAmountCents,
      },
    )

    if (refundRpcError) {
      metrics.recordWebhook(false)
      logger.error(
        '[Midtrans Webhook] RPC handle_refund_webhook error',
        {
          requestId: event.context?.requestId,
          orderId: baseOrderId,
        },
        refundRpcError,
      )
      return errorResponse(
        event,
        `Gagal memproses webhook refund di database: ${refundRpcError.message || 'RPC Error'}`,
        refundRpcError,
        500,
      )
    }

    if (
      (refundResult as any)?.no_op &&
      ((refundResult as any)?.result === 'REFUND_IDENTITY_MISMATCH' ||
        (refundResult as any)?.result === 'REFUND_AMOUNT_MISMATCH')
    ) {
      logger.warn(
        `[Midtrans Webhook] Refund event ignored due to ${(refundResult as any).result}`,
        {
          requestId: event.context?.requestId,
          orderId: baseOrderId,
          result: (refundResult as any).result,
        },
      )
      return successResponse(
        `Notifikasi refund diabaikan: ${(refundResult as any).message || (refundResult as any).result}`,
        refundResult,
      )
    }

    metrics.recordWebhook(true)
    return successResponse('Notifikasi refund berhasil diproses', refundResult)
  }

  // 3. Notifikasi Siklus Pembayaran Standar (Payment Lifecycle)
  const newStatus = mapMidtransStatus(transactionStatus, fraudStatus)

  const { data: resultStatus, error: rpcError } = await client.rpc('handle_payment_webhook', {
    p_order_id: baseOrderId,
    p_target_status: newStatus,
    p_payment_type: paymentType || null,
    p_midtrans_id: transactionId || null,
  })

  // 4. Tangani kegagalan RPC secara fail-fast
  if (rpcError) {
    metrics.recordWebhook(false)
    logger.error(
      '[Midtrans Webhook] RPC handle_payment_webhook error',
      {
        requestId: event.context?.requestId,
        orderId: baseOrderId,
        targetStatus: newStatus,
      },
      rpcError,
    )
    return errorResponse(
      event,
      `Gagal memproses transaksi webhook di database: ${rpcError.message || 'RPC Error'}`,
      rpcError,
      500,
    )
  }

  metrics.recordWebhook(true)

  if (newStatus === 'paid') {
    const { data: orderData } = await client
      .from('orders')
      .select('user_id')
      .eq('id', baseOrderId)
      .maybeSingle()

    if (orderData?.user_id) {
      await createNotification(client, {
        user_id: orderData.user_id,
        title: 'Pembayaran Diterima',
        message: `Pembayaran untuk pesanan ${baseOrderId} telah kami terima. Pesanan Anda akan segera diproses.`,
        type: 'payment_success',
        reference_id: baseOrderId,
        reference_url: `/orders/${baseOrderId}`,
      }).catch((err) => {
        logger.warn('Gagal membuat notifikasi payment_success', {}, err)
      })

      // Kirim email pembayaran sukses (payment_success) secara fail-open
      void dispatchOrderTransactionalEmail(client, baseOrderId, 'payment_success')
    }
  }

  return successResponse('Status pesanan berhasil diproses', {
    order_id: baseOrderId,
    result: resultStatus,
    target_status: newStatus,
  })
})
