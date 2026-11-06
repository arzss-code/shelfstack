import type { SupabaseClient } from '@supabase/supabase-js'
import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../src/app.js'
import { config } from '../src/config.js'
import {
  buildOrderExpiryJobId,
  setOrderExpiryQueueAdapterForTests,
  type DlqJobItem,
  type OrderExpiryDlqRecord,
  type OrderExpiryQueueAdapter,
} from '../src/queues/order-expiry.queue.js'
import { setSupabaseClient } from '../src/services/supabase.service.js'
import { OrderExpiryWorker, type WorkerLogger } from '../src/workers/order-expiry.worker.js'

function createInMemoryQueueAdapter() {
  const scheduledJobs: Array<{ orderId: string; delayMs?: number; correlationId?: string }> = []
  const dlqItems: DlqJobItem[] = []

  const adapter: OrderExpiryQueueAdapter = {
    isActive: () => true,
    scheduleExpiry: async (params) => {
      scheduledJobs.push(params)
      const jobId = buildOrderExpiryJobId(params.orderId)
      return {
        scheduled: true,
        jobId,
        delayMs: params.delayMs ?? config.ORDER_EXPIRY_MINUTES * 60_000,
        mode: 'bullmq',
      }
    },
    forwardToDlq: async (record: OrderExpiryDlqRecord) => {
      const id = `dlq-${record.originalJobId}-1`
      dlqItems.push({
        id,
        payload: record,
        timestamp: Date.now(),
      })
      return id
    },
    getStats: async () => ({
      enabled: true,
      mainQueue: {
        waiting: 0,
        active: 0,
        delayed: scheduledJobs.length,
        completed: 4,
        failed: dlqItems.length,
        paused: 0,
      },
      dlq: {
        waiting: dlqItems.length,
        active: 0,
        delayed: 0,
        completed: 0,
        failed: 0,
        paused: 0,
      },
    }),
    listDlq: async (limit = 25) => dlqItems.slice(0, limit),
    retryDlq: async (dlqJobId: string) => {
      const index = dlqItems.findIndex((item) => item.id === dlqJobId)
      if (index === -1) {
        return {
          retried: false,
          dlqJobId,
          newJobId: null,
          reason: 'DLQ_JOB_NOT_FOUND',
        }
      }
      const [removed] = dlqItems.splice(index, 1)
      const newJobId = `${removed.payload.originalJobId}-retry-1`
      if (removed.payload.data.kind === 'single') {
        scheduledJobs.push({
          orderId: removed.payload.data.orderId,
          delayMs: 0,
          correlationId: 'dlq-replay',
        })
      }
      return {
        retried: true,
        dlqJobId,
        newJobId,
      }
    },
  }

  return { adapter, scheduledJobs, dlqItems }
}

describe('BullMQ Order Expiry Queue & Dead Letter Queue (DLQ)', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterEach(() => {
    setOrderExpiryQueueAdapterForTests(null)
    setSupabaseClient(null)
    config.INTERNAL_SERVICE_KEY = undefined
  })

  afterAll(async () => {
    await app.close()
  })

  it('builds colon-free deterministic BullMQ jobId and strips Midtrans retry suffix', () => {
    const uuid = 'c1111111-2222-4333-8444-555555555555'
    const jobId = buildOrderExpiryJobId(`${uuid}-R987654`)
    expect(jobId).toBe(`expire-order-${uuid}`)
    expect(jobId.includes(':')).toBe(false)
  })

  describe('POST /api/v1/orders/schedule-expiry', () => {
    it('returns 403 when INTERNAL_SERVICE_KEY is set and secret header does not match', async () => {
      config.INTERNAL_SERVICE_KEY = 'super-secret-internal-key'

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/schedule-expiry',
        headers: {
          'x-internal-secret': 'wrong-key',
        },
        payload: {
          order_id: 'c1111111-2222-4333-8444-555555555555',
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('returns 400 when order_id is not a valid UUID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/schedule-expiry',
        payload: {
          order_id: 'invalid-uuid',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('schedules delayed expiry job with deterministic jobId when authenticated', async () => {
      config.INTERNAL_SERVICE_KEY = 'super-secret-internal-key'
      const { adapter, scheduledJobs } = createInMemoryQueueAdapter()
      setOrderExpiryQueueAdapterForTests(adapter)

      const orderId = 'c1111111-2222-4333-8444-555555555555'
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/schedule-expiry',
        headers: {
          'x-internal-secret': 'super-secret-internal-key',
          'x-correlation-id': 'checkout-corr-001',
        },
        payload: {
          order_id: orderId,
          delay_ms: 900_000,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.status).toBe('success')
      expect(body.data.scheduled).toBe(true)
      expect(body.data.jobId).toBe(`expire-order-${orderId}`)
      expect(body.data.delayMs).toBe(900_000)
      expect(scheduledJobs).toHaveLength(1)
      expect(scheduledJobs[0]?.correlationId).toBe('checkout-corr-001')
    })
  })

  describe('OrderExpiryWorker.processSingleOrderExpiry & Concurrency Safety', () => {
    it('cancels pending order via handle_payment_webhook(auto_timeout)', async () => {
      const orderId = 'd2222222-3333-4444-8555-666666666666'
      const rpcSpy = vi.fn(async () => ({ data: 'CANCELLED_SUCCESS', error: null }))
      setSupabaseClient({ rpc: rpcSpy } as unknown as SupabaseClient)

      const outcome = await OrderExpiryWorker.processSingleOrderExpiry(`${orderId}-R1234`)

      expect(outcome.orderId).toBe(orderId)
      expect(outcome.action).toBe('cancelled')
      expect(outcome.rpcResult).toBe('CANCELLED_SUCCESS')
      expect(rpcSpy).toHaveBeenCalledWith('handle_payment_webhook', {
        p_order_id: orderId,
        p_target_status: 'cancelled',
        p_payment_type: 'auto_timeout',
        p_midtrans_id: null,
      })
    })

    it('returns idempotent no_op when order was already paid or cancelled concurrently', async () => {
      const orderId = 'd2222222-3333-4444-8555-666666666666'

      for (const rpcResult of [
        'IGNORED_STALE_CANCEL_ON_PAID_ORDER',
        'NO_CHANGE_ALREADY_CANCELLED',
        'ORDER_NOT_FOUND',
      ]) {
        setSupabaseClient({
          rpc: vi.fn(async () => ({ data: rpcResult, error: null })),
        } as unknown as SupabaseClient)

        const outcome = await OrderExpiryWorker.processSingleOrderExpiry(orderId)
        expect(outcome.action).toBe('no_op')
        expect(outcome.rpcResult).toBe(rpcResult)
        expect(outcome.cacheInvalidated).toBe(false)
      }
    })

    it('throws on transient RPC failure so BullMQ exponential backoff retries the job', async () => {
      const orderId = 'd2222222-3333-4444-8555-666666666666'
      setSupabaseClient({
        rpc: vi.fn(async () => ({
          data: null,
          error: { message: 'connection reset by peer' },
        })),
      } as unknown as SupabaseClient)

      await expect(OrderExpiryWorker.processSingleOrderExpiry(orderId)).rejects.toThrow(
        'connection reset by peer',
      )
    })

    it('enqueues individual BullMQ jobs during reconciliation sweep when enqueueToQueue is true', async () => {
      const { adapter, scheduledJobs } = createInMemoryQueueAdapter()
      setOrderExpiryQueueAdapterForTests(adapter)

      const orderA = 'e1111111-1111-4111-8111-111111111111'
      const orderB = 'e2222222-2222-4222-8222-222222222222'

      setSupabaseClient({
        from: () => ({
          select: () => ({
            eq: () => ({
              lt: async () => ({
                data: [
                  { id: orderA, created_at: '2026-01-01T00:00:00Z', status: 'pending' },
                  { id: orderB, created_at: '2026-01-01T00:01:00Z', status: 'pending' },
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as unknown as SupabaseClient)

      const sweepResult = await OrderExpiryWorker.sweepExpiredOrders(30, { enqueueToQueue: true })

      expect(sweepResult.scannedCount).toBe(2)
      expect(sweepResult.queuedCount).toBe(2)
      expect(sweepResult.cancelledCount).toBe(0)
      expect(scheduledJobs.map((j) => j.orderId)).toEqual([orderA, orderB])
    })
  })

  describe('Dead Letter Queue (DLQ) Forwarding, Telemetry & Replay Endpoints', () => {
    const silentLogger: WorkerLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }

    it('does NOT forward job to DLQ while retry attempts remain', async () => {
      const { adapter, dlqItems } = createInMemoryQueueAdapter()
      setOrderExpiryQueueAdapterForTests(adapter)

      const dlqId = await OrderExpiryWorker.handleFailedJob(
        {
          id: 'expire-order-test-1',
          name: 'expire-order',
          data: {
            kind: 'single',
            orderId: 'f1111111-1111-4111-8111-111111111111',
            scheduledAt: new Date().toISOString(),
          },
          attemptsMade: 1,
          opts: { attempts: 3 },
          stacktrace: [],
        },
        new Error('Temporary lock timeout'),
        silentLogger,
      )

      expect(dlqId).toBeNull()
      expect(dlqItems).toHaveLength(0)
    })

    it('forwards exhausted job to DLQ and supports queue-stats, dlq listing, and dlq retry', async () => {
      config.INTERNAL_SERVICE_KEY = 'admin-secret'
      const { adapter, scheduledJobs, dlqItems } = createInMemoryQueueAdapter()
      setOrderExpiryQueueAdapterForTests(adapter)

      const failedOrderId = 'f2222222-2222-4222-8222-222222222222'
      const dlqId = await OrderExpiryWorker.handleFailedJob(
        {
          id: `expire-order-${failedOrderId}`,
          name: 'expire-order',
          data: {
            kind: 'single',
            orderId: failedOrderId,
            scheduledAt: new Date().toISOString(),
          },
          attemptsMade: 3,
          opts: { attempts: 3 },
          stacktrace: ['Error: Database unavailable'],
        },
        new Error('Database unavailable'),
        silentLogger,
      )

      expect(dlqId).toBe(`dlq-expire-order-${failedOrderId}-1`)
      expect(dlqItems).toHaveLength(1)

      // 1. Inspect /queue-stats
      const statsRes = await app.inject({
        method: 'GET',
        url: '/api/v1/orders/queue-stats',
        headers: { 'x-internal-secret': 'admin-secret' },
      })
      expect(statsRes.statusCode).toBe(200)
      expect(statsRes.json().data.dlq.waiting).toBe(1)

      // 2. Inspect /dlq
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/orders/dlq?limit=10',
        headers: { 'x-internal-secret': 'admin-secret' },
      })
      expect(listRes.statusCode).toBe(200)
      expect(listRes.json().data.jobs).toHaveLength(1)
      expect(listRes.json().data.jobs[0].payload.failedReason).toBe('Database unavailable')

      // 3. Replay DLQ job via POST /dlq/:jobId/retry
      const retryRes = await app.inject({
        method: 'POST',
        url: `/api/v1/orders/dlq/${encodeURIComponent(dlqId ?? '')}/retry`,
        headers: { 'x-internal-secret': 'admin-secret' },
      })
      expect(retryRes.statusCode).toBe(200)
      expect(retryRes.json().data.retried).toBe(true)
      expect(dlqItems).toHaveLength(0)
      expect(scheduledJobs).toHaveLength(1)
      expect(scheduledJobs[0]?.orderId).toBe(failedOrderId)

      // 4. Second replay returns 404 since job was removed from DLQ
      const missingRes = await app.inject({
        method: 'POST',
        url: `/api/v1/orders/dlq/${encodeURIComponent(dlqId ?? '')}/retry`,
        headers: { 'x-internal-secret': 'admin-secret' },
      })
      expect(missingRes.statusCode).toBe(404)
    })
  })
})
