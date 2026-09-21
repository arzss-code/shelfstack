import { describe, it, expect, vi } from 'vitest'
import { successResponse, errorResponse } from '../../server/utils/response'

describe('API Response Utilities', () => {
  it('should format success response correctly', () => {
    const data = { id: 1, name: 'Product A' }
    const result = successResponse('Success', data)

    expect(result).toEqual({
      status: 'success',
      message: 'Success',
      data: data,
      errors: null,
    })
  })

  it('should format error response and throw Nuxt Error', () => {
    try {
      errorResponse(null as any, 'Validation Failed', { field: 'name required' }, 422)
    } catch (e: any) {
      expect(e.statusCode).toBe(422)
      expect(e.message).toBe('Validation Failed')
      expect(e.data).toEqual({
        status: 'error',
        message: 'Validation Failed',
        data: null,
        errors: { field: 'name required' },
      })
    }
  })
})
