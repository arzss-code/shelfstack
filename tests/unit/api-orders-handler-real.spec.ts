import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, H3Error, type H3Event } from 'h3'
import { errorResponse, successResponse } from '../../server/utils/response'
import { calculateCheckoutHash } from '../../server/utils/idempotency'

const edges = vi.hoisted(() => ({
  supabaseClient: vi.fn(),
  requireUser: vi.fn(),
  getMethod: vi.fn(),
  getHeader: vi.fn(),
  readBody: vi.fn(),
  getQuery: vi.fn(),
  enqueueOrderExpiry: vi.fn(async () => true),
  createNotification: vi.fn(async () => undefined),
  dispatchEmail: vi.fn(async () => undefined),
}))

vi.mock('../../server/utils/order-service', () => ({
  enqueueOrderExpiryNotification: edges.enqueueOrderExpiry,
}))

let handler: typeof import('../../server/api/orders/index').default

const validCheckoutBody = {
  items: [{ product_id: 101, qty: 2 }],
  address: {
    name: 'Arya Santoso',
    phone: '081234567890',
    street: 'Jl. Sudirman No. 42, Jakarta',
    city: 'Jakarta Pusat',
    postal: '10220',
  },
  shipping_service: 'express' as const,
  coins_used: 500,
}

function makeOrderClient(options?: {
  rpcImpl?: (
    name: string,
    params: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>
  summaryRow?: Record<string, unknown> | null
}) {
  const rpc = vi.fn(
    options?.rpcImpl ??
      (async () => ({
        data: '00000000-0000-4000-8000-000000000101',
        error: null,
      })),
  )

  const summaryData =
    options?.summaryRow !== undefined
      ? options.summaryRow
      : {
          id: '00000000-0000-4000-8000-000000000101',
          total_cents: 52500000,
          subtotal_cents: 50000000,
          discount_cents: 0,
          coupon_code: null,
          coins_used: 500,
          coins_discount_cents: 50000,
          shipping_cost_cents: 3000000,
          shipping_service: 'express',
        }

  const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: summaryData, error: null })),
  }))

  return { rpc, from }
}

const fakeEvent = { context: { requestId: 'orders-real-test' } } as unknown as H3Event

async function expectHttpError(promise: Promise<unknown>, statusCode: number) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  expect(err).toBeInstanceOf(H3Error)
  expect(err).toMatchObject({ statusCode })
  return err as H3Error
}

describe('Real Handler: server/api/orders/index.ts (POST)', () => {
  beforeAll(async () => {
    vi.doMock('#supabase/server', () => ({ serverSupabaseClient: edges.supabaseClient }))
    vi.stubGlobal('requireUser', edges.requireUser)
    vi.stubGlobal('errorResponse', errorResponse)
    vi.stubGlobal('successResponse', successResponse)
    vi.stubGlobal('createNotification', edges.createNotification)
    vi.stubGlobal('dispatchOrderTransactionalEmail', edges.dispatchEmail)
    vi.doMock('h3', async () => {
      const actual = await vi.importActual<typeof import('h3')>('h3')
      return {
        ...actual,
        getMethod: edges.getMethod,
        getHeader: edges.getHeader,
        readBody: edges.readBody,
        getQuery: edges.getQuery,
      }
    })
    handler = (await import('../../server/api/orders/index')).default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    edges.getMethod.mockReturnValue('POST')
    edges.getHeader.mockReturnValue('idem-key-real-001')
    edges.readBody.mockResolvedValue(validCheckoutBody)
    edges.requireUser.mockResolvedValue({
      user: { id: 'user-1', email: 'buyer@shelfstack.local' },
      profile: { user_id: 'user-1', role: 'customer' },
    })
  })

  afterAll(() => {
    vi.doUnmock('#supabase/server')
    vi.doUnmock('h3')
    vi.unstubAllGlobals()
  })

  it('invokes real create_order RPC with 8 args + hash and returns authoritative summary', async () => {
    const dbClient = makeOrderClient()
    edges.supabaseClient.mockResolvedValue(dbClient)

    const res = (await handler(fakeEvent)) as {
      status: string
      data: { order_id: string; summary: Record<string, unknown> }
    }

    expect(res.status).toBe('success')
    expect(res.data.order_id).toBe('00000000-0000-4000-8000-000000000101')
    expect(res.data.summary.shipping_cost_cents).toBe(3000000)
    expect(dbClient.rpc).toHaveBeenCalledTimes(1)
    expect(dbClient.rpc).toHaveBeenCalledWith('create_order', {
      p_items: validCheckoutBody.items,
      p_address: validCheckoutBody.address,
      p_idempotency_key: 'idem-key-real-001',
      p_request_hash: calculateCheckoutHash(validCheckoutBody),
      p_coupon_code: null,
      p_shipping_service: 'express',
      p_courier_code: null,
      p_coins_used: 500,
    })
  })

  it('rejects invalid Idempotency-Key with HTTP 400 before RPC execution', async () => {
    const dbClient = makeOrderClient()
    edges.supabaseClient.mockResolvedValue(dbClient)
    edges.getHeader.mockReturnValue('invalid key with spaces!')

    await expectHttpError(handler(fakeEvent), 400)
    expect(dbClient.rpc).not.toHaveBeenCalled()
  })

  it('maps IDEMPOTENCY_CONFLICT RPC errors to HTTP 409', async () => {
    const dbClient = makeOrderClient({
      rpcImpl: async () => ({
        data: null,
        error: { message: 'IDEMPOTENCY_CONFLICT: payload mismatch' },
      }),
    })
    edges.supabaseClient.mockResolvedValue(dbClient)

    await expectHttpError(handler(fakeEvent), 409)
  })

  it('falls back to 5-arg create_order signature when PGRST202 occurs', async () => {
    const dbClient = makeOrderClient({
      rpcImpl: vi
        .fn()
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST202', message: 'schema cache miss' },
        })
        .mockResolvedValueOnce({
          data: '00000000-0000-4000-8000-000000000202',
          error: null,
        }),
    })
    edges.supabaseClient.mockResolvedValue(dbClient)

    const res = (await handler(fakeEvent)) as { data: { order_id: string } }
    expect(res.data.order_id).toBe('00000000-0000-4000-8000-000000000202')
    expect(dbClient.rpc).toHaveBeenCalledTimes(2)
  })

  it('preserves 401 rejection before calling create_order when unauthenticated', async () => {
    const dbClient = makeOrderClient()
    edges.supabaseClient.mockResolvedValue(dbClient)
    edges.requireUser.mockRejectedValueOnce(
      createError({ statusCode: 401, message: 'Unauthorized' }),
    )

    await expectHttpError(handler(fakeEvent), 401)
    expect(dbClient.rpc).not.toHaveBeenCalled()
  })
})
