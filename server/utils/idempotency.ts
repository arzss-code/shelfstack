import crypto from 'node:crypto'
import type { CheckoutInput } from '../../shared/schemas/order'

export interface IdempotencyValidationResult {
  isValid: boolean
  key: string | null
  error?: string
}

/**
 * Validasi header Idempotency-Key
 * - Optional: jika undefined/null, dianggap valid (key = null) untuk backward compatibility
 * - Tidak boleh empty string atau whitespace saja
 * - Maksimal 255 karakter
 * - Hanya karakter aman: alfanumerik, -, _, ., :, +, =, /
 */
export function validateIdempotencyKey(
  rawKey: string | string[] | undefined | null,
): IdempotencyValidationResult {
  if (rawKey === undefined || rawKey === null) {
    return { isValid: true, key: null }
  }

  const keyStr = Array.isArray(rawKey) ? rawKey[0] : rawKey
  const trimmed = keyStr.trim()

  if (trimmed.length === 0) {
    return {
      isValid: false,
      key: null,
      error: 'Idempotency-Key tidak boleh berupa string kosong.',
    }
  }

  if (trimmed.length > 255) {
    return {
      isValid: false,
      key: null,
      error: 'Idempotency-Key melebihi batas maksimal 255 karakter.',
    }
  }

  // Karakter aman standar API (ASCII printable, tanpa whitespace atau control chars)
  if (!/^[\w\-.:+=/]{1,255}$/.test(trimmed)) {
    return {
      isValid: false,
      key: null,
      error:
        'Format Idempotency-Key tidak valid. Gunakan karakter alfanumerik, -, _, ., :, +, =, atau /.',
    }
  }

  return { isValid: true, key: trimmed }
}

/**
 * Menghasilkan hash SHA-256 deterministik dari data checkout yang sudah tervalidasi.
 * - Items diurutkan berdasarkan product_id secara ascending
 * - Field address dinormalisasi (trim) dan diurutkan secara kanonikal
 * - Menjamin representasi string identik untuk payload yang sama terlepas dari urutan array input
 */
export function calculateCheckoutHash(input: CheckoutInput): string {
  // 1. Urutkan items secara deterministik berdasarkan product_id ASC
  const sortedItems = [...input.items]
    .map((item) => ({
      product_id: Number(item.product_id),
      qty: Number(item.qty),
    }))
    .sort((a, b) => a.product_id - b.product_id)

  // 2. Normalisasi objek alamat dengan key alfabetis
  const normalizedAddress = {
    city: input.address.city.trim(),
    name: input.address.name.trim(),
    note: (input.address.note || '').trim(),
    phone: input.address.phone.trim(),
    postal: input.address.postal.trim(),
    street: input.address.street.trim(),
  }

  // 3. Serialisasi ke canonical string
  const canonicalString = JSON.stringify({
    address: normalizedAddress,
    items: sortedItems,
  })

  // 4. Hitung hash SHA-256
  return crypto.createHash('sha256').update(canonicalString).digest('hex')
}
