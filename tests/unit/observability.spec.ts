import { describe, expect, it, vi } from 'vitest'
import {
  REQUEST_ID_REGEX,
  logger,
  resolveRequestId,
  sanitizeLogData,
} from '../../server/utils/logger'
import { metrics } from '../../server/utils/metrics'
import { errorResponse, successResponse } from '../../server/utils/response'

describe('Observability & Operational Readiness', () => {
  describe('1. Request ID Generation & Validation', () => {
    it('generates a valid UUID when request ID header is absent', () => {
      const generated = resolveRequestId()
      expect(generated).toBeDefined()
      expect(typeof generated).toBe('string')
      expect(generated.length).toBeGreaterThan(10)
      expect(REQUEST_ID_REGEX.test(generated)).toBe(true)
    })

    it('accepts and preserves a valid external alphanumeric request ID', () => {
      const customId = 'req-prod-gw-987654321_abc'
      const resolved = resolveRequestId(customId)
      expect(resolved).toBe(customId)
    })

    it('rejects malicious or invalid request IDs and falls back to a clean UUID', () => {
      const dangerousInputs = [
        '<script>alert(1)</script>',
        'req id with spaces',
        '../../etc/passwd',
        'invalid;drop table orders;--',
        'a'.repeat(65), // Exceeds 64 chars limit
      ]

      for (const input of dangerousInputs) {
        const resolved = resolveRequestId(input)
        expect(resolved).not.toBe(input)
        expect(REQUEST_ID_REGEX.test(resolved)).toBe(true)
      }
    })
  })

  describe('2. Structured Logging Redaction & Sanitization', () => {
    it('redacts sensitive keys in objects and nested payloads', () => {
      const sensitivePayload = {
        order_id: 'a0000000-0000-0000-0000-000000000001',
        authorization: 'Bearer super-secret-admin-token',
        cookie: 'sb-access-token=xyz123',
        signature_key: '5f4dcc3b5aa765d61d8327deb882cf992b9699aaf928b03750d75a896d9cb115e347',
        midtrans_server_key: 'SB-Mid-server-secretKey123',
        service_role_key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWYiOiJteS1wcm9qZWN0In0.abc',
        phone: '08123456789',
        address: 'Jl. Sudirman Kav 21, Jakarta Pusat',
        nested: {
          password: 'mySecretPassword123',
          snap_token: 'snap-token-abcdef123456',
        },
      }

      const sanitized = sanitizeLogData(sensitivePayload) as Record<string, any>

      expect(sanitized.order_id).toBe('a0000000-0000-0000-0000-000000000001')
      expect(sanitized.authorization).toBe('[REDACTED]')
      expect(sanitized.cookie).toBe('[REDACTED]')
      expect(sanitized.signature_key).toBe('[REDACTED]')
      expect(sanitized.midtrans_server_key).toBe('[REDACTED]')
      expect(sanitized.service_role_key).toBe('[REDACTED]')
      expect(sanitized.phone).toBe('[REDACTED]')
      expect(sanitized.address).toBe('[REDACTED]')
      expect(sanitized.nested.password).toBe('[REDACTED]')
      expect(sanitized.nested.snap_token).toBe('[REDACTED]')
    })

    it('redacts JWT tokens and SHA-512 signatures embedded in plain text messages', () => {
      const rawJwt = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc'
      const rawSha512 = 'a'.repeat(128) // 128-char hex string representing SHA-512 signature
      const message = `Failed request with token ${rawJwt} and signature ${rawSha512}`

      const sanitized = sanitizeLogData(message) as string
      expect(sanitized).not.toContain(rawJwt)
      expect(sanitized).not.toContain(rawSha512)
      expect(sanitized).toContain('Bearer [REDACTED_JWT]')
      expect(sanitized).toContain('[REDACTED_SHA512]')
    })

    it('redacts error stack traces in production environment', () => {
      const origEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      try {
        const error = new Error('Database connection failed')
        const sanitized = sanitizeLogData(error) as Record<string, any>

        expect(sanitized.name).toBe('Error')
        expect(sanitized.message).toBe('Database connection failed')
        expect(sanitized.stack).toBeUndefined()
      } finally {
        process.env.NODE_ENV = origEnv
      }
    })
  })

  describe('3. Request ID in Error Responses & Fail-Closed Behavior', () => {
    it('attaches requestId to error response when available in event context', () => {
      const mockEvent = {
        context: {
          requestId: 'test-req-id-12345',
        },
        path: '/api/orders',
        method: 'POST',
      }

      try {
        errorResponse(mockEvent, 'Invalid payment details', null, 400)
      } catch (err: any) {
        expect(err.statusCode).toBe(400)
        expect(err.data.status).toBe('error')
        expect(err.data.message).toBe('Invalid payment details')
        expect(err.data.requestId).toBe('test-req-id-12345')
      }
    })

    it('does not leak internal database details or credentials on 500 errors', () => {
      const mockEvent = {
        context: {
          requestId: 'test-req-500',
        },
      }
      const rawDbError = {
        message: 'password authentication failed for user "postgres"',
        details:
          'Failed at port 5432 with connection string postgres://user:secret@db.internal:5432/main',
        hint: 'Check database password',
      }

      try {
        errorResponse(mockEvent, 'Internal system failure', rawDbError, 500)
      } catch (err: any) {
        expect(err.statusCode).toBe(500)
        expect(err.data.requestId).toBe('test-req-500')
        expect(err.data.errors).not.toHaveProperty('details')
        expect(err.data.errors).not.toHaveProperty('hint')
      }
    })
  })

  describe('4. Operational Signals & Metrics Collector', () => {
    it('records and tracks requests, errors, webhooks, refunds, and reconciliation counts', () => {
      metrics.reset()

      // Requests
      metrics.recordRequest(200)
      metrics.recordRequest(201)
      metrics.recordRequest(400)
      metrics.recordRequest(404)
      metrics.recordRequest(500)

      // Webhooks
      metrics.recordWebhook(true)
      metrics.recordWebhook(false)

      // Refunds
      metrics.recordRefund(true)
      metrics.recordRefund(false)

      // Reconciliations
      metrics.recordReconciliation(true)
      metrics.recordReconciliation(false)

      const snapshot = metrics.getSnapshot()
      expect(snapshot.requestsTotal).toBe(5)
      expect(snapshot.requestsSuccess).toBe(2)
      expect(snapshot.requestsClientError).toBe(2)
      expect(snapshot.requestsServerError).toBe(1)

      expect(snapshot.webhookTotal).toBe(2)
      expect(snapshot.webhookSuccess).toBe(1)
      expect(snapshot.webhookFailure).toBe(1)

      expect(snapshot.refundTotal).toBe(2)
      expect(snapshot.refundSuccess).toBe(1)
      expect(snapshot.refundFailure).toBe(1)

      expect(snapshot.reconciliationTotal).toBe(2)
      expect(snapshot.reconciliationSuccess).toBe(1)
      expect(snapshot.reconciliationFailure).toBe(1)
    })
  })

  describe('5. Logging Entry Generation', () => {
    it('creates well-formed structured log entries', () => {
      const entry = logger.createEntry('info', 'Order status updated', {
        requestId: 'req-abc-123',
        route: '/api/orders/update',
        method: 'POST',
        statusCode: 200,
        orderId: 'a0000000-0000-0000-0000-000000000001',
      })

      expect(entry.level).toBe('info')
      expect(entry.service).toBe('shelfstack-frontend')
      expect(entry.requestId).toBe('req-abc-123')
      expect(entry.correlationId).toBe('req-abc-123')
      expect(entry.route).toBe('/api/orders/update')
      expect(entry.statusCode).toBe(200)
      expect(entry.context?.orderId).toBe('a0000000-0000-0000-0000-000000000001')
      expect(typeof entry.timestamp).toBe('string')
    })
  })
})
