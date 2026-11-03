import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore, type AppliedCoupon } from '../../app/features/cart/stores/cart'

describe('Checkout Voucher Lifecycle & Transactional Invariants', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('Cart Coupon Calculations During Checkout Preparation', () => {
    it('menghitung diskon persentase dengan pembatasan diskon maksimum (max_discount_cents)', () => {
      const cart = useCartStore()
      // Subtotal: 2 x Rp 1.000.000 = Rp 2.000.000 (200.000.000 cents)
      cart.addItem({
        productId: 101,
        name: 'Lemari Premium Kayu Jati',
        price: 1000000,
        priceCents: 100000000,
        stock: 5,
        quantity: 2,
        openCartDrawer: false,
      })

      // Kupon 10% diskon, batas maksimal diskon Rp 150.000 (15.000.000 cents)
      const sampleCoupon: AppliedCoupon = {
        code: 'MEGABIG10',
        name: 'Diskon Mega 10%',
        discount_type: 'percentage',
        discount_value: 10,
        max_discount_cents: 15000000,
        min_purchase_cents: 100000000,
        discount_cents: 15000000,
        formatted_discount: 'Rp 150.000',
      }
      cart.applyCoupon(sampleCoupon)

      expect(cart.totalPriceCents).toBe(200000000)
      expect(cart.discountCents).toBe(15000000)
      expect(cart.finalPriceCents).toBe(185000000)
    })

    it('otomatis menyesuaikan nilai diskon saat kuantitas item keranjang berubah', () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 101,
        name: 'Kursi Kerja Ergonomis',
        price: 500000,
        priceCents: 50000000,
        stock: 10,
        quantity: 1,
        openCartDrawer: false,
      })

      // Kupon 10% tanpa batas maksimal diskon
      const sampleCoupon: AppliedCoupon = {
        code: 'DISKON10',
        name: 'Diskon 10%',
        discount_type: 'percentage',
        discount_value: 10,
        max_discount_cents: null,
        min_purchase_cents: 20000000,
        discount_cents: 5000000,
        formatted_discount: 'Rp 50.000',
      }
      cart.applyCoupon(sampleCoupon)

      expect(cart.discountCents).toBe(5000000) // 10% dari 500.000 = 50.000

      // Tambah quantity jadi 3 (Subtotal Rp 1.500.000)
      cart.updateQuantity(101, 3)
      expect(cart.totalPriceCents).toBe(150000000)
      expect(cart.discountCents).toBe(15000000) // 10% dari 1.500.000 = 150.000
      expect(cart.finalPriceCents).toBe(135000000)
    })

    it('membatalkan nilai diskon jika subtotal turun di bawah batas minimal belanja', () => {
      const cart = useCartStore()
      cart.addItem({
        productId: 101,
        name: 'Produk A',
        price: 250000,
        priceCents: 25000000,
        stock: 10,
        quantity: 2, // Subtotal Rp 500.000
        openCartDrawer: false,
      })

      const sampleCoupon: AppliedCoupon = {
        code: 'MIN500K',
        name: 'Diskon Khusus Min 500k',
        discount_type: 'fixed',
        discount_value: 5000000, // Rp 50.000
        max_discount_cents: null,
        min_purchase_cents: 50000000, // Min Rp 500.000
        discount_cents: 5000000,
        formatted_discount: 'Rp 50.000',
      }
      cart.applyCoupon(sampleCoupon)

      expect(cart.isCouponValidForCurrentSubtotal).toBe(true)
      expect(cart.discountCents).toBe(5000000)

      // Kurangi quantity jadi 1 (Subtotal Rp 250.000 < Rp 500.000)
      cart.updateQuantity(101, 1)
      expect(cart.totalPriceCents).toBe(25000000)
      expect(cart.isCouponValidForCurrentSubtotal).toBe(false)
      expect(cart.discountCents).toBe(0)
      expect(cart.finalPriceCents).toBe(25000000)
    })
  })

  describe('PostgreSQL RPC Order Voucher Transition Logic Simulation', () => {
    interface UserCouponRecord {
      id: string
      user_id: string
      coupon_id: string
      code: string
      status: 'claimed' | 'used' | 'expired'
      claimed_at: string
      used_at: string | null
      order_id: string | null
    }

    interface OrderRecord {
      id: string
      user_id: string
      status: 'pending' | 'paid' | 'cancelled'
      coupon_code: string | null
    }

    // Simulasi transaksional RPC create_order
    function simulateCreateOrder(
      orderId: string,
      userId: string,
      couponCode: string | null,
      coupons: UserCouponRecord[],
    ): { order: OrderRecord; updatedCoupon: UserCouponRecord | null } {
      const order: OrderRecord = {
        id: orderId,
        user_id: userId,
        status: 'pending',
        coupon_code: couponCode,
      }

      let updatedCoupon: UserCouponRecord | null = null
      if (couponCode) {
        const found = coupons.find(
          (c) => c.user_id === userId && c.code.toUpperCase() === couponCode.toUpperCase(),
        )
        if (found) {
          found.status = 'used'
          found.used_at = new Date().toISOString()
          found.order_id = orderId
          updatedCoupon = { ...found }
        }
      }

      return { order, updatedCoupon }
    }

    // Simulasi transaksional RPC cancel_order
    function simulateCancelOrder(
      order: OrderRecord,
      coupons: UserCouponRecord[],
    ): { cancelledOrder: OrderRecord; restoredCoupon: UserCouponRecord | null } {
      order.status = 'cancelled'

      let restoredCoupon: UserCouponRecord | null = null
      if (order.coupon_code) {
        const found = coupons.find((c) => c.user_id === order.user_id && c.order_id === order.id)
        if (found) {
          found.status = 'claimed'
          found.used_at = null
          found.order_id = null
          restoredCoupon = { ...found }
        }
      }

      return { cancelledOrder: order, restoredCoupon }
    }

    it('mengubah status voucher menjadi used dan mengikat order_id saat pesanan dibuat', () => {
      const walletCoupons: UserCouponRecord[] = [
        {
          id: 'uc-1',
          user_id: 'user-123',
          coupon_id: 'c-1',
          code: 'HEMAT10',
          status: 'claimed',
          claimed_at: '2026-11-01T10:00:00Z',
          used_at: null,
          order_id: null,
        },
      ]

      const { order, updatedCoupon } = simulateCreateOrder(
        'order-999',
        'user-123',
        'HEMAT10',
        walletCoupons,
      )

      expect(order.status).toBe('pending')
      expect(order.coupon_code).toBe('HEMAT10')
      expect(updatedCoupon).not.toBeNull()
      expect(updatedCoupon?.status).toBe('used')
      expect(updatedCoupon?.order_id).toBe('order-999')
      expect(updatedCoupon?.used_at).not.toBeNull()
    })

    it('memulihkan status voucher menjadi claimed dan melepaskan order_id saat pesanan dibatalkan', () => {
      const walletCoupons: UserCouponRecord[] = [
        {
          id: 'uc-1',
          user_id: 'user-123',
          coupon_id: 'c-1',
          code: 'HEMAT10',
          status: 'claimed',
          claimed_at: '2026-11-01T10:00:00Z',
          used_at: null,
          order_id: null,
        },
      ]

      // 1. Create order
      const { order } = simulateCreateOrder('order-999', 'user-123', 'HEMAT10', walletCoupons)
      expect(walletCoupons[0].status).toBe('used')
      expect(walletCoupons[0].order_id).toBe('order-999')

      // 2. Cancel order
      const { cancelledOrder, restoredCoupon } = simulateCancelOrder(order, walletCoupons)
      expect(cancelledOrder.status).toBe('cancelled')
      expect(restoredCoupon).not.toBeNull()
      expect(restoredCoupon?.status).toBe('claimed')
      expect(restoredCoupon?.used_at).toBeNull()
      expect(restoredCoupon?.order_id).toBeNull()
    })
  })
})
