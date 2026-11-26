import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { nextTick } from 'vue'
import { useAdminOperationalSignals } from '../../app/features/admin/composables/useAdminOperationalSignals'
import AdminOperationalSignals from '../../app/features/admin/components/AdminOperationalSignals.vue'
import AdminRecentOrdersTable from '../../app/features/admin/components/AdminRecentOrdersTable.vue'
import type { OrderStatus } from '../../app/types/order'

const mockMetricsData = {
  requestsTotal: 100,
  requestsSuccess: 98,
  requestsClientError: 2,
  requestsServerError: 0,
  webhookTotal: 25,
  webhookSuccess: 25,
  webhookFailure: 0,
  refundTotal: 4,
  refundSuccess: 4,
  refundFailure: 0,
  reconciliationTotal: 12,
  reconciliationSuccess: 12,
  reconciliationFailure: 0,
  startedAt: '2026-11-10T08:00:00Z',
}

const mockReadinessData = {
  service: 'shelfstack-frontend',
  version: '0.40.0',
  timestamp: '2026-11-10T10:00:00Z',
  dependencies: {
    database: 'up' as const,
    order_service: 'up' as const,
  },
}

const { mockFetch } = vi.hoisted(() => {
  const fMock: any = vi.fn()
  fMock.create = () => fMock
  fMock.raw = vi.fn()
  return {
    mockFetch: fMock,
  }
})

vi.mock('ofetch', () => ({
  $fetch: mockFetch,
  ofetch: mockFetch,
  createFetch: () => mockFetch,
}))

mockNuxtImport('$fetch', () => mockFetch)
vi.stubGlobal('$fetch', mockFetch)

const globalStubs = {
  UiButton: {
    template: `
      <button type="button" class="ui-button-stub" @click="$emit('click', $event)">
        <slot />
      </button>
    `,
    props: ['variant', 'size', 'icon', 'loading'],
  },
  UiBadge: {
    template: '<span class="ui-badge-stub">{{ label }}</span>',
    props: ['label', 'variant'],
  },
  UiAlert: {
    template: '<div class="ui-alert-stub"><slot /></div>',
    props: ['tone'],
  },
  NuxtLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}

describe('Admin Operational Signals & System Telemetry Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAdminOperationalSignals composable', () => {
    it('computes isDatabaseUp and isOrderServiceUp based on readiness data', async () => {
      mockFetch
        .mockResolvedValueOnce({
          status: 'success',
          data: { metrics: mockMetricsData, timestamp: '2026-11-10T10:00:00Z' },
        })
        .mockResolvedValueOnce({
          status: 'success',
          data: mockReadinessData,
        })

      const { fetchSignals, isDatabaseUp, isOrderServiceUp, systemTone } =
        useAdminOperationalSignals()
      await fetchSignals()

      expect(isDatabaseUp.value).toBe(true)
      expect(isOrderServiceUp.value).toBe(true)
      expect(systemTone.value).toBe('success')
    })

    it('calculates request and webhook success rates accurately', async () => {
      mockFetch
        .mockResolvedValueOnce({
          status: 'success',
          data: {
            metrics: {
              ...mockMetricsData,
              requestsTotal: 200,
              requestsSuccess: 195,
              webhookTotal: 10,
              webhookSuccess: 8,
              webhookFailure: 2,
            },
            timestamp: '2026-11-10T10:00:00Z',
          },
        })
        .mockResolvedValueOnce({
          status: 'success',
          data: mockReadinessData,
        })

      const { fetchSignals, requestSuccessRate, webhookSuccessRate } = useAdminOperationalSignals()
      await fetchSignals()

      expect(requestSuccessRate.value).toBe(97.5)
      expect(webhookSuccessRate.value).toBe(80)
    })

    it('sets systemTone to danger when database is down', async () => {
      mockFetch
        .mockResolvedValueOnce({
          status: 'success',
          data: { metrics: mockMetricsData, timestamp: '2026-11-10T10:00:00Z' },
        })
        .mockResolvedValueOnce({
          status: 'success',
          data: {
            ...mockReadinessData,
            dependencies: {
              database: 'down',
              order_service: 'up',
            },
          },
        })

      const { fetchSignals, isDatabaseUp, systemTone } = useAdminOperationalSignals()
      await fetchSignals()

      expect(isDatabaseUp.value).toBe(false)
      expect(systemTone.value).toBe('danger')
    })

    it('sets systemTone to warning when order service is offline or server errors exist', async () => {
      mockFetch
        .mockResolvedValueOnce({
          status: 'success',
          data: {
            metrics: {
              ...mockMetricsData,
              requestsServerError: 1,
            },
            timestamp: '2026-11-10T10:00:00Z',
          },
        })
        .mockResolvedValueOnce({
          status: 'success',
          data: {
            ...mockReadinessData,
            dependencies: {
              database: 'up',
              order_service: 'down',
            },
          },
        })

      const { fetchSignals, isOrderServiceUp, systemTone } = useAdminOperationalSignals()
      await fetchSignals()

      expect(isOrderServiceUp.value).toBe(false)
      expect(systemTone.value).toBe('warning')
    })

    it('handles network failure gracefully and sets errorMessage', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Koneksi telemetri timeout'))

      const { fetchSignals, errorMessage } = useAdminOperationalSignals()
      await fetchSignals()

      expect(errorMessage.value).toBe('Koneksi telemetri timeout')
    })
  })

  describe('AdminOperationalSignals.vue component', () => {
    it('renders loading skeleton when fetching initial signals', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      const wrapper = mount(AdminOperationalSignals, {
        global: { stubs: globalStubs },
      })
      await nextTick()

      expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('renders dependency status and metrics telemetry on success', async () => {
      mockFetch
        .mockResolvedValueOnce({
          status: 'success',
          data: { metrics: mockMetricsData, timestamp: '2026-11-10T10:00:00Z' },
        })
        .mockResolvedValueOnce({
          status: 'success',
          data: mockReadinessData,
        })

      const wrapper = mount(AdminOperationalSignals, {
        global: { stubs: globalStubs },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Status Sistem')
      expect(wrapper.text()).toContain('PostgreSQL Supabase')
      expect(wrapper.text()).toContain('Order Service Worker')
      expect(wrapper.text()).toContain('Sukses HTTP API')
      expect(wrapper.text()).toContain('98%')
      expect(wrapper.text()).toContain('Webhook Midtrans')
    })

    it('renders error alert when fetch fails and allows retry', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Gagal terhubung ke probe'))

      const wrapper = mount(AdminOperationalSignals, {
        global: { stubs: globalStubs },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Gagal terhubung ke probe')

      // Mock sukses untuk retry
      mockFetch
        .mockResolvedValueOnce({
          status: 'success',
          data: { metrics: mockMetricsData, timestamp: '2026-11-10T10:00:00Z' },
        })
        .mockResolvedValueOnce({
          status: 'success',
          data: mockReadinessData,
        })

      const retryBtn = wrapper.find('.ui-alert-stub .ui-button-stub')
      expect(retryBtn.exists()).toBe(true)
      await retryBtn.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('PostgreSQL Supabase')
    })
  })

  describe('AdminRecentOrdersTable.vue component', () => {
    const mockRecentOrders = [
      {
        id: '9f8b4d21-a1b2-4c3d-8e9f-0123456789ab',
        user_id: 'usr-1',
        status: 'paid' as OrderStatus,
        total_cents: 150000000,
        created_at: '2026-11-10T11:00:00Z',
        address: {
          name: 'Ahmad Dahlan',
          city: 'Jakarta Selatan',
        },
      },
    ]

    it('renders recent orders table with customer and formatted values', () => {
      const wrapper = mount(AdminRecentOrdersTable, {
        props: {
          orders: mockRecentOrders,
          loading: false,
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Transaksi Terbaru')
      expect(wrapper.text()).toContain('Ahmad Dahlan')
      expect(wrapper.text()).toContain('Jakarta Selatan')
      expect(wrapper.text()).toContain('#9f8b4d21')
    })

    it('renders empty state when orders list is empty', () => {
      const wrapper = mount(AdminRecentOrdersTable, {
        props: {
          orders: [],
          loading: false,
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.text()).toContain('Belum ada transaksi pesanan yang tercatat.')
    })

    it('renders loading skeleton when loading prop is true', () => {
      const wrapper = mount(AdminRecentOrdersTable, {
        props: {
          orders: [],
          loading: true,
        },
        global: { stubs: globalStubs },
      })

      expect(wrapper.findAll('.animate-pulse').length).toBeGreaterThan(0)
    })
  })

  describe('Architecture & Antislop Compliance', () => {
    it('enforces line limit <= 300 lines for all admin operational files', () => {
      const files = [
        'app/features/admin/composables/useAdminOperationalSignals.ts',
        'app/features/admin/components/AdminOperationalSignals.vue',
        'app/features/admin/components/AdminRecentOrdersTable.vue',
        'app/pages/admin/index.vue',
      ]

      for (const relPath of files) {
        const fullPath = path.resolve(process.cwd(), relPath)
        const lineCount = fs.readFileSync(fullPath, 'utf-8').split('\n').length
        expect(lineCount).toBeLessThanOrEqual(300)
      }
    })

    it('ensures zero em dashes across all operational files', () => {
      const files = [
        'app/features/admin/composables/useAdminOperationalSignals.ts',
        'app/features/admin/components/AdminOperationalSignals.vue',
        'app/features/admin/components/AdminRecentOrdersTable.vue',
        'app/pages/admin/index.vue',
      ]

      for (const relPath of files) {
        const fullPath = path.resolve(process.cwd(), relPath)
        const content = fs.readFileSync(fullPath, 'utf-8')
        expect(content.includes('—')).toBe(false)
      }
    })
  })
})
