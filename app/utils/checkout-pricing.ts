import { formatRupiah } from '~/utils/format'

export interface CheckoutPricingInput {
  finalPriceCents: number
  balanceCoins: number
  useCoins: boolean
  shippingFeeCents: number
}

/**
 * Menghitung batasan maksimal pemakaian koin loyalitas (maksimal 50% dari total belanja).
 */
export function calculateMaxUsableCoins(balanceCoins: number, finalPriceCents: number): number {
  if (balanceCoins <= 0) return 0
  const maxAllowed = Math.floor((finalPriceCents * 0.5) / 100)
  return Math.max(0, Math.min(balanceCoins, maxAllowed))
}

/**
 * Menghitung diskon koin dalam satuan sen (1 koin = 100 sen).
 */
export function calculateCoinsDiscountCents(actualCoinsUsed: number): number {
  return actualCoinsUsed * 100
}

/**
 * Menghitung total akhir pembayaran pesanan setelah diskon koin dan biaya pengiriman.
 */
export function calculateCheckoutTotalCents(
  finalPriceCents: number,
  coinsDiscountCents: number,
  shippingFeeCents: number,
): number {
  return Math.max(0, finalPriceCents - coinsDiscountCents + shippingFeeCents)
}

export interface PlacedOrderSnapshotInput<T = unknown> {
  items: T[]
  totalItems: number
  formattedTotalPrice: string
  discountCents: number
  formattedDiscountAmount?: string | null
  couponCode?: string | null
  actualCoinsUsed: number
  isFreeShipping: boolean
  shippingFeeCents: number
  shippingService: string
  finalPriceCents: number
  coinsDiscountCents: number
}

export function createPlacedOrderSnapshot<T = unknown>(input: PlacedOrderSnapshotInput<T>) {
  const totalWithShipping = calculateCheckoutTotalCents(
    input.finalPriceCents,
    input.coinsDiscountCents,
    input.shippingFeeCents,
  )

  return {
    items: [...input.items],
    totalItems: input.totalItems,
    totalPriceFormatted: input.formattedTotalPrice,
    discountFormatted: input.discountCents > 0 ? input.formattedDiscountAmount : null,
    couponCode: input.couponCode || null,
    coinsDiscountFormatted: input.actualCoinsUsed > 0 ? formatRupiah(input.actualCoinsUsed) : null,
    coinsUsed: input.actualCoinsUsed,
    shippingFeeFormatted: input.isFreeShipping
      ? 'Gratis Ongkir'
      : formatRupiah(input.shippingFeeCents / 100),
    shippingService: input.shippingService,
    isFreeShipping: input.isFreeShipping,
    finalPriceFormatted: formatRupiah(totalWithShipping / 100),
  }
}

export interface BuildCheckoutOrderPayloadInput {
  items: Array<{ productId: number; quantity: number }>
  address: {
    name: string
    phone: string
    street: string
    city: string
    postal: string
    note?: string
  }
  couponCode?: string
  shippingService: string
  courierCode?: string | null
  coinsUsed: number
}

/**
 * Membangun payload pesanan checkout yang bersih dan tervalidasi.
 */
export function buildCheckoutOrderPayload(input: BuildCheckoutOrderPayloadInput) {
  return {
    items: input.items.map((item) => ({ product_id: item.productId, qty: item.quantity })),
    address: {
      name: input.address.name.trim(),
      phone: input.address.phone.trim(),
      street: input.address.street.trim(),
      city: input.address.city.trim(),
      postal: input.address.postal.trim(),
      note: input.address.note ? input.address.note.trim() : undefined,
    },
    coupon_code: input.couponCode || undefined,
    shipping_service: input.shippingService,
    courier_code: input.courierCode || undefined,
    coins_used: input.coinsUsed,
  }
}
