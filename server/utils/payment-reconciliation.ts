/**
 * Server Payment Reconciliation Deep Module
 * Mengisolasi logika pencarian ID kandidat dan evaluasi status rekonsiliasi refund Midtrans.
 */

export interface CandidateLookupParams {
  orderId: string
  bodyOrderId?: string | null
  orderMidtransId?: string | null
  gatewayTransactionId?: string | null
}

/**
 * Menyusun daftar ID kandidat unik untuk pencarian status di gateway pembayaran.
 */
export function resolveCandidateLookupIds(params: CandidateLookupParams): string[] {
  const candidateOrderIds: string[] = [params.orderId]

  if (params.bodyOrderId && !candidateOrderIds.includes(params.bodyOrderId)) {
    candidateOrderIds.unshift(params.bodyOrderId)
  }
  if (params.orderMidtransId && !candidateOrderIds.includes(params.orderMidtransId)) {
    candidateOrderIds.push(params.orderMidtransId)
  }
  if (params.gatewayTransactionId && !candidateOrderIds.includes(params.gatewayTransactionId)) {
    candidateOrderIds.push(params.gatewayTransactionId)
  }

  return candidateOrderIds
}

export interface PendingRefundContext {
  id: string
  amount_cents: number
  idempotency_key?: string | null
  gateway_refund_id?: string | null
}

export interface RefundItemFromGateway {
  id?: string | number
  refund_key?: string
  refund_chargeback_id?: string | number
  bank_confirmed_at?: string
  refund_amount?: string | number
  status?: string
}

export type RefundReconciliationAction = 'FINALIZE_SUCCESS' | 'FINALIZE_REJECTED' | 'WAITING'

export interface RefundReconciliationDecision {
  action: RefundReconciliationAction
  bankConfirmedAt?: string
  gatewayRefundId?: string | null
  matchingRefund?: RefundItemFromGateway
  isAmountMatched: boolean
  message: string
}

/**
 * Mengevaluasi respons gateway Midtrans terhadap pending refund lokal dengan validasi identitas dan nominal ketat.
 */
export function evaluateRefundReconciliation(
  midtransData: Record<string, unknown>,
  pendingRefund: PendingRefundContext,
): RefundReconciliationDecision {
  const refundsList: RefundItemFromGateway[] = Array.isArray(midtransData.refunds)
    ? (midtransData.refunds as RefundItemFromGateway[])
    : []
  const expectedCents = pendingRefund.amount_cents

  let matchingRefund: RefundItemFromGateway | undefined = undefined
  let bankConfirmedAt: string | undefined = undefined
  let isAmountMatched = false

  if (refundsList.length > 0) {
    // A. Cari refund entry spesifik menggunakan identifier yang paling reliable
    matchingRefund = refundsList.find((r) => {
      const keyMatch = Boolean(
        r.refund_key &&
        pendingRefund.idempotency_key &&
        r.refund_key === pendingRefund.idempotency_key,
      )
      const idMatch = Boolean(
        pendingRefund.gateway_refund_id &&
        (String(r.refund_chargeback_id) === String(pendingRefund.gateway_refund_id) ||
          String(r.id) === String(pendingRefund.gateway_refund_id)),
      )
      return keyMatch || idMatch
    })

    if (matchingRefund) {
      bankConfirmedAt = matchingRefund.bank_confirmed_at
        ? String(matchingRefund.bank_confirmed_at)
        : undefined

      if (matchingRefund.refund_amount !== undefined && matchingRefund.refund_amount !== null) {
        const gatewayCents = Math.round(parseFloat(String(matchingRefund.refund_amount)) * 100)
        isAmountMatched = gatewayCents === expectedCents
      } else {
        isAmountMatched = true
      }
    } else {
      isAmountMatched = false
      bankConfirmedAt = undefined
    }
  } else if (midtransData.transaction_status === 'refund' || midtransData.refund_key) {
    // Fallback jika refundsList kosong (flat gateway response)
    const keyMatch =
      !midtransData.refund_key ||
      !pendingRefund.idempotency_key ||
      midtransData.refund_key === pendingRefund.idempotency_key
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
        const gatewayCents = Math.round(parseFloat(String(rawAmount)) * 100)
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

  if (bankConfirmedAt && isAmountMatched && !isRefundRejected) {
    const gatewayRefundId = matchingRefund?.refund_chargeback_id
      ? String(matchingRefund.refund_chargeback_id)
      : typeof midtransData.transaction_id === 'string'
        ? midtransData.transaction_id
        : null

    return {
      action: 'FINALIZE_SUCCESS',
      bankConfirmedAt,
      gatewayRefundId,
      matchingRefund,
      isAmountMatched: true,
      message: 'Refund berhasil dikonfirmasi dan diselesaikan melalui rekonsiliasi',
    }
  }

  if (isRefundRejected) {
    return {
      action: 'FINALIZE_REJECTED',
      matchingRefund,
      isAmountMatched,
      message: 'Refund tercatat ditolak oleh payment gateway',
    }
  }

  return {
    action: 'WAITING',
    matchingRefund,
    isAmountMatched,
    message: matchingRefund
      ? 'Refund telah diterima oleh gateway dan sedang menunggu konfirmasi bank (bank_confirmed_at)'
      : 'Status refund masih dalam proses verifikasi oleh Payment Gateway',
  }
}
