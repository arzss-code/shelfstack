import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError, defineEventHandler, H3Error, type H3Event } from 'h3'
import { WELCOME_BOT_MESSAGE } from '../../server/utils/support-chat'
import {
  customerId,
  foreignId,
  orderId,
  otherOrderId,
  ownOrder,
  orderCard,
  threadRow,
  messageRow,
  database,
} from './fixtures/support-order'

const edges = vi.hoisted(() => ({ auth: vi.fn(), serviceRole: vi.fn(), readBody: vi.fn() }))
vi.mock('../../server/utils/auth', () => ({ requireUser: edges.auth }))

let post: typeof import('../../server/api/support/messages.post').default
let get: typeof import('../../server/api/support/thread.get').default
let db: ReturnType<typeof database>
const event = { context: { requestId: 'support-order-test' } } as unknown as H3Event
const send = (attachment: string | null = orderId) => {
  edges.readBody.mockResolvedValue({ message_text: 'Pesanan saya', attached_order_id: attachment })
  return post(event)
}

beforeAll(async () => {
  vi.doMock('#supabase/server', () => ({ serverSupabaseServiceRole: edges.serviceRole }))
  vi.stubGlobal('defineEventHandler', defineEventHandler)
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('readBody', edges.readBody)
  post = (await import('../../server/api/support/messages.post')).default
  get = (await import('../../server/api/support/thread.get')).default
})
beforeEach(() => {
  vi.clearAllMocks()
  db = database()
  edges.serviceRole.mockReturnValue(db)
  edges.auth.mockResolvedValue({
    user: { id: customerId },
    profile: { user_id: foreignId, role: 'customer' },
  })
})
afterAll(() => {
  vi.doUnmock('#supabase/server')
  vi.unstubAllGlobals()
})

async function expectSafeError(result: Promise<unknown>, statusCode: number, message: string) {
  const error: unknown = await result.then(
    () => null,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(H3Error)
  expect(error).toMatchObject({
    statusCode,
    message,
    data: { status: 'error', message, data: null, errors: null },
  })
  expect(JSON.stringify(error)).not.toContain('private')
}

describe('support order attachment ownership, actual handlers', () => {
  it.each(['new', 'existing'] as const)(
    'POST attests an own order before %s thread mutations and preserves the welcome response',
    async (kind) => {
      if (kind === 'existing') db.rows.support_threads.push(threadRow())
      const result = await send()
      expect(result).toMatchObject({
        status: 'success',
        message: 'Pesan berhasil dikirim',
        errors: null,
        data: {
          message: {
            sender_id: customerId,
            attachment_type: 'order_card',
            attached_order: orderCard,
            attached_product: null,
          },
          system_message: { sender_type: 'system', message_text: WELCOME_BOT_MESSAGE },
        },
      })
      expect(db.rows.support_threads[0]?.attached_order_id).toBe(orderId)
      expect(db.rows.support_messages).toHaveLength(2)
      expect(db.operations[0]).toEqual({ table: 'orders', action: 'select' })
      expect(db.operations.filter((op) => op.table === 'orders')).toHaveLength(1)
    },
  )

  describe.each(['new', 'existing', 'already attached'] as const)(
    'POST rejected attachments with %s thread',
    (kind) => {
      it.each(['foreign', 'missing', 'unrelated'] as const)(
        'returns the same 404 for %s orders without side effects',
        async (state) => {
          if (kind !== 'new')
            db.rows.support_threads.push(
              threadRow(kind === 'already attached' ? otherOrderId : null),
            )
          if (state === 'foreign') db.rows.orders[0]!.user_id = foreignId
          if (state === 'missing') db.rows.orders = []
          if (state === 'unrelated') db.rows.orders = [{ ...ownOrder, id: otherOrderId }]
          const snapshot = structuredClone(db.rows)
          await expectSafeError(send(), 404, 'Pesanan tidak ditemukan.')
          expect(db.mutations).toEqual([])
          expect(db.rows).toEqual(snapshot)
        },
      )
    },
  )

  it.each(['not-a-uuid', "' OR 1=1 --", '550e8400-e29b-41d4-a716-44665544000z'])(
    'POST rejects invalid order UUID %s with 400 before database access',
    async (invalidId) => {
      await expectSafeError(send(invalidId), 400, 'ID pesanan tidak valid')
      expect(db.from).not.toHaveBeenCalled()
      expect(db.mutations).toEqual([])
    },
  )

  it.each(['POST', 'GET'] as const)(
    '%s preserves typed auth rejection before database access',
    async (method) => {
      edges.auth.mockRejectedValueOnce(
        createError({ statusCode: 401, message: 'Unauthorized. Silakan login dulu.' }),
      )
      await expectSafeError(
        method === 'POST' ? send() : get(event),
        401,
        'Unauthorized. Silakan login dulu.',
      )
      expect(edges.serviceRole).not.toHaveBeenCalled()
      expect(db.from).not.toHaveBeenCalled()
    },
  )

  describe.each(['returned', 'thrown'] as const)('order lookup %s database failure', (mode) => {
    it.each(['new', 'existing'] as const)(
      'POST fails closed with a generic 500 before %s thread mutations',
      async (kind) => {
        if (kind === 'existing') db.rows.support_threads.push(threadRow())
        db.failOrders(mode)
        await expectSafeError(send(), 500, 'Gagal memuat lampiran pesanan.')
        expect(db.mutations).toEqual([])
        expect(db.rows.support_messages).toEqual([])
      },
    )
    it('GET fails closed with a generic 500 without exposing order details', async () => {
      db.rows.support_threads.push(threadRow(orderId))
      db.rows.support_messages.push(messageRow())
      db.failOrders(mode)
      await expectSafeError(get(event), 500, 'Gagal memuat lampiran pesanan.')
      expect(db.mutations).toEqual([])
    })
  })

  it.each([undefined, null])(
    'POST sends normally with attached_order_id=%s and no order lookup',
    async (attachment) => {
      edges.readBody.mockResolvedValue({ message_text: 'Halo', attached_order_id: attachment })
      const result = await post(event)
      expect(result.data.message).toMatchObject({
        message_text: 'Halo',
        attachment_type: null,
        attached_order: null,
        attached_product: null,
      })
      expect(result.data.system_message?.message_text).toBe(WELCOME_BOT_MESSAGE)
      expect(db.operations.some((op) => op.table === 'orders')).toBe(false)
    },
  )

  it('POST preserves product attachment enrichment and does not repeat the welcome on an ongoing thread', async () => {
    db.rows.support_threads.push(threadRow())
    db.rows.support_messages.push(messageRow(null, 'Halo'))
    db.rows.products.push({ id: 7, name: 'Lampu', price_cents: 45000, image_url: null })
    edges.readBody.mockResolvedValue({ message_text: 'Produk ini', attached_product_id: 7 })
    const result = await post(event)
    expect(result.data.message).toMatchObject({
      attachment_type: 'product_card',
      attached_order: null,
      attached_product: { id: 7, title: 'Lampu', price_cents: 45000, image_url: null },
    })
    expect(result.data.system_message).toBeNull()
    expect(db.rows.support_threads[0]?.attached_product_id).toBe(7)
    expect(db.operations.some((op) => op.table === 'orders')).toBe(false)
  })

  it.each(['POST', 'GET'] as const)(
    '%s succeeds using only schema-defined order fields and ownership predicates',
    async (method) => {
      if (method === 'GET') {
        db.rows.support_threads.push(threadRow(orderId))
        db.rows.support_messages.push(messageRow())
      }
      const result = await (method === 'POST' ? send() : get(event))
      expect(result.status).toBe('success')
      expect(db.orderQueries).toEqual([
        {
          columns: ['id', 'total_cents', 'status', 'created_at'],
          filters: [
            ['id', orderId],
            ['user_id', customerId],
          ],
        },
      ])
    },
  )

  it('GET enriches both explicit order cards and historical text messages for an own order', async () => {
    db.rows.support_threads.push(threadRow(orderId))
    db.rows.support_messages.push(messageRow(), { ...messageRow(null), id: 'legacy-message' })
    const result = await get(event)
    expect(result).toMatchObject({
      status: 'success',
      message: 'Thread bantuan berhasil dimuat',
      errors: null,
      data: {
        thread: { id: 'thread-1' },
        messages: [
          { id: 'legacy-message', attached_order: orderCard },
          { id: 'message-1', attached_order: orderCard },
        ],
      },
    })
    expect(db.mutations).toEqual([])
  })

  it.each(['foreign', 'missing', 'unrelated'] as const)(
    'GET hides historical %s attachments in cards and text fallback without rewriting the thread',
    async (state) => {
      db.rows.support_threads.push(threadRow(orderId))
      db.rows.support_messages.push(messageRow(), { ...messageRow(null), id: 'legacy-message' })
      if (state === 'foreign') db.rows.orders[0]!.user_id = foreignId
      if (state === 'missing') db.rows.orders = []
      if (state === 'unrelated') db.rows.orders = [{ ...ownOrder, id: otherOrderId }]
      const result = await get(event)
      expect(result.status).toBe('success')
      expect(result.data.messages).toHaveLength(2)
      for (const message of result.data.messages) {
        expect(message.attached_order ?? null).toBeNull()
        expect(message).not.toHaveProperty('total_cents')
        expect(message).not.toHaveProperty('status')
      }
      expect(db.rows.support_threads[0]?.attached_order_id).toBe(orderId)
      expect(db.mutations).toEqual([])
    },
  )

  it('GET preserves empty thread initialization without an attachment lookup', async () => {
    const result = await get(event)
    expect(result).toMatchObject({
      status: 'success',
      data: { thread: { customer_id: customerId, status: 'open' }, messages: [] },
    })
    expect(db.operations.some((op) => op.table === 'orders')).toBe(false)
  })

  it('GET keeps product-card enrichment working', async () => {
    db.rows.support_threads.push({ ...threadRow(), attached_product_id: 7 })
    db.rows.support_messages.push(messageRow('product_card', 'Produk ini'))
    db.rows.products.push({ id: 7, name: 'Lampu', price_cents: 45000, image_url: null })
    const result = await get(event)
    expect(result.data.messages[0]?.attached_product).toEqual({
      id: 7,
      title: 'Lampu',
      price_cents: 45000,
      image_url: null,
    })
    expect(db.operations.some((op) => op.table === 'orders')).toBe(false)
  })
})
