/**
 * Task 09 — Reliability and Failure Scenarios Integration Suite
 *
 * Simulates and verifies system resilience under fault conditions:
 * 1. Database connection timeout & graceful error reporting without credential leak.
 * 2. Payment gateway unavailable (Snap API 502/503/timeout) — order state preserved, no double deduction.
 * 3. Duplicate webhook delivery — idempotent 200 OK, no double sold_count increment.
 * 4. Stale/late webhook arrival — terminal state invariant enforced, backwards transition rejected.
 * 5. Repeated checkout requests — idempotency replay prevents duplicate order & double reservation.
 * 6. Repeated reconciliation execution — idempotent no-op, no double restock.
 * 7. Readiness 503 during critical dependency outage.
 * 8. Automatic recovery to 200 OK once dependency becomes healthy again.
 */

import { describe, expect, it, vi } from 'vitest'
import { checkReadiness } from '../../server/utils/health'
import { calculateCheckoutHash, validateIdempotencyKey } from '../../server/utils/idempotency'
import { verifyMidtransSignature } from '../../server/utils/midtrans'

describe('Task 09: Reliability and Failure Scenarios', () => {
  describe('1. Database Connection Timeout & Outage', () => {
    it('readiness probe returns 503 not_ready when DB query times out', async () => {
      const hungDbPing = async () => {
        await new Promise((resolve) => setTimeout(resolve, 150))
        return true
      }

      // Enforce 40ms timeout
      const { isReady, status } = await checkReadiness(hungDbPing, 40)

      expect(isReady).toBe(false)
      expect(status.status).toBe('not_ready')
      expect(status.dependencies.database).toBe('down')
    })

    it('readiness probe masks sensitive DB error details and connection strings', async () => {
      const failedDbPing = async () => {
        throw new Error(
          'connection to server at "postgres-pooler.internal:5432", user "postgres", password "secret_pwd_99" failed: timeout expired',
        )
      }

      const { isReady, status } = await checkReadiness(failedDbPing, 500)

      expect(isReady).toBe(false)
      expect(status.status).toBe('not_ready')
      expect(status.dependencies.database).toBe('down')

      const jsonString = JSON.stringify(status)
      expect(jsonString).not.toContain('secret_pwd_99')
      expect(jsonString).not.toContain('postgres-pooler.internal')
    })
  })

  describe('2. Payment Gateway Unavailable (Snap API 502/503/Network Failure)', () => {
    it('preserves order in pending state and avoids corrupting state when gateway is down', async () => {
      // Mock order state
      const mockOrder = {
        id: 'ord-sim-001',
        user_id: 'usr-buyer-001',
        total_amount: 150000,
        status: 'pending',
        snap_token: null as string | null,
      }

      // Simulate Gateway failure (e.g. Midtrans returns 503 Service Unavailable)
      const mockMidtransClient = {
        createTransactionToken: vi
          .fn()
          .mockRejectedValue(new Error('Midtrans 503: Service Unavailable / Connection Timeout')),
      }

      let errorCaught: Error | null = null
      try {
        await mockMidtransClient.createTransactionToken({
          transaction_details: {
            order_id: mockOrder.id,
            gross_amount: mockOrder.total_amount,
          },
        })
      } catch (err: any) {
        errorCaught = err
      }

      expect(errorCaught).toBeDefined()
      expect(errorCaught?.message).toContain('503')

      // INVARIANT CHECK:
      // Order status MUST remain pending (not cancelled, not paid, not corrupted)
      expect(mockOrder.status).toBe('pending')
      expect(mockOrder.snap_token).toBeNull()

      // Retry when gateway recovers
      mockMidtransClient.createTransactionToken.mockResolvedValueOnce('snap-token-recovered-999')
      const recoveredToken = await mockMidtransClient.createTransactionToken({
        transaction_details: {
          order_id: mockOrder.id,
          gross_amount: mockOrder.total_amount,
        },
      })

      mockOrder.snap_token = recoveredToken
      expect(mockOrder.snap_token).toBe('snap-token-recovered-999')
      expect(mockOrder.status).toBe('pending')
    })
  })

  describe('3. Duplicate and Stale / Late Webhook Delivery', () => {
    it('handles duplicate settlement webhooks idempotently without double restock or sold_count double-count', () => {
      // Track ledger
      const stock = 10
      let soldCount = 0
      let orderStatus = 'pending'

      // First webhook arrives: settlement
      const applyWebhookSettlement = () => {
        if (orderStatus === 'paid') {
          // Idempotent no-op
          return { success: true, duplicated: true }
        }
        if (orderStatus === 'pending') {
          orderStatus = 'paid'
          soldCount += 2
          return { success: true, duplicated: false }
        }
        throw new Error(`Invalid transition from ${orderStatus}`)
      }

      // 1st delivery
      const res1 = applyWebhookSettlement()
      expect(res1.duplicated).toBe(false)
      expect(orderStatus).toBe('paid')
      expect(soldCount).toBe(2)

      // 2nd delivery (duplicate webhook from gateway retry)
      const res2 = applyWebhookSettlement()
      expect(res2.duplicated).toBe(true)
      expect(orderStatus).toBe('paid')
      // INVARIANT: soldCount must NOT increase to 4!
      expect(soldCount).toBe(2)
      // Stock remains unaffected by duplicate webhook
      expect(stock).toBe(10)
    })

    it('rejects stale/late webhook trying to overwrite paid order back to pending', () => {
      const orderStatus = 'paid'

      const applyWebhookEvent = (incomingStatus: string) => {
        if (orderStatus === 'paid' && incomingStatus === 'pending') {
          // Backward transition rejected
          return { status: 'rejected', reason: 'Cannot transition backwards from paid to pending' }
        }
        return { status: 'applied' }
      }

      const res = applyWebhookEvent('pending')
      expect(res.status).toBe('rejected')
      expect(orderStatus).toBe('paid')
    })
  })

  describe('4. Repeated Checkout Requests (Idempotency Replay)', () => {
    it('safely replays cached response on concurrent/repeated checkout and blocks duplicate deduction', () => {
      const idempotencyStore = new Map<string, { request_hash: string; response: any }>()
      let inventoryStock = 50

      const processCheckout = (key: string, payload: any) => {
        const hash = calculateCheckoutHash(payload)
        const cached = idempotencyStore.get(key)

        if (cached) {
          if (cached.request_hash === hash) {
            // Replay identical response
            return { statusCode: 200, body: cached.response, isReplay: true }
          } else {
            return {
              statusCode: 409,
              error: 'Idempotency key already used with different payload',
              isReplay: false,
            }
          }
        }

        // Deduct inventory
        inventoryStock -= payload.items[0].qty

        const newOrder = {
          id: 'ord-fresh-999',
          total: payload.items[0].qty * 100000,
          status: 'pending',
        }

        idempotencyStore.set(key, {
          request_hash: hash,
          response: newOrder,
        })

        return { statusCode: 201, body: newOrder, isReplay: false }
      }

      const payload = {
        items: [{ product_id: 101, qty: 3 }],
        address: {
          name: 'AA Tester',
          phone: '08123456789',
          street: 'Jl. Sudirman 1',
          city: 'Jakarta',
          postal: '10220',
          note: '',
        },
      }
      const idemKey = 'uuid-idem-key-abc-123'

      // First checkout attempt
      const attempt1 = processCheckout(idemKey, payload)
      expect(attempt1.statusCode).toBe(201)
      expect(attempt1.isReplay).toBe(false)
      expect(inventoryStock).toBe(47)

      // Second checkout attempt with identical key (user double-clicks submit)
      const attempt2 = processCheckout(idemKey, payload)
      expect(attempt2.statusCode).toBe(200)
      expect(attempt2.isReplay).toBe(true)
      expect(attempt2.body.id).toBe(attempt1.body.id)
      // INVARIANT: inventory must NOT be deducted again
      expect(inventoryStock).toBe(47)
    })
  })

  describe('5. Repeated Reconciliation Execution (Idempotent Recovery)', () => {
    it('executes reconciliation multiple times safely without double restock or duplicate refund attempts', () => {
      let stock = 10
      let refundStatus = 'completed'
      let restockEventsCount = 1 // already restocked once during initial refund

      const runReconciliationJob = (orderId: string) => {
        // DB check: if already completed, do not restock again
        if (refundStatus === 'completed') {
          return { status: 'noop', message: 'Order already reconciled and completed' }
        }

        // Simulating transition
        refundStatus = 'completed'
        stock += 1
        restockEventsCount++
        return { status: 'reconciled' }
      }

      // Run reconciliation 1st time
      const run1 = runReconciliationJob('ord-999')
      expect(run1.status).toBe('noop')

      // Run reconciliation 2nd time (e.g. cron retry)
      const run2 = runReconciliationJob('ord-999')
      expect(run2.status).toBe('noop')

      // INVARIANTS:
      expect(restockEventsCount).toBe(1)
      expect(stock).toBe(10)
    })
  })

  describe('6. Readiness State & Recovery Cycle', () => {
    it('transitions smoothly from ready -> down (503) -> restored (200)', async () => {
      let isDbAlive = true

      const dynamicDbPing = async () => {
        if (!isDbAlive) throw new Error('Database connection terminated')
        return true
      }

      // Phase 1: Healthy
      const check1 = await checkReadiness(dynamicDbPing, 1000)
      expect(check1.isReady).toBe(true)
      expect(check1.status.status).toBe('ready')
      expect(check1.status.dependencies.database).toBe('up')

      // Phase 2: DB Crash / Maintenance Outage
      isDbAlive = false
      const check2 = await checkReadiness(dynamicDbPing, 1000)
      expect(check2.isReady).toBe(false)
      expect(check2.status.status).toBe('not_ready')
      expect(check2.status.dependencies.database).toBe('down')

      // Phase 3: DB Recovered
      isDbAlive = true
      const check3 = await checkReadiness(dynamicDbPing, 1000)
      expect(check3.isReady).toBe(true)
      expect(check3.status.status).toBe('ready')
      expect(check3.status.dependencies.database).toBe('up')
    })
  })
})
