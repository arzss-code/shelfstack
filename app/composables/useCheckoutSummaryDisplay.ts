import { computed, type Ref, type ComputedRef } from 'vue'
import { formatRupiah } from '~/utils/format'
import { calculateCheckoutTotalCents, createPlacedOrderSnapshot } from '~/utils/checkout-pricing'
import type { CartItem, useCartStore } from '~/features/cart/stores/cart'

export type PlacedOrderSnapshot = ReturnType<typeof createPlacedOrderSnapshot<CartItem>>

export interface ServerOrderSummary {
  total_cents: number
  subtotal_cents?: number | null
  discount_cents?: number | null
  coupon_code?: string | null
  coins_used?: number | null
  coins_discount_cents?: number | null
  shipping_cost_cents?: number | null
  shipping_service?: string | null
}

export function createCheckoutPlacedSnapshot(params: {
  cartStore: ReturnType<typeof useCartStore>
  actualCoinsUsed: number
  coinsDiscountCents: number
  shippingFeeCents: number
  isFreeShipping: boolean
  shippingService: string
  serverSummary?: ServerOrderSummary | null
}): PlacedOrderSnapshot {
  const {
    cartStore,
    actualCoinsUsed,
    coinsDiscountCents,
    shippingFeeCents,
    isFreeShipping,
    shippingService,
    serverSummary,
  } = params

  const authSubtotal = serverSummary?.subtotal_cents ?? null
  const authDiscount = serverSummary?.discount_cents ?? null
  const authCoinsUsed = serverSummary?.coins_used ?? actualCoinsUsed
  const authCoinsDiscount = serverSummary?.coins_discount_cents ?? coinsDiscountCents
  const authShippingCost = serverSummary?.shipping_cost_cents ?? shippingFeeCents
  const authFreeShipping =
    serverSummary?.shipping_cost_cents !== undefined && serverSummary?.shipping_cost_cents !== null
      ? serverSummary.shipping_cost_cents === 0
      : isFreeShipping

  const snapshot = createPlacedOrderSnapshot({
    items: cartStore.items,
    totalItems: cartStore.totalItems,
    formattedTotalPrice:
      authSubtotal !== null ? formatRupiah(authSubtotal / 100) : cartStore.formattedTotalPrice,
    discountCents: authDiscount ?? cartStore.discountCents,
    formattedDiscountAmount:
      authDiscount !== null && authDiscount > 0
        ? formatRupiah(authDiscount / 100)
        : cartStore.formattedDiscountAmount,
    couponCode: serverSummary?.coupon_code ?? cartStore.appliedCoupon?.code,
    actualCoinsUsed: authCoinsUsed,
    isFreeShipping: authFreeShipping,
    shippingFeeCents: authShippingCost,
    shippingService: serverSummary?.shipping_service || shippingService,
    finalPriceCents: cartStore.finalPriceCents,
    coinsDiscountCents: authCoinsDiscount,
  })

  if (serverSummary && typeof serverSummary.total_cents === 'number') {
    return {
      ...snapshot,
      finalPriceFormatted: formatRupiah(serverSummary.total_cents / 100),
    }
  }

  return snapshot
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
