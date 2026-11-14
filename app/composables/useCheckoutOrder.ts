import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useCartStore, type CartItem } from '~/features/cart/stores/cart'
import { checkoutAddressSchema } from '~~/shared/schemas/order'
import { formatRupiah } from '~/utils/format'
import { useOrderPaymentSync } from '~/composables/useOrderPaymentSync'
import { useAddresses } from '~/composables/useAddresses'
import { useLoyaltyPoints } from '~/composables/useLoyaltyPoints'
import type { UserAddress } from '~~/shared/schemas/address'
import { type ShippingService, calculateShippingFee } from '~~/shared/schemas/shipping'
import {
  calculateMaxUsableCoins,
  calculateCoinsDiscountCents,
  calculateCheckoutTotalCents,
  createPlacedOrderSnapshot,
  buildCheckoutOrderPayload,
  mapUserAddressToForm,
  buildAddressSavePayload,
} from '~/utils/checkout-pricing'

export function useCheckoutOrder() {
  const { user, profile } = useAuth()
  const cartStore = useCartStore()
  const router = useRouter()
  const toast = useUiToast()
  const config = useRuntimeConfig()
  const { launchSnapPayment } = useOrderPaymentSync()
  const { saveAddress } = useAddresses()
  const { balanceCoins, fetchPointsSummary } = useLoyaltyPoints()

  onMounted(() => {
    if (user.value) {
      fetchPointsSummary().catch(() => {})
    }
  })

  const address = ref({
    name: profile.value?.full_name || '',
    phone: '',
    street: '',
    city: '',
    postal: '',
    note: '',
  })

  watch(
    () => profile.value?.full_name,
    (name) => {
      if (name && !address.value.name) address.value.name = name
    },
  )

  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)
  const isOrderPlaced = ref(false)
  const createdOrderId = ref<string | null>(null)
  const generalError = ref('')
  const checkoutIdempotencyKey = ref<string>('')

  const selectedShippingService = ref<ShippingService>('reguler')
  const selectedCourierCode = ref<string | null>(null)
  const selectedSavedAddressId = ref<string | null>(null)
  const saveAddressForNextOrder = ref(false)

  // Manajemen pemakaian koin loyalitas di checkout
  const useCoins = ref(false)

  const maxUsableCoins = computed(() => {
    return calculateMaxUsableCoins(balanceCoins.value, cartStore.finalPriceCents)
  })

  const actualCoinsUsed = computed(() => (useCoins.value ? maxUsableCoins.value : 0))
  const coinsDiscountCents = computed(() => calculateCoinsDiscountCents(actualCoinsUsed.value))

  const shippingFeeCalculation = computed(() => {
    return calculateShippingFee(selectedShippingService.value, cartStore.totalPriceCents)
  })
  const shippingFeeCents = computed(() => shippingFeeCalculation.value.feeCents)
  const isFreeShipping = computed(() => shippingFeeCalculation.value.isFree)

  type PlacedOrderSnapshot = ReturnType<typeof createPlacedOrderSnapshot<CartItem>>
  const placedOrderSnapshot = ref<PlacedOrderSnapshot | null>(null)

  const displayItems = computed(() => placedOrderSnapshot.value?.items ?? cartStore.items)
  const displayTotalItems = computed(
    () => placedOrderSnapshot.value?.totalItems ?? cartStore.totalItems,
  )
  const displayTotalPrice = computed(
    () => placedOrderSnapshot.value?.totalPriceFormatted ?? cartStore.formattedTotalPrice,
  )
  const displayDiscountAmount = computed(() => {
    return (
      placedOrderSnapshot.value?.discountFormatted ??
      (cartStore.discountCents > 0 ? cartStore.formattedDiscountAmount : null)
    )
  })
  const displayCouponCode = computed(
    () => placedOrderSnapshot.value?.couponCode ?? cartStore.appliedCoupon?.code ?? null,
  )
  const displayCoinsDiscountAmount = computed(() => {
    return (
      placedOrderSnapshot.value?.coinsDiscountFormatted ??
      (actualCoinsUsed.value > 0 ? formatRupiah(actualCoinsUsed.value) : null)
    )
  })
  const displayCoinsUsed = computed(
    () => placedOrderSnapshot.value?.coinsUsed ?? actualCoinsUsed.value,
  )
  const displayShippingFeeFormatted = computed(() => {
    return (
      placedOrderSnapshot.value?.shippingFeeFormatted ??
      (isFreeShipping.value ? 'Gratis Ongkir' : formatRupiah(shippingFeeCents.value / 100))
    )
  })
  const displayIsFreeShipping = computed(
    () => placedOrderSnapshot.value?.isFreeShipping ?? isFreeShipping.value,
  )

  const displayFinalPrice = computed(() => {
    return (
      placedOrderSnapshot.value?.finalPriceFormatted ??
      formatRupiah(
        calculateCheckoutTotalCents(
          cartStore.finalPriceCents,
          coinsDiscountCents.value,
          shippingFeeCents.value,
        ) / 100,
      )
    )
  })

  const submitButtonLabel = computed(() => {
    if (isOrderPlaced.value) return 'Membuka Pembayaran...'
    if (isSubmitting.value) return 'Memproses Pesanan...'
    return 'Bayar Sekarang'
  })

  const handleSelectSavedAddress = (saved: UserAddress) => {
    selectedSavedAddressId.value = saved.id
    address.value = mapUserAddressToForm(saved)
    errors.value = {}
  }

  const getOrCreateCheckoutKey = () => {
    if (!checkoutIdempotencyKey.value) {
      checkoutIdempotencyKey.value =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `chk-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    return checkoutIdempotencyKey.value
  }

  watch(
    [
      () => cartStore.items,
      () => cartStore.appliedCoupon,
      address,
      selectedShippingService,
      selectedCourierCode,
      useCoins,
    ],
    () => {
      checkoutIdempotencyKey.value = ''
    },
    { deep: true },
  )

  const validateForm = () => {
    errors.value = {}
    const result = checkoutAddressSchema.safeParse(address.value)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      for (const [key, messages] of Object.entries(fieldErrors)) {
        if (messages?.[0]) errors.value[key] = messages[0]
      }
      return false
    }
    return true
  }

  const handleCreateOrder = async () => {
    if (isSubmitting.value || isOrderPlaced.value) return
    if (!user.value) {
      router.push('/auth/login?redirect=/checkout')
      return
    }
    if (cartStore.isEmpty) {
      generalError.value = 'Keranjang belanja Anda kosong. Silakan pilih produk terlebih dahulu.'
      return
    }
    if (!validateForm()) {
      generalError.value = 'Mohon periksa kembali kelengkapan formulir alamat pengiriman.'
      return
    }

    isSubmitting.value = true
    generalError.value = ''

    try {
      const orderPayload = buildCheckoutOrderPayload({
        items: cartStore.items,
        address: address.value,
        couponCode:
          cartStore.appliedCoupon && cartStore.isCouponValidForCurrentSubtotal
            ? cartStore.appliedCoupon.code
            : undefined,
        shippingService: selectedShippingService.value,
        courierCode: selectedCourierCode.value,
        coinsUsed: actualCoinsUsed.value,
      })

      const idempotencyKey = getOrCreateCheckoutKey()
      const response = await $fetch<{ status: string; data: { order_id: string } }>('/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: orderPayload,
      })

      const orderId = response.data.order_id
      createdOrderId.value = orderId

      placedOrderSnapshot.value = createPlacedOrderSnapshot({
        items: cartStore.items,
        totalItems: cartStore.totalItems,
        formattedTotalPrice: cartStore.formattedTotalPrice,
        discountCents: cartStore.discountCents,
        formattedDiscountAmount: cartStore.formattedDiscountAmount,
        couponCode: cartStore.appliedCoupon?.code,
        actualCoinsUsed: actualCoinsUsed.value,
        isFreeShipping: isFreeShipping.value,
        shippingFeeCents: shippingFeeCents.value,
        shippingService: selectedShippingService.value,
        finalPriceCents: cartStore.finalPriceCents,
        coinsDiscountCents: coinsDiscountCents.value,
      })
      isOrderPlaced.value = true
      checkoutIdempotencyKey.value = ''
      cartStore.clearCart()

      if (saveAddressForNextOrder.value && user.value) {
        saveAddress(buildAddressSavePayload(address.value)).catch(() => {})
      }

      if (config.public?.enableMidtrans) {
        const toOrder = () => router.push(`/orders/${orderId}`)
        await launchSnapPayment(orderId, {
          onSuccess: toOrder,
          onPending: toOrder,
          onError: toOrder,
          onClose: toOrder,
        })
        return
      }

      toast.add({
        severity: 'success',
        summary: 'Pesanan Dibuat',
        detail: 'Pesanan berhasil dibuat dengan status pending.',
        life: 4000,
      })
      router.push(`/orders/${orderId}`)
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      generalError.value =
        fetchErr.data?.message ||
        'Terjadi kesalahan saat memproses pesanan Anda. Silakan coba lagi.'
      isOrderPlaced.value = false
      placedOrderSnapshot.value = null
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    user,
    cartStore,
    address,
    errors,
    isSubmitting,
    isOrderPlaced,
    createdOrderId,
    generalError,
    selectedShippingService,
    selectedCourierCode,
    selectedSavedAddressId,
    saveAddressForNextOrder,
    useCoins,
    balanceCoins,
    maxUsableCoins,
    actualCoinsUsed,
    displayItems,
    displayTotalItems,
    displayTotalPrice,
    displayDiscountAmount,
    displayCouponCode,
    displayCoinsDiscountAmount,
    displayCoinsUsed,
    displayShippingFeeFormatted,
    displayIsFreeShipping,
    displayFinalPrice,
    submitButtonLabel,
    handleSelectSavedAddress,
    handleCreateOrder,
  }
}
