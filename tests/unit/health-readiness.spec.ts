import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { pingOrderService } from '~~/server/utils/order-service'
import healthHandler from '~~/server/api/health.get'
import versionData from '../../version.json'

const SEED_PATH = resolve(process.cwd(), 'supabase/seed.sql')

describe('Multi-Service Health, Readiness & Seed Ecosystem Suite', () => {
  describe('Order Service Health Ping Probe', () => {
    it('returns true when order-service responds with HTTP 200 OK', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success' }),
      } as Response)

      const result = await pingOrderService('req-test-1', mockFetch as unknown as typeof fetch)
      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('returns false when order-service responds with 500 error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      const result = await pingOrderService('req-test-2', mockFetch as unknown as typeof fetch)
      expect(result).toBe(false)
    })

    it('fails open and returns false when order-service network call rejects', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))

      const result = await pingOrderService('req-test-3', mockFetch as unknown as typeof fetch)
      expect(result).toBe(false)
    })
  })

  describe('Nitro Server Liveness Health Handler', () => {
    it('returns process health metadata matching version.json', () => {
      const response = healthHandler({} as never)
      expect(response).toMatchObject({
        status: 'success',
        message: 'ShelfStack Frontend process is healthy',
        data: {
          service: 'shelfstack-frontend',
          version: versionData.version,
        },
      })
      expect(typeof response.data.uptime).toBe('number')
      expect(typeof response.data.timestamp).toBe('string')
    })
  })

  describe('Database Seed Ecosystem (supabase/seed.sql)', () => {
    const seedSql = readFileSync(SEED_PATH, 'utf8')

    it('contains canonical demo accounts with password hash', () => {
      expect(seedSql).toContain('demo-customer@shelfstack.local')
      expect(seedSql).toContain('demo-admin@shelfstack.local')
      expect(seedSql).toContain('customer@shelfstack.local')
      expect(seedSql).toContain('admin@shelfstack.local')
      expect(seedSql).toContain("crypt('Password123!', gen_salt('bf'))")
      expect(seedSql).toContain('"role": "admin"')
    })

    it('seeds canonical discount coupons with usage constraints', () => {
      expect(seedSql).toContain('WELCOME10')
      expect(seedSql).toContain('SHELF50K')
      expect(seedSql).toContain('FREESHIP')
      expect(seedSql).toContain("'percentage',")
      expect(seedSql).toContain("'fixed',")
    })

    it('seeds orders spanning all 5 lifecycle states', () => {
      expect(seedSql).toContain("'completed'")
      expect(seedSql).toContain("'shipped'")
      expect(seedSql).toContain("'paid'")
      expect(seedSql).toContain("'pending'")
      expect(seedSql).toContain("'cancelled'")
      expect(seedSql).toContain('SS-JNE-1731000001')
      expect(seedSql).toContain('SS-SICEPAT-1731000002')
    })

    it('seeds verified product reviews, support chat, return request, and in-app notifications', () => {
      expect(seedSql).toContain('insert into public.product_reviews')
      expect(seedSql).toContain('insert into public.shipping_checkpoints')
      expect(seedSql).toContain('insert into public.return_requests')
      expect(seedSql).toContain('insert into public.support_threads')
      expect(seedSql).toContain('insert into public.support_messages')
      expect(seedSql).toContain('insert into public.notifications')
    })
  })
})
