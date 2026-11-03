import { ref, computed, watch, onMounted } from 'vue'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useCartStore } from '~/features/cart/stores/cart'
import { checkoutAddressSchema } from '~~/shared/schemas/order'
import { formatRupiah } from '~/utils/format'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import { useAddresses } from '~/composables/useAddresses'
import { useLoyaltyPoints } from '~/composables/useLoyaltyPoints'
import type { UserAddress } from '~~/shared/schemas/address'
import { type ShippingService, calculateShippingFee } from '~~/shared/schemas/shipping'

export function useCheckoutOrder() {
  const { user, profile } = useAuth()
  const cartStore = useCartStore()
  const router = useRouter()
  const toast = useUiToast()
  const config = useRuntimeConfig()
  const { pay: openSnapModal } = useMidtransSnap()
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
      if (name && !address.value.name) {
        address.value.name = name
      }
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
    if (balanceCoins.value <= 0) return 0
    // Maksimal 50% dari subtotal setelah kupon diskon (1 koin = Rp 1 = 100 sen)
    const maxAllowed = Math.floor((cartStore.finalPriceCents * 0.5) / 100)
    return Math.max(0, Math.min(balanceCoins.value, maxAllowed))
  })

  const actualCoinsUsed = computed(() => {
    return useCoins.value ? maxUsableCoins.value : 0
  })

  const coinsDiscountCents = computed(() => actualCoinsUsed.value * 100)

  const shippingFeeCalculation = computed(() => {
    return calculateShippingFee(selectedShippingService.value, cartStore.totalPriceCents)
  })
  const shippingFeeCents = computed(() => shippingFeeCalculation.value.feeCents)
  const isFreeShipping = computed(() => shippingFeeCalculation.value.isFree)

  const placedOrderSnapshot = ref<{
    items: typeof cartStore.items
    totalItems: number
    totalPriceFormatted: string
    discountFormatted?: string | null
    couponCode?: string | null
    coinsDiscountFormatted?: string | null
    coinsUsed?: number
    shippingFeeFormatted?: string
    shippingService?: string
    isFreeShipping?: boolean
    finalPriceFormatted?: string
  } | null>(null)

  const displayItems = computed(() => placedOrderSnapshot.value?.items ?? cartStore.items)
  const displayTotalItems = computed(
    () => placedOrderSnapshot.value?.totalItems ?? cartStore.totalItems,
  )
  const displayTotalPrice = computed(
    () => placedOrderSnapshot.value?.totalPriceFormatted ?? cartStore.formattedTotalPrice,
  )
  const displayDiscountAmount = computed(() => {
    if (placedOrderSnapshot.value) {
      return placedOrderSnapshot.value.discountFormatted
    }
    return cartStore.discountCents > 0 ? cartStore.formattedDiscountAmount : null
  })
  const displayCouponCode = computed(() => {
    if (placedOrderSnapshot.value) {
      return placedOrderSnapshot.value.couponCode
    }
    return cartStore.appliedCoupon?.code || null
  })
  const displayCoinsDiscountAmount = computed(() => {
    if (placedOrderSnapshot.value) {
      return placedOrderSnapshot.value.coinsDiscountFormatted
    }
    return actualCoinsUsed.value > 0 ? formatRupiah(actualCoinsUsed.value) : null
  })
  const displayCoinsUsed = computed(() => {
    if (placedOrderSnapshot.value?.coinsUsed != null) {
      return placedOrderSnapshot.value.coinsUsed
    }
    return actualCoinsUsed.value
  })
  const displayShippingFeeFormatted = computed(() => {
    if (placedOrderSnapshot.value?.shippingFeeFormatted) {
      return placedOrderSnapshot.value.shippingFeeFormatted
    }
    return isFreeShipping.value ? 'Gratis Ongkir' : formatRupiah(shippingFeeCents.value / 100)
  })
  const displayIsFreeShipping = computed(() => {
    if (placedOrderSnapshot.value) {
      return placedOrderSnapshot.value.isFreeShipping ?? isFreeShipping.value
    }
    return isFreeShipping.value
  })

  const displayFinalPrice = computed(() => {
    if (placedOrderSnapshot.value?.finalPriceFormatted) {
      return placedOrderSnapshot.value.finalPriceFormatted
    }
    const totalWithShipping = Math.max(
      0,
      cartStore.finalPriceCents - coinsDiscountCents.value + shippingFeeCents.value,
    )
    return formatRupiah(totalWithShipping / 100)
  })

  const submitButtonLabel = computed(() => {
    if (isOrderPlaced.value) {
      return 'Membuka Pembayaran...'
    }
    if (isSubmitting.value) {
      return 'Memproses Pesanan...'
    }
    return 'Bayar Sekarang'
  })

  const handleSelectSavedAddress = (saved: UserAddress) => {
    selectedSavedAddressId.value = saved.id
    address.value.name = saved.name
    address.value.phone = saved.phone
    address.value.street = saved.street
    address.value.city = saved.city
    address.value.postal = saved.postal
    address.value.note = saved.note || ''
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
    [() => cartStore.items, address, selectedShippingService, selectedCourierCode, useCoins],
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
        if (messages && messages.length > 0 && messages[0]) {
          errors.value[key] = messages[0]
        }
      }
      return false
    }
    return true
  }

  const handleCreateOrder = async () => {
    if (isSubmitting.value || isOrderPlaced.value) {
      return
    }

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
      const orderPayload = {
        items: cartStore.items.map((item) => ({
          product_id: item.productId,
          qty: item.quantity,
        })),
        address: {
          name: address.value.name.trim(),
          phone: address.value.phone.trim(),
          street: address.value.street.trim(),
          city: address.value.city.trim(),
          postal: address.value.postal.trim(),
          note: address.value.note ? address.value.note.trim() : undefined,
        },
        coupon_code:
          cartStore.appliedCoupon && cartStore.isCouponValidForCurrentSubtotal
            ? cartStore.appliedCoupon.code
            : undefined,
        shipping_service: selectedShippingService.value,
        courier_code: selectedCourierCode.value || undefined,
        coins_used: actualCoinsUsed.value,
      }

      const idempotencyKey = getOrCreateCheckoutKey()

      const response = await $fetch<{ status: string; data: { order_id: string } }>('/api/orders', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: orderPayload,
      })

      const orderId = response.data.order_id
      createdOrderId.value = orderId

      placedOrderSnapshot.value = {
        items: [...cartStore.items],
        totalItems: cartStore.totalItems,
        totalPriceFormatted: cartStore.formattedTotalPrice,
        discountFormatted: cartStore.discountCents > 0 ? cartStore.formattedDiscountAmount : null,
        couponCode: cartStore.appliedCoupon?.code || null,
        coinsDiscountFormatted:
          actualCoinsUsed.value > 0 ? formatRupiah(actualCoinsUsed.value) : null,
        coinsUsed: actualCoinsUsed.value,
        shippingFeeFormatted: isFreeShipping.value
          ? 'Gratis Ongkir'
          : formatRupiah(shippingFeeCents.value / 100),
        shippingService: selectedShippingService.value,
        isFreeShipping: isFreeShipping.value,
        finalPriceFormatted: formatRupiah(
          Math.max(
            0,
            cartStore.finalPriceCents - coinsDiscountCents.value + shippingFeeCents.value,
          ) / 100,
        ),
      }
      isOrderPlaced.value = true
      checkoutIdempotencyKey.value = ''
      cartStore.clearCart()

      if (saveAddressForNextOrder.value && user.value) {
        try {
          await saveAddress({
            name: address.value.name.trim(),
            phone: address.value.phone.trim(),
            street: address.value.street.trim(),
            city: address.value.city.trim(),
            postal: address.value.postal.trim(),
            note: address.value.note ? address.value.note.trim() : undefined,
            is_default: false,
          })
        } catch {
          // Gagal menyimpan alamat sekunder tidak membatalkan checkout
        }
      }

      if (config.public?.enableMidtrans) {
        try {
          const paymentRes = await $fetch<{
            status: string
            data: { snap_token: string; redirect_url: string }
          }>(`/api/orders/${orderId}/pay`, {
            method: 'POST',
          })

          const snapToken = paymentRes.data.snap_token

          openSnapModal(snapToken, {
            onSuccess: () => {
              toast.add({
                severity: 'success',
                summary: 'Pembayaran Berhasil',
                detail: 'Terima kasih, pembayaran Anda telah berhasil diverifikasi!',
                life: 5000,
              })
              router.push(`/orders/${orderId}`)
            },
            onPending: () => {
              toast.add({
                severity: 'info',
                summary: 'Menunggu Pembayaran',
                detail: 'Silakan selesaikan pembayaran sesuai petunjuk metode yang dipilih.',
                life: 5000,
              })
              router.push(`/orders/${orderId}`)
            },
            onError: () => {
              toast.add({
                severity: 'error',
                summary: 'Pembayaran Gagal',
                detail: 'Transaksi pembayaran gagal diproses. Anda dapat mencobanya kembali.',
                life: 5000,
              })
              router.push(`/orders/${orderId}`)
            },
            onClose: () => {
              router.push(`/orders/${orderId}`)
            },
          })
          return
        } catch (payErr: unknown) {
          const fetchErr = payErr as { data?: { message?: string } }
          const errorMsg =
            fetchErr.data?.message ||
            'Gagal memuat sesi Snap Midtrans. Mengalihkan ke detail pesanan...'
          toast.add({
            severity: 'warn',
            summary: 'Perhatian Pembayaran',
            detail: errorMsg,
            life: 5000,
          })
          router.push(`/orders/${orderId}`)
          return
        }
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
