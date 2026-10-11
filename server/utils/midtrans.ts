import crypto from 'node:crypto'

export interface VerifySignatureParams {
  orderId: string
  statusCode: string
  grossAmount: string
  serverKey: string
  signatureKey: string
}

/**
 * Memvalidasi SHA-512 Signature Key dari notifikasi Webhook Midtrans.
 * Formula resmi Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature({
  orderId,
  statusCode,
  grossAmount,
  serverKey,
  signatureKey,
}: VerifySignatureParams): boolean {
  if (!orderId || !statusCode || !grossAmount || !serverKey || !signatureKey) {
    return false
  }

  const payload = `${orderId}${statusCode}${grossAmount}${serverKey}`
  const computedHash = crypto.createHash('sha512').update(payload).digest('hex')

  return computedHash.toLowerCase() === signatureKey.toLowerCase()
}

/**
 * Memetakan transaction_status dari Midtrans ke order_status resmi ShelfStack.
 */
export function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string | null,
): 'pending' | 'paid' | 'cancelled' {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'challenge' ? 'pending' : 'paid'
  }

  if (transactionStatus === 'settlement') {
    return 'paid'
  }

  if (
    transactionStatus === 'cancel' ||
    transactionStatus === 'deny' ||
    transactionStatus === 'expire'
  ) {
    return 'cancelled'
  }

  return 'pending'
}

/**
 * Extracts base order UUID from Midtrans order_id in case a retry/timestamp suffix was used.
 * Example: "b129f62c-152e-44cf-9fa6-f12a548168d1-R123456" -> "b129f62c-152e-44cf-9fa6-f12a548168d1"
 */
export function extractBaseOrderId(orderId: string): string {
  if (!orderId) return ''
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  const match = orderId.match(uuidRegex)
  return match ? match[0] : orderId
}

/**
 * Detects whether a Midtrans Snap API error is due to an already taken / duplicate order_id.
 * Supports both Indonesian ("order_id sudah digunakan") and English ("order_id has already been taken").
 */
export function isMidtransDuplicateOrderError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const errorObj = err as { data?: { error_messages?: string[] }; message?: string }
  const messages: string[] = []
  if (Array.isArray(errorObj.data?.error_messages)) {
    messages.push(...errorObj.data!.error_messages)
  }
  if (errorObj.message) {
    messages.push(errorObj.message)
  }

  const pattern = /order_id.*(already been taken|sudah digunakan|duplicate|already exist)/i
  return messages.some((msg) => pattern.test(msg))
}

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
    const response = await $fetch<any>(`${baseUrl}/${orderIdOrTransactionId}/refund`, {
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
    })

    const statusCode = String(response?.status_code || '200')
    const isApproved = statusCode === '200' || statusCode === '201' || statusCode === '202'
    const bankConfirmedAt = response?.bank_confirmed_at
      ? String(response.bank_confirmed_at)
      : undefined

    return {
      success: isApproved,
      statusCode,
      statusMessage: response?.status_message,
      gatewayRefundId: response?.refund_chargeback_id
        ? String(response.refund_chargeback_id)
        : response?.transaction_id,
      refundAmount: response?.refund_amount,
      bankConfirmedAt,
    }
  } catch (err: any) {
    const errorData = err?.data
    const statusCode = String(errorData?.status_code || err?.status || '502')
    const statusMessage =
      errorData?.status_message || err?.message || 'Gagal menghubungi payment gateway'

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
export function isMidtransRefundNotification(body: any): boolean {
  if (!body || typeof body !== 'object') return false
  const txStatus = body.transaction_status
  return (
    txStatus === 'refund' ||
    txStatus === 'partial_refund' ||
    Boolean(body.refund_key) ||
    Boolean(body.refund_chargeback_id)
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

/**
 * Mem-parse payload notifikasi refund Midtrans dengan semantik korelasi identitas yang ketat.
 * - 'accepted': Notifikasi awal refund request diterima (belum ada bank_confirmed_at untuk refund target)
 * - 'confirmed': Notifikasi akhir yang membawa bank_confirmed_at valid DARI REFUND YANG TEPAT
 * - 'failed': Penolakan definitif dari gateway / chargeback status rejected
 */
export function parseMidtransRefundNotification(body: any): ParsedRefundNotification {
  const statusCode = String(body?.status_code || '200')
  const chargebackStatus = String(body?.refund_chargeback_status || '').toLowerCase()

  const rootRefundKey = body?.refund_key ? String(body.refund_key) : undefined
  const rootGatewayRefundId = body?.refund_chargeback_id
    ? String(body.refund_chargeback_id)
    : undefined

  // 1. Korelasi entri refund di dalam array refunds (jika tersedia)
  let matchedNestedRefund: any = undefined
  const hasRefundsArray = Array.isArray(body?.refunds) && body.refunds.length > 0

  if (hasRefundsArray) {
    if (rootRefundKey || rootGatewayRefundId) {
      // Cari entri yang cocok secara presisi berdasarkan refund_key atau refund_chargeback_id
      matchedNestedRefund = body.refunds.find((r: any) => {
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
    } else if (body.refunds.length === 1) {
      // Jika root tidak membawa identifier khusus dan array hanya berisi tepat 1 entri
      matchedNestedRefund = body.refunds[0]
    }
  }

  // 2. Ekstrak bank_confirmed_at secara aman:
  // PENTING: Jika payload memiliki array refunds, bank_confirmed_at HANYA boleh diambil
  // dari matchedNestedRefund. Tidak boleh membocorkan timestamp dari refund lain!
  let bankConfirmedAt: string | undefined = undefined
  if (hasRefundsArray) {
    if (matchedNestedRefund?.bank_confirmed_at) {
      bankConfirmedAt = String(matchedNestedRefund.bank_confirmed_at)
    } else if (body?.bank_confirmed_at && matchedNestedRefund) {
      bankConfirmedAt = String(body.bank_confirmed_at)
    }
  } else if (body?.bank_confirmed_at) {
    // Flat payload tanpa array refunds
    bankConfirmedAt = String(body.bank_confirmed_at)
  }

  const gatewayRefundId =
    rootGatewayRefundId ||
    (matchedNestedRefund?.refund_chargeback_id
      ? String(matchedNestedRefund.refund_chargeback_id)
      : matchedNestedRefund?.id
        ? String(matchedNestedRefund.id)
        : body?.transaction_id
          ? String(body.transaction_id)
          : undefined)

  const refundKey =
    rootRefundKey ||
    (matchedNestedRefund?.refund_key ? String(matchedNestedRefund.refund_key) : undefined)

  const refundAmount =
    matchedNestedRefund?.refund_amount !== undefined
      ? Number(matchedNestedRefund.refund_amount)
      : body?.refund_amount !== undefined
        ? Number(body.refund_amount)
        : body?.gross_amount !== undefined
          ? Number(body.gross_amount)
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
      orderId: String(body?.order_id || ''),
      refundKey,
      gatewayRefundId,
      statusCode,
      statusMessage: body?.status_message,
      failureReason: body?.status_message || 'Refund ditolak oleh gateway',
    }
  }

  // 4. Evaluasi konfirmasi bank vs penerimaan awal
  const isConfirmed = Boolean(bankConfirmedAt)

  return {
    stage: isConfirmed ? 'confirmed' : 'accepted',
    isSuccess: isConfirmed,
    isAccepted: !isConfirmed,
    orderId: String(body?.order_id || ''),
    refundKey,
    gatewayRefundId,
    bankConfirmedAt,
    refundAmount,
    statusCode,
    statusMessage: body?.status_message,
  }
}

export interface MidtransStatusResult {
  success: boolean
  data?: any
  error?: string
}

/**
 * Mengambil status transaksi langsung dari Midtrans Status API (/v2/:id/status).
 */
export async function fetchMidtransTransactionStatus(
  orderIdOrTransactionId: string,
  serverKey: string,
  isSandbox = true,
): Promise<MidtransStatusResult> {
  if (!serverKey) {
    return { success: false, error: 'Server key tidak tersedia' }
  }

  const baseUrl = isSandbox ? 'https://api.sandbox.midtrans.com/v2' : 'https://api.midtrans.com/v2'
  const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64')

  try {
    const data = await $fetch<any>(`${baseUrl}/${orderIdOrTransactionId}/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
    })
    return { success: true, data }
  } catch (err: any) {
    return {
      success: false,
      error: err?.data?.status_message || err?.message || 'Gagal mengambil status transaksi',
    }
  }
}
