import { describe, it, expect } from 'vitest'
import {
  isAllowedTransition,
  getAvailableTransitions,
  ALLOWED_ORDER_TRANSITIONS,
} from '../../shared/constants/order-transitions'

describe('Order State Machine & Legal Transitions (D-02)', () => {
  it('allows pending -> paid and pending -> cancelled', () => {
    expect(isAllowedTransition('pending', 'paid')).toBe(true)
    expect(isAllowedTransition('pending', 'cancelled')).toBe(true)
  })

  it('rejects direct completion or shipping from pending', () => {
    expect(isAllowedTransition('pending', 'shipped')).toBe(false)
    expect(isAllowedTransition('pending', 'completed')).toBe(false)
  })

  it('allows paid -> shipped and paid -> cancelled', () => {
    expect(isAllowedTransition('paid', 'shipped')).toBe(true)
    expect(isAllowedTransition('paid', 'cancelled')).toBe(true)
  })

  it('rejects reverting paid back to pending', () => {
    expect(isAllowedTransition('paid', 'pending')).toBe(false)
  })

  it('allows shipped -> completed', () => {
    expect(isAllowedTransition('shipped', 'completed')).toBe(true)
  })

  it('rejects reverting shipped back to paid or pending', () => {
    expect(isAllowedTransition('shipped', 'paid')).toBe(false)
    expect(isAllowedTransition('shipped', 'pending')).toBe(false)
  })

  it('strictly forbids transitions once order is completed or cancelled (terminal states)', () => {
    const statuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'] as const
    for (const target of statuses) {
      expect(isAllowedTransition('completed', target)).toBe(false)
      expect(isAllowedTransition('cancelled', target)).toBe(false)
    }
  })

  it('returns valid available target transitions for current status', () => {
    expect(getAvailableTransitions('pending')).toEqual(['paid', 'cancelled'])
    expect(getAvailableTransitions('paid')).toEqual(['shipped', 'cancelled'])
    expect(getAvailableTransitions('shipped')).toEqual(['completed'])
    expect(getAvailableTransitions('completed')).toEqual([])
    expect(getAvailableTransitions('cancelled')).toEqual([])
  })

  it('has immutable state map definitions', () => {
    expect(Object.keys(ALLOWED_ORDER_TRANSITIONS)).toHaveLength(5)
  })
})
