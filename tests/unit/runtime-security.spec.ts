import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { errorResponse, successResponse } from '../../server/utils/response'

describe('Runtime Security & Sanitization', () => {
  describe('Error Response Sanitization', () => {
    it('sanitizes internal database error details on 500 errors', () => {
      const dbError = {
        message: 'relation "orders" does not exist',
        hint: 'Table name is hidden',
        details: 'Internal query failed at line 42',
        internalPosition: '42',
      }

      try {
        errorResponse(null as any, 'Database query failed', dbError, 500)
      } catch (err: any) {
        expect(err.statusCode).toBe(500)
        expect(err.data.status).toBe('error')
        expect(err.data.errors).not.toHaveProperty('details')
        expect(err.data.errors).not.toHaveProperty('hint')
        expect(err.data.errors).not.toHaveProperty('internalPosition')
        expect(err.data.errors.message).toBe('relation "orders" does not exist')
      }
    })

    it('preserves clean validation error objects on 400/422 errors', () => {
      const validationErrors = {
        entity_type: ['Required'],
        action: ['Invalid enum value'],
      }

      try {
        errorResponse(null as any, 'Validation error', validationErrors, 422)
      } catch (err: any) {
        expect(err.statusCode).toBe(422)
        expect(err.data.errors).toEqual(validationErrors)
      }
    })

    it('sanitizes Error instance stack traces', () => {
      const rawError = new Error('Secret internal failure in /etc/passwd')

      try {
        errorResponse(null as any, 'Operation failed', rawError, 500)
      } catch (err: any) {
        expect(err.statusCode).toBe(500)
        expect(err.data.errors).toEqual({
          message: 'Secret internal failure in /etc/passwd',
        })
        expect(err.data.errors).not.toHaveProperty('stack')
      }
    })
  })

  describe('Activity Log Payload Schema Validation', () => {
    const activityLogSchema = z.object({
      entity_type: z.string().min(1).max(50),
      entity_id: z.coerce.number().optional().nullable(),
      action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'RESTORE']),
      description: z.string().min(1).max(500),
      old_data: z.any().optional().nullable(),
      new_data: z.any().optional().nullable(),
    })

    it('accepts valid activity log payloads', () => {
      const validPayload = {
        entity_type: 'product',
        entity_id: 123,
        action: 'UPDATE',
        description: 'Updated product price',
      }
      const res = activityLogSchema.safeParse(validPayload)
      expect(res.success).toBe(true)
    })

    it('rejects invalid action enum values', () => {
      const invalidPayload = {
        entity_type: 'product',
        action: 'DROP_TABLE',
        description: 'Malicious attempt',
      }
      const res = activityLogSchema.safeParse(invalidPayload)
      expect(res.success).toBe(false)
    })

    it('rejects missing description or entity_type', () => {
      const invalidPayload = {
        action: 'CREATE',
      }
      const res = activityLogSchema.safeParse(invalidPayload)
      expect(res.success).toBe(false)
    })
  })
})
