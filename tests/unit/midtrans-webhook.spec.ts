import { describe, expect, it } from 'vitest'
import crypto from 'node:crypto'
import {
  extractBaseOrderId,
  isMidtransDuplicateOrderError,
  mapMidtransStatus,
  verifyMidtransSignature,
} from '../../server/utils/midtrans'

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

describe('extractBaseOrderId', () => {
  const baseUuid = 'b129f62c-152e-44cf-9fa6-f12a548168d1'

  it('mengembalikan UUID murni jika tanpa suffix', () => {
    expect(extractBaseOrderId(baseUuid)).toBe(baseUuid)
  })

  it('mengekstrak UUID murni jika order_id Midtrans memiliki suffix retry (-R123456)', () => {
    expect(extractBaseOrderId(`${baseUuid}-R123456`)).toBe(baseUuid)
  })

  it('mengekstrak UUID murni jika order_id Midtrans memiliki suffix timestamp (-1728374829)', () => {
    expect(extractBaseOrderId(`${baseUuid}-1728374829`)).toBe(baseUuid)
  })

  it('mengembalikan string kosong jika input falsy', () => {
    expect(extractBaseOrderId('')).toBe('')
  })
})

describe('isMidtransDuplicateOrderError', () => {
  it('mendeteksi pesan duplikat versi bahasa Inggris ("transaction_details.order_id has already been taken")', () => {
    const error = {
      data: {
        error_messages: ['transaction_details.order_id has already been taken'],
      },
    }
    expect(isMidtransDuplicateOrderError(error)).toBe(true)
  })

  it('mendeteksi pesan duplikat versi bahasa Indonesia ("transaction_details.order_id sudah digunakan")', () => {
    const error = {
      data: {
        error_messages: ['transaction_details.order_id sudah digunakan'],
      },
    }
    expect(isMidtransDuplicateOrderError(error)).toBe(true)
  })

  it('mendeteksi pesan duplikat dari properti message langsung', () => {
    const error = {
      message:
        '[POST] "https://app.sandbox.midtrans.com/snap/v1/transactions": order_id already exists',
    }
    expect(isMidtransDuplicateOrderError(error)).toBe(true)
  })

  it('mengabaikan error lain yang bukan duplikasi order_id', () => {
    const error = {
      data: {
        error_messages: ['gross_amount is invalid'],
      },
    }
    expect(isMidtransDuplicateOrderError(error)).toBe(false)
  })

  it('menangani input error falsy / null tanpa crash', () => {
    expect(isMidtransDuplicateOrderError(null)).toBe(false)
    expect(isMidtransDuplicateOrderError(undefined)).toBe(false)
  })
})
