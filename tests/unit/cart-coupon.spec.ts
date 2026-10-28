import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore, type AppliedCoupon } from '../../app/features/cart/stores/cart'

describe('useCartStore - Promo Coupon Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  const samplePercentageCoupon: AppliedCoupon = {
    code: 'SHELF10',
    name: 'Diskon Spesial 10%',
    discount_type: 'percentage',
    discount_value: 10,
    max_discount_cents: 10000000, // Rp 100.000
    min_purchase_cents: 20000000, // Rp 200.000
    discount_cents: 3000000,
    formatted_discount: 'Rp 30.000',
  }

  const sampleFixedCoupon: AppliedCoupon = {
    code: 'HEMAT50K',
    name: 'Potongan Rp 50.000',
    discount_type: 'fixed',
    discount_value: 5000000, // Rp 50.000
    max_discount_cents: null,
    min_purchase_cents: 30000000, // Rp 300.000
    discount_cents: 5000000,
    formatted_discount: 'Rp 50.000',
  }

  it('menginisialisasi tanpa kupon aktif secara default', () => {
    const cart = useCartStore()
    expect(cart.appliedCoupon).toBeNull()
    expect(cart.discountCents).toBe(0)
    expect(cart.discountAmount).toBe(0)
    expect(cart.finalPrice).toBe(cart.totalPrice)
    expect(cart.isCouponValidForCurrentSubtotal).toBe(false)
  })

  it('menerapkan kupon persentase dan menghitung diskon serta total akhir secara dinamis', () => {
    const cart = useCartStore()
    // Tambah produk seharga Rp 500.000
    cart.addItem({
      productId: 1,
      name: 'Meja Kerja Minimalis',
      price: 500000,
      priceCents: 50000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(samplePercentageCoupon)

    expect(cart.appliedCoupon?.code).toBe('SHELF10')
    // 10% dari Rp 500.000 = Rp 50.000 (5.000.000 cents)
    expect(cart.discountCents).toBe(5000000)
    expect(cart.discountAmount).toBe(50000)
    expect(cart.finalPriceCents).toBe(45000000)
    expect(cart.finalPrice).toBe(450000)
    expect(cart.isCouponValidForCurrentSubtotal).toBe(true)
  })

  it('membatasi diskon persentase pada pagu max_discount_cents', () => {
    const cart = useCartStore()
    // Tambah produk seharga Rp 2.000.000 (10% = Rp 200.000, tapi max discount Rp 100.000)
    cart.addItem({
      productId: 2,
      name: 'Kursi Ergonomis',
      price: 2000000,
      priceCents: 200000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(samplePercentageCoupon)

    expect(cart.discountCents).toBe(10000000) // Rp 100.000
    expect(cart.discountAmount).toBe(100000)
    expect(cart.finalPrice).toBe(1900000)
  })

  it('menerapkan kupon potongan nominal tetap (fixed)', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 3,
      name: 'Lampu Meja LED',
      price: 400000,
      priceCents: 40000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(sampleFixedCoupon)

    expect(cart.discountCents).toBe(5000000) // Rp 50.000
    expect(cart.finalPrice).toBe(350000) // Rp 350.000
    expect(cart.isCouponValidForCurrentSubtotal).toBe(true)
  })

  it('menonaktifkan nilai diskon jika subtotal belanja di bawah syarat minimum pembelian', () => {
    const cart = useCartStore()
    // Tambah produk hanya seharga Rp 100.000 (syarat kupon SHELF10 min Rp 200.000)
    cart.addItem({
      productId: 4,
      name: 'Mousepad Kulit',
      price: 100000,
      priceCents: 10000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(samplePercentageCoupon)

    expect(cart.isCouponValidForCurrentSubtotal).toBe(false)
    expect(cart.discountCents).toBe(0)
    expect(cart.finalPrice).toBe(100000)
  })

  it('dapat mencabut kupon yang sedang aktif (removeCoupon)', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Produk Demo',
      price: 300000,
      priceCents: 30000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(sampleFixedCoupon)
    expect(cart.appliedCoupon).not.toBeNull()

    cart.removeCoupon()
    expect(cart.appliedCoupon).toBeNull()
    expect(cart.discountCents).toBe(0)
    expect(cart.finalPrice).toBe(300000)
  })

  it('mengosongkan kupon saat clearCart dipanggil', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Produk Demo',
      price: 350000,
      priceCents: 35000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(sampleFixedCoupon)
    cart.clearCart()

    expect(cart.items.length).toBe(0)
    expect(cart.appliedCoupon).toBeNull()
    expect(cart.discountCents).toBe(0)
  })
})
