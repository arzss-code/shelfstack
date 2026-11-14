import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  dispatchTransactionalEmail,
  dispatchOrderTransactionalEmail,
  getEmailDeliveryLogs,
  clearEmailDeliveryLogs,
} from '../../server/utils/email-dispatcher'
import { mapDbOrderToEmailData } from '../../server/utils/email-mapper'
import type { RawDbOrder } from '../../server/utils/email-types'
import type { EmailOrderData } from '../../shared/utils/email-templates'

describe('server/utils/email-dispatcher', () => {
  const sampleOrder: EmailOrderData = {
    id: 'ord-test-4412',
    customer_name: 'Ahmad Dahlan',
    customer_email: 'ahmad@example.com',
    customer_phone: '081298765432',
    street: 'Jl. Malioboro No. 12',
    city: 'Yogyakarta',
    postal: '55271',
    shipping_service: 'Reguler',
    courier_code: 'jne',
    tracking_number: 'SS-JNE-990011',
    items: [
      {
        name: 'Mechanical Keyboard 75%',
        variantName: 'Gateron Yellow',
        quantity: 1,
        price: 850000,
      },
    ],
    subtotal_cents: 85000000,
    shipping_fee_cents: 2000000,
    total_cents: 87000000,
  }

  beforeEach(() => {
    clearEmailDeliveryLogs()
    vi.restoreAllMocks()
  })

  describe('dispatchTransactionalEmail with mock provider', () => {
    it('dispatches order_placed email and logs to memory buffer', async () => {
      const result = await dispatchTransactionalEmail('order_placed', sampleOrder, {
        provider: 'mock',
      })

      expect(result.ok).toBe(true)
      expect(result.provider).toBe('mock')
      expect(result.messageId).toContain('mock-')
      expect(result.error).toBeNull()

      const logs = getEmailDeliveryLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].orderId).toBe('ord-test-4412')
      expect(logs[0].templateType).toBe('order_placed')
      expect(logs[0].recipientEmail).toBe('ahmad@example.com')
      expect(logs[0].status).toBe('sent')
    })

    it('dispatches payment_success email successfully', async () => {
      const result = await dispatchTransactionalEmail('payment_success', sampleOrder, {
        provider: 'mock',
      })

      expect(result.ok).toBe(true)
      expect(result.provider).toBe('mock')

      const logs = getEmailDeliveryLogs()
      expect(logs[0].templateType).toBe('payment_success')
      expect(logs[0].status).toBe('sent')
    })

    it('dispatches order_shipped email with tracking information', async () => {
      const result = await dispatchTransactionalEmail('order_shipped', sampleOrder, {
        provider: 'mock',
      })

      expect(result.ok).toBe(true)
      expect(result.provider).toBe('mock')

      const logs = getEmailDeliveryLogs()
      expect(logs[0].templateType).toBe('order_shipped')
      expect(logs[0].status).toBe('sent')
    })
  })

  describe('dispatchTransactionalEmail with resend provider', () => {
    it('dispatches email via Resend API when valid response is returned', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 'resend-msg-12345' }),
      })

      const result = await dispatchTransactionalEmail('order_placed', sampleOrder, {
        provider: 'resend',
        apiKey: 're_test_key_123',
        fetchImpl: mockFetch as unknown as typeof fetch,
      })

      expect(result.ok).toBe(true)
      expect(result.provider).toBe('resend')
      expect(result.messageId).toBe('resend-msg-12345')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      const [url, init] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.resend.com/emails')
      expect(init.headers.authorization).toBe('Bearer re_test_key_123')

      const payload = JSON.parse(init.body)
      expect(payload.to).toEqual(['ahmad@example.com'])
      expect(payload.subject).toContain('Konfirmasi Pemesanan')
    })

    it('fails open when Resend API returns HTTP error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ message: 'API key revoked' }),
      })

      const result = await dispatchTransactionalEmail('payment_success', sampleOrder, {
        provider: 'resend',
        apiKey: 're_invalid_key',
        fetchImpl: mockFetch as unknown as typeof fetch,
      })

      expect(result.ok).toBe(false)
      expect(result.provider).toBe('resend')
      expect(result.error).toContain('API key revoked')

      const logs = getEmailDeliveryLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].status).toBe('failed')
      expect(logs[0].errorMessage).toContain('API key revoked')
    })

    it('fails open when fetch throws a network timeout exception', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection timed out'))

      const result = await dispatchTransactionalEmail('order_shipped', sampleOrder, {
        provider: 'resend',
        apiKey: 're_test_key',
        fetchImpl: mockFetch as unknown as typeof fetch,
      })

      expect(result.ok).toBe(false)
      expect(result.provider).toBe('resend')
      expect(result.error).toContain('Connection timed out')

      const logs = getEmailDeliveryLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].status).toBe('failed')
    })
  })

  describe('delivery logs management', () => {
    it('clears in-memory delivery logs when requested', async () => {
      await dispatchTransactionalEmail('order_placed', sampleOrder, { provider: 'mock' })
      expect(getEmailDeliveryLogs()).toHaveLength(1)

      clearEmailDeliveryLogs()
      expect(getEmailDeliveryLogs()).toHaveLength(0)
    })

    it('limits returned delivery logs according to limit argument', async () => {
      for (let i = 0; i < 5; i++) {
        await dispatchTransactionalEmail(
          'order_placed',
          { ...sampleOrder, id: `ord-${i}` },
          { provider: 'mock' },
        )
      }
      expect(getEmailDeliveryLogs(3)).toHaveLength(3)
    })
  })

  describe('mapDbOrderToEmailData', () => {
    it('maps database order row with items and address into EmailOrderData', () => {
      const rawDb: RawDbOrder = {
        id: 'ord-db-101',
        total_cents: 125000000,
        subtotal_cents: 120000000,
        discount_cents: 5000000,
        coins_used: 50,
        shipping_cost_cents: 1000000,
        coupon_code: 'DISKON50',
        shipping_service: 'express',
        courier_code: 'sicepat',
        tracking_number: '00329182910',
        address: {
          name: 'Siti Aminah',
          email: 'siti@example.com',
          phone: '081399887766',
          street: 'Jl. Riau No. 8',
          city: 'Bandung',
          postal: '40115',
          note: 'Dekat masjid',
        },
        items: [
          {
            qty: 2,
            price_cents: 60000000,
            product: { name: 'Wireless Mouse Pro', image_url: 'https://example.com/mouse.jpg' },
            variant: { name: 'Matte White' },
          },
        ],
      }

      const emailData = mapDbOrderToEmailData(rawDb)

      expect(emailData.id).toBe('ord-db-101')
      expect(emailData.customer_name).toBe('Siti Aminah')
      expect(emailData.customer_email).toBe('siti@example.com')
      expect(emailData.customer_phone).toBe('081399887766')
      expect(emailData.city).toBe('Bandung')
      expect(emailData.shipping_service).toBe('express')
      expect(emailData.courier_code).toBe('sicepat')
      expect(emailData.tracking_number).toBe('00329182910')
      expect(emailData.coupon_code).toBe('DISKON50')
      expect(emailData.items).toHaveLength(1)
      expect(emailData.items[0].name).toBe('Wireless Mouse Pro')
      expect(emailData.items[0].quantity).toBe(2)
      expect(emailData.items[0].price).toBe(600000)
    })

    it('provides fallbacks when optional fields are empty', () => {
      const minimalDb: RawDbOrder = {
        id: 'ord-db-minimal',
        total_cents: 5000000,
      }

      const emailData = mapDbOrderToEmailData(minimalDb)

      expect(emailData.id).toBe('ord-db-minimal')
      expect(emailData.customer_name).toBe('Pelanggan Setia')
      expect(emailData.customer_email).toBe('pelanggan@example.com')
      expect(emailData.customer_phone).toBe('-')
      expect(emailData.items).toEqual([])
      expect(emailData.shipping_service).toBe('Reguler')
    })
  })

  describe('dispatchOrderTransactionalEmail', () => {
    it('fetches order from client and dispatches email successfully', async () => {
      const mockOrder = {
        id: 'ord-db-999',
        total_cents: 5000000,
        subtotal_cents: 5000000,
        address: { name: 'Budi Test', email: 'budi@test.com' },
        user_id: 'usr-123',
        items: [],
      }

      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockOrder, error: null }),
            }),
          }),
        }),
        auth: {
          admin: {
            getUserById: vi.fn().mockResolvedValue({
              data: { user: { email: 'budi-auth@test.com' } },
            }),
          },
        },
      }

      const result = await dispatchOrderTransactionalEmail(
        mockClient as any,
        'ord-db-999',
        'order_placed',
      )

      expect(result.ok).toBe(true)
      expect(result.provider).toBe('mock')

      const logs = getEmailDeliveryLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].orderId).toBe('ord-db-999')
      expect(logs[0].recipientEmail).toBe('budi-auth@test.com')
    })

    it('fails open when order is not found in database', async () => {
      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }

      const result = await dispatchOrderTransactionalEmail(
        mockClient as any,
        'ord-nonexistent',
        'order_placed',
      )

      expect(result.ok).toBe(false)
      expect(result.error).toContain('Order not found')
    })
  })
})
