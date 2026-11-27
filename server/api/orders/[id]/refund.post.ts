import crypto from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { executeMidtransRefund, type MidtransRefundResult } from '../../../utils/midtrans'
import { logger } from '../../../utils/logger'
import { metrics } from '../../../utils/metrics'
import { enrichRecentOrderActivityDevice } from '../../../utils/activity-log'

export default defineEventHandler(async (event) => {
  // 1. Authorization: Administrator Only
  await requireAdmin(event)

  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const body = await readBody(event).catch(() => ({}))
  let reason = (body?.reason as string) || 'Permintaan refund oleh Administrator'

  // Task 07.4: Jalur admin terisolasi menggunakan service role setelah otorisasi requireAdmin lulus
  const client = serverSupabaseServiceRole<Database>(event)

  // 2. Idempotency Key Handling (adopsi permintaan refund pelanggan jika ada)
  const headerKey = getHeader(event, 'idempotency-key')
  const explicitKey =
    headerKey?.trim() ||
    (typeof body?.idempotency_key === 'string' && body.idempotency_key.trim()) ||
    ''

  let idempotencyKey = explicitKey
  if (!idempotencyKey) {
    const { data: pendingCustomerReq } = await client
      .from('refunds')
      .select('id, idempotency_key, reason')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .like('idempotency_key', 'cust-refund-req-%')
      .is('gateway_refund_id', null)
      .maybeSingle()

    if (pendingCustomerReq?.idempotency_key) {
      idempotencyKey = pendingCustomerReq.idempotency_key
      if (!body?.reason && pendingCustomerReq.reason) {
        reason = pendingCustomerReq.reason
      }
    } else {
      idempotencyKey = crypto.randomUUID()
    }
  }

  // 3. Inisiasi Refund Attempt secara atomik di PostgreSQL (mengunci order dengan FOR UPDATE)
  const { data: attemptData, error: attemptError } = await client.rpc('create_refund_attempt', {
    p_order_id: orderId,
    p_idempotency_key: idempotencyKey,
    p_reason: reason,
  })

  if (attemptError) {
    metrics.recordRefund(false)
    const errorMsg = attemptError.message || 'Gagal memulai proses refund'

    if (errorMsg.includes('ORDER_NOT_FOUND')) {
      return errorResponse(event, 'Pesanan tidak ditemukan', attemptError, 404)
    }

    if (errorMsg.includes('INVALID_ORDER_STATE_FOR_REFUND')) {
      return errorResponse(event, errorMsg, attemptError, 409)
    }

    if (errorMsg.includes('REFUND_ALREADY_IN_PROGRESS')) {
      return errorResponse(event, errorMsg, attemptError, 409)
    }

    if (errorMsg.includes('FORBIDDEN_NOT_ADMIN')) {
      return errorResponse(event, 'Akses ditolak. Hanya admin.', attemptError, 403)
    }

    return errorResponse(event, errorMsg, attemptError, 500)
  }

  const attempt = attemptData as {
    refund_id: string
    order_id: string
    amount_cents: number
    status: 'pending' | 'succeeded' | 'failed'
    idempotency_key: string
    gateway_transaction_id?: string
    is_replay: boolean
  }

  // Jika ini adalah request replay dari refund yang sudah pernah SUCCEEDED sebelumnya:
  if (attempt.is_replay && attempt.status === 'succeeded') {
    return successResponse('Refund sudah berhasil diproses sebelumnya (idempotent)', {
      refund_id: attempt.refund_id,
      order_id: attempt.order_id,
      amount_cents: attempt.amount_cents,
      status: 'succeeded',
      order_status: 'refunded',
      is_replay: true,
    })
  }

  // 4. Hubungi Payment Gateway (Midtrans Core Refund API)
  const config = useRuntimeConfig()
  const serverKey = config.midtransServerKey
  const isSandbox = config.public?.enableMidtransSandbox ?? true

  const refundAmountRupiah = Math.max(1, Math.round(attempt.amount_cents / 100))
  const gatewayTargetId = attempt.gateway_transaction_id || orderId

  let gatewayResult: MidtransRefundResult

  if (serverKey) {
    gatewayResult = await executeMidtransRefund({
      orderIdOrTransactionId: gatewayTargetId,
      amount: refundAmountRupiah,
      reason,
      refundKey: idempotencyKey,
      serverKey,
      isSandbox,
    })
  } else {
    // Jika serverKey belum dikonfigurasi di environment
    gatewayResult = {
      success: false,
      statusCode: '500',
      error: 'Midtrans Server Key tidak terkonfigurasi pada server.',
      statusMessage: 'Gateway configuration missing',
      gatewayRefundId: undefined,
    }
  }

  if (!gatewayResult.success) {
    metrics.recordRefund(false)
    logger.warn('[Refund] Gateway rejected refund request', {
      requestId: event.context?.requestId,
      orderId,
      refundId: attempt.refund_id,
      reason: gatewayResult.error,
    })

    // Gateway explicitly rejected the refund request
    const { data: finalizeData } = await client.rpc('finalize_refund', {
      p_refund_id: attempt.refund_id,
      p_success: false,
      p_gateway_refund_id: null,
      p_failure_reason: gatewayResult.error || 'Refund ditolak oleh payment gateway',
    })

    const failureCode =
      gatewayResult.statusCode === '412' || gatewayResult.statusCode === '400' ? 422 : 502
    return errorResponse(
      event,
      gatewayResult.error || 'Refund ditolak oleh payment gateway',
      finalizeData,
      failureCode,
    )
  }

  // Gateway accepted the request. Check whether bank confirmation has arrived:
  if (gatewayResult.bankConfirmedAt) {
    // Immediate bank confirmation (rare/direct provider settlement)
    const { data: finalizeData, error: finalizeError } = await client.rpc('finalize_refund', {
      p_refund_id: attempt.refund_id,
      p_success: true,
      p_gateway_refund_id: gatewayResult.gatewayRefundId || null,
      p_failure_reason: null,
    })

    if (finalizeError) {
      metrics.recordRefund(false)
      logger.error(
        '[Refund] Gagal memperbarui status finalisasi refund',
        {
          requestId: event.context?.requestId,
          orderId,
          refundId: attempt.refund_id,
        },
        finalizeError,
      )
      return errorResponse(
        event,
        'Gagal memperbarui status finalisasi refund di database',
        finalizeError,
        500,
      )
    }

    const finalResult = finalizeData as {
      refund_id: string
      order_id: string
      status: 'succeeded' | 'failed'
      order_status: string
      bank_confirmed_at?: string
    }

    await enrichRecentOrderActivityDevice(event, orderId, client)
    metrics.recordRefund(true)
    return successResponse('Refund berhasil diproses dan dikonfirmasi oleh payment gateway', {
      refund_id: finalResult.refund_id,
      order_id: finalResult.order_id,
      amount_cents: attempt.amount_cents,
      status: finalResult.status,
      order_status: finalResult.order_status,
      gateway_refund_id: gatewayResult.gatewayRefundId,
      bank_confirmed_at: gatewayResult.bankConfirmedAt,
    })
  }

  // 2-Step Midtrans Async Flow:
  // Request is accepted/approved by Midtrans, awaiting bank confirmation (bank_confirmed_at).
  // Do NOT finalize prematurely: order remains paid, stock remains untouched!
  if (gatewayResult.gatewayRefundId) {
    await client
      .from('refunds')
      .update({
        gateway_refund_id: gatewayResult.gatewayRefundId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', attempt.refund_id)
  }

  await enrichRecentOrderActivityDevice(event, orderId, client)
  metrics.recordRefund(true)
  return successResponse(
    'Permintaan refund telah diterima oleh payment gateway dan menunggu konfirmasi bank (bank_confirmed_at)',
    {
      refund_id: attempt.refund_id,
      order_id: attempt.order_id,
      amount_cents: attempt.amount_cents,
      status: 'pending',
      order_status: 'paid',
      gateway_refund_id: gatewayResult.gatewayRefundId,
      stage: 'accepted',
      awaiting_bank_confirmation: true,
    },
  )
})
