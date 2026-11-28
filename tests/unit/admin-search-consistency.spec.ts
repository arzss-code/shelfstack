import { nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import AdminContactInboxPanel from '~/components/admin/support/AdminContactInboxPanel.vue'
import AdminCouponTable from '~/components/admin/coupons/AdminCouponTable.vue'
import AdminReturnTable from '~/components/admin/returns/AdminReturnTable.vue'
import AdminReviewsFilterBar from '~/components/admin/reviews/AdminReviewsFilterBar.vue'
import AdminReviewsTable from '~/components/admin/reviews/AdminReviewsTable.vue'
import AdminCouponsPage from '~/pages/admin/coupons.vue'
import AdminUsersPage from '~/pages/admin/users.vue'
import AdminReturnsPage from '~/pages/admin/returns.vue'
import AdminReviewsPage from '~/pages/admin/reviews.vue'

const { fetchSpy, mockState, mockSeoMeta } = vi.hoisted(() => ({
  fetchSpy: vi.fn(),
  mockState: new Map<string, unknown>(),
  mockSeoMeta: vi.fn(),
}))

mockNuxtImport('$fetch', () => fetchSpy)
mockNuxtImport('useSeoMeta', () => mockSeoMeta)
mockNuxtImport('useState', () => <T>(key: string, init?: () => T) => {
  if (!mockState.has(key)) {
    mockState.set(key, ref(init ? init() : undefined))
  }
  return mockState.get(key)
})

const commonStubs = {
  AdminPageHeader: { template: '<div><slot /><slot name="actions" /></div>' },
  AdminCouponMetrics: { template: '<div />' },
  AdminCouponModal: { template: '<div />' },
  AdminCouponUsagesModal: { template: '<div />' },
  AdminUserMetrics: { template: '<div />' },
  AdminCustomer360Drawer: { template: '<div />' },
  AdminReturnMetrics: { template: '<div />' },
  AdminReturnDetailModal: { template: '<div />' },
  AdminReviewsMetricCards: { template: '<div />' },
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
}

describe('Admin Search, AbortController & Reset Filter Consistency', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockState.clear()
    vi.stubGlobal('$fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('Pesan Kontak removes Cari button, auto-debounces 300ms with abort signal, and resets filter from empty state', async () => {
    fetchSpy.mockResolvedValue({ data: { items: [] } })
    const wrapper = mount(AdminContactInboxPanel, { global: { stubs: commonStubs } })
    await Promise.resolve()

    expect(wrapper.findAll('button').find((b) => b.text().trim() === 'Cari')).toBeUndefined()

    const input = wrapper.get('#admin-contact-search')
    expect(input.attributes('type')).toBe('search')

    const beforeCalls = fetchSpy.mock.calls.length
    await input.setValue('tiket')
    vi.advanceTimersByTime(250)
    expect(fetchSpy.mock.calls.length).toBe(beforeCalls)

    vi.advanceTimersByTime(50)
    expect(fetchSpy.mock.calls.length).toBe(beforeCalls + 1)

    await flushPromises()
    const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset Filter'))
    expect(resetBtn).toBeDefined()
    await resetBtn!.trigger('click')
    await nextTick()

    expect((input.element as HTMLInputElement).value).toBe('')
    expect(fetchSpy.mock.calls.length).toBe(beforeCalls + 2)
  })

  it('Voucher Diskon debounces 300ms, toggles empty state action, and keeps pagination mounted when reloading', async () => {
    fetchSpy.mockResolvedValue({
      status: 'success',
      data: {
        coupons: [],
        metrics: {
          total_coupons: 0,
          active_coupons: 0,
          total_usages: 0,
          total_discount_cents: 0,
          formatted_total_discount: 'Rp0',
        },
      },
    })

    const unfilteredTable = mount(AdminCouponTable, {
      props: { coupons: [], loading: false, hasActiveFilters: false },
      global: { stubs: commonStubs },
    })
    expect(unfilteredTable.text()).toContain('Buat Voucher Baru')
    expect(unfilteredTable.text()).not.toContain('Reset Filter')

    const filteredTable = mount(AdminCouponTable, {
      props: { coupons: [], loading: false, hasActiveFilters: true },
      global: { stubs: commonStubs },
    })
    expect(filteredTable.text()).toContain('Reset Filter')

    const refreshingTable = mount(AdminCouponTable, {
      props: {
        coupons: [
          {
            id: 'c1',
            code: 'HEMAT10',
            name: 'Hemat 10%',
            description: null,
            discount_type: 'percentage',
            discount_value: 10,
            formatted_discount: '10%',
            max_discount_cents: null,
            formatted_max_discount: '-',
            min_purchase_cents: 0,
            formatted_min_purchase: 'Rp0',
            usage_limit: null,
            usage_count: 0,
            user_limit: 1,
            starts_at: null,
            expires_at: null,
            is_active: true,
            is_expired: false,
            coin_cost: null,
            formatted_coin_cost: null,
            created_at: '2026-11-20T00:00:00Z',
          },
        ],
        loading: true,
        hasActiveFilters: false,
      },
      global: { stubs: commonStubs },
    })
    expect(refreshingTable.text()).toContain('HEMAT10')
    expect(refreshingTable.find('[data-testid="ui-pagination"]').exists()).toBe(true)

    const page = mount(AdminCouponsPage, { global: { stubs: commonStubs } })
    await flushPromises()

    const beforeCalls = fetchSpy.mock.calls.length
    const input = page.get('#admin-coupons-search')
    await input.setValue('H')
    await input.setValue('HE')
    await input.setValue('HEMAT')
    expect(fetchSpy.mock.calls.length).toBe(beforeCalls)

    vi.advanceTimersByTime(300)
    expect(fetchSpy.mock.calls.length).toBe(beforeCalls + 1)
    const callOpts = fetchSpy.mock.calls.at(-1)?.[1] as { signal?: AbortSignal }
    expect(callOpts?.signal).toBeInstanceOf(AbortSignal)

    await flushPromises()
    const resetBtn = page.findAll('button').find((b) => b.text().includes('Reset Filter'))
    expect(resetBtn).toBeDefined()
    await resetBtn!.trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('Pelanggan sends AbortSignal, fetches strictly once even from page > 1, and exposes Reset Filter', async () => {
    fetchSpy.mockResolvedValue({
      customers: [
        {
          userId: 'u1',
          fullName: 'Siti',
          email: 'siti@example.com',
          avatarUrl: null,
          createdAt: '2026-11-01T00:00:00Z',
          totalOrders: 1,
          completedOrders: 1,
          totalSpentCents: 100000,
          formattedLtv: 'Rp 1.000',
          lastOrderAt: '2026-11-10T00:00:00Z',
        },
      ],
      metrics: {
        totalCustomers: 30,
        totalRevenueCents: 100000,
        formattedTotalRevenue: 'Rp 1.000',
        averageLtvCents: 100000,
        formattedAverageLtv: 'Rp 1.000',
        activeOrderingCustomers: 1,
      },
      pagination: { total: 30, totalPages: 2 },
    })

    const page = mount(AdminUsersPage, { global: { stubs: commonStubs } })
    await Promise.resolve()
    await nextTick()

    // Navigate to page 2 first
    const page2Btn = page.find('[data-testid="pagination-page-2"]')
    expect(page2Btn.exists()).toBe(true)
    await page2Btn.trigger('click')
    await Promise.resolve()

    // Searching from page 2 returns empty result and triggers strictly 1 API call
    fetchSpy.mockResolvedValue({
      customers: [],
      metrics: {
        totalCustomers: 0,
        totalRevenueCents: 0,
        formattedTotalRevenue: 'Rp 0',
        averageLtvCents: 0,
        formattedAverageLtv: 'Rp 0',
        activeOrderingCustomers: 0,
      },
      pagination: { total: 0, totalPages: 1 },
    })

    const beforeSearch = fetchSpy.mock.calls.length
    const input = page.get('#admin-users-search')
    await input.setValue('nonexistent')
    vi.advanceTimersByTime(300)
    await nextTick()

    expect(fetchSpy.mock.calls.length).toBe(beforeSearch + 1)
    const callOpts = fetchSpy.mock.calls.at(-1)?.[1] as { signal?: AbortSignal }
    expect(callOpts?.signal).toBeInstanceOf(AbortSignal)

    await flushPromises()
    const resetBtn = page.findAll('button').find((b) => b.text().includes('Reset Filter'))
    expect(resetBtn).toBeDefined()
    const beforeReset = fetchSpy.mock.calls.length
    await resetBtn!.trigger('click')
    await nextTick()

    expect((input.element as HTMLInputElement).value).toBe('')
    expect(fetchSpy.mock.calls.length).toBe(beforeReset + 1)
  })

  it('Komplain & Retur keeps rows visible during loading, passes AbortSignal, and supports Reset Filter', async () => {
    const sampleReturn = {
      id: 'ret-1',
      order_id: 'ord-1',
      order_number: '#ord-1',
      customer_name: 'Siti',
      reason_type: 'damaged_item' as const,
      solution_type: 'refund' as const,
      status: 'requested' as const,
      created_at: '2026-11-20T00:00:00Z',
    }
    const tableWithRows = mount(AdminReturnTable, {
      props: { returns: [sampleReturn], loading: true, hasActiveFilters: true },
      global: { stubs: commonStubs },
    })
    expect(tableWithRows.text()).toContain('#ord-1')

    fetchSpy.mockResolvedValue({
      status: 'success',
      data: {
        returns: [],
        metrics: {
          total: 0,
          requested: 0,
          approved: 0,
          item_received: 0,
          completed: 0,
          rejected: 0,
        },
      },
    })

    const page = mount(AdminReturnsPage, { global: { stubs: commonStubs } })
    await Promise.resolve()

    const input = page.get('#admin-returns-search')
    const beforeCalls = fetchSpy.mock.calls.length
    await input.setValue('siti')
    vi.advanceTimersByTime(300)
    expect(fetchSpy.mock.calls.length).toBe(beforeCalls + 1)

    const callOpts = fetchSpy.mock.calls.at(-1)?.[1] as { signal?: AbortSignal }
    expect(callOpts?.signal).toBeInstanceOf(AbortSignal)

    await flushPromises()
    const resetBtn = page.findAll('button').find((b) => b.text().includes('Reset Filter'))
    expect(resetBtn).toBeDefined()
    await resetBtn!.trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('Moderasi Ulasan syncs cleared search input, cancels pending debounce on reset, and aborts stale fetches', async () => {
    const bar = mount(AdminReviewsFilterBar, {
      props: {
        metrics: {
          total: 0,
          active: 0,
          hidden: 0,
          fiveStar: 0,
          attention: 0,
          averageRating: 5,
        },
        activeStatus: 'all',
        searchQuery: 'keramik',
      },
    })
    expect((bar.get('#admin-reviews-search').element as HTMLInputElement).value).toBe('keramik')
    await bar.setProps({ searchQuery: '' })
    expect((bar.get('#admin-reviews-search').element as HTMLInputElement).value).toBe('')

    const emptyFiltered = mount(AdminReviewsTable, {
      props: {
        reviews: [],
        loading: false,
        mutatingId: null,
        hasActiveFilters: true,
        pagination: { page: 1, limit: 15, totalCount: 0, totalPages: 1 },
      },
      global: { stubs: commonStubs },
    })
    const tableResetBtn = emptyFiltered
      .findAll('button')
      .find((b) => b.text().includes('Reset Filter'))
    expect(tableResetBtn).toBeDefined()

    fetchSpy.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        items: [],
        pagination: { page: 1, limit: 15, totalCount: 0, totalPages: 1 },
        metrics: {
          total: 0,
          active: 0,
          hidden: 0,
          fiveStar: 0,
          attention: 0,
          averageRating: 5,
        },
      },
    })

    const page = mount(AdminReviewsPage, { global: { stubs: commonStubs } })
    await Promise.resolve()
    const input = page.get('#admin-reviews-search')
    const beforeCalls = fetchSpy.mock.calls.length
    await input.setValue('kursi')
    vi.advanceTimersByTime(300)
    expect(fetchSpy.mock.calls.length).toBe(beforeCalls + 1)

    const callOpts = fetchSpy.mock.calls.at(-1)?.[1] as { signal?: AbortSignal }
    expect(callOpts?.signal).toBeInstanceOf(AbortSignal)

    await flushPromises()
    const resetBtn = page.findAll('button').find((b) => b.text().includes('Reset Filter'))
    expect(resetBtn).toBeDefined()
    await resetBtn!.trigger('click')
    expect((input.element as HTMLInputElement).value).toBe('')

    // Filter by status yielding 0 rows, start typing 'abc', then click Reset Filter before 300ms
    const hiddenTab = page.findAll('button').find((b) => b.text().includes('Disembunyikan'))
    await hiddenTab!.trigger('click')
    await flushPromises()

    await input.setValue('abc')
    await nextTick()
    const callsAfterType = fetchSpy.mock.calls.length
    const resetBtn2 = page.findAll('button').find((b) => b.text().includes('Reset Filter'))
    expect(resetBtn2).toBeDefined()
    await resetBtn2!.trigger('click')
    await flushPromises()
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(fetchSpy.mock.calls.length).toBe(callsAfterType + 1)

    vi.advanceTimersByTime(400)
    expect(fetchSpy.mock.calls.length).toBe(callsAfterType + 1)
  })
})
