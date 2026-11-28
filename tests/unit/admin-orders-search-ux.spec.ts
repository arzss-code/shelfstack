import { nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import AdminOrdersIndexPage from '~/pages/admin/orders/index.vue'

const { fetchSpy, mockSupabaseClient, mockRoute, mockRouter, mockSeoMeta, mockState } = vi.hoisted(
  () => {
    const channel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }
    return {
      fetchSpy: vi.fn(),
      mockSupabaseClient: {
        channel: vi.fn(() => channel),
        removeChannel: vi.fn(async () => undefined),
      },
      mockRoute: { query: {} as Record<string, string> },
      mockRouter: { push: vi.fn() },
      mockSeoMeta: vi.fn(),
      mockState: new Map<string, unknown>(),
    }
  },
)

mockNuxtImport('$fetch', () => fetchSpy)
mockNuxtImport('useSupabaseClient', () => () => mockSupabaseClient)
mockNuxtImport('useRoute', () => () => mockRoute)
mockNuxtImport('useRouter', () => () => mockRouter)
mockNuxtImport('useSeoMeta', () => mockSeoMeta)
mockNuxtImport('useState', () => <T>(key: string, init?: () => T) => {
  if (!mockState.has(key)) {
    mockState.set(key, ref(init ? init() : undefined))
  }
  return mockState.get(key)
})

const globalStubs = {
  AdminPageHeader: { template: '<div><slot /><slot name="actions" /></div>' },
  AdminOrderExportMenu: { template: '<div />' },
  UiDateRangePicker: {
    template: '<div data-testid="date-picker-stub" />',
    props: ['from', 'to'],
  },
  NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
}

describe('Kelola Pesanan Live Search & Reset UX', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockRoute.query = {}
    mockState.clear()
    vi.stubGlobal('$fetch', fetchSpy)
    fetchSpy.mockResolvedValue({
      status: 'success',
      data: { orders: [], total: 0 },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('auto-searches after 300ms without a Cari submit button and aborts stale in-flight requests', async () => {
    const signals: AbortSignal[] = []
    fetchSpy.mockImplementation((_url: string, opts?: { signal?: AbortSignal }) => {
      if (opts?.signal) signals.push(opts.signal)
      return Promise.resolve({ status: 'success', data: { orders: [], total: 0 } })
    })

    const wrapper = mount(AdminOrdersIndexPage, { global: { stubs: globalStubs } })
    await Promise.resolve()

    const cariBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Cari')
    expect(cariBtn).toBeUndefined()

    const initialCalls = fetchSpy.mock.calls.length
    const input = wrapper.get('#admin-orders-search')

    // Keep the search request in-flight while a subsequent clear triggers
    let resolveInFlight!: (val: unknown) => void
    fetchSpy.mockImplementationOnce((_url: string, opts?: { signal?: AbortSignal }) => {
      if (opts?.signal) signals.push(opts.signal)
      return new Promise((resolve) => {
        resolveInFlight = resolve
      })
    })

    await input.setValue('si')
    vi.advanceTimersByTime(200)
    expect(fetchSpy.mock.calls.length).toBe(initialCalls)

    await input.setValue('siti')
    vi.advanceTimersByTime(300)
    expect(fetchSpy.mock.calls.length).toBe(initialCalls + 1)
    const lastCallOpts = fetchSpy.mock.calls.at(-1)?.[1] as {
      params?: Record<string, string | number>
    }
    expect(lastCallOpts?.params?.search).toBe('siti')

    const inFlightSignal = signals.at(-1)
    expect(inFlightSignal?.aborted).toBe(false)

    // Clearing search resets immediately without waiting 300ms and aborts the slow search
    await input.setValue('')
    await nextTick()
    expect(inFlightSignal?.aborted).toBe(true)
    expect(fetchSpy.mock.calls.length).toBe(initialCalls + 2)
    const clearCallOpts = fetchSpy.mock.calls.at(-1)?.[1] as {
      params?: Record<string, string | number>
    }
    expect(clearCallOpts?.params?.search).toBeUndefined()
    resolveInFlight({ status: 'success', data: { orders: [], total: 0 } })
  })

  it('submits immediately on Enter and resets search + status via Reset Filter', async () => {
    const wrapper = mount(AdminOrdersIndexPage, { global: { stubs: globalStubs } })
    await Promise.resolve()

    const callsBeforeSubmit = fetchSpy.mock.calls.length
    const input = wrapper.get('#admin-orders-search')
    await input.setValue('order-xyz')
    await wrapper.get('form').trigger('submit.prevent')

    expect(fetchSpy.mock.calls.length).toBe(callsBeforeSubmit + 1)
    vi.advanceTimersByTime(300)
    expect(fetchSpy.mock.calls.length).toBe(callsBeforeSubmit + 1)

    await nextTick()
    await Promise.resolve()
    const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset Filter'))
    expect(resetBtn).toBeDefined()

    await resetBtn!.trigger('click')
    await nextTick()
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(fetchSpy.mock.calls.length).toBe(callsBeforeSubmit + 2)
  })
})
