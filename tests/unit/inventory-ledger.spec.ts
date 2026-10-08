import { describe, expect, it } from 'vitest'

interface StockMovement {
  id: string
  product_id: number
  delta: number
  balance_after: number
  reason:
    | 'initial_inventory'
    | 'checkout'
    | 'order_cancellation'
    | 'webhook_expire_restock'
    | 'manual_adjustment'
  order_id: string | null
  created_at: string
}

describe('Inventory Movements Ledger Architecture (Phase 2)', () => {
  // Ledger simulation engine replicating PostgreSQL triggers
  class InventoryLedgerSimulator {
    public movements: StockMovement[] = []
    public currentStock: number

    constructor(
      public productId: number,
      initialStock: number,
    ) {
      this.currentStock = initialStock
      if (initialStock > 0) {
        this.movements.push({
          id: 'mov-init',
          product_id: productId,
          delta: initialStock,
          balance_after: initialStock,
          reason: 'initial_inventory',
          order_id: null,
          created_at: new Date().toISOString(),
        })
      }
    }

    public applyMovement(
      delta: number,
      reason: StockMovement['reason'],
      orderId: string | null = null,
    ) {
      this.currentStock += delta
      const movement: StockMovement = {
        id: `mov-${this.movements.length + 1}`,
        product_id: this.productId,
        delta,
        balance_after: this.currentStock,
        reason,
        order_id: orderId,
        created_at: new Date().toISOString(),
      }
      this.movements.push(movement)
      return movement
    }

    public getAuditTrail() {
      return [...this.movements].reverse()
    }
  }

  it('records initial stock creation with positive delta and initial_inventory reason', () => {
    const ledger = new InventoryLedgerSimulator(101, 50)
    expect(ledger.movements).toHaveLength(1)
    expect(ledger.movements[0].delta).toBe(50)
    expect(ledger.movements[0].balance_after).toBe(50)
    expect(ledger.movements[0].reason).toBe('initial_inventory')
  })

  it('records checkout deduction with negative delta and associates order_id', () => {
    const ledger = new InventoryLedgerSimulator(101, 50)
    const mov = ledger.applyMovement(-3, 'checkout', 'order-uuid-1')

    expect(mov.delta).toBe(-3)
    expect(mov.balance_after).toBe(47)
    expect(mov.reason).toBe('checkout')
    expect(mov.order_id).toBe('order-uuid-1')
    expect(ledger.currentStock).toBe(47)
  })

  it('records restock when order is cancelled or expired', () => {
    const ledger = new InventoryLedgerSimulator(101, 50)
    ledger.applyMovement(-5, 'checkout', 'order-uuid-2')
    expect(ledger.currentStock).toBe(45)

    // User cancels or webhook expires -> auto restock
    const restockMov = ledger.applyMovement(5, 'order_cancellation', 'order-uuid-2')
    expect(restockMov.delta).toBe(5)
    expect(restockMov.balance_after).toBe(50)
    expect(restockMov.reason).toBe('order_cancellation')
    expect(ledger.currentStock).toBe(50)
  })

  it('guarantees that sum(deltas) strictly equals current stock (Audit Trail Invariant)', () => {
    const ledger = new InventoryLedgerSimulator(101, 100)

    // Series of transactions
    ledger.applyMovement(-10, 'checkout', 'ord-1')
    ledger.applyMovement(-20, 'checkout', 'ord-2')
    ledger.applyMovement(10, 'order_cancellation', 'ord-1') // ord-1 cancelled
    ledger.applyMovement(-5, 'checkout', 'ord-3')
    ledger.applyMovement(25, 'manual_adjustment', null) // warehouse restock +25
    ledger.applyMovement(5, 'webhook_expire_restock', 'ord-3') // ord-3 expired

    // Final balance should be: 100 - 10 - 20 + 10 - 5 + 25 + 5 = 105
    expect(ledger.currentStock).toBe(105)

    const sumDeltas = ledger.movements.reduce((acc, m) => acc + m.delta, 0)
    expect(sumDeltas).toBe(ledger.currentStock)
  })

  it('sorts audit trail chronologically descending for admin view', () => {
    const ledger = new InventoryLedgerSimulator(101, 20)
    ledger.applyMovement(-2, 'checkout', 'ord-a')
    ledger.applyMovement(-3, 'checkout', 'ord-b')

    const audit = ledger.getAuditTrail()
    expect(audit[0].order_id).toBe('ord-b')
    expect(audit[1].order_id).toBe('ord-a')
    expect(audit[2].reason).toBe('initial_inventory')
  })
})
