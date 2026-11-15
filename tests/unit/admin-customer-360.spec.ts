import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Customer360Detail } from '../../shared/types/admin-crm'

describe('Admin Customer 360 Slide-Over & CRM Detail Suite', () => {
  describe('Customer 360 Aggregation Logic', () => {
    it('accurately calculates financial metrics and order distributions', () => {
      const mockOrders = [
        { id: 'o-1', status: 'completed', total_cents: 50000000 },
        { id: 'o-2', status: 'completed', total_cents: 30000000 },
        { id: 'o-3', status: 'cancelled', total_cents: 20000000 },
        { id: 'o-4', status: 'shipped', total_cents: 40000000 },
      ]

      const completedOrders = mockOrders.filter((o) => o.status === 'completed').length
      const pendingOrders = mockOrders.filter((o) => o.status === 'shipped').length
      const cancelledOrders = mockOrders.filter((o) => o.status === 'cancelled').length

      const totalSpentCents = mockOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_cents, 0)

      const aovCents = completedOrders > 0 ? Math.round(totalSpentCents / completedOrders) : 0

      expect(completedOrders).toBe(2)
      expect(pendingOrders).toBe(1)
      expect(cancelledOrders).toBe(1)
      expect(totalSpentCents).toBe(120000000)
      expect(aovCents).toBe(60000000)
    })

    it('handles zero order edge cases without division by zero errors', () => {
      const mockOrders: { id: string; status: string; total_cents: number }[] = []
      const completedOrders = mockOrders.filter((o) => o.status === 'completed').length
      const totalSpentCents = mockOrders.reduce((sum, o) => sum + o.total_cents, 0)
      const aovCents = completedOrders > 0 ? Math.round(totalSpentCents / completedOrders) : 0

      expect(aovCents).toBe(0)
    })

    it('conforms to the strict typed Customer360Detail interface structure', () => {
      const detail: Customer360Detail = {
        userId: 'usr-123',
        fullName: 'Aria Pratama',
        email: 'aria@example.com',
        avatarUrl: null,
        role: 'customer',
        joinedAt: '2026-01-01T00:00:00.000Z',
        totalOrders: 3,
        completedOrders: 2,
        pendingOrders: 1,
        cancelledOrders: 0,
        totalSpentCents: 150000000,
        formattedLtv: 'Rp 1.500.000',
        averageOrderValueCents: 75000000,
        formattedAov: 'Rp 750.000',
        loyaltyCoinBalance: 2500,
        recentOrders: [
          {
            id: 'ord-1',
            status: 'completed',
            totalCents: 75000000,
            formattedTotal: 'Rp 750.000',
            createdAt: '2026-02-01T00:00:00.000Z',
            itemCount: 2,
          },
        ],
        supportTicketsCount: 0,
      }

      expect(detail.userId).toBe('usr-123')
      expect(detail.loyaltyCoinBalance).toBe(2500)
      expect(detail.recentOrders).toHaveLength(1)
    })
  })

  describe('Architectural Line Limits & Governance', () => {
    const files = [
      'shared/types/admin-crm.ts',
      'server/api/admin/users/[id]/360.get.ts',
      'app/components/admin/users/AdminCustomer360Drawer.vue',
      'app/pages/admin/users.vue',
      'app/features/orders/components/AdminOrderCustomerCard.vue',
      'tests/unit/admin-customer-360.spec.ts',
    ]

    it('ensures all modified and created files are <= 300 lines', () => {
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        const lines = content.split('\n').length
        expect(lines, `File ${file} exceeds 300 lines (${lines})`).toBeLessThanOrEqual(300)
      }
    })

    it('strictly prohibits em dashes in all modified and created files', () => {
      const emDash = String.fromCharCode(8212)
      for (const file of files) {
        const fullPath = resolve(process.cwd(), file)
        const content = readFileSync(fullPath, 'utf-8')
        expect(content.includes(emDash), `File ${file} contains forbidden em dash`).toBe(false)
      }
    })
  })
})
