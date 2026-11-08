import { describe, it, expect } from 'vitest'
import {
  calculateCouponDiscountCents,
  isCouponEligible,
  findBestCoupon,
} from '../../shared/utils/coupon-math'
import {
  resolveCandidateLookupIds,
  evaluateRefundReconciliation,
} from '../../server/utils/payment-reconciliation'
import {
  calculateMaxUsableCoins,
  calculateCoinsDiscountCents,
  calculateCheckoutTotalCents,
  createPlacedOrderSnapshot,
} from '../../app/utils/checkout-pricing'
import {
  formatOrderStatusLabel,
  formatShippingServiceLabel,
  formatPaymentTypeLabel,
  buildOrderTimelineSteps,
  getOrderStatusBadge,
  getPaymentStatusBadge,
  getTimelineSegmentColor,
  filterOrdersByQuery,
  createOrderTabItems,
} from '../../app/utils/order-presentation'
import type { Order } from '../../app/types/order'

describe('Deep Modules & Web Standards Verification Suite', () => {
  describe('shared/utils/coupon-math.ts', () => {
    it('calculates percentage coupon discount correctly with max cap', () => {
      const percentageCoupon = {
        discount_type: 'percentage' as const,
        discount_value: 20, // 20%
        min_purchase_cents: 10000000,
        max_discount_cents: 3000000, // Rp 30.000 max
      }
      // Subtotal Rp 200.000 (20000000 cents) -> 20% = Rp 40.000 -> capped at Rp 30.000 (3000000 cents)
      const discount = calculateCouponDiscountCents(percentageCoupon, 20000000)
      expect(discount).toBe(3000000)
    })

    it('calculates fixed discount coupon correctly without exceeding subtotal', () => {
      const fixedCoupon = {
        discount_type: 'fixed' as const,
        discount_value: 5000000, // Rp 50.000 (5000000 cents)
        min_purchase_cents: 0,
        max_discount_cents: null,
      }
      // Subtotal Rp 40.000 (4000000 cents) -> capped at subtotal
      const discount = calculateCouponDiscountCents(fixedCoupon, 4000000)
      expect(discount).toBe(4000000)
    })

    it('evaluates coupon eligibility against min purchase and expiration state', () => {
      const coupon = {
        discount_type: 'fixed' as const,
        discount_value: 1000000,
        min_purchase_cents: 10000000, // Rp 100.000
        is_expired: false,
        is_available: true,
      }

      expect(isCouponEligible(coupon, 15000000)).toBe(true)
      expect(isCouponEligible(coupon, 5000000)).toBe(false)
      expect(isCouponEligible({ ...coupon, is_expired: true }, 15000000)).toBe(false)
    })

    it('selects the best coupon offering highest savings', () => {
      const coupons = [
        {
          code: 'SAVE10',
          discount_type: 'percentage' as const,
          discount_value: 10,
          max_discount_cents: null,
          min_purchase_cents: 0,
        },
        {
          code: 'SAVE20',
          discount_type: 'percentage' as const,
          discount_value: 20,
          max_discount_cents: null,
          min_purchase_cents: 0,
        },
        {
          code: 'FIXED5',
          discount_type: 'fixed' as const,
          discount_value: 500000,
          max_discount_cents: null,
          min_purchase_cents: 0,
        },
      ]
      const best = findBestCoupon(coupons, 10000000)
      expect(best?.code).toBe('SAVE20')
    })
  })

  describe('server/utils/payment-reconciliation.ts', () => {
    it('resolves candidate lookup IDs including synthetic prefix and raw ID', () => {
      const candidates = resolveCandidateLookupIds({
        orderId: 'ORD-12345',
        orderMidtransId: 'order_ORD-12345',
        gatewayTransactionId: 'pay_snap_99',
      })
      expect(candidates).toContain('ORD-12345')
      expect(candidates).toContain('order_ORD-12345')
      expect(candidates).toContain('pay_snap_99')
    })

    it('evaluates refund reconciliation status transitions properly', () => {
      const decision1 = evaluateRefundReconciliation(
        {
          transaction_status: 'refund',
          refunds: [
            {
              id: 'ref_1',
              refund_key: 'idem_key_1',
              bank_confirmed_at: '2026-11-08T10:00:00Z',
              refund_amount: 50000,
            },
          ],
        },
        {
          id: 'ref_local_1',
          amount_cents: 5000000, // 50000 * 100
          idempotency_key: 'idem_key_1',
        },
      )
      expect(decision1.action).toBe('FINALIZE_SUCCESS')
      expect(decision1.bankConfirmedAt).toBe('2026-11-08T10:00:00Z')

      const decision2 = evaluateRefundReconciliation(
        { transaction_status: 'settlement' },
        { id: 'ref_local_2', amount_cents: 5000000 },
      )
      expect(decision2.action).toBe('WAITING')
    })
  })

  describe('app/utils/checkout-pricing.ts', () => {
    it('caps loyalty coin usage to maximum 50% of final order price', () => {
      // Final price: Rp 100.000 (10.000.000 cents). 50% = Rp 50.000 (50.000 coins).
      // User has 100.000 coins. Max usable is 50.000 coins.
      const usable = calculateMaxUsableCoins(100000, 10000000)
      expect(usable).toBe(50000)

      // User has 10.000 coins. Max allowed is 50.000 coins, so all 10.000 coins are usable.
      const usableSmall = calculateMaxUsableCoins(10000, 10000000)
      expect(usableSmall).toBe(10000)
    })

    it('calculates checkout total cents accurately with coins discount and shipping', () => {
      const finalPriceCents = 10000000 // Rp 100.000
      const coinsDiscountCents = calculateCoinsDiscountCents(200) // 200 coins = 20.000 cents = Rp 200
      const shippingFeeCents = 1500000 // Rp 15.000
      const total = calculateCheckoutTotalCents(
        finalPriceCents,
        coinsDiscountCents,
        shippingFeeCents,
      )
      expect(total).toBe(10000000 - 20000 + 1500000)
    })

    it('creates immutable placed order snapshot preserving item properties', () => {
      const mockItem = {
        productId: 1,
        name: 'Minimalist Desk Lamp',
        price: 250000,
        priceCents: 25000000,
        imageUrl: null,
        quantity: 1,
        stock: 10,
      }
      const snapshot = createPlacedOrderSnapshot({
        items: [mockItem],
        totalItems: 1,
        formattedTotalPrice: 'Rp 250.000',
        discountCents: 0,
        actualCoinsUsed: 0,
        isFreeShipping: true,
        shippingFeeCents: 0,
        shippingService: 'reguler',
        finalPriceCents: 25000000,
        coinsDiscountCents: 0,
      })

      expect(snapshot.totalItems).toBe(1)
      expect(snapshot.shippingFeeFormatted).toBe('Gratis Ongkir')
      expect(snapshot.items[0]?.name).toBe('Minimalist Desk Lamp')
    })
  })

  describe('app/utils/order-presentation.ts', () => {
    it('formats human readable order labels and badges', () => {
      expect(formatOrderStatusLabel('pending')).toBe('Menunggu Pembayaran')
      expect(formatOrderStatusLabel('paid')).toBe('Dibayar')
      expect(formatOrderStatusLabel('shipped')).toBe('Dikirim')
      expect(formatOrderStatusLabel('completed')).toBe('Selesai')
      expect(formatOrderStatusLabel('cancelled')).toBe('Dibatalkan')

      expect(getOrderStatusBadge('paid').variant).toBe('success')
      expect(getOrderStatusBadge('cancelled').variant).toBe('danger')
      expect(getOrderStatusBadge('pending').variant).toBe('warning')
    })

    it('formats shipping service label accurately', () => {
      expect(formatShippingServiceLabel('instan')).toBe('Pengiriman Instan')
      expect(formatShippingServiceLabel('same_day')).toBe('Same Day')
      expect(formatShippingServiceLabel('reguler')).toBe('Reguler')
    })

    it('formats payment type label cleanly without raw gateway jargon', () => {
      expect(formatPaymentTypeLabel('gopay')).toBe('GoPay / QRIS')
      expect(formatPaymentTypeLabel('bank_transfer')).toBe('Virtual Account')
      expect(formatPaymentTypeLabel('echannel')).toBe('Virtual Account')
    })

    it('builds linear timeline steps correctly for paid status', () => {
      const steps = buildOrderTimelineSteps('paid')
      expect(steps.length).toBe(4)
      expect(steps[0]?.isDone).toBe(true)
      expect(steps[1]?.isCurrent).toBe(true)
      expect(steps[2]?.isDone).toBe(false)
    })

    it('calculates segment color progression along order timeline', () => {
      expect(getTimelineSegmentColor(0, 'paid')).toBe('bg-emerald-600')
      expect(getTimelineSegmentColor(1, 'paid')).toBe('bg-emerald-600')
      expect(getTimelineSegmentColor(2, 'paid')).toBe('bg-brand-hairsoft')
    })

    it('filters orders by query across ID, customer city, and item names', () => {
      const orders = [
        {
          id: 'ord-abc-111',
          status: 'paid',
          address: { city: 'Jakarta Selatan', name: 'John Doe' },
          items: [{ product: { name: 'Keyboard Wireless' } }],
        },
        {
          id: 'ord-xyz-222',
          status: 'pending',
          address: { city: 'Bandung', name: 'Jane Doe' },
          items: [{ product: { name: 'Kopi Arabika' } }],
        },
      ] as unknown as Order[]

      const filterByCity = filterOrdersByQuery(orders, 'Jakarta')
      expect(filterByCity.length).toBe(1)
      expect(filterByCity[0]?.id).toBe('ord-abc-111')

      const filterByItem = filterOrdersByQuery(orders, 'Kopi')
      expect(filterByItem.length).toBe(1)
      expect(filterByItem[0]?.id).toBe('ord-xyz-222')
    })

    it('generates tabs configuration with correct danger badge for pending orders', () => {
      const tabs = createOrderTabItems({
        all: 5,
        pending: 2,
        paid: 1,
        shipped: 1,
        completed: 1,
        cancelled: 0,
      })

      const pendingTab = tabs.find((t) => t.value === 'pending')
      expect(pendingTab?.count).toBe(2)
      expect(pendingTab?.countTone).toBe('danger')
    })
  })
})
