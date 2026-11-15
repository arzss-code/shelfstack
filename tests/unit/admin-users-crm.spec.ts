import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  calculateCustomerAggregations,
  filterAndSortCustomers,
  calculateCrmMetrics,
  formatRupiahCurrency,
} from '~/../server/utils/admin-users'
import AdminUserMetrics from '~/components/admin/users/AdminUserMetrics.vue'
import type { AdminCrmMetrics } from '~~/shared/types/admin-crm'

describe('Admin Users & Customer Lifetime Value CRM (E-07)', () => {
  const mockProfiles = [
    {
      id: 'usr-1',
      full_name: 'Ahmad Dahlan',
      email: 'ahmad@example.com',
      role: 'customer',
      avatar_url: null,
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'usr-2',
      full_name: 'Budi Santoso',
      email: 'budi@example.com',
      role: 'customer',
      avatar_url: null,
      created_at: '2026-02-15T09:00:00Z',
    },
    {
      id: 'usr-3',
      full_name: 'Citra Kirana',
      email: 'citra@example.com',
      role: 'customer',
      avatar_url: null,
      created_at: '2026-03-01T10:00:00Z',
    },
  ]

  const mockOrders = [
    {
      id: 'ord-101',
      user_id: 'usr-1',
      status: 'completed',
      total_cents: 75000000, // Rp 750.000
      created_at: '2026-02-01T12:00:00Z',
    },
    {
      id: 'ord-102',
      user_id: 'usr-1',
      status: 'shipped',
      total_cents: 25000000, // Rp 250.000
      created_at: '2026-03-05T14:00:00Z',
    },
    {
      id: 'ord-103',
      user_id: 'usr-1',
      status: 'cancelled',
      total_cents: 10000000, // Tidak dihitung ke LTV
      created_at: '2026-03-10T11:00:00Z',
    },
    {
      id: 'ord-201',
      user_id: 'usr-2',
      status: 'completed',
      total_cents: 50000000, // Rp 500.000
      created_at: '2026-02-20T10:00:00Z',
    },
    // usr-3 belum pernah order
  ]

  describe('Service Layer: calculateCustomerAggregations', () => {
    it('aggregates total orders, completed orders, and LTV correctly', () => {
      const result = calculateCustomerAggregations(mockProfiles, mockOrders)

      expect(result).toHaveLength(3)

      const ahmad = result.find((u) => u.userId === 'usr-1')
      expect(ahmad).toBeDefined()
      expect(ahmad?.totalOrders).toBe(3)
      expect(ahmad?.completedOrders).toBe(2) // completed + shipped
      expect(ahmad?.totalSpentCents).toBe(100000000) // Rp 1.000.000
      expect(ahmad?.formattedLtv).toContain('1.000.000')
      expect(ahmad?.lastOrderAt).toBe('2026-03-10T11:00:00Z')

      const citra = result.find((u) => u.userId === 'usr-3')
      expect(citra?.totalOrders).toBe(0)
      expect(citra?.totalSpentCents).toBe(0)
      expect(citra?.lastOrderAt).toBeNull()
    })
  })

  describe('Service Layer: filterAndSortCustomers', () => {
    it('filters customers by search term in full name or email', () => {
      const aggregated = calculateCustomerAggregations(mockProfiles, mockOrders)
      const filtered = filterAndSortCustomers(aggregated, { search: 'budi' })

      expect(filtered).toHaveLength(1)
      expect(filtered[0]?.fullName).toBe('Budi Santoso')
    })

    it('sorts customers by LTV descending by default', () => {
      const aggregated = calculateCustomerAggregations(mockProfiles, mockOrders)
      const sorted = filterAndSortCustomers(aggregated, { sort: 'ltv_desc' })

      expect(sorted[0]?.userId).toBe('usr-1') // Rp 1.000.000
      expect(sorted[1]?.userId).toBe('usr-2') // Rp 500.000
      expect(sorted[2]?.userId).toBe('usr-3') // Rp 0
    })

    it('sorts customers by orders count descending', () => {
      const aggregated = calculateCustomerAggregations(mockProfiles, mockOrders)
      const sorted = filterAndSortCustomers(aggregated, { sort: 'orders_desc' })

      expect(sorted[0]?.totalOrders).toBe(3)
      expect(sorted[1]?.totalOrders).toBe(1)
      expect(sorted[2]?.totalOrders).toBe(0)
    })
  })

  describe('Service Layer: calculateCrmMetrics', () => {
    it('computes executive CRM metrics and average LTV', () => {
      const aggregated = calculateCustomerAggregations(mockProfiles, mockOrders)
      const metrics = calculateCrmMetrics(aggregated)

      expect(metrics.totalCustomers).toBe(3)
      expect(metrics.totalRevenueCents).toBe(150000000) // Rp 1.500.000
      expect(metrics.averageLtvCents).toBe(50000000) // Rp 500.000
      expect(metrics.activeOrderingCustomers).toBe(2)
      expect(metrics.formattedTotalRevenue).toContain('1.500.000')
      expect(metrics.formattedAverageLtv).toContain('500.000')
    })
  })

  describe('Component: AdminUserMetrics.vue', () => {
    const mockMetrics: AdminCrmMetrics = {
      totalCustomers: 120,
      totalRevenueCents: 15000000000,
      formattedTotalRevenue: 'Rp 150.000.000',
      averageLtvCents: 125000000,
      formattedAverageLtv: 'Rp 1.250.000',
      activeOrderingCustomers: 85,
    }

    it('renders metrics cards with formatted values', () => {
      const wrapper = mount(AdminUserMetrics, {
        props: {
          metrics: mockMetrics,
        },
      })

      expect(wrapper.text()).toContain('Total Pelanggan')
      expect(wrapper.text()).toContain('120')
      expect(wrapper.text()).toContain('Rp 150.000.000')
      expect(wrapper.text()).toContain('Rp 1.250.000')
      expect(wrapper.text()).toContain('85')
    })
  })
})
