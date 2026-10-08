import { describe, expect, it } from 'vitest'
import { mapMidtransStatus } from '../../server/utils/midtrans'

describe('Payment Status Verification & Sync Logic (check-payment-status)', () => {
  it('maps settlement status to paid for bank transfer / virtual account', () => {
    const status = mapMidtransStatus('settlement', null)
    expect(status).toBe('paid')
  })

  it('maps capture status with accept fraud to paid for credit card', () => {
    const status = mapMidtransStatus('capture', 'accept')
    expect(status).toBe('paid')
  })

  it('maps capture status with challenge fraud to pending', () => {
    const status = mapMidtransStatus('capture', 'challenge')
    expect(status).toBe('pending')
  })

  it('maps expire / cancel / deny to cancelled', () => {
    expect(mapMidtransStatus('expire')).toBe('cancelled')
    expect(mapMidtransStatus('cancel')).toBe('cancelled')
    expect(mapMidtransStatus('deny')).toBe('cancelled')
  })

  it('maps pending or unknown status to pending', () => {
    expect(mapMidtransStatus('pending')).toBe('pending')
    expect(mapMidtransStatus('authorize')).toBe('pending')
  })

  it('determines whether state transition is needed when syncing', () => {
    const currentStatus = 'pending'
    const newStatusPaid = mapMidtransStatus('settlement')
    expect(newStatusPaid !== currentStatus).toBe(true)

    const alreadyPaid = 'paid'
    expect(newStatusPaid !== alreadyPaid).toBe(false)
  })
})
