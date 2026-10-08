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
