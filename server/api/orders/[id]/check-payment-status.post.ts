import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { fetchMidtransTransactionStatus, mapMidtransStatus } from '../../../utils/midtrans'
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
    const candidateOrderIds: string[] = [order.id]
    if (body?.midtrans_order_id && !candidateOrderIds.includes(body.midtrans_order_id)) {
      candidateOrderIds.unshift(body.midtrans_order_id)
    }
    if (order.midtrans_id && !candidateOrderIds.includes(order.midtrans_id)) {
      candidateOrderIds.push(order.midtrans_id)
    }
    if (
      pendingRefund?.gateway_transaction_id &&
      !candidateOrderIds.includes(pendingRefund.gateway_transaction_id)
    ) {
      candidateOrderIds.push(pendingRefund.gateway_transaction_id)
    }

    let midtransData: any = null
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
      const refundsList: any[] = Array.isArray(midtransData.refunds) ? midtransData.refunds : []
      const expectedCents = pendingRefund.amount_cents

      let matchingRefund: any = undefined
      let bankConfirmedAt: string | undefined = undefined
      let isAmountMatched = false

      if (refundsList.length > 0) {
        // A. Cari refund entry spesifik menggunakan identifier yang paling reliable (refund_key atau gateway_refund_id)
        matchingRefund = refundsList.find((r: any) => {
          const keyMatch = Boolean(r.refund_key && r.refund_key === pendingRefund.idempotency_key)
          const idMatch = Boolean(
            pendingRefund.gateway_refund_id &&
            (String(r.refund_chargeback_id) === String(pendingRefund.gateway_refund_id) ||
              String(r.id) === String(pendingRefund.gateway_refund_id)),
          )
          return keyMatch || idMatch
        })

        if (matchingRefund) {
          // PENTING: Hanya gunakan bank_confirmed_at DARI MATCHING REFUND INI!
          // Jangan pernah mengambil dari sembarang refund lain di riwayat refunds!
          bankConfirmedAt = matchingRefund.bank_confirmed_at
            ? String(matchingRefund.bank_confirmed_at)
            : undefined

          if (matchingRefund.refund_amount) {
            const gatewayCents = Math.round(parseFloat(matchingRefund.refund_amount) * 100)
            isAmountMatched = gatewayCents === expectedCents
          } else {
            isAmountMatched = true
          }
        } else {
          // Ada daftar refunds di gateway, tetapi tidak ada satupun yang cocok dengan pendingRefund ini!
          // Identity mismatch: Jangan sentuh pendingRefund ini dan jangan memfinalisasi.
          isAmountMatched = false
          bankConfirmedAt = undefined
        }
      } else if (midtransData.transaction_status === 'refund' || midtransData.refund_key) {
        // Fallback hanya jika refundsList kosong (flat gateway response)
        const keyMatch =
          !midtransData.refund_key || midtransData.refund_key === pendingRefund.idempotency_key
        const idMatch =
          !midtransData.refund_chargeback_id ||
          !pendingRefund.gateway_refund_id ||
          String(midtransData.refund_chargeback_id) === String(pendingRefund.gateway_refund_id)

        if (keyMatch && idMatch) {
          bankConfirmedAt = midtransData.bank_confirmed_at
            ? String(midtransData.bank_confirmed_at)
            : undefined
          const rawAmount = midtransData.refund_amount || midtransData.gross_amount
          if (rawAmount) {
            const gatewayCents = Math.round(parseFloat(rawAmount) * 100)
            isAmountMatched = gatewayCents === expectedCents
          } else {
            isAmountMatched = true
          }
        }
      }

      const isRefundRejected =
        String(midtransData.refund_chargeback_status || '').toLowerCase() === 'rejected' ||
        String(midtransData.refund_chargeback_status || '').toLowerCase() === 'failed' ||
        String(matchingRefund?.status || '').toLowerCase() === 'rejected'

      // C. Cek apakah refund sudah terkonfirmasi resmi oleh bank DENGAN identitas & amount yang cocok
      if (bankConfirmedAt && isAmountMatched && !isRefundRejected) {
        const gatewayRefundId = matchingRefund?.refund_chargeback_id
          ? String(matchingRefund.refund_chargeback_id)
          : midtransData.transaction_id || null

        const serviceRoleClient = serverSupabaseServiceRole<Database>(event)
        const { error: finErr } = await serviceRoleClient.rpc('finalize_refund', {
          p_refund_id: pendingRefund.id,
          p_success: true,
          p_gateway_refund_id: gatewayRefundId,
          p_failure_reason: null,
          p_bank_confirmed_at: bankConfirmedAt,
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
        return successResponse(
          'Refund berhasil dikonfirmasi dan diselesaikan melalui rekonsiliasi',
          {
            order_id: order.id,
            status: 'refunded',
            refund_status: 'succeeded',
            bank_confirmed_at: bankConfirmedAt,
            is_paid: false,
            is_refunded: true,
            reconciled: true,
          },
        )
      }

      if (isRefundRejected) {
        // Gateway menolak refund secara definitif
        const serviceRoleClient = serverSupabaseServiceRole<Database>(event)
        await serviceRoleClient.rpc('finalize_refund', {
          p_refund_id: pendingRefund.id,
          p_success: false,
          p_gateway_refund_id: null,
          p_failure_reason: 'Refund ditolak oleh gateway pada saat rekonsiliasi',
        })

        metrics.recordReconciliation(true)
        return successResponse('Refund tercatat ditolak oleh payment gateway', {
          order_id: order.id,
          status: 'paid',
          refund_status: 'failed',
          is_paid: true,
          is_refunded: false,
          reconciled: true,
        })
      }

      // D. Refund masih dalam tahap 'accepted' atau menunggu konfirmasi bank (bank_confirmed_at belum ada)
      // JANGAN finalize premature! Order tetap paid, stok tetap utuh!
      if (matchingRefund?.refund_chargeback_id && !pendingRefund.gateway_refund_id) {
        const serviceRoleClient = serverSupabaseServiceRole<Database>(event)
        await serviceRoleClient
          .from('refunds')
          .update({
            gateway_refund_id: String(matchingRefund.refund_chargeback_id),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pendingRefund.id)
      }

      return successResponse(
        matchingRefund
          ? 'Refund telah diterima oleh gateway dan sedang menunggu konfirmasi bank (bank_confirmed_at)'
          : 'Status refund masih dalam proses verifikasi oleh Payment Gateway',
        {
          order_id: order.id,
          status: order.status,
          refund_status: 'pending',
          stage: matchingRefund ? 'accepted' : 'processing',
          is_paid: true,
          is_refunded: false,
          reconciled: false,
        },
      )
    }

    // 4. REKONSILIASI PEMBAYARAN STANDAR (Pending Order)
    const targetStatus = mapMidtransStatus(
      midtransData.transaction_status,
      midtransData.fraud_status,
    )

    if (targetStatus !== order.status) {
      const serviceRoleClient = serverSupabaseServiceRole<Database>(event)
      const { error: rpcErr } = await serviceRoleClient.rpc('handle_payment_webhook', {
        p_order_id: order.id,
        p_target_status: targetStatus,
        p_payment_type: midtransData.payment_type || null,
        p_midtrans_id: midtransData.transaction_id || null,
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
