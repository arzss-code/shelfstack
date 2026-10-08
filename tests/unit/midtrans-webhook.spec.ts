import { describe, expect, it } from 'vitest'
import crypto from 'node:crypto'
import { mapMidtransStatus, verifyMidtransSignature } from '../../server/utils/midtrans'

describe('verifyMidtransSignature', () => {
  const serverKey = 'SB-Mid-server-TESTKEY123'
  const orderId = 'd9472c08-9ac6-4b0a-933c-f6b25d041fdd'
  const statusCode = '200'
  const grossAmount = '150000.00'

  const validSignature = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex')

  it('memvalidasi signature SHA-512 yang benar', () => {
    const isValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signatureKey: validSignature,
    })
    expect(isValid).toBe(true)
  })

  it('menolak signature yang salah / dipalsukan', () => {
    const isValid = verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      signatureKey: 'tampered-signature-hash-12345',
    })
    expect(isValid).toBe(false)
  })

  it('menolak parameter yang tidak lengkap', () => {
    const isValid = verifyMidtransSignature({
      orderId: '',
      statusCode,
      grossAmount,
      serverKey,
      signatureKey: validSignature,
    })
    expect(isValid).toBe(false)
  })
})

describe('mapMidtransStatus', () => {
  it('memetakan settlement menjadi paid', () => {
    expect(mapMidtransStatus('settlement')).toBe('paid')
  })

  it('memetakan capture tanpa fraud/challenge menjadi paid', () => {
    expect(mapMidtransStatus('capture', 'accept')).toBe('paid')
  })

  it('memetakan capture dengan fraud challenge menjadi pending', () => {
    expect(mapMidtransStatus('capture', 'challenge')).toBe('pending')
  })

  it('memetakan cancel, expire, deny menjadi cancelled', () => {
    expect(mapMidtransStatus('cancel')).toBe('cancelled')
    expect(mapMidtransStatus('expire')).toBe('cancelled')
    expect(mapMidtransStatus('deny')).toBe('cancelled')
  })

  it('memetakan status yang belum selesai menjadi pending', () => {
    expect(mapMidtransStatus('pending')).toBe('pending')
    expect(mapMidtransStatus('unknown_status')).toBe('pending')
  })
})
