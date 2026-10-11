import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { config } from '../src/config.js'
import { setSupabaseClient } from '../src/services/supabase.service.js'

describe('Order Service (Fastify Pilot)', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /health', () => {
    it('should return 200 OK and health telemetry', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.status).toBe('success')
      expect(body.message).toBe('Order service is healthy')
      expect(body.data.service).toBe('@shelfstack/order-service')
      expect(typeof body.data.uptime).toBe('number')
    })
  })

  describe('POST /api/v1/orders/webhook', () => {
    it('should return 400 when body fails Zod schema validation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/webhook',
        payload: {
          order_id: 'not-enough-fields',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.status).toBe('error')
    })

    it('should return 500 when MIDTRANS_SERVER_KEY is missing (fail-closed)', async () => {
      const origKey = config.MIDTRANS_SERVER_KEY
      config.MIDTRANS_SERVER_KEY = undefined

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/webhook',
        payload: {
          order_id: 'test-order-123',
          status_code: '200',
          gross_amount: '150000.00',
          signature_key: 'any-hash',
          transaction_status: 'settlement',
        },
      })

      expect(response.statusCode).toBe(500)
      const body = response.json()
      expect(body.status).toBe('error')
      expect(body.message).toContain('Midtrans Server Key belum disetel')

      config.MIDTRANS_SERVER_KEY = origKey
    })

    it('should return 403 when signature key is invalid', async () => {
      // Set test server key
      config.MIDTRANS_SERVER_KEY = 'test-server-key'

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/webhook',
        payload: {
          order_id: 'test-order-123',
          status_code: '200',
          gross_amount: '150000.00',
          signature_key: 'invalid-signature-hash',
          transaction_status: 'settlement',
        },
      })

      expect(response.statusCode).toBe(403)
      const body = response.json()
      expect(body.status).toBe('error')
      expect(body.message).toContain('Signature tidak valid')
    })

    it('should process webhook successfully with valid signature and mock database RPC', async () => {
      config.MIDTRANS_SERVER_KEY = 'test-server-key'
      const orderId = 'a0000000-0000-0000-0000-000000000001'
      const statusCode = '200'
      const grossAmount = '150000.00'
      const serverKey = 'test-server-key'

      // Calculate valid SHA-512 signature
      const validSignature = crypto
        .createHash('sha512')
        .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
        .digest('hex')

      // Mock Supabase client
      const mockSupabase = {
        rpc: async (fnName: string, args: any) => {
          expect(fnName).toBe('handle_payment_webhook')
          expect(args.p_order_id).toBe(orderId)
          expect(args.p_target_status).toBe('paid')
          return { data: 'UPDATED_TO_paid', error: null }
        },
      } as any

      setSupabaseClient(mockSupabase)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/webhook',
        payload: {
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: 'settlement',
          payment_type: 'bank_transfer',
          transaction_id: 'midtrans-trx-999',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.status).toBe('success')
      expect(body.data.orderId).toBe(orderId)
      expect(body.data.status).toBe('paid')
      expect(body.data.method).toBe('atomic_rpc')

      // Cleanup
      setSupabaseClient(null)
    })

    it('should strip retry suffix from order_id and successfully update original UUID order', async () => {
      config.MIDTRANS_SERVER_KEY = 'test-server-key'
      const baseOrderId = 'b129f62c-152e-44cf-9fa6-f12a548168d1'
      const suffixedOrderId = `${baseOrderId}-R123456`
      const statusCode = '200'
      const grossAmount = '250000.00'
      const serverKey = 'test-server-key'

      const validSignature = crypto
        .createHash('sha512')
        .update(`${suffixedOrderId}${statusCode}${grossAmount}${serverKey}`)
        .digest('hex')

      const mockSupabase = {
        rpc: async (fnName: string, args: any) => {
          expect(fnName).toBe('handle_payment_webhook')
          expect(args.p_order_id).toBe(baseOrderId)
          expect(args.p_target_status).toBe('paid')
          return { data: 'UPDATED_TO_paid', error: null }
        },
      } as any

      setSupabaseClient(mockSupabase)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/webhook',
        payload: {
          order_id: suffixedOrderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: 'settlement',
          payment_type: 'gopay',
          transaction_id: 'midtrans-trx-gopay-123',
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.status).toBe('success')
      expect(body.data.orderId).toBe(baseOrderId)
      expect(body.data.status).toBe('paid')

      setSupabaseClient(null)
    })
  })

  describe('Redis Cache-Aside & Circuit Breaker', () => {
    it('gracefully degrades without throwing errors when Redis is not connected', async () => {
      const { CacheService } = await import('../src/cache/redis.client.js')

      const version = await CacheService.getCatalogVersion()
      expect(version).toBe('v1')

      const cached = await CacheService.get('any-key')
      expect(cached).toBeNull()

      const setResult = await CacheService.set('any-key', { foo: 'bar' })
      expect(setResult).toBe(false)

      const invalidResult = await CacheService.invalidateCatalog()
      expect(invalidResult).toBe(false)
    })

    it('should successfully call /api/v1/orders/invalidate-cache', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/invalidate-cache',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.status).toBe('success')
    })
  })

  describe('POST /api/v1/orders/sweep-expiry (Order Expiry Worker)', () => {
    it('blocks request when INTERNAL_SERVICE_KEY is set and secret header is invalid', async () => {
      config.INTERNAL_SERVICE_KEY = 'secret-guard-token'

      try {
        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/orders/sweep-expiry',
          headers: {
            'x-internal-secret': 'wrong-token',
          },
          payload: {
            expiry_minutes: 30,
          },
        })

        expect(response.statusCode).toBe(403)
        const body = response.json()
        expect(body.message).toContain('x-internal-secret tidak valid')
      } finally {
        config.INTERNAL_SERVICE_KEY = undefined
      }
    })

    it('executes sweep successfully with mocked database', async () => {
      const expiredOrderId = 'b0000000-0000-0000-0000-000000000002'

      const mockSupabase = {
        from: (table: string) => {
          expect(table).toBe('orders')
          return {
            select: () => ({
              eq: () => ({
                lt: async () => ({
                  data: [
                    {
                      id: expiredOrderId,
                      created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
                      status: 'pending',
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }
        },
        rpc: async (fn: string, args: any) => {
          expect(fn).toBe('handle_payment_webhook')
          expect(args.p_order_id).toBe(expiredOrderId)
          expect(args.p_target_status).toBe('cancelled')
          return { data: 'UPDATED_TO_cancelled', error: null }
        },
      } as any

      setSupabaseClient(mockSupabase)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/sweep-expiry',
        payload: {
          expiry_minutes: 30,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.status).toBe('success')
      expect(body.data.scannedCount).toBe(1)
      expect(body.data.cancelledCount).toBe(1)
      expect(body.data.cancelledOrders).toContain(expiredOrderId)

      setSupabaseClient(null)
    })
  })

  describe('GET /ready (Readiness Probe)', () => {
    it('should return 200 OK when database dependency is healthy', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            limit: async () => ({ data: [{ id: 1 }], error: null }),
          }),
        }),
      } as any
      setSupabaseClient(mockSupabase)

      const response = await app.inject({
        method: 'GET',
        url: '/ready',
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.status).toBe('success')
      expect(body.data.status).toBe('ready')
      expect(body.data.dependencies.database).toBe('up')

      setSupabaseClient(null)
    })

    it('should return 503 Service Unavailable when database dependency is down', async () => {
      const mockSupabase = {
        from: () => ({
          select: () => ({
            limit: async () => ({ data: null, error: { message: 'Connection refused' } }),
          }),
        }),
      } as any
      setSupabaseClient(mockSupabase)

      const response = await app.inject({
        method: 'GET',
        url: '/ready',
      })

      expect(response.statusCode).toBe(503)
      const body = response.json()
      expect(body.status).toBe('error')
      expect(body.data.status).toBe('not_ready')
      expect(body.data.dependencies.database).toBe('down')

      setSupabaseClient(null)
    })
  })

  describe('Request ID & Correlation ID Propagation', () => {
    it('echoes valid x-request-id header and propagates x-correlation-id', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': 'req-client-pilot-12345',
          'x-correlation-id': 'corr-pilot-trace-999',
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers['x-request-id']).toBe('req-client-pilot-12345')
      expect(response.headers['x-correlation-id']).toBe('corr-pilot-trace-999')
    })

    it('sanitizes malicious x-request-id header and generates a safe UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'x-request-id': '<script>alert("hack")</script>',
        },
      })

      expect(response.statusCode).toBe(200)
      const returnedId = response.headers['x-request-id'] as string
      expect(returnedId).not.toContain('<script>')
      expect(/^[a-zA-Z0-9_-]{1,64}$/.test(returnedId)).toBe(true)
    })

    it('includes requestId in error responses', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/orders/webhook',
        headers: {
          'x-request-id': 'req-error-trace-456',
        },
        payload: {
          order_id: 'invalid-body',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = response.json()
      expect(body.status).toBe('error')
      expect(body.requestId).toBe('req-error-trace-456')
    })
  })
})
