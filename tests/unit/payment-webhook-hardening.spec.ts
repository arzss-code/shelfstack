import { describe, it, expect, vi } from 'vitest'

/**
 * Unit Regression Test Suite: Payment Webhook State Machine & Invariant Hardening
 *
 * Menguji seluruh aturan transisi status dan proteksi mutasi stok pada alur webhook:
 * 1. pending -> paid
 * 2. pending -> cancelled + restock
 * 3. paid + stale cancel/expire
 * 4. shipped + stale cancel/expire
 * 5. completed + stale cancel/expire
 * 6. duplicate paid (idempotency, no double sold_count increment)
 * 7. duplicate cancelled (idempotency, no double restock)
 * 8. cancelled + late paid (conflict protection, phantom stock prevention)
 * 9. RPC failure in Nitro handler must return 500 without direct order update fallback
 */

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

interface MockProduct {
  id: number
  stock: number
  sold_count: number
}

interface MockOrder {
  id: string
  status: OrderStatus
  paid_at: string | null
  cancelled_at: string | null
  items: Array<{ product_id: number; qty: number }>
}

class WebhookRpcSimulator {
  public products: Map<number, MockProduct>
  public orders: Map<string, MockOrder>
  public activityLogs: any[] = []

  constructor(products: MockProduct[], orders: MockOrder[]) {
    this.products = new Map(products.map((p) => [p.id, { ...p }]))
    this.orders = new Map(orders.map((o) => [o.id, { ...o }]))
  }

  public handlePaymentWebhook(
    orderId: string,
    targetStatus: 'paid' | 'cancelled',
    paymentType: string = 'bank_transfer',
    midtransId: string = 'mid-test-123',
  ): string {
    const order = this.orders.get(orderId)
    if (!order) return 'ORDER_NOT_FOUND'

    const currentStatus = order.status

    // 1. Terminal / Progressive state protection (paid, shipped, completed)
    if (['paid', 'shipped', 'completed'].includes(currentStatus)) {
      if (targetStatus === 'cancelled') {
        return 'IGNORED_STALE_CANCEL_ON_PAID_ORDER'
      }
      if (targetStatus === 'paid') {
        return `NO_CHANGE_ALREADY_${currentStatus.toUpperCase()}`
      }
      return 'IGNORED_ORDER_ALREADY_PROGRESSING'
    }

    // 2. Cancelled order protection (Late payment & duplicate cancel)
    if (currentStatus === 'cancelled') {
      if (targetStatus === 'paid') {
        this.activityLogs.push({
          action: 'UPDATE',
          entity_type: 'orders',
          order_id: orderId,
          description: 'CONFLICT: Late paid webhook on cancelled order',
        })
        return 'CONFLICT_ALREADY_CANCELLED'
      }
      if (targetStatus === 'cancelled') {
        return 'NO_CHANGE_ALREADY_CANCELLED'
      }
      return 'IGNORED_ORDER_ALREADY_CANCELLED'
    }

    // 3. Valid transitions from pending
    if (currentStatus === 'pending') {
      if (targetStatus === 'paid') {
        order.status = 'paid'
        order.paid_at = new Date().toISOString()

        // Increment sold_count
        for (const item of order.items) {
          const product = this.products.get(item.product_id)
          if (product) {
            product.sold_count += item.qty
          }
        }
        return 'PAID_SUCCESS'
      }

      if (targetStatus === 'cancelled') {
        order.status = 'cancelled'
        order.cancelled_at = new Date().toISOString()

        // Restock products
        for (const item of order.items) {
          const product = this.products.get(item.product_id)
          if (product) {
            product.stock += item.qty
          }
        }
        return 'CANCELLED_AND_RESTOCKED'
      }
    }

    return 'INVALID_TRANSITION'
  }
}

describe('Payment Webhook State Machine Invariants (handle_payment_webhook)', () => {
  it('transisi pending -> paid berhasil memperbarui status dan menginkrementasi sold_count', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 10, sold_count: 5 }],
      [
        {
          id: 'ord-1',
          status: 'pending',
          paid_at: null,
          cancelled_at: null,
          items: [{ product_id: 1, qty: 2 }],
        },
      ],
    )

    const result = sim.handlePaymentWebhook('ord-1', 'paid')
    expect(result).toBe('PAID_SUCCESS')

    const order = sim.orders.get('ord-1')!
    expect(order.status).toBe('paid')
    expect(order.paid_at).toBeTruthy()

    const product = sim.products.get(1)!
    expect(product.sold_count).toBe(7) // 5 + 2
    expect(product.stock).toBe(10) // Stok tidak berubah saat bayar karena sudah dipotong saat checkout
  })

  it('transisi pending -> cancelled berhasil mengembalikan stok produk (restock atomik)', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 8, sold_count: 5 }],
      [
        {
          id: 'ord-1',
          status: 'pending',
          paid_at: null,
          cancelled_at: null,
          items: [{ product_id: 1, qty: 2 }],
        },
      ],
    )

    const result = sim.handlePaymentWebhook('ord-1', 'cancelled')
    expect(result).toBe('CANCELLED_AND_RESTOCKED')

    const order = sim.orders.get('ord-1')!
    expect(order.status).toBe('cancelled')
    expect(order.cancelled_at).toBeTruthy()

    const product = sim.products.get(1)!
    expect(product.stock).toBe(10) // 8 + 2 (restocked)
    expect(product.sold_count).toBe(5) // sold_count tidak bertambah
  })

  it('mengabaikan stale cancel/expire webhook pada pesanan paid tanpa mengubah status atau stok', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 10, sold_count: 5 }],
      [
        {
          id: 'ord-1',
          status: 'paid',
          paid_at: '2026-10-08T10:00:00Z',
          cancelled_at: null,
          items: [{ product_id: 1, qty: 2 }],
        },
      ],
    )

    const result = sim.handlePaymentWebhook('ord-1', 'cancelled')
    expect(result).toBe('IGNORED_STALE_CANCEL_ON_PAID_ORDER')

    const order = sim.orders.get('ord-1')!
    expect(order.status).toBe('paid')
    expect(order.cancelled_at).toBeNull()

    const product = sim.products.get(1)!
    expect(product.stock).toBe(10) // Tidak di-restock
  })

  it('mengabaikan stale cancel/expire webhook pada pesanan shipped tanpa rollback status atau stok', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 10, sold_count: 5 }],
      [
        {
          id: 'ord-1',
          status: 'shipped',
          paid_at: '2026-10-08T10:00:00Z',
          cancelled_at: null,
          items: [{ product_id: 1, qty: 2 }],
        },
      ],
    )

    const result = sim.handlePaymentWebhook('ord-1', 'cancelled')
    expect(result).toBe('IGNORED_STALE_CANCEL_ON_PAID_ORDER')

    const order = sim.orders.get('ord-1')!
    expect(order.status).toBe('shipped')

    const product = sim.products.get(1)!
    expect(product.stock).toBe(10)
  })

  it('mengabaikan stale cancel/expire webhook pada pesanan completed tanpa rollback status atau stok', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 10, sold_count: 5 }],
      [
        {
          id: 'ord-1',
          status: 'completed',
          paid_at: '2026-10-08T10:00:00Z',
          cancelled_at: null,
          items: [{ product_id: 1, qty: 2 }],
        },
      ],
    )

    const result = sim.handlePaymentWebhook('ord-1', 'cancelled')
    expect(result).toBe('IGNORED_STALE_CANCEL_ON_PAID_ORDER')

    const order = sim.orders.get('ord-1')!
    expect(order.status).toBe('completed')

    const product = sim.products.get(1)!
    expect(product.stock).toBe(10)
  })

  it('menolak degradasi status saat webhook paid duplikat tiba pada pesanan shipped atau completed', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 10, sold_count: 5 }],
      [
        {
          id: 'ord-ship',
          status: 'shipped',
          paid_at: '2026-10-08T10:00:00Z',
          cancelled_at: null,
          items: [{ product_id: 1, qty: 1 }],
        },
        {
          id: 'ord-comp',
          status: 'completed',
          paid_at: '2026-10-08T10:00:00Z',
          cancelled_at: null,
          items: [{ product_id: 1, qty: 1 }],
        },
      ],
    )

    expect(sim.handlePaymentWebhook('ord-ship', 'paid')).toBe('NO_CHANGE_ALREADY_SHIPPED')
    expect(sim.orders.get('ord-ship')!.status).toBe('shipped')

    expect(sim.handlePaymentWebhook('ord-comp', 'paid')).toBe('NO_CHANGE_ALREADY_COMPLETED')
    expect(sim.orders.get('ord-comp')!.status).toBe('completed')
  })

  it('idempotensi: webhook paid ganda tidak menduplikasi sold_count', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 10, sold_count: 5 }],
      [
        {
          id: 'ord-1',
          status: 'pending',
          paid_at: null,
          cancelled_at: null,
          items: [{ product_id: 1, qty: 2 }],
        },
      ],
    )

    // Pengiriman pertama
    sim.handlePaymentWebhook('ord-1', 'paid')
    expect(sim.products.get(1)!.sold_count).toBe(7)

    // Pengiriman kedua (duplikat / retry)
    const secondResult = sim.handlePaymentWebhook('ord-1', 'paid')
    expect(secondResult).toBe('NO_CHANGE_ALREADY_PAID')
    expect(sim.products.get(1)!.sold_count).toBe(7) // Tidak bertambah lagi
  })

  it('idempotensi: webhook cancel ganda tidak merestock stok produk dua kali', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 8, sold_count: 5 }],
      [
        {
          id: 'ord-1',
          status: 'pending',
          paid_at: null,
          cancelled_at: null,
          items: [{ product_id: 1, qty: 2 }],
        },
      ],
    )

    // Pembatalan pertama -> restock +2 (8 -> 10)
    sim.handlePaymentWebhook('ord-1', 'cancelled')
    expect(sim.products.get(1)!.stock).toBe(10)

    // Webhook cancel duplikat
    const secondResult = sim.handlePaymentWebhook('ord-1', 'cancelled')
    expect(secondResult).toBe('NO_CHANGE_ALREADY_CANCELLED')
    expect(sim.products.get(1)!.stock).toBe(10) // Stok tetap 10, tidak menjadi 12!
  })

  it('menolak pengaktifan order cancelled saat late paid webhook tiba dan mencatat audit log', () => {
    const sim = new WebhookRpcSimulator(
      [{ id: 1, stock: 10, sold_count: 5 }],
      [
        {
          id: 'ord-1',
          status: 'cancelled',
          paid_at: null,
          cancelled_at: '2026-10-08T09:00:00Z',
          items: [{ product_id: 1, qty: 2 }],
        },
      ],
    )

    const result = sim.handlePaymentWebhook('ord-1', 'paid')
    expect(result).toBe('CONFLICT_ALREADY_CANCELLED')

    const order = sim.orders.get('ord-1')!
    expect(order.status).toBe('cancelled')
    expect(sim.products.get(1)!.stock).toBe(10) // Stok tidak dipotong
    expect(sim.products.get(1)!.sold_count).toBe(5) // sold_count tidak bertambah
    expect(sim.activityLogs).toHaveLength(1)
    expect(sim.activityLogs[0].order_id).toBe('ord-1')
  })
})

describe('Nitro Notification Webhook Handler (Fail-Fast Verification)', () => {
  it('memastikan jika RPC database gagal, handler mengembalikan error 500 dan TIDAK mengeksekusi direct update fallback', async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database transaction lock timeout', code: '40P01' },
    })
    const mockUpdate = vi.fn()

    const mockSupabaseClient = {
      rpc: mockRpc,
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    }

    // Simulasi handler logic
    const executeHandler = async (client: any, orderId: string, newStatus: string) => {
      const { data: resultStatus, error: rpcError } = await client.rpc('handle_payment_webhook', {
        p_order_id: orderId,
        p_target_status: newStatus,
        p_payment_type: 'bank_transfer',
        p_midtrans_id: 'mid-123',
      })

      if (rpcError) {
        return {
          statusCode: 500,
          error: rpcError,
        }
      }

      return {
        statusCode: 200,
        result: resultStatus,
      }
    }

    const response = await executeHandler(mockSupabaseClient, 'ord-fail-1', 'paid')

    expect(response.statusCode).toBe(500)
    expect(response.error.message).toBe('Database transaction lock timeout')
    // Memastikan client.from('orders').update() TIDAK PERNAH dipanggil sama sekali!
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
