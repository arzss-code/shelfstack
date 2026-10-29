import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore, type AppliedCoupon } from '../../app/features/cart/stores/cart'
import { formatRupiah } from '../../app/utils/format'

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

  const sampleSuperDealCoupon: AppliedCoupon = {
    code: 'SUPERDEAL',
    name: 'Promo 20% Tanpa Pagu',
    discount_type: 'percentage',
    discount_value: 20,
    max_discount_cents: null,
    min_purchase_cents: 40000000, // Rp 400.000
    discount_cents: 0,
    formatted_discount: 'Diskon 20%',
  }

  const sampleZeroMinPurchaseCoupon: AppliedCoupon = {
    code: 'HEMAT10K',
    name: 'Potongan Rp 10.000 Tanpa Syarat',
    discount_type: 'fixed',
    discount_value: 1000000, // Rp 10.000
    max_discount_cents: null,
    min_purchase_cents: 0,
    discount_cents: 1000000,
    formatted_discount: 'Rp 10.000',
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

  it('mendukung pergantian voucher (switching coupon) secara mulus dan menghitung ulang diskon', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 1,
      name: 'Speaker Monitor Desktop',
      price: 600000,
      priceCents: 60000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    // 1. Terapkan voucher persentase 10% (max Rp 100.000)
    cart.applyCoupon(samplePercentageCoupon)
    expect(cart.appliedCoupon?.code).toBe('SHELF10')
    expect(cart.discountCents).toBe(6000000) // Rp 60.000
    expect(cart.finalPrice).toBe(540000)

    // 2. Ganti ke voucher potongan tetap Rp 50.000
    cart.applyCoupon(sampleFixedCoupon)
    expect(cart.appliedCoupon?.code).toBe('HEMAT50K')
    expect(cart.discountCents).toBe(5000000) // Rp 50.000
    expect(cart.finalPrice).toBe(550000)

    // 3. Ganti ke voucher 20% tanpa batas pagu
    cart.applyCoupon(sampleSuperDealCoupon)
    expect(cart.appliedCoupon?.code).toBe('SUPERDEAL')
    expect(cart.discountCents).toBe(12000000) // 20% dari 600.000 = Rp 120.000
    expect(cart.finalPrice).toBe(480000)
  })

  it('mengaktifkan diskon secara reaktif saat kuantitas item dinaikkan melampaui syarat minimum', () => {
    const cart = useCartStore()
    // Tambah 1 unit barang seharga Rp 150.000 (di bawah syarat min purchase SHELF10: Rp 200.000)
    cart.addItem({
      productId: 5,
      name: 'Stand Headphone Kayu',
      price: 150000,
      priceCents: 15000000,
      stock: 10,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(samplePercentageCoupon)
    expect(cart.isCouponValidForCurrentSubtotal).toBe(false)
    expect(cart.discountCents).toBe(0)
    expect(cart.finalPrice).toBe(150000)

    // Naikkan kuantitas menjadi 2 unit (subtotal menjadi Rp 300.000)
    cart.updateQuantity(5, 2)
    expect(cart.totalPrice).toBe(300000)
    expect(cart.isCouponValidForCurrentSubtotal).toBe(true)
    // 10% dari 300.000 = 30.000
    expect(cart.discountCents).toBe(3000000)
    expect(cart.finalPrice).toBe(270000)
  })

  it('menonaktifkan nilai diskon kembali saat kuantitas item diturunkan di bawah syarat minimum', () => {
    const cart = useCartStore()
    // Awal: 2 unit seharga Rp 200.000/unit (subtotal Rp 400.000, min purchase HEMAT50K: Rp 300.000)
    cart.addItem({
      productId: 6,
      name: 'Keyboard Wrist Rest',
      price: 200000,
      priceCents: 20000000,
      stock: 10,
      quantity: 2,
      openCartDrawer: false,
    })

    cart.applyCoupon(sampleFixedCoupon)
    expect(cart.isCouponValidForCurrentSubtotal).toBe(true)
    expect(cart.discountCents).toBe(5000000)
    expect(cart.finalPrice).toBe(350000)

    // Turunkan kuantitas menjadi 1 unit (subtotal Rp 200.000)
    cart.updateQuantity(6, 1)
    expect(cart.totalPrice).toBe(200000)
    expect(cart.appliedCoupon?.code).toBe('HEMAT50K') // Kupon tetap tercatat
    expect(cart.isCouponValidForCurrentSubtotal).toBe(false) // Namun tidak valid untuk subtotal saat ini
    expect(cart.discountCents).toBe(0)
    expect(cart.finalPrice).toBe(200000)
  })

  it('membatasi nilai diskon agar tidak melebihi subtotal jika kupon fixed lebih besar dari belanjaan', () => {
    const cart = useCartStore()
    // Belanja hanya Rp 30.000
    cart.addItem({
      productId: 7,
      name: 'Cable Clip Organizer',
      price: 30000,
      priceCents: 3000000,
      stock: 10,
      quantity: 1,
      openCartDrawer: false,
    })

    // Kupon diskon Rp 50.000 tanpa batas minimum belanja
    const hugeDiscountCoupon: AppliedCoupon = {
      code: 'PROMO50K',
      name: 'Diskon Rp 50.000',
      discount_type: 'fixed',
      discount_value: 5000000, // Rp 50.000
      max_discount_cents: null,
      min_purchase_cents: 0,
      discount_cents: 5000000,
      formatted_discount: 'Rp 50.000',
    }

    cart.applyCoupon(hugeDiscountCoupon)
    expect(cart.isCouponValidForCurrentSubtotal).toBe(true)
    // Diskon tidak boleh melebihi subtotal belanja (Rp 30.000)
    expect(cart.discountCents).toBe(3000000)
    expect(cart.discountAmount).toBe(30000)
    expect(cart.finalPriceCents).toBe(0)
    expect(cart.finalPrice).toBe(0)
  })

  it('selalu memperlakukan kupon dengan min_purchase_cents 0 sebagai valid pada belanjaan apapun', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 8,
      name: 'Sticker Pack ShelfStack',
      price: 25000,
      priceCents: 2500000,
      stock: 20,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(sampleZeroMinPurchaseCoupon)
    expect(cart.isCouponValidForCurrentSubtotal).toBe(true)
    expect(cart.discountCents).toBe(1000000) // Rp 10.000
    expect(cart.finalPrice).toBe(15000)
  })

  it('menghitung ulang diskon secara akurat saat item dihapus sebagian pada keranjang multi-item', () => {
    const cart = useCartStore()
    // Tambah Item 1: Rp 300.000
    cart.addItem({
      productId: 10,
      name: 'Monitor Riser Kayu',
      price: 300000,
      priceCents: 30000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    // Tambah Item 2: Rp 200.000
    cart.addItem({
      productId: 11,
      name: 'Lampu Monitor Bar',
      price: 200000,
      priceCents: 20000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    // Subtotal awal: Rp 500.000
    cart.applyCoupon(samplePercentageCoupon) // 10%
    expect(cart.discountCents).toBe(5000000) // Rp 50.000
    expect(cart.finalPrice).toBe(450000)

    // Hapus Item 2 (Rp 200.000)
    cart.removeItem(11)
    expect(cart.items.length).toBe(1)
    expect(cart.totalPrice).toBe(300000)
    // Diskon reaktif berkurang menjadi 10% dari Rp 300.000 = Rp 30.000
    expect(cart.discountCents).toBe(3000000)
    expect(cart.finalPrice).toBe(270000)
    expect(cart.isCouponValidForCurrentSubtotal).toBe(true)
  })

  it('menghasilkan formattedTotalPrice, formattedDiscountAmount, dan formattedFinalPrice yang valid', () => {
    const cart = useCartStore()
    cart.addItem({
      productId: 12,
      name: 'Desk Pad Kulit Asli',
      price: 400000,
      priceCents: 40000000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    cart.applyCoupon(samplePercentageCoupon) // 10% dari Rp 400.000 = Rp 40.000

    expect(cart.formattedTotalPrice).toBe(formatRupiah(400000))
    expect(cart.formattedDiscountAmount).toBe(formatRupiah(40000))
    expect(cart.formattedFinalPrice).toBe(formatRupiah(360000))
  })
})
