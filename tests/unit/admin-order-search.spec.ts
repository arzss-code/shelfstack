import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineEventHandler, type H3Event } from 'h3'
import { errorResponse, successResponse } from '../../server/utils/response'

const edges = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  supabaseClient: vi.fn(),
  query: vi.fn(),
}))

interface RecordedQuery {
  orArgs: string[]
}

function createAdminOrdersDbMock(recorded: RecordedQuery) {
  const builder = {
    select: vi.fn(() => builder),
    is: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    or: vi.fn((expr: string) => {
      recorded.orArgs.push(expr)
      return builder
    }),
    order: vi.fn(() => builder),
    range: vi.fn(async () => ({ data: [], count: 0, error: null })),
    limit: vi.fn(async () => ({ data: [], error: null })),
  }
  return {
    from: vi.fn(() => builder),
  }
}

let adminOrdersGet: typeof import('../../server/api/admin/orders.get').default
let adminOrdersExportGet: typeof import('../../server/api/admin/orders/export.get').default

const evt = {
  context: { requestId: 'admin-order-search-test' },
  node: { req: {}, res: { setHeader: vi.fn(), getHeader: vi.fn() } },
} as unknown as H3Event

describe('Admin Order Search Filter & UUID Safety', () => {
  beforeAll(async () => {
    vi.doMock('#supabase/server', () => ({ serverSupabaseClient: edges.supabaseClient }))
    vi.stubGlobal('defineEventHandler', defineEventHandler)
    vi.stubGlobal('requireAdmin', edges.requireAdmin)
    vi.stubGlobal('errorResponse', errorResponse)
    vi.stubGlobal('successResponse', successResponse)
    vi.stubGlobal('getQuery', edges.query)
    vi.stubGlobal('setHeader', vi.fn())
    vi.doMock('h3', async () => {
      const actual = await vi.importActual<typeof import('h3')>('h3')
      return { ...actual, getQuery: edges.query }
    })
    adminOrdersGet = (await import('../../server/api/admin/orders.get')).default
    adminOrdersExportGet = (await import('../../server/api/admin/orders/export.get')).default
  })

  beforeEach(() => {
    vi.clearAllMocks()
    edges.requireAdmin.mockResolvedValue({
      user: { id: 'admin-1' },
      profile: { user_id: 'admin-1', role: 'admin' },
    })
  })

  afterAll(() => {
    vi.doUnmock('#supabase/server')
    vi.doUnmock('h3')
    vi.unstubAllGlobals()
  })

  it('never applies id.ilike to uuid column when searching customer name "siti" on orders GET', async () => {
    const recorded: RecordedQuery = { orArgs: [] }
    edges.supabaseClient.mockResolvedValue(createAdminOrdersDbMock(recorded))
    edges.query.mockReturnValue({ from: '0', to: '14', search: 'siti' })

    const res = await adminOrdersGet(evt)

    expect(res.status).toBe('success')
    expect(recorded.orArgs).toHaveLength(1)
    expect(recorded.orArgs[0]).not.toContain('id.ilike')
    expect(recorded.orArgs[0]).toContain('address->>name.ilike.%siti%')
  })

  it('never applies id.ilike when searching customer name "siti" on orders export GET', async () => {
    const recorded: RecordedQuery = { orArgs: [] }
    edges.supabaseClient.mockResolvedValue(createAdminOrdersDbMock(recorded))
    edges.query.mockReturnValue({ search: 'siti', format: 'csv' })

    await adminOrdersExportGet(evt)

    expect(recorded.orArgs).toHaveLength(1)
    expect(recorded.orArgs[0]).not.toContain('id.ilike')
    expect(recorded.orArgs[0]).toContain('address->>name.ilike.%siti%')
  })

  it('uses uuid range bounds for hex order ID prefixes like "#a1b2c3d4" without uuid ilike', async () => {
    const recorded: RecordedQuery = { orArgs: [] }
    edges.supabaseClient.mockResolvedValue(createAdminOrdersDbMock(recorded))
    edges.query.mockReturnValue({ from: '0', to: '14', search: '#a1b2c3d4' })

    await adminOrdersGet(evt)

    expect(recorded.orArgs).toHaveLength(1)
    expect(recorded.orArgs[0]).not.toContain('id.ilike')
    expect(recorded.orArgs[0]).toContain(
      'and(id.gte.a1b2c3d4-0000-0000-0000-000000000000,id.lte.a1b2c3d4-ffff-ffff-ffff-ffffffffffff)',
    )
    expect(recorded.orArgs[0]).toContain('address->>name.ilike.%a1b2c3d4%')
  })

  it('uses id.eq when searching a full UUID order ID', async () => {
    const uuid = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890'
    const recorded: RecordedQuery = { orArgs: [] }
    edges.supabaseClient.mockResolvedValue(createAdminOrdersDbMock(recorded))
    edges.query.mockReturnValue({ from: '0', to: '14', search: uuid })

    await adminOrdersGet(evt)

    expect(recorded.orArgs).toHaveLength(1)
    expect(recorded.orArgs[0]).not.toContain('id.ilike')
    expect(recorded.orArgs[0]).toContain(`id.eq.${uuid}`)
  })

  it('strips PostgREST filter delimiters from free-text search queries', async () => {
    const recorded: RecordedQuery = { orArgs: [] }
    edges.supabaseClient.mockResolvedValue(createAdminOrdersDbMock(recorded))
    edges.query.mockReturnValue({ from: '0', to: '14', search: 'siti,admin(1)%_' })

    await adminOrdersGet(evt)

    expect(recorded.orArgs).toHaveLength(1)
    expect(recorded.orArgs[0]).not.toContain(',admin')
    expect(recorded.orArgs[0]).not.toContain('(1)')
    expect(recorded.orArgs[0]).toContain('address->>name.ilike.%siti admin 1%')
  })
})
