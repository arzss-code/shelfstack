import { describe, it, expect } from 'vitest'

describe('Concurrency Hardening & Webhook State Guard (Phase 0)', () => {
  // 1. Deadlock Elimination Logic: Deterministic Item Lock Ordering
  const sortCheckoutItemsForLocking = (items: Array<{ product_id: number; qty: number }>) => {
    return [...items].sort((a, b) => a.product_id - b.product_id)
  }

  it('guarantees deterministic ascending order of items for database row locks', () => {
    const userAItems = [
      { product_id: 105, qty: 1 },
      { product_id: 12, qty: 2 },
      { product_id: 48, qty: 1 },
    ]
    const userBItems = [
      { product_id: 48, qty: 3 },
      { product_id: 105, qty: 1 },
      { product_id: 12, qty: 1 },
    ]

    const lockedA = sortCheckoutItemsForLocking(userAItems)
    const lockedB = sortCheckoutItemsForLocking(userBItems)

    expect(lockedA.map((i) => i.product_id)).toEqual([12, 48, 105])
    expect(lockedB.map((i) => i.product_id)).toEqual([12, 48, 105])
  })

  // 2. Safe Webhook State Transition Logic (Phantom Stock Protection)
  type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

  interface WebhookTransitionResult {
    action:
      | 'PROCEED_UPDATE'
      | 'CONFLICT_ALREADY_CANCELLED'
      | 'IDEMPOTENT_NOOP'
      | 'IGNORED_STALE_CANCEL'
      | 'IGNORED_ROLLBACK'
    restockNeeded: boolean
    finalStatus: OrderStatus
  }

  const resolveWebhookState = (
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
  ): WebhookTransitionResult => {
    // Idempotency: status sama
    if (currentStatus === targetStatus) {
      return { action: 'IDEMPOTENT_NOOP', restockNeeded: false, finalStatus: currentStatus }
    }

    // Proteksi Pesanan Terminal / Progresif (paid, shipped, completed):
    if (['paid', 'shipped', 'completed'].includes(currentStatus)) {
      if (targetStatus === 'cancelled') {
        return {
          action: 'IGNORED_STALE_CANCEL',
          restockNeeded: false,
          finalStatus: currentStatus,
        }
      }
      if (targetStatus === 'paid') {
        return {
          action: 'IGNORED_ROLLBACK',
          restockNeeded: false,
          finalStatus: currentStatus,
        }
      }
      return {
        action: 'IDEMPOTENT_NOOP',
        restockNeeded: false,
        finalStatus: currentStatus,
      }
    }

    // Phantom Stock Protection: Jika order sudah cancelled, jangan biarkan webhook menimpa jadi paid
    if (currentStatus === 'cancelled' && targetStatus === 'paid') {
      return {
        action: 'CONFLICT_ALREADY_CANCELLED',
        restockNeeded: false,
        finalStatus: 'cancelled',
      }
    }

    // Transisi normal: pending -> paid
    if (currentStatus === 'pending' && targetStatus === 'paid') {
      return { action: 'PROCEED_UPDATE', restockNeeded: false, finalStatus: 'paid' }
    }

    // Transisi: pending -> cancelled (Expired / Denied di Payment Gateway)
    if (currentStatus === 'pending' && targetStatus === 'cancelled') {
      return { action: 'PROCEED_UPDATE', restockNeeded: true, finalStatus: 'cancelled' }
    }

    return { action: 'IDEMPOTENT_NOOP', restockNeeded: false, finalStatus: currentStatus }
  }

  it('rejects overwriting cancelled order with late paid webhook (prevents phantom stock)', () => {
    const result = resolveWebhookState('cancelled', 'paid')
    expect(result.action).toBe('CONFLICT_ALREADY_CANCELLED')
    expect(result.finalStatus).toBe('cancelled')
    expect(result.restockNeeded).toBe(false)
  })

  it('handles duplicate paid webhook idempotently', () => {
    const result = resolveWebhookState('paid', 'paid')
    expect(result.action).toBe('IDEMPOTENT_NOOP')
    expect(result.finalStatus).toBe('paid')
  })

  it('successfully transitions pending to paid without restock', () => {
    const result = resolveWebhookState('pending', 'paid')
    expect(result.action).toBe('PROCEED_UPDATE')
    expect(result.finalStatus).toBe('paid')
    expect(result.restockNeeded).toBe(false)
  })

  it('triggers automatic restock when pending order expires/cancels from webhook', () => {
    const result = resolveWebhookState('pending', 'cancelled')
    expect(result.action).toBe('PROCEED_UPDATE')
    expect(result.finalStatus).toBe('cancelled')
    expect(result.restockNeeded).toBe(true)
  })

  it('ignores stale cancel/expire webhook on paid order without restock', () => {
    const result = resolveWebhookState('paid', 'cancelled')
    expect(result.action).toBe('IGNORED_STALE_CANCEL')
    expect(result.finalStatus).toBe('paid')
    expect(result.restockNeeded).toBe(false)
  })

  it('ignores stale cancel/expire webhook on shipped order without modifying status or stock', () => {
    const result = resolveWebhookState('shipped', 'cancelled')
    expect(result.action).toBe('IGNORED_STALE_CANCEL')
    expect(result.finalStatus).toBe('shipped')
    expect(result.restockNeeded).toBe(false)
  })

  it('ignores stale cancel/expire webhook on completed order without modifying status or stock', () => {
    const result = resolveWebhookState('completed', 'cancelled')
    expect(result.action).toBe('IGNORED_STALE_CANCEL')
    expect(result.finalStatus).toBe('completed')
    expect(result.restockNeeded).toBe(false)
  })

  it('prevents downgrading shipped/completed order back to paid on duplicate paid webhook', () => {
    const resultShipped = resolveWebhookState('shipped', 'paid')
    expect(resultShipped.action).toBe('IGNORED_ROLLBACK')
    expect(resultShipped.finalStatus).toBe('shipped')

    const resultCompleted = resolveWebhookState('completed', 'paid')
    expect(resultCompleted.action).toBe('IGNORED_ROLLBACK')
    expect(resultCompleted.finalStatus).toBe('completed')
  })
})
