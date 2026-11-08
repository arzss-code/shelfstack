import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { fetchMidtransTransactionStatus, mapMidtransStatus } from '../../../utils/midtrans'
import {
  resolveCandidateLookupIds,
  evaluateRefundReconciliation,
} from '../../../utils/payment-reconciliation'
import { logger } from '../../../utils/logger'
import { metrics } from '../../../utils/metrics'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method !== 'POST') {
    return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
  }

  const { user, profile } = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)
  const config = useRuntimeConfig(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse(event, 'ID pesanan diperlukan', null, 400)
  }

  // 1. Ambil data order dari database
  const { data: order, error } = await client.from('orders').select('*').eq('id', id).single()

  if (error || !order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', error, 404)
  }

  // Otorisasi: hanya pemilik atau admin yang bisa mengakses
  if (order.user_id !== user.id && profile.role !== 'admin') {
    return errorResponse(event, 'Akses pesanan ditolak', null, 403)
  }

  // 2. Cek apakah ada refund pending yang membutuhkan rekonsiliasi
  const { data: pendingRefund } = await client
    .from('refunds')
    .select('*')
    .eq('order_id', order.id)
    .eq('status', 'pending')
    .maybeSingle()

  // Jika pesanan sudah berstatus terminal atau lunas tanpa ada pending refund:
  if (order.status !== 'pending' && !pendingRefund) {
    return successResponse('Status pesanan sudah terverifikasi', {
      order_id: order.id,
      status: order.status,
      is_paid: order.status === 'paid',
      is_refunded: order.status === 'refunded',
    })
  }

  const serverKey = config.midtransServerKey
  if (!serverKey) {
    return errorResponse(
      event,
      'Konfigurasi Midtrans Server Key belum disetel di server.',
      null,
      500,
    )
  }

  const isSandbox = config.public?.enableMidtransSandbox ?? true

  try {
    const body = await readBody(event).catch(() => ({}))
    const candidateOrderIds = resolveCandidateLookupIds({
      orderId: order.id,
      bodyOrderId: body?.midtrans_order_id,
      orderMidtransId: order.midtrans_id,
      gatewayTransactionId: pendingRefund?.gateway_transaction_id,
    })

    let midtransData: Record<string, unknown> | null = null
    for (const lookupId of candidateOrderIds) {
      const statusRes = await fetchMidtransTransactionStatus(lookupId, serverKey, isSandbox)
      if (statusRes.success && statusRes.data?.transaction_status) {
        midtransData = statusRes.data
        break
      }
    }

    if (!midtransData || !midtransData.transaction_status) {
      return successResponse('Status belum diperbarui oleh Payment Gateway', {
        order_id: order.id,
        status: order.status,
        is_paid: order.status === 'paid',
      })
    }

    // 3. REKONSILIASI REFUND PENDING (Jika order memiliki pending refund)
    if (pendingRefund) {
      const decision = evaluateRefundReconciliation(midtransData, pendingRefund)
      const serviceRoleClient = serverSupabaseServiceRole<Database>(event)

      if (decision.action === 'FINALIZE_SUCCESS') {
        const { error: finErr } = await serviceRoleClient.rpc('finalize_refund', {
          p_refund_id: pendingRefund.id,
          p_success: true,
          p_gateway_refund_id: decision.gatewayRefundId || null,
          p_failure_reason: null,
          p_bank_confirmed_at: decision.bankConfirmedAt || null,
        })

        if (finErr) {
          metrics.recordReconciliation(false)
          logger.error(
            '[check-payment-status] Gagal finalize_refund saat rekonsiliasi',
            {
              requestId: event.context?.requestId,
              orderId: order.id,
              refundId: pendingRefund.id,
            },
            finErr,
          )
          return errorResponse(
            event,
            `Gagal menyelesaikan finalisasi refund di database: ${finErr.message}`,
            finErr,
            500,
          )
        }

        metrics.recordReconciliation(true)
        return successResponse(decision.message, {
          order_id: order.id,
          status: 'refunded',
          refund_status: 'succeeded',
          bank_confirmed_at: decision.bankConfirmedAt,
          is_paid: false,
          is_refunded: true,
          reconciled: true,
        })
      }

      if (decision.action === 'FINALIZE_REJECTED') {
        await serviceRoleClient.rpc('finalize_refund', {
          p_refund_id: pendingRefund.id,
          p_success: false,
          p_gateway_refund_id: null,
          p_failure_reason: 'Refund ditolak oleh gateway pada saat rekonsiliasi',
        })

        metrics.recordReconciliation(true)
        return successResponse(decision.message, {
          order_id: order.id,
          status: 'paid',
          refund_status: 'failed',
          is_paid: true,
          is_refunded: false,
          reconciled: true,
        })
      }

      // Action WAITING: simpan gateway_refund_id jika baru terbit
      if (decision.matchingRefund?.refund_chargeback_id && !pendingRefund.gateway_refund_id) {
        await serviceRoleClient
          .from('refunds')
          .update({
            gateway_refund_id: String(decision.matchingRefund.refund_chargeback_id),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingRefund.id)
      }

      return successResponse(decision.message, {
        order_id: order.id,
        status: order.status,
        refund_status: 'pending',
        stage: decision.matchingRefund ? 'accepted' : 'processing',
        is_paid: true,
        is_refunded: false,
        reconciled: false,
      })
    }

    // 4. REKONSILIASI PEMBAYARAN STANDAR (Pending Order)
    const txStatus = String(midtransData.transaction_status || '')
    const fraudStatus =
      typeof midtransData.fraud_status === 'string' ? midtransData.fraud_status : null
    const targetStatus = mapMidtransStatus(txStatus, fraudStatus)

    if (targetStatus !== order.status) {
      const serviceRoleClient = serverSupabaseServiceRole<Database>(event)
      const { error: rpcErr } = await serviceRoleClient.rpc('handle_payment_webhook', {
        p_order_id: order.id,
        p_target_status: targetStatus,
        p_payment_type:
          typeof midtransData.payment_type === 'string' ? midtransData.payment_type : null,
        p_midtrans_id:
          typeof midtransData.transaction_id === 'string' ? midtransData.transaction_id : null,
      })

      if (rpcErr) {
        metrics.recordReconciliation(false)
        logger.error(
          '[check-payment-status] RPC handle_payment_webhook error',
          {
            requestId: event.context?.requestId,
            orderId: order.id,
            targetStatus,
          },
          rpcErr,
        )
        return errorResponse(
          event,
          `Gagal memproses sinkronisasi pembayaran di database: ${rpcErr.message}`,
          rpcErr,
          500,
        )
      }
    }

    metrics.recordReconciliation(true)
    return successResponse('Pemeriksaan status pembayaran berhasil', {
      order_id: order.id,
      status: targetStatus,
      is_paid: targetStatus === 'paid',
      transaction_status: midtransData.transaction_status,
      payment_type: midtransData.payment_type,
    })
  } catch (err: unknown) {
    metrics.recordReconciliation(false)
    logger.error(
      '[check-payment-status] Error saat memeriksa status ke Midtrans',
      {
        requestId: event.context?.requestId,
        orderId: order.id,
      },
      err,
    )
    return errorResponse(
      event,
      'Gagal memeriksa status pembayaran ke payment gateway. Silakan coba beberapa saat lagi.',
      null,
      502,
    )
  }
})
