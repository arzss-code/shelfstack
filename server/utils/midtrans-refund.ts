export interface MidtransRefundParams {
  orderIdOrTransactionId: string
  amount: number
  reason: string
  refundKey: string
  serverKey: string
  isSandbox?: boolean
}

export interface MidtransRefundResult {
  success: boolean
  statusCode: string
  statusMessage?: string
  gatewayRefundId?: string
  refundAmount?: string
  bankConfirmedAt?: string
  error?: string
}

/**
 * Eksekusi Refund langsung ke Midtrans Refund Core API (/v2/:id/refund).
 * Dokumen resmi: https://docs.midtrans.com/reference/refund-transaction
 */
export async function executeMidtransRefund(
  params: MidtransRefundParams,
): Promise<MidtransRefundResult> {
  const { orderIdOrTransactionId, amount, reason, refundKey, serverKey, isSandbox = true } = params

  if (!serverKey) {
    return {
      success: false,
      statusCode: '500',
      error: 'Midtrans Server Key tidak dikonfigurasi di environment.',
    }
  }

  const baseUrl = isSandbox ? 'https://api.sandbox.midtrans.com/v2' : 'https://api.midtrans.com/v2'
  const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64')

  try {
    const response = await $fetch<Record<string, unknown>>(
      `${baseUrl}/${orderIdOrTransactionId}/refund`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: {
          refund_key: refundKey,
          amount: Math.round(amount),
          reason: reason || 'Customer request via Admin',
        },
      },
    )

    const statusCode = String(response?.status_code || '200')
    const isApproved = statusCode === '200' || statusCode === '201' || statusCode === '202'
    const bankConfirmedAt = response?.bank_confirmed_at
      ? String(response.bank_confirmed_at)
      : undefined

    return {
      success: isApproved,
      statusCode,
      statusMessage:
        typeof response?.status_message === 'string' ? response.status_message : undefined,
      gatewayRefundId: response?.refund_chargeback_id
        ? String(response.refund_chargeback_id)
        : typeof response?.transaction_id === 'string'
          ? response.transaction_id
          : undefined,
      refundAmount:
        typeof response?.refund_amount === 'string' ? response.refund_amount : undefined,
      bankConfirmedAt,
    }
  } catch (err: unknown) {
    const errorObj = err as {
      data?: { status_code?: string | number; status_message?: string }
      status?: number
      message?: string
    }
    const errorData = errorObj?.data
    const statusCode = String(errorData?.status_code || errorObj?.status || '502')
    const statusMessage =
      errorData?.status_message || errorObj?.message || 'Gagal menghubungi payment gateway'

    return {
      success: false,
      statusCode,
      statusMessage,
      error: statusMessage,
    }
  }
}

/**
 * Mendeteksi apakah notifikasi webhook dari Midtrans merupakan sinyal refund.
 * Sinyal refund resmi:
 * - transaction_status === 'refund' atau 'partial_refund'
 * - memiliki refund_key atau refund_chargeback_id
 */
export function isMidtransRefundNotification(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false
  const obj = body as Record<string, unknown>
  const txStatus = obj.transaction_status
  return (
    txStatus === 'refund' ||
    txStatus === 'partial_refund' ||
    Boolean(obj.refund_key) ||
    Boolean(obj.refund_chargeback_id)
  )
}

export type RefundEventStage = 'accepted' | 'confirmed' | 'failed'

export interface ParsedRefundNotification {
  stage: RefundEventStage
  isSuccess: boolean
  isAccepted: boolean
  orderId: string
  refundKey?: string
  gatewayRefundId?: string
  bankConfirmedAt?: string
  refundAmount?: number
  statusCode: string
  statusMessage?: string
  failureReason?: string
}

/**
 * Mengonversi nilai nominal uang ke format cents (integer) secara aman
 * untuk menghindari masalah ketelitian floating-point.
 */
export function parseAmountToCents(amount: string | number | undefined | null): number | null {
  if (amount === undefined || amount === null || amount === '') return null
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount))
  if (isNaN(num)) return null
  return Math.round(num * 100)
}

interface NestedRefundItem {
  id?: string | number
  refund_key?: string
  refund_chargeback_id?: string | number
  bank_confirmed_at?: string
  refund_amount?: string | number
  status?: string
}

/**
 * Mem-parse payload notifikasi refund Midtrans dengan semantik korelasi identitas yang ketat.
 * - 'accepted': Notifikasi awal refund request diterima (belum ada bank_confirmed_at untuk refund target)
 * - 'confirmed': Notifikasi akhir yang membawa bank_confirmed_at valid DARI REFUND YANG TEPAT
 * - 'failed': Penolakan definitif dari gateway / chargeback status rejected
 */
export function parseMidtransRefundNotification(body: unknown): ParsedRefundNotification {
  const payload = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  const statusCode = String(payload.status_code || '200')
  const chargebackStatus = String(payload.refund_chargeback_status || '').toLowerCase()

  const rootRefundKey = payload.refund_key ? String(payload.refund_key) : undefined
  const rootGatewayRefundId = payload.refund_chargeback_id
    ? String(payload.refund_chargeback_id)
    : undefined

  // 1. Korelasi entri refund di dalam array refunds (jika tersedia)
  let matchedNestedRefund: NestedRefundItem | undefined = undefined
  const rawRefunds = payload.refunds
  const refundsArray = Array.isArray(rawRefunds) ? (rawRefunds as NestedRefundItem[]) : []
  const hasRefundsArray = refundsArray.length > 0

  if (hasRefundsArray) {
    if (rootRefundKey || rootGatewayRefundId) {
      // Cari entri yang cocok secara presisi berdasarkan refund_key atau refund_chargeback_id
      matchedNestedRefund = refundsArray.find((r) => {
        const keyMatch = Boolean(
          rootRefundKey && r.refund_key && String(r.refund_key) === rootRefundKey,
        )
        const idMatch = Boolean(
          rootGatewayRefundId &&
          ((r.refund_chargeback_id && String(r.refund_chargeback_id) === rootGatewayRefundId) ||
            (r.id && String(r.id) === rootGatewayRefundId)),
        )
        return keyMatch || idMatch
      })
    } else if (refundsArray.length === 1) {
      // Jika root tidak membawa identifier khusus dan array hanya berisi tepat 1 entri
      matchedNestedRefund = refundsArray[0]
    }
  }

  // 2. Ekstrak bank_confirmed_at secara aman:
  let bankConfirmedAt: string | undefined = undefined
  if (hasRefundsArray) {
    if (matchedNestedRefund?.bank_confirmed_at) {
      bankConfirmedAt = String(matchedNestedRefund.bank_confirmed_at)
    } else if (payload.bank_confirmed_at && matchedNestedRefund) {
      bankConfirmedAt = String(payload.bank_confirmed_at)
    }
  } else if (payload.bank_confirmed_at) {
    bankConfirmedAt = String(payload.bank_confirmed_at)
  }

  const gatewayRefundId =
    rootGatewayRefundId ||
    (matchedNestedRefund?.refund_chargeback_id
      ? String(matchedNestedRefund.refund_chargeback_id)
      : matchedNestedRefund?.id
        ? String(matchedNestedRefund.id)
        : payload.transaction_id
          ? String(payload.transaction_id)
          : undefined)

  const refundKey =
    rootRefundKey ||
    (matchedNestedRefund?.refund_key ? String(matchedNestedRefund.refund_key) : undefined)

  const refundAmount =
    matchedNestedRefund?.refund_amount !== undefined
      ? Number(matchedNestedRefund.refund_amount)
      : payload.refund_amount !== undefined
        ? Number(payload.refund_amount)
        : payload.gross_amount !== undefined
          ? Number(payload.gross_amount)
          : undefined

  // 3. Evaluasi kegagalan
  const isRejected =
    chargebackStatus === 'rejected' ||
    chargebackStatus === 'failed' ||
    String(matchedNestedRefund?.status || '').toLowerCase() === 'rejected' ||
    statusCode.startsWith('4') ||
    statusCode.startsWith('5')

  if (isRejected) {
    return {
      stage: 'failed',
      isSuccess: false,
      isAccepted: false,
      orderId: String(payload.order_id || ''),
      refundKey,
      gatewayRefundId,
      statusCode,
      statusMessage:
        typeof payload.status_message === 'string' ? payload.status_message : undefined,
      failureReason:
        typeof payload.status_message === 'string'
          ? payload.status_message
          : 'Refund ditolak oleh gateway',
    }
  }

  // 4. Evaluasi konfirmasi bank vs penerimaan awal
  const isConfirmed = Boolean(bankConfirmedAt)

  return {
    stage: isConfirmed ? 'confirmed' : 'accepted',
    isSuccess: isConfirmed,
    isAccepted: !isConfirmed,
    orderId: String(payload.order_id || ''),
    refundKey,
    gatewayRefundId,
    bankConfirmedAt,
    refundAmount,
    statusCode,
    statusMessage: typeof payload.status_message === 'string' ? payload.status_message : undefined,
  }
}
