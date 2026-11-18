import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { H3Event } from 'h3'
import { adminVariantCreateSchema } from '~~/shared/schemas/product-variant'
import { adminFlashDealCreateSchema } from '~~/shared/schemas/flash-deals'
import { adminCategoryCreateSchema } from '~~/shared/schemas/category'
import { adminContactUpdateSchema } from '~~/shared/schemas/contact'
import { customerRefundRequestSchema } from '~~/shared/schemas/refund-request'
import OrderDetailPaymentCard from '~/features/orders/components/OrderDetailPaymentCard.vue'

describe('Stage 2 Remediations: Schemas, API Guards, & Customer/Admin UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('validates variant, flash-deal date range, category slug, contact status, and refund reason schemas', () => {
    expect(adminVariantCreateSchema.safeParse({ sku: 'KB-75-BLK', name: 'Hitam' }).success).toBe(
      true,
    )
    expect(
      adminFlashDealCreateSchema.safeParse({
        product_id: 1,
        promo_price_cents: 5000000,
        discount_percentage: 20,
        quota: 10,
        starts_at: '2026-12-02T10:00:00.000Z',
        ends_at: '2026-12-01T10:00:00.000Z',
      }).success,
    ).toBe(false)

    expect(
      adminCategoryCreateSchema.safeParse({ name: 'Audio Studio', slug: 'Audio Studio!' }).success,
    ).toBe(false)
    expect(
      adminCategoryCreateSchema.safeParse({ name: 'Audio Studio', slug: 'audio-studio' }).success,
    ).toBe(true)

    expect(adminContactUpdateSchema.safeParse({ status: 'in_progress' }).success).toBe(true)
    expect(adminContactUpdateSchema.safeParse({ status: 'archived' }).success).toBe(false)

    expect(customerRefundRequestSchema.safeParse({ reason: '1234' }).success).toBe(false)
    expect(
      customerRefundRequestSchema.safeParse({ reason: 'Ingin ubah alamat tujuan sebelum kirim' })
        .success,
    ).toBe(true)
  })

  it('blocks category soft-delete with 409 when active products reference the category', async () => {
    const categoryUuid = '11111111-1111-4111-8111-111111111111'
    const updateMock = vi.fn()
    const clientMock = {
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: () => ({
              eq: () => ({
                is: async () => ({ count: 3, error: null }),
              }),
            }),
          }
        }
        return { update: updateMock }
      }),
    }

    vi.doMock('h3', async (importOriginal) => {
      const actual = await importOriginal<typeof import('h3')>()
      return { ...actual, getRouterParam: () => categoryUuid }
    })
    vi.doMock('#supabase/server', () => ({
      serverSupabaseServiceRole: () => clientMock,
      serverSupabaseUser: vi.fn(),
      serverSupabaseClient: vi.fn(),
    }))
    vi.doMock('~~/server/utils/auth', () => ({
      requireAdmin: async () => ({ user: { id: 'admin-1' }, profile: { role: 'admin' } }),
    }))

    const handler = (await import('~~/server/api/admin/categories/[id].delete')).default
    const fakeEvent = {
      node: { res: { statusCode: 200 } },
      context: { requestId: 'req-cat' },
    } as unknown as H3Event

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 409,
    })
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('creates idempotent pending refund for paid unshipped customer order', async () => {
    const orderUuid = '22222222-2222-4222-8222-222222222222'
    const insertSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: '33333333-3333-4333-8333-333333333333',
        order_id: orderUuid,
        status: 'pending',
        amount_cents: 25000000,
        reason: 'Salah memilih alamat',
      },
      error: null,
    })

    const clientMock = {
      from: vi.fn((table: string) => {
        if (table === 'orders') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: orderUuid,
                    user_id: 'user-1',
                    status: 'paid',
                    tracking_number: null,
                    total_cents: 25000000,
                    midtrans_id: 'mid-123',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'refunds') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  order: () => ({
                    limit: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
                  }),
                }),
              }),
            }),
            insert: () => ({ select: () => ({ single: insertSingleMock }) }),
          }
        }
        return { insert: () => ({ select: () => ({ single: async () => ({ data: null }) }) }) }
      }),
    }

    vi.doMock('h3', async (importOriginal) => {
      const actual = await importOriginal<typeof import('h3')>()
      return {
        ...actual,
        getRouterParam: () => orderUuid,
        readBody: async () => ({ reason: 'Salah memilih alamat' }),
      }
    })
    vi.doMock('#supabase/server', () => ({
      serverSupabaseServiceRole: () => clientMock,
      serverSupabaseUser: vi.fn(),
      serverSupabaseClient: vi.fn(),
    }))
    vi.doMock('~~/server/utils/auth', () => ({
      requireUser: async () => ({ user: { id: 'user-1' }, profile: { role: 'user' } }),
    }))
    vi.doMock('~~/server/utils/notifications', () => ({
      createNotification: vi.fn().mockResolvedValue({ data: null, error: null }),
    }))

    const handler = (await import('~~/server/api/orders/[id]/request-refund.post')).default
    const fakeEvent = { node: { res: { statusCode: 200 } } } as unknown as H3Event
    const res = (await handler(fakeEvent)) as {
      status: string
      data: { status: string; order_id: string }
    }

    expect(res.status).toBe('success')
    expect(fakeEvent.node.res.statusCode).toBe(201)
    expect(res.data.status).toBe('pending')
    expect(insertSingleMock).toHaveBeenCalledTimes(1)
  })

  it('renders pre-shipment refund CTA only when order is paid without tracking number', () => {
    const baseOrder = {
      id: '22222222-2222-4222-8222-222222222222',
      user_id: 'user-1',
      status: 'paid' as const,
      total_cents: 15000000,
      tracking_number: null,
      created_at: '2026-11-18T00:00:00Z',
      items: [],
    }
    const stubOpts = {
      props: {
        order: baseOrder,
        isPaying: false,
        isCancelling: false,
        isManualChecking: false,
        getPaymentStatusBadge: () => ({ variant: 'success' as const, label: 'Lunas' }),
        formatShippingServiceName: () => 'Reguler',
      },
      global: {
        stubs: {
          UiBadge: { props: ['label'], template: '<span>{{ label }}</span>' },
          UiButton: { template: '<button><slot /></button>' },
          OrderPaymentCountdownCard: { template: '<div />' },
        },
      },
    }

    const eligibleWrapper = mount(OrderDetailPaymentCard, stubOpts)
    expect(eligibleWrapper.text()).toContain('Ajukan Pembatalan & Refund')

    const pendingWrapper = mount(OrderDetailPaymentCard, {
      ...stubOpts,
      props: {
        ...stubOpts.props,
        paidRefundRequest: {
          id: 'r-1',
          order_id: baseOrder.id,
          status: 'pending',
          amount_cents: 15000000,
          reason: 'Batal',
          created_at: '2026-11-18T00:00:00Z',
          updated_at: '2026-11-18T00:00:00Z',
        },
      },
    })
    expect(pendingWrapper.text()).toContain('Sedang Ditinjau Admin')
  })

  it('enforces canonical /account/coins -> /account/points redirect and clean ProductForm copy', () => {
    const coinsSrc = readFileSync(resolve(process.cwd(), 'app/pages/account/coins.vue'), 'utf8')
    expect(coinsSrc).toContain('/account/points')
    expect(coinsSrc).toContain('redirectCode: 301')

    const formSrc = readFileSync(
      resolve(process.cwd(), 'app/features/products/components/ProductForm.vue'),
      'utf8',
    )
    expect(formSrc).not.toContain('Kemeja Linen')
    expect(formSrc).not.toContain('Tautan Referensi')
  })
})
