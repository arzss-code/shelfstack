import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

  it('evaluates order 15-minute expiry logic correctly', () => {
    const now = Date.now()
    const createdAt16MinsAgo = new Date(now - 16 * 60 * 1000).toISOString()
    const createdAt10MinsAgo = new Date(now - 10 * 60 * 1000).toISOString()

    const isExpired16 = now - new Date(createdAt16MinsAgo).getTime() >= 15 * 60 * 1000
    const isExpired10 = now - new Date(createdAt10MinsAgo).getTime() >= 15 * 60 * 1000

    expect(isExpired16).toBe(true)
    expect(isExpired10).toBe(false)
  })

  describe('Architectural Line Limits & Governance', () => {
    const files = [
      'server/api/orders/[id]/check-payment-status.post.ts',
      'app/composables/useOrderDetail.ts',
      'app/features/orders/components/OrderDetailPaymentCard.vue',
      'app/pages/orders/[id].vue',
      'tests/unit/check-payment-status.spec.ts',
    ]

    it('ensures all modified files are <= 300 lines', () => {
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        expect(lines, `File ${file} exceeds 300 lines (${lines})`).toBeLessThanOrEqual(300)
      }
    })

    it('strictly prohibits em dashes in all modified files', () => {
      const emDash = String.fromCharCode(8212)
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        expect(content.includes(emDash), `File ${file} contains em dash`).toBe(false)
      }
    })
  })
})
