import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import AdminSalesChart from '../../app/components/admin/AdminSalesChart.vue'
import {
  adminTrendsPeriodSchema,
  adminTrendsQuerySchema,
  type AdminTrendsResponseData,
} from '../../shared/schemas/admin-stats'

const { mockFetch } = vi.hoisted(() => {
  const fMock = vi.fn() as any
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

  describe('Schema Validation', () => {
    it('validates allowed periods in adminTrendsPeriodSchema', () => {
      expect(adminTrendsPeriodSchema.parse('7d')).toBe('7d')
      expect(adminTrendsPeriodSchema.parse('30d')).toBe('30d')
      expect(adminTrendsPeriodSchema.parse('month')).toBe('month')
      expect(adminTrendsPeriodSchema.safeParse('invalid').success).toBe(false)
    })

    it('defaults to 7d when period query is missing or empty', () => {
      const parsed = adminTrendsQuerySchema.parse({})
      expect(parsed.period).toBe('7d')
    })
  })

  describe('AdminSalesChart Component', () => {
    it('renders chart header, period buttons, and summary KPIs', async () => {
      const wrapper = mount(AdminSalesChart, {
        props: { initialPeriod: '7d' },
      })
      await flushPromises()

      expect(wrapper.text()).toContain('Tren Penjualan & Pendapatan')
      expect(wrapper.text()).toContain('7 Hari')
      expect(wrapper.text()).toContain('30 Hari')
      expect(wrapper.text()).toContain('Bulan Ini')

      expect(wrapper.text()).toContain('Total Omzet')
      expect(wrapper.text()).toContain('17 Pesanan')
      expect(wrapper.html()).not.toContain('font-mono')
    })

    it('renders pure SVG elements with grid lines and data points in brand electric blue', async () => {
      const wrapper = mount(AdminSalesChart, {
        props: { initialPeriod: '7d' },
      })
      await flushPromises()

      const svg = wrapper.find('svg')
      expect(svg.exists()).toBe(true)

      const gridLines = wrapper.findAll('.grid-lines line')
      expect(gridLines.length).toBeGreaterThanOrEqual(3)

      const circles = wrapper.findAll('.data-points circle')
      expect(circles.length).toBeGreaterThan(0)

      const line = wrapper.find('path[stroke="#0066ff"]')
      expect(line.exists()).toBe(true)
    })

    it('switches period and triggers refetch when another period button is clicked', async () => {
      const wrapper = mount(AdminSalesChart, {
        props: { initialPeriod: '7d' },
      })
      await flushPromises()

      const buttons = wrapper.findAll('button')
      const monthButton = buttons.find((b) => b.text().includes('Bulan Ini'))
      expect(monthButton).toBeDefined()

      await monthButton?.trigger('click')
      await flushPromises()

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/stats/trends',
        expect.objectContaining({
          params: { period: 'month' },
        }),
      )
    })
  })
})
