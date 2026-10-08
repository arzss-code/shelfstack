import crypto from 'node:crypto'

export interface VerifySignatureParams {
  orderId: string
  statusCode: string
  grossAmount: string
  serverKey: string
  signatureKey: string
}

/**
 * Validates SHA-512 Signature Key from Midtrans Webhook Notification.
 * Official Midtrans formula: SHA512(order_id + status_code + gross_amount + ServerKey)
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
 * Maps Midtrans transaction_status to ShelfStack order status.
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
