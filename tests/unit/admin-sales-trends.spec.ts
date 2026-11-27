import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import AdminSalesChart from '../../app/components/admin/AdminSalesChart.vue'
import { formatSalesAxisTick } from '../../app/composables/useAdminSalesChart'
import {
  adminTrendsPeriodSchema,
  adminTrendsQuerySchema,
  adminTrendsStatusScopeSchema,
  type AdminTrendsResponseData,
} from '../../shared/schemas/admin-stats'

const { mockFetch } = vi.hoisted(() => {
  const fMock = vi.fn() as ReturnType<typeof vi.fn> & {
    create?: () => unknown
    raw?: ReturnType<typeof vi.fn>
  }
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

const mockTrendsData: AdminTrendsResponseData = {
  period: '7d',
  status_scope: 'confirmed',
  granularity: 'day',
  points: [
    {
      date: '2026-11-08',
      label: '08 Nov',
      revenue_cents: 150000000,
      revenue: 1500000,
      order_count: 2,
    },
    {
      date: '2026-11-09',
      label: '09 Nov',
      revenue_cents: 285000000,
      revenue: 2850000,
      order_count: 3,
    },
    {
      date: '2026-11-10',
      label: '10 Nov',
      revenue_cents: 0,
      revenue: 0,
      order_count: 0,
    },
    {
      date: '2026-11-11',
      label: '11 Nov',
      revenue_cents: 75000000,
      revenue: 750000,
      order_count: 1,
    },
    {
      date: '2026-11-12',
      label: '12 Nov',
      revenue_cents: 320000000,
      revenue: 3200000,
      order_count: 4,
    },
    {
      date: '2026-11-13',
      label: '13 Nov',
      revenue_cents: 120000000,
      revenue: 1200000,
      order_count: 2,
    },
    {
      date: '2026-11-14',
      label: '14 Nov',
      revenue_cents: 450000000,
      revenue: 4500000,
      order_count: 5,
    },
  ],
  summary: {
    total_revenue_cents: 1395000000,
    total_revenue: 13950000,
    total_orders: 17,
    average_order_value_cents: 82058800,
    average_order_value: 820588,
    peak_label: '14 Nov',
    peak_revenue: 4500000,
    peak_orders: 5,
    active_buckets: 6,
    revenue_delta_pct: 12.5,
    orders_delta_pct: 6.3,
  },
}

describe('Admin Sales Trends & Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      status: 'success',
      data: mockTrendsData,
    })
  })

  describe('Schema Validation & Axis Formatting', () => {
    it('validates allowed periods and status scopes cleanly', () => {
      expect(adminTrendsPeriodSchema.parse('7d')).toBe('7d')
      expect(adminTrendsPeriodSchema.parse('30d')).toBe('30d')
      expect(adminTrendsPeriodSchema.parse('90d')).toBe('90d')
      expect(adminTrendsPeriodSchema.parse('month')).toBe('month')
      expect(adminTrendsPeriodSchema.parse('year')).toBe('year')
      expect(adminTrendsPeriodSchema.parse('custom')).toBe('custom')
      expect(adminTrendsPeriodSchema.safeParse('invalid').success).toBe(false)

      expect(adminTrendsStatusScopeSchema.parse('confirmed')).toBe('confirmed')
      expect(adminTrendsStatusScopeSchema.parse('completed')).toBe('completed')
      expect(adminTrendsStatusScopeSchema.parse('all_active')).toBe('all_active')
    })

    it('defaults to 7d & confirmed when query is empty and formats Rupiah Y ticks concisely', () => {
      const parsed = adminTrendsQuerySchema.parse({})
      expect(parsed.period).toBe('7d')
      expect(parsed.status_scope).toBe('confirmed')

      expect(formatSalesAxisTick(0, 'revenue')).toBe('Rp 0')
      expect(formatSalesAxisTick(666666.6667, 'revenue')).toBe('Rp 667rb')
      expect(formatSalesAxisTick(1500000, 'revenue')).toBe('Rp 1,5jt')
      expect(formatSalesAxisTick(2000000000, 'revenue')).toBe('Rp 2M')
      expect(formatSalesAxisTick(12.4, 'orders')).toBe('12')
    })
  })

  describe('AdminSalesChart Component', () => {
    it('renders chart header, period/status filters, metric toggle, and 4 summary KPIs', async () => {
      const wrapper = mount(AdminSalesChart, {
        props: { initialPeriod: '7d' },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Grafik Penjualan')
      expect(wrapper.text()).toContain('7 Hari')
      expect(wrapper.text()).toContain('90 Hari')
      expect(wrapper.text()).toContain('Tahun Ini')
      expect(wrapper.text()).toContain('Kustom')

      expect(wrapper.text()).toContain('Total Omzet')
      expect(wrapper.text()).toContain('17 pesanan')
      expect(wrapper.text()).toContain('Puncak Periode')
      expect(wrapper.text()).toContain('+12.5%')
      expect(wrapper.html()).not.toContain('font-mono')
      expect(wrapper.html()).not.toContain('overflow-hidden')
    })

    it('renders pure SVG elements with grid lines and data points in brand electric blue', async () => {
      const wrapper = mount(AdminSalesChart, {
        props: { initialPeriod: '7d' },
      })
      await flushPromises()

      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)
      expect(wrapper.findAll('.grid-lines line').length).toBeGreaterThanOrEqual(3)
      expect(wrapper.findAll('.data-points circle').length).toBeGreaterThan(0)
      expect(wrapper.find('path[stroke="#0066ff"]').exists()).toBe(true)
    })

    it('switches period, opens custom date range picker, and refetches cleanly', async () => {
      const wrapper = mount(AdminSalesChart, {
        props: { initialPeriod: '7d' },
      })
      await flushPromises()

      const monthButton = wrapper.findAll('button').find((b) => b.text().includes('Bulan Ini'))
      await monthButton?.trigger('click')
      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/stats/trends',
        expect.objectContaining({
          params: { period: 'month' },
        }),
      )

      const customButton = wrapper.findAll('button').find((b) => b.text().includes('Kustom'))
      await customButton?.trigger('click')
      await flushPromises()
      expect(wrapper.find('[data-testid="date-range-trigger"]').exists()).toBe(true)
    })
  })
})
