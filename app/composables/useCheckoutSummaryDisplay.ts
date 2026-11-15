import { computed, type Ref, type ComputedRef } from 'vue'
import { formatRupiah } from '~/utils/format'
import { calculateCheckoutTotalCents, createPlacedOrderSnapshot } from '~/utils/checkout-pricing'
import type { CartItem, useCartStore } from '~/features/cart/stores/cart'

export type PlacedOrderSnapshot = ReturnType<typeof createPlacedOrderSnapshot<CartItem>>

export function createCheckoutPlacedSnapshot(params: {
  cartStore: ReturnType<typeof useCartStore>
  actualCoinsUsed: number
  coinsDiscountCents: number
  shippingFeeCents: number
  isFreeShipping: boolean
  shippingService: string
}): PlacedOrderSnapshot {
  const {
    cartStore,
    actualCoinsUsed,
    coinsDiscountCents,
    shippingFeeCents,
    isFreeShipping,
    shippingService,
  } = params

  return createPlacedOrderSnapshot({
    items: cartStore.items,
    totalItems: cartStore.totalItems,
    formattedTotalPrice: cartStore.formattedTotalPrice,
    discountCents: cartStore.discountCents,
    formattedDiscountAmount: cartStore.formattedDiscountAmount,
    couponCode: cartStore.appliedCoupon?.code,
    actualCoinsUsed,
    isFreeShipping,
    shippingFeeCents,
    shippingService,
    finalPriceCents: cartStore.finalPriceCents,
    coinsDiscountCents,
  })
}

interface CheckoutSummaryDeps {
  cartStore: ReturnType<typeof useCartStore>
  actualCoinsUsed: ComputedRef<number>
  coinsDiscountCents: ComputedRef<number>
  shippingFeeCents: ComputedRef<number>
  isFreeShipping: ComputedRef<boolean>
  placedOrderSnapshot: Ref<PlacedOrderSnapshot | null>
}

export function useCheckoutSummaryDisplay(deps: CheckoutSummaryDeps) {
  const {
    cartStore,
    actualCoinsUsed,
    coinsDiscountCents,
    shippingFeeCents,
    isFreeShipping,
    placedOrderSnapshot,
  } = deps

  const displayItems = computed(() => placedOrderSnapshot.value?.items ?? cartStore.items)
  const displayTotalItems = computed(
    () => placedOrderSnapshot.value?.totalItems ?? cartStore.totalItems,
  )
  const displayTotalPrice = computed(
    () => placedOrderSnapshot.value?.totalPriceFormatted ?? cartStore.formattedTotalPrice,
  )
  const displayDiscountAmount = computed(
    () =>
      placedOrderSnapshot.value?.discountFormatted ??
      (cartStore.discountCents > 0 ? cartStore.formattedDiscountAmount : null),
  )
  const displayCouponCode = computed(
    () => placedOrderSnapshot.value?.couponCode ?? cartStore.appliedCoupon?.code ?? null,
  )
  const displayCoinsDiscountAmount = computed(
    () =>
      placedOrderSnapshot.value?.coinsDiscountFormatted ??
      (actualCoinsUsed.value > 0 ? formatRupiah(actualCoinsUsed.value) : null),
  )
  const displayCoinsUsed = computed(
    () => placedOrderSnapshot.value?.coinsUsed ?? actualCoinsUsed.value,
  )
  const displayShippingFeeFormatted = computed(
    () =>
      placedOrderSnapshot.value?.shippingFeeFormatted ??
      (isFreeShipping.value ? 'Gratis Ongkir' : formatRupiah(shippingFeeCents.value / 100)),
  )
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

  return {
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
  }
}
