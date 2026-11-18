import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { errorResponse, successResponse } from '../../server/utils/response'
import { faqs } from '../../app/data/faqs'
import AppNavbar from '../../app/components/AppNavbar.vue'
import CartSummarySidebar from '../../app/components/cart/CartSummarySidebar.vue'
import HomeHero from '../../app/components/home/HomeHero.vue'
import HomeFlashDeals from '../../app/components/home/HomeFlashDeals.vue'

const contactMocks = vi.hoisted(() => ({
  insert: vi.fn(),
  requireAdmin: vi.fn(),
  rpc: vi.fn(),
  readBody: vi.fn(),
  getRouterParam: vi.fn(),
}))

let contactHandler: typeof import('../../server/api/contact.post').default
let restockHandler: typeof import('../../server/api/admin/products/[id]/restock.post').default

describe('Stage 1 Audit Remediations: Contact, Restock RPC, RMA Settlement, & Storefront Integrity', () => {
  beforeAll(async () => {
    vi.stubGlobal('errorResponse', errorResponse)
    vi.stubGlobal('successResponse', successResponse)

    vi.doMock('h3', async () => {
      const actual = await vi.importActual<typeof import('h3')>('h3')
      return {
        ...actual,
        readBody: contactMocks.readBody,
        getRouterParam: contactMocks.getRouterParam,
      }
    })

    vi.doMock('#supabase/server', () => ({
      serverSupabaseUser: vi.fn(async () => null),
      serverSupabaseServiceRole: vi.fn(() => ({
        from: vi.fn(() => ({
          insert: contactMocks.insert,
        })),
        rpc: contactMocks.rpc,
      })),
    }))

    vi.doMock('../../server/utils/auth', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../server/utils/auth')>()
      return {
        ...actual,
        requireAdmin: contactMocks.requireAdmin,
      }
    })

    vi.resetModules()
    contactHandler = (await import('../../server/api/contact.post')).default
    restockHandler = (await import('../../server/api/admin/products/[id]/restock.post')).default
  })

  afterAll(() => {
    vi.doUnmock('h3')
    vi.doUnmock('#supabase/server')
    vi.doUnmock('../../server/utils/auth')
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    contactMocks.insert.mockReset()
    contactMocks.insert.mockResolvedValue({ error: null })
    contactMocks.requireAdmin.mockReset()
    contactMocks.requireAdmin.mockResolvedValue({ id: 'admin-1' })
    contactMocks.rpc.mockReset()
    contactMocks.readBody.mockReset()
    contactMocks.getRouterParam.mockReset()
  })

  it('persists contact form submissions into public.contact_messages', async () => {
    const mockEvent = {
      node: { req: {}, res: {} },
      context: {},
      _body: {
        name: 'Citra Kirana',
        email: 'citra@example.com',
        category: 'Pengiriman & Logistik',
        orderNumber: 'ORD-20261118-01',
        message: 'Mohon bantu cek status paket ekspedisi reguler saya.',
      },
    } as unknown as H3Event

    const res = await contactHandler(mockEvent)
    expect(res.status).toBe('success')
    expect(res.data.persisted).toBe(true)
    expect(contactMocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        ticket_code: res.data.ticket_id,
        email: 'citra@example.com',
        order_number: 'ORD-20261118-01',
        status: 'open',
      }),
    )
  })

  it('delegates quick restock atomically to admin_restock_product RPC and maps 404/409 errors', async () => {
    contactMocks.getRouterParam.mockReturnValue('42')
    contactMocks.readBody.mockResolvedValue({ quantity: 15, notes: 'Restock batch B' })

    contactMocks.rpc.mockResolvedValueOnce({
      data: {
        product_id: 42,
        product_name: 'Monitor Arm Pro',
        variant_id: null,
        previous_stock: 5,
        added_quantity: 15,
        new_stock: 20,
      },
      error: null,
    })

    const okRes = await restockHandler({ context: {} } as H3Event)
    expect(contactMocks.rpc).toHaveBeenCalledWith('admin_restock_product', {
      p_product_id: 42,
      p_quantity: 15,
      p_notes: 'Restock batch B',
      p_variant_id: null,
    })
    expect((okRes.data as { new_stock: number }).new_stock).toBe(20)

    contactMocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'PRODUCT_NOT_FOUND: Produk tidak ditemukan' },
    })
    await expect(restockHandler({ context: {} } as H3Event)).rejects.toMatchObject({
      statusCode: 404,
    })
  })

  it('verifies Stage 1 SQL migration invariants (contact_messages, admin_restock_product, refund settlement)', () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        'supabase/migrations/20261203000001_audit_stage1_contact_restock_and_rma.sql',
      ),
      'utf8',
    )
    expect(sql).toContain('create table if not exists public.contact_messages')
    expect(sql).toContain('create or replace function public.admin_restock_product')
    expect(sql).toContain("perform set_config('app.stock_change_notes'")
    expect(sql).toContain("v_ticket.solution_type = 'refund'")
    expect(sql).toContain("'rma_settlement'")
    expect(sql).toContain('sold_count = greatest(0, coalesce(sold_count, 0) - r.qty)')
    expect(sql).toContain('v_clawback_coins := least(v_new_coin_balance, v_order.coins_earned)')
  })

  it('removes fake midnight timer from index.vue and displays curated copy when no DB campaign is active', () => {
    const indexSrc = readFileSync(resolve(process.cwd(), 'app/pages/index.vue'), 'utf8')
    expect(indexSrc).not.toContain('dailyFlashSaleEnd')
    expect(indexSrc).not.toContain('setHours(24')

    const dealsWrapper = mount(HomeFlashDeals, {
      props: { products: [], loading: false },
      global: { stubs: { NuxtLink: { template: '<a><slot /></a>' } } },
    })
    expect(dealsWrapper.find('[data-testid="flash-deals-timer"]').exists()).toBe(false)
    expect(dealsWrapper.find('[data-testid="flash-deals-curated-badge"]').exists()).toBe(true)
    expect(dealsWrapper.text()).toContain('Sorotan Koleksi Pilihan')
  })

  it('aligns storefront policies (7-day return, 2-hour payment window) and removes /products/ 404 links', () => {
    const navbarSrc = readFileSync(resolve(process.cwd(), 'app/components/AppNavbar.vue'), 'utf8')
    expect(navbarSrc).toContain('Garansi Retur 7 Hari')
    expect(navbarSrc).not.toContain('30 Hari')
    expect(navbarSrc).not.toContain('animate-pulse')
    void AppNavbar

    const cartSrc = readFileSync(
      resolve(process.cwd(), 'app/components/cart/CartSummarySidebar.vue'),
      'utf8',
    )
    expect(cartSrc).toContain('Garansi Pengembalian 7 Hari')
    expect(cartSrc).toContain('cartStore.totalPriceCents >= 50000000')
    expect(cartSrc).not.toContain('30 Hari')
    void CartSummarySidebar

    const heroWrapper = mount(HomeHero, {
      global: { stubs: { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } } },
    })
    expect(heroWrapper.text()).not.toContain('1.300+')
    expect(heroWrapper.findAll('a').some((a) => a.attributes('href') === '/c/tech')).toBe(true)

    const expiryFaq = faqs.find((f) => f.id === 'payment-expiry-window')
    expect(expiryFaq?.answer).toContain('2 jam (120 menit)')
    expect(expiryFaq?.answer).not.toContain('24 jam')

    const snippetSrc = readFileSync(
      resolve(process.cwd(), 'app/components/support/ChatProductSnippet.vue'),
      'utf8',
    )
    const chatPaneSrc = readFileSync(
      resolve(process.cwd(), 'app/components/admin/support/AdminSupportChatPane.vue'),
      'utf8',
    )
    expect(snippetSrc).not.toContain('/products/')
    expect(chatPaneSrc).not.toContain('/products/')
  })
})
