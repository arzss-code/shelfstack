import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import HomeHero from '~/components/home/HomeHero.vue'
import NavbarSearchBar from '~/components/navbar/NavbarSearchBar.vue'
import UiInput from '~/components/ui/UiInput.vue'
import { productFormSchema, productSchema } from '~~/shared/schemas/product'
import {
  enqueueOrderExpiryNotification,
  fetchOrderExpiryQueueTelemetry,
  retryOrderExpiryDlqJob,
} from '~~/server/utils/order-service'

const MIGRATION_PATH = resolve(
  process.cwd(),
  'supabase/migrations/20261130000001_order_cancellation_parity_and_expiry_hardening.sql',
)
const COMPOSABLE_PATH = resolve(process.cwd(), 'app/composables/useProductForm.ts')

describe('Order Cancellation Transactional Parity & Shared Product Schema', () => {
  describe('Database Migration 20261130000001 Invariants', () => {
    const sql = readFileSync(MIGRATION_PATH, 'utf8')

    it('enforces soft delete (deleted_at) on coupon_usages with zero hard DELETE statements', () => {
      expect(sql).toContain('add column if not exists deleted_at timestamptz')
      expect(sql).toContain('idx_coupon_usages_active_unique')
      expect(sql).toContain('where deleted_at is null')
      expect(sql.toLowerCase()).not.toContain('delete from public.coupon_usages')
    })

    it('sets app.order_transition_source in cancel_order, handle_payment_webhook, and transition_order_status', () => {
      expect(sql).toContain(
        "perform set_config('app.order_transition_source', 'cancel_order_rpc', true)",
      )
      expect(sql).toContain(
        "perform set_config('app.order_transition_source', 'payment_webhook', true)",
      )
      expect(sql).toContain(
        "perform set_config('app.order_transition_source', 'admin_transition_rpc', true)",
      )
    })

    it('restores coupon quota, user_coupons wallet, and loyalty coins across all cancellation RPCs', () => {
      const cancelledCoinRefs = sql.match(/'cancelled_order'/g) ?? []
      expect(cancelledCoinRefs.length).toBeGreaterThanOrEqual(6)

      const userCouponRestores = sql.match(/update public\.user_coupons/g) ?? []
      expect(userCouponRestores.length).toBeGreaterThanOrEqual(3)

      expect(sql).toContain('Pesanan Kedaluwarsa')
      expect(sql).toContain("p_payment_type = 'auto_timeout'")
      expect(sql).toContain(
        'grant execute on function public.cancel_order(uuid, text) to authenticated, service_role',
      )
    })
  })

  describe('Nitro -> Order Service Bridge (Fail-Open & Admin Telemetry)', () => {
    it('schedules delayed expiry job when order-service responds 200 OK', async () => {
      const mockFetch = vi.fn(
        async () => new Response(JSON.stringify({ status: 'success' }), { status: 200 }),
      )
      const scheduled = await enqueueOrderExpiryNotification(
        'c1111111-2222-4333-8444-555555555555',
        'req-123',
        mockFetch as unknown as typeof fetch,
      )

      expect(scheduled).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('fails open (returns false without throwing) when order-service returns 500 or rejects', async () => {
      const nonOkFetch = vi.fn(async () => new Response('Unavailable', { status: 503 }))
      await expect(
        enqueueOrderExpiryNotification(
          'c1111111-2222-4333-8444-555555555555',
          'req-503',
          nonOkFetch as unknown as typeof fetch,
        ),
      ).resolves.toBe(false)

      const throwingFetch = vi.fn(async () => {
        throw new Error('ECONNREFUSED')
      })
      await expect(
        enqueueOrderExpiryNotification(
          'c1111111-2222-4333-8444-555555555555',
          'req-err',
          throwingFetch as unknown as typeof fetch,
        ),
      ).resolves.toBe(false)
    })

    it('returns graceful offline telemetry when order-service is unreachable and merges stats when online', async () => {
      const offlineFetch = vi.fn(async () => {
        throw new Error('offline')
      })
      const offline = await fetchOrderExpiryQueueTelemetry(
        'req-offline',
        offlineFetch as unknown as typeof fetch,
      )
      expect(offline.reachable).toBe(false)
      expect(offline.dlqJobs).toEqual([])

      const onlineFetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/queue-stats')) {
          return new Response(
            JSON.stringify({
              data: {
                enabled: true,
                mainQueue: {
                  waiting: 1,
                  active: 0,
                  delayed: 5,
                  completed: 12,
                  failed: 1,
                  paused: 0,
                },
                dlq: { waiting: 1, active: 0, delayed: 0, completed: 0, failed: 0, paused: 0 },
              },
            }),
            { status: 200 },
          )
        }
        return new Response(
          JSON.stringify({
            data: {
              jobs: [
                {
                  id: 'dlq-1',
                  payload: {
                    originalJobId: 'expire-order-1',
                    jobName: 'expire-order',
                    data: { orderId: 'c1111111-2222-4333-8444-555555555555' },
                    failedReason: 'DB timeout',
                    attemptsMade: 3,
                    maxAttempts: 3,
                    failedAt: '2026-11-06T00:00:00.000Z',
                  },
                  timestamp: 1700000000000,
                },
              ],
            },
          }),
          { status: 200 },
        )
      })

      const online = await fetchOrderExpiryQueueTelemetry(
        'req-online',
        onlineFetch as unknown as typeof fetch,
      )
      expect(online.reachable).toBe(true)
      expect(online.enabled).toBe(true)
      expect(online.mainQueue.delayed).toBe(5)
      expect(online.dlqJobs).toHaveLength(1)

      const retryFetch = vi.fn(
        async () =>
          new Response(JSON.stringify({ message: 'Job DLQ dijadwalkan ulang' }), { status: 200 }),
      )
      const retryRes = await retryOrderExpiryDlqJob(
        'dlq-1',
        'req-retry',
        retryFetch as unknown as typeof fetch,
      )
      expect(retryRes.ok).toBe(true)
      expect(retryRes.statusCode).toBe(200)
    })
  })

  describe('Shared Product Zod Schema Unification (Backlog C-07)', () => {
    it('consumes productFormSchema from shared/schemas/product without local duplicate z.object', () => {
      const composableSource = readFileSync(COMPOSABLE_PATH, 'utf8')
      expect(composableSource).toContain('productFormSchema')
      expect(composableSource).toContain('shared/schemas/product')
      expect(composableSource).not.toContain('z.object(')
    })

    it('enforces identical 120-character name limit and stock/price invariants across client and server', () => {
      const validPayload = {
        name: '  Meja Kerja Arsitektural Kayu Ek  ',
        category: 'Ruang Kerja',
        price: 1_850_000,
        stock: 12,
        description: 'Meja kerja solid.',
      }

      const clientParsed = productFormSchema.safeParse(validPayload)
      const serverParsed = productSchema.safeParse({ ...validPayload, image_url: null })

      expect(clientParsed.success).toBe(true)
      expect(serverParsed.success).toBe(true)
      if (clientParsed.success && serverParsed.success) {
        expect(clientParsed.data.name).toBe('Meja Kerja Arsitektural Kayu Ek')
        expect(serverParsed.data.name).toBe('Meja Kerja Arsitektural Kayu Ek')
      }

      const overlongName = 'A'.repeat(121)
      expect(productFormSchema.safeParse({ ...validPayload, name: overlongName }).success).toBe(
        false,
      )
      expect(productSchema.safeParse({ ...validPayload, name: overlongName }).success).toBe(false)
    })
  })

  describe('Modern Web Guidance & Web Interface Accessibility Assertions', () => {
    it('sets fetchpriority="high" without loading="lazy" ONLY on the primary HomeHero LCP image', () => {
      const wrapper = mount(HomeHero, {
        global: {
          stubs: {
            NuxtLink: { template: '<a><slot /></a>' },
          },
        },
      })

      const images = wrapper.findAll('img')
      expect(images).toHaveLength(3)
      expect(images[0]?.attributes('fetchpriority')).toBe('high')
      expect(images[0]?.attributes('loading')).toBeUndefined()
      expect(images[0]?.attributes('width')).toBe('800')
      expect(images[0]?.attributes('height')).toBe('800')
      expect(images[1]?.attributes('fetchpriority')).toBeUndefined()
      expect(images[2]?.attributes('fetchpriority')).toBeUndefined()
    })

    it('wraps NavbarSearchBar in semantic <search> with type="search" and disabled text correction', () => {
      const wrapper = mount(NavbarSearchBar, {
        props: {
          searchQuery: '',
          selectedCategory: 'Semua Kategori',
          dropdownCategories: ['Semua Kategori', 'Audio'],
        },
        global: {
          stubs: {
            UiTooltip: { template: '<div><slot /></div>' },
          },
        },
      })

      expect(wrapper.find('search').exists()).toBe(true)
      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe('search')
      expect(input.attributes('enterkeyhint')).toBe('search')
      expect(input.attributes('spellcheck')).toBe('false')
      expect(input.attributes('autocorrect')).toBe('off')
      expect(input.attributes('autocapitalize')).toBe('off')
    })

    it('applies inputmode="email" and disables spellcheck/autocorrect on UiInput identifier fields', () => {
      const wrapper = mount(UiInput, {
        props: {
          id: 'email',
          modelValue: 'pembeli@shelfstack.id',
          type: 'email',
          autocomplete: 'email',
        },
      })

      const input = wrapper.find('input')
      expect(input.attributes('inputmode')).toBe('email')
      expect(input.attributes('spellcheck')).toBe('false')
      expect(input.attributes('autocorrect')).toBe('off')
      expect(input.attributes('autocapitalize')).toBe('off')
      expect(input.attributes('name')).toBe('email')
    })

    it('wires aria-labelledby and overscroll-contain in UiModal source template', () => {
      const modalSource = readFileSync(
        resolve(process.cwd(), 'app/components/ui/UiModal.vue'),
        'utf8',
      )
      expect(modalSource).toContain('aria-labelledby')
      expect(modalSource).toContain('aria-describedby')
      expect(modalSource).toContain('overscroll-contain')
    })
  })
})
