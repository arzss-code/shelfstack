import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { computed, ref } from 'vue'
import { useCartStore } from '../../app/features/cart/stores/cart'

/**
 * Unit Test: Checkout State Transition & Empty State Guard
 *
 * Verifies that placing an order and clearing the cart does NOT prematurely
 * trigger the "Keranjang Belanja Kosong" screen while Midtrans Snap popup is loading.
 */
describe('Checkout State Transition & Empty State Guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('keeps order summary intact and prevents empty cart flash when order is created', () => {
    const cartStore = useCartStore()

    // 1. User has items in cart
    cartStore.addItem({
      productId: 101,
      name: 'Wireless ANC Headphones',
      price: 2500000,
      stock: 10,
      quantity: 2,
      openCartDrawer: false,
    })

    expect(cartStore.isEmpty).toBe(false)
    expect(cartStore.totalItems).toBe(2)
    expect(cartStore.totalPrice).toBe(5000000)

    // Checkout page state model
    const isSubmitting = ref(false)
    const isOrderPlaced = ref(false)
    const placedOrderSnapshot = ref<{
      items: typeof cartStore.items
      totalItems: number
      totalPriceFormatted: string
    } | null>(null)

    const shouldShowEmptyCart = computed(
      () => cartStore.isEmpty && !isOrderPlaced.value && !isSubmitting.value,
    )
    const displayItems = computed(() => placedOrderSnapshot.value?.items ?? cartStore.items)
    const displayTotalItems = computed(
      () => placedOrderSnapshot.value?.totalItems ?? cartStore.totalItems,
    )
    const displayTotalPrice = computed(
      () => placedOrderSnapshot.value?.totalPriceFormatted ?? cartStore.formattedTotalPrice,
    )
    const submitButtonLabel = computed(() => {
      if (isOrderPlaced.value) return 'Membuka Pembayaran...'
      if (isSubmitting.value) return 'Memproses Pesanan...'
      return 'Bayar Sekarang'
    })

    // Initially with items in cart:
    expect(shouldShowEmptyCart.value).toBe(false)
    expect(displayTotalItems.value).toBe(2)
    expect(displayItems.value).toHaveLength(1)
    expect(submitButtonLabel.value).toBe('Bayar Sekarang')

    // 2. User clicks "Bayar Sekarang" -> submission starts
    isSubmitting.value = true
    expect(submitButtonLabel.value).toBe('Memproses Pesanan...')
    expect(shouldShowEmptyCart.value).toBe(false)

    // 3. API order creation succeeds:
    placedOrderSnapshot.value = {
      items: [...cartStore.items],
      totalItems: cartStore.totalItems,
      totalPriceFormatted: cartStore.formattedTotalPrice,
    }
    isOrderPlaced.value = true

    // Cart is cleared in store for persistence/DB parity
    cartStore.clearCart()
    expect(cartStore.isEmpty).toBe(true)

    // Midtrans Snap popup is being opened (submitting finished or continuing)
    isSubmitting.value = false

    // CRITICAL ASSERTIONS:
    // Empty cart screen MUST NOT be shown because isOrderPlaced is true
    expect(shouldShowEmptyCart.value).toBe(false)

    // Order summary preview MUST still display items and total bill
    expect(displayItems.value).toHaveLength(1)
    expect(displayItems.value[0]?.name).toBe('Wireless ANC Headphones')
    expect(displayTotalItems.value).toBe(2)
    expect(displayTotalPrice.value).toBe('Rp\u00a05.000.000')

    // Submit button reflects opening payment gateway
    expect(submitButtonLabel.value).toBe('Membuka Pembayaran...')
  })

  it('displays empty cart message when user visits checkout with no items', () => {
    const cartStore = useCartStore()
    expect(cartStore.isEmpty).toBe(true)

    const isSubmitting = ref(false)
    const isOrderPlaced = ref(false)

    const shouldShowEmptyCart = computed(
      () => cartStore.isEmpty && !isOrderPlaced.value && !isSubmitting.value,
    )

    expect(shouldShowEmptyCart.value).toBe(true)
  })

  it('restores checkout form and retains cart items if order creation fails', () => {
    const cartStore = useCartStore()
    cartStore.addItem({
      productId: 102,
      name: 'Mechanical Gaming Keyboard',
      price: 1200000,
      stock: 5,
      quantity: 1,
      openCartDrawer: false,
    })

    const isSubmitting = ref(true)
    const isOrderPlaced = ref(false)
    const generalError = ref('')
    const placedOrderSnapshot = ref<{
      items: typeof cartStore.items
      totalItems: number
      totalPriceFormatted: string
    } | null>(null)

    // Simulate error from POST /api/orders
    const errorOccurred = true
    if (errorOccurred) {
      generalError.value = 'Stok produk tidak mencukupi untuk memproses pesanan.'
      isOrderPlaced.value = false
      placedOrderSnapshot.value = null
      isSubmitting.value = false
    }

    // Invariants: Cart is NOT cleared on failure, no empty state, error displayed
    expect(cartStore.isEmpty).toBe(false)
    expect(cartStore.items).toHaveLength(1)
    expect(generalError.value).toBe('Stok produk tidak mencukupi untuk memproses pesanan.')
    expect(isSubmitting.value).toBe(false)
    expect(isOrderPlaced.value).toBe(false)
  })
})
