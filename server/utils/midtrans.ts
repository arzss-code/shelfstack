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

export * from './midtrans-refund'

export interface MidtransStatusResult {
  success: boolean
  data?: Record<string, unknown>
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
    const data = await $fetch<Record<string, unknown>>(
      `${baseUrl}/${orderIdOrTransactionId}/status`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
      },
    )
    return { success: true, data }
  } catch (err: unknown) {
    const errorObj = err as { data?: { status_message?: string }; message?: string }
    return {
      success: false,
      error:
        errorObj?.data?.status_message || errorObj?.message || 'Gagal mengambil status transaksi',
    }
  }
}
