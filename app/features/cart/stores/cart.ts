import { defineStore } from 'pinia'
import { formatRupiah } from '~/utils/format'
import type { DiscountType } from '~~/shared/schemas/coupon'
import { calculateCouponDiscountCents, isCouponEligible } from '~~/shared/utils/coupon-math'

export interface CartItem {
  productId: number
  slug?: string | null
  name: string
  price: number
  priceCents: number
  imageUrl: string | null
  quantity: number
  stock: number
  color?: string
  material?: string
}

export interface AppliedCoupon {
  code: string
  name: string
  description?: string | null
  discount_type: DiscountType
  discount_value: number
  max_discount_cents?: number | null
  min_purchase_cents: number
  discount_cents: number
  formatted_discount: string
}

const STORAGE_KEY = 'shelfstack-cart'
const COUPON_STORAGE_KEY = 'shelfstack-applied-coupon'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const appliedCoupon = ref<AppliedCoupon | null>(null)
  const isDrawerOpen = ref(false)

  // Inisialisasi dari LocalStorage (Client-only)
  const initCart = () => {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            items.value = parsed
          }
        }
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e)
      }

      try {
        const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY)
        if (storedCoupon) {
          appliedCoupon.value = JSON.parse(storedCoupon)
        }
      } catch (e) {
        console.error('Failed to parse applied coupon from localStorage:', e)
      }
    }
  }

  // Simpan ke LocalStorage
  const saveCart = () => {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
      } catch (e) {
        console.error('Failed to save cart to localStorage:', e)
      }
    }
  }

  const saveCoupon = () => {
    if (import.meta.client) {
      try {
        if (appliedCoupon.value) {
          localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon.value))
        } else {
          localStorage.removeItem(COUPON_STORAGE_KEY)
        }
      } catch (e) {
        console.error('Failed to save coupon to localStorage:', e)
      }
    }
  }

  // Inisialisasi saat store dibuat di browser
  if (import.meta.client) {
    initCart()
  }

  // Getters
  const totalItems = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => total + item.price * item.quantity, 0)
  })

  const totalPriceCents = computed(() => {
    return items.value.reduce((total, item) => total + item.priceCents * item.quantity, 0)
  })

  const formattedTotalPrice = computed(() => {
    return formatRupiah(totalPrice.value)
  })

  const isEmpty = computed(() => items.value.length === 0)

  // Kalkulasi Diskon Voucher Dinamis
  const discountCents = computed(() => {
    return calculateCouponDiscountCents(appliedCoupon.value, totalPriceCents.value)
  })

  const discountAmount = computed(() => discountCents.value / 100)
  const formattedDiscountAmount = computed(() => formatRupiah(discountAmount.value))

  const finalPriceCents = computed(() => Math.max(0, totalPriceCents.value - discountCents.value))
  const finalPrice = computed(() => finalPriceCents.value / 100)
  const formattedFinalPrice = computed(() => formatRupiah(finalPrice.value))

  const isCouponValidForCurrentSubtotal = computed(() => {
    return isCouponEligible(appliedCoupon.value, totalPriceCents.value)
  })

  // Actions
  const openDrawer = () => {
    isDrawerOpen.value = true
  }

  const closeDrawer = () => {
    isDrawerOpen.value = false
  }

  const toggleDrawer = () => {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  const applyCoupon = (coupon: AppliedCoupon) => {
    appliedCoupon.value = coupon
    saveCoupon()
  }

  const removeCoupon = () => {
    appliedCoupon.value = null
    saveCoupon()
  }

  const addItem = (payload: {
    productId: number
    slug?: string | null
    name: string
    price: number
    priceCents?: number
    imageUrl?: string | null
    quantity?: number
    stock: number
    color?: string
    material?: string
    openCartDrawer?: boolean
  }) => {
    const qtyToAdd = payload.quantity ?? 1
    const priceCents = payload.priceCents ?? Math.round(payload.price * 100)

    const existingIndex = items.value.findIndex(
      (item) =>
        item.productId === payload.productId &&
        item.color === payload.color &&
        item.material === payload.material,
    )

    if (existingIndex > -1 && items.value[existingIndex]) {
      const existing = items.value[existingIndex]!
      const newQty = Math.min(existing.quantity + qtyToAdd, payload.stock)
      existing.quantity = newQty
      existing.stock = payload.stock
      if (payload.slug) existing.slug = payload.slug
    } else {
      items.value.push({
        productId: payload.productId,
        slug: payload.slug,
        name: payload.name,
        price: payload.price,
        priceCents,
        imageUrl: payload.imageUrl || null,
        quantity: Math.min(qtyToAdd, payload.stock),
        stock: payload.stock,
        color: payload.color,
        material: payload.material,
      })
    }

    saveCart()

    if (payload.openCartDrawer !== false) {
      openDrawer()
    }
  }

  const updateQuantity = (
    productId: number,
    quantity: number,
    color?: string,
    material?: string,
  ) => {
    const targetIndex = items.value.findIndex(
      (item) =>
        item.productId === productId &&
        (color === undefined || item.color === color) &&
        (material === undefined || item.material === material),
    )

    if (targetIndex === -1) return

    if (quantity <= 0) {
      items.value.splice(targetIndex, 1)
    } else {
      const item = items.value[targetIndex]
      if (item) {
        item.quantity = Math.min(quantity, item.stock)
      }
    }

    saveCart()
  }

  const removeItem = (productId: number, color?: string, material?: string) => {
    items.value = items.value.filter(
      (item) =>
        !(
          item.productId === productId &&
          (color === undefined || item.color === color) &&
          (material === undefined || item.material === material)
        ),
    )
    saveCart()
  }

  const clearCart = () => {
    items.value = []
    appliedCoupon.value = null
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(COUPON_STORAGE_KEY)
    }
  }

  return {
    items,
    appliedCoupon,
    isDrawerOpen,
    totalItems,
    totalPrice,
    totalPriceCents,
    formattedTotalPrice,
    discountCents,
    discountAmount,
    formattedDiscountAmount,
    finalPriceCents,
    finalPrice,
    formattedFinalPrice,
    isCouponValidForCurrentSubtotal,
    isEmpty,
    initCart,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    applyCoupon,
    removeCoupon,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  }
})
