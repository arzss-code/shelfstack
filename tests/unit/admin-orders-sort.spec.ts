import { describe, expect, it, vi } from 'vitest'

/**
 * Admin orders sort allowlist (mirrors server/api/admin/orders.get.ts).
 * Legal values forward the matching order to Supabase.
 * Illegal values fall back silently to the default, same as status filter.
 */
const SORT_ALLOWLIST = [
  'created_at_desc',
  'created_at_asc',
  'total_desc',
  'total_asc',
  'name_asc',
  'name_desc',
] as const

type AdminOrdersSort = (typeof SORT_ALLOWLIST)[number]

const resolveAdminOrdersSort = (raw: unknown): AdminOrdersSort => {
  if (typeof raw === 'string' && (SORT_ALLOWLIST as readonly string[]).includes(raw)) {
    return raw as AdminOrdersSort
  }
  return 'created_at_desc'
}

const expectedOrderArgs: Record<AdminOrdersSort, [string, { ascending: boolean }]> = {
  created_at_desc: ['created_at', { ascending: false }],
  created_at_asc: ['created_at', { ascending: true }],
  total_desc: ['total_cents', { ascending: false }],
  total_asc: ['total_cents', { ascending: true }],
  name_asc: ['address->>name', { ascending: true }],
  name_desc: ['address->>name', { ascending: false }],
}

const simulateAdminOrdersEndpoint = async (params: {
  query: Record<string, unknown>
  mockRequireAdmin: () => Promise<void>
  mockOrder: (
    column: string,
    opts: { ascending: boolean },
  ) => Promise<{ data: unknown[]; count: number; error: null }>
}) => {
  await params.mockRequireAdmin()

  const sort = resolveAdminOrdersSort(params.query.sort)
  const [column, opts] = expectedOrderArgs[sort]
  const result = await params.mockOrder(column, opts)

  return { sort, result }
}

describe('Admin Orders Sort Allowlist (mirror server/api/admin/orders.get.ts)', () => {
  it('uses created_at_desc default when sort is absent', async () => {
    const mockRequireAdmin = vi.fn().mockResolvedValue(undefined)
    const mockOrder = vi.fn().mockResolvedValue({ data: [], count: 0, error: null })

    const { sort } = await simulateAdminOrdersEndpoint({
      query: {},
      mockRequireAdmin,
      mockOrder,
    })

    expect(sort).toBe('created_at_desc')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockRequireAdmin).toHaveBeenCalled()
  })

  it.each([
    ['created_at_desc', 'created_at', false],
    ['created_at_asc', 'created_at', true],
    ['total_desc', 'total_cents', false],
    ['total_asc', 'total_cents', true],
    ['name_asc', 'address->>name', true],
    ['name_desc', 'address->>name', false],
  ] as const)('forwards legal sort %s to Supabase order', async (sortValue, column, ascending) => {
    const mockRequireAdmin = vi.fn().mockResolvedValue(undefined)
    const mockOrder = vi.fn().mockResolvedValue({ data: [], count: 0, error: null })

    const { sort } = await simulateAdminOrdersEndpoint({
      query: { sort: sortValue },
      mockRequireAdmin,
      mockOrder,
    })

    expect(sort).toBe(sortValue)
    expect(mockOrder).toHaveBeenCalledWith(column, { ascending })
    expect(mockRequireAdmin).toHaveBeenCalled()
  })

  it.each(['created_at_DESC', 'newest', 'price_asc', 'id_desc', 'DROP TABLE orders', ''])(
    'falls back silently to default for illegal sort %s',
    async (illegal) => {
      const mockRequireAdmin = vi.fn().mockResolvedValue(undefined)
      const mockOrder = vi.fn().mockResolvedValue({ data: [], count: 0, error: null })

      const { sort } = await simulateAdminOrdersEndpoint({
        query: { sort: illegal },
        mockRequireAdmin,
        mockOrder,
      })

      expect(sort).toBe('created_at_desc')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockRequireAdmin).toHaveBeenCalled()
    },
  )

  it('still calls requireAdmin when sort is illegal', async () => {
    const mockRequireAdmin = vi.fn().mockResolvedValue(undefined)
    const mockOrder = vi.fn().mockResolvedValue({ data: [], count: 0, error: null })

    await simulateAdminOrdersEndpoint({
      query: { sort: 'not_a_sort' },
      mockRequireAdmin,
      mockOrder,
    })

    expect(mockRequireAdmin).toHaveBeenCalledTimes(1)
  })
})
