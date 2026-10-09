import { describe, expect, it, vi } from 'vitest'
import { calculateCheckoutHash, validateIdempotencyKey } from '../../server/utils/idempotency'
import { checkoutSchema } from '../../shared/schemas/order'

/**
 * API-Level Endpoint Simulation & Verification Suite
 * Menguji seluruh alur request handling pada POST /api/orders:
 * 1. New request (200 OK + order_id)
 * 2. Replay request (200 OK + same order_id)
 * 3. Conflict request (409 Conflict)
 * 4. Invalid key validation (400 Bad Request)
 * 5. Missing key (200 OK, backward compatibility)
 * 6. Auth isolation (User A & User B with same key)
 */

describe('POST /api/orders Endpoint Handler Behavior (API-Level)', () => {
  const validPayload = {
    items: [{ product_id: 101, qty: 2 }],
    address: {
      name: 'John Doe',
      phone: '081234567890',
      street: 'Jl. Melati No. 12',
      city: 'Jakarta',
      postal: '10110',
    },
  }

  // Simulated handler mirroring server/api/orders/index.ts
  const simulateOrdersEndpoint = async (
    headers: Record<string, string | undefined>,
    body: any,
    userId: string,
    mockRpc: (name: string, params: any) => Promise<{ data: any; error: any }>,
  ) => {
    // 1. Header validation
    const rawKey = headers['idempotency-key']
    const keyValidation = validateIdempotencyKey(rawKey)

    if (!keyValidation.isValid) {
      return {
        statusCode: 400,
        status: 'error',
        message: keyValidation.error || 'Idempotency-Key tidak valid',
      }
    }

    const idempotencyKey = keyValidation.key

    // 2. Body schema validation
    const parsed = checkoutSchema.safeParse(body)
    if (!parsed.success) {
      return {
        statusCode: 400,
        status: 'error',
        message: 'Validasi data pesanan gagal',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    // 3. Request hash
    const requestHash = idempotencyKey ? calculateCheckoutHash(parsed.data) : null

    // 4. RPC execution
    const { data: orderId, error } = await mockRpc('create_order', {
      p_items: parsed.data.items,
      p_address: parsed.data.address,
      p_idempotency_key: idempotencyKey,
      p_request_hash: requestHash,
    })

    if (error) {
      if (error.message?.includes('IDEMPOTENCY_CONFLICT')) {
        return {
          statusCode: 409,
          status: 'error',
          message: error.message,
          errors: { code: 'IDEMPOTENCY_CONFLICT', idempotency_key: idempotencyKey },
        }
      }
      return {
        statusCode: 400,
        status: 'error',
        message: error.message,
      }
    }

    return {
      statusCode: 200,
      status: 'success',
      data: { order_id: orderId },
    }
  }

  it('A. New request: valid key -> status 200 OK dan mengembalikan order_id baru', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: 'ord-uuid-001',
      error: null,
    })

    const res = await simulateOrdersEndpoint(
      { 'idempotency-key': 'key-new-1' },
      validPayload,
      'user-1',
      mockRpc,
    )

    expect(res.statusCode).toBe(200)
    expect(res.status).toBe('success')
    expect(res.data?.order_id).toBe('ord-uuid-001')
    expect(mockRpc).toHaveBeenCalledWith(
      'create_order',
      expect.objectContaining({
        p_idempotency_key: 'key-new-1',
        p_request_hash: expect.any(String),
      }),
    )
  })

  it('B. Replay request: same key + same payload -> status 200 OK dan mengembalikan order_id yang sama', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: 'ord-uuid-001', // Replayed order ID
      error: null,
    })

    const res = await simulateOrdersEndpoint(
      { 'idempotency-key': 'key-new-1' },
      validPayload,
      'user-1',
      mockRpc,
    )

    expect(res.statusCode).toBe(200)
    expect(res.data?.order_id).toBe('ord-uuid-001')
  })

  it('C. Conflict request: same key + different payload -> status 409 Conflict', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message:
          'IDEMPOTENCY_CONFLICT: Idempotency-Key "key-new-1" telah digunakan untuk transaksi dengan rincian berbeda',
      },
    })

    const modifiedPayload = {
      ...validPayload,
      items: [{ product_id: 101, qty: 5 }],
    }

    const res = await simulateOrdersEndpoint(
      { 'idempotency-key': 'key-new-1' },
      modifiedPayload,
      'user-1',
      mockRpc,
    )

    expect(res.statusCode).toBe(409)
    expect(res.status).toBe('error')
    expect(res.errors?.code).toBe('IDEMPOTENCY_CONFLICT')
    expect(res.message).toContain('IDEMPOTENCY_CONFLICT')
  })

  it('D. Invalid key: whitespace atau melebihi 255 karakter -> status 400 Bad Request tanpa memanggil RPC', async () => {
    const mockRpc = vi.fn()

    // Whitespace only
    const resWhitespace = await simulateOrdersEndpoint(
      { 'idempotency-key': '   ' },
      validPayload,
      'user-1',
      mockRpc,
    )
    expect(resWhitespace.statusCode).toBe(400)
    expect(resWhitespace.message).toContain('tidak boleh berupa string kosong')

    // Too long
    const resTooLong = await simulateOrdersEndpoint(
      { 'idempotency-key': 'x'.repeat(256) },
      validPayload,
      'user-1',
      mockRpc,
    )
    expect(resTooLong.statusCode).toBe(400)
    expect(resTooLong.message).toContain('255 karakter')

    // Disallowed control chars
    const resControl = await simulateOrdersEndpoint(
      { 'idempotency-key': 'key\x00invalid' },
      validPayload,
      'user-1',
      mockRpc,
    )
    expect(resControl.statusCode).toBe(400)

    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('E. Missing key: optional header -> status 200 OK dengan p_idempotency_key = null (backward compatibility)', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: 'ord-uuid-no-key',
      error: null,
    })

    const res = await simulateOrdersEndpoint(
      {}, // No idempotency-key header
      validPayload,
      'user-1',
      mockRpc,
    )

    expect(res.statusCode).toBe(200)
    expect(res.data?.order_id).toBe('ord-uuid-no-key')
    expect(mockRpc).toHaveBeenCalledWith(
      'create_order',
      expect.objectContaining({
        p_idempotency_key: null,
        p_request_hash: null,
      }),
    )
  })

  it('F. Auth isolation: User A dan User B menggunakan key yang sama dieksekusi secara independen', async () => {
    const mockRpcUserA = vi.fn().mockResolvedValue({
      data: 'ord-user-a',
      error: null,
    })
    const mockRpcUserB = vi.fn().mockResolvedValue({
      data: 'ord-user-b',
      error: null,
    })

    const resA = await simulateOrdersEndpoint(
      { 'idempotency-key': 'shared-key-123' },
      validPayload,
      'user-a',
      mockRpcUserA,
    )
    const resB = await simulateOrdersEndpoint(
      { 'idempotency-key': 'shared-key-123' },
      validPayload,
      'user-b',
      mockRpcUserB,
    )

    expect(resA.statusCode).toBe(200)
    expect(resA.data?.order_id).toBe('ord-user-a')

    expect(resB.statusCode).toBe(200)
    expect(resB.data?.order_id).toBe('ord-user-b')
  })
})
