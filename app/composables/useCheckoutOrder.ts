import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useCartStore } from '~/features/cart/stores/cart'
import { useCartReconciliation } from '~/features/cart/composables/useCartReconciliation'
import { useOrderPaymentSync } from '~/composables/useOrderPaymentSync'
import { useAddresses } from '~/composables/useAddresses'
import { useLoyaltyPoints } from '~/composables/useLoyaltyPoints'
import {
  useCheckoutSummaryDisplay,
  createCheckoutPlacedSnapshot,
  type PlacedOrderSnapshot,
} from '~/composables/useCheckoutSummaryDisplay'
import type { UserAddress } from '~~/shared/schemas/address'
import { type ShippingService, calculateShippingFee } from '~~/shared/schemas/shipping'
import {
  calculateMaxUsableCoins,
  calculateCoinsDiscountCents,
  buildCheckoutOrderPayload,
  mapUserAddressToForm,
  buildAddressSavePayload,
  validateCheckoutAddress,
  resolveDefaultSavedAddress,
} from '~/utils/checkout-pricing'

export function useCheckoutOrder() {
  const { user, profile } = useAuth()
  const cartStore = useCartStore()
  const router = useRouter()
  const toast = useUiToast()
  const config = useRuntimeConfig()
  const { launchSnapPayment } = useOrderPaymentSync()
  const { saveAddress, fetchAddresses } = useAddresses()
  const { balanceCoins, fetchPointsSummary } = useLoyaltyPoints()
  const { reconcileCart, hasOutOfStockItems } = useCartReconciliation()

  const syncDefaultAddress = async () => {
    if (!user.value || selectedSavedAddressId.value) return
    try {
      const target = resolveDefaultSavedAddress(await fetchAddresses())
      if (target) handleSelectSavedAddress(target)
    } catch {
      // Abaikan kegagalan sinkronisasi alamat saat fetch awal
    }
  }

  onMounted(async () => {
    if (user.value) {
      fetchPointsSummary().catch(() => {})
      syncDefaultAddress()
    }
    await reconcileCart(true)
    if (hasOutOfStockItems.value) {
      toast.show({
        title: 'Barang Tidak Tersedia',
        message: 'Terdapat barang di keranjang yang telah habis. Keranjang Anda telah disesuaikan.',
        tone: 'error',
      })
      router.push('/cart')
    }
  })

  watch(
    () => user.value,
    () => syncDefaultAddress(),
  )

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

  const placedOrderSnapshot = ref<PlacedOrderSnapshot | null>(null)

  const summaryDisplay = useCheckoutSummaryDisplay({
    cartStore,
    actualCoinsUsed,
    coinsDiscountCents,
    shippingFeeCents,
    isFreeShipping,
    placedOrderSnapshot,
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
      const rnd = Math.random().toString(36).slice(2)
      checkoutIdempotencyKey.value =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `chk-${Date.now()}-${rnd}`
    }
    return checkoutIdempotencyKey.value
  }

  const monitoredDeps = [
    () => cartStore.items,
    () => cartStore.appliedCoupon,
    address,
    selectedShippingService,
    selectedCourierCode,
    useCoins,
  ]
  watch(
    monitoredDeps,
    () => {
      checkoutIdempotencyKey.value = ''
    },
    { deep: true },
  )

  const validateForm = () => {
    errors.value = validateCheckoutAddress(address.value)
    return Object.keys(errors.value).length === 0
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
    if (hasOutOfStockItems.value) {
      generalError.value =
        'Terdapat barang yang telah habis di keranjang Anda. Mohon sesuaikan kembali keranjang Anda.'
      router.push('/cart')
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

      placedOrderSnapshot.value = createCheckoutPlacedSnapshot({
        cartStore,
        actualCoinsUsed: actualCoinsUsed.value,
        coinsDiscountCents: coinsDiscountCents.value,
        shippingFeeCents: shippingFeeCents.value,
        isFreeShipping: isFreeShipping.value,
        shippingService: selectedShippingService.value,
      })
      isOrderPlaced.value = true
      checkoutIdempotencyKey.value = ''
      cartStore.clearCart()

      if (saveAddressForNextOrder.value && user.value) {
        saveAddress(buildAddressSavePayload(address.value)).catch(() => {})
      }

      const isMidtransEnabled = Boolean(
        config.public?.enableMidtransSandbox || config.public?.enableMidtrans,
      )

      if (isMidtransEnabled) {
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
    ...summaryDisplay,
    submitButtonLabel,
    handleSelectSavedAddress,
    handleCreateOrder,
  }
}
