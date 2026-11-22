import type { Product, ProductVariant } from '~/types/product'
import { getProductVariants } from '~/utils/product-specs'

export interface ProductSelectionPayload {
  quantity: number
  color: string
  material: string
  variantId?: string | null
  variantName?: string | null
  sku?: string | null
  price?: number
}

export function useProductConfigurator(
  getProduct: () => Product,
  callbacks: {
    onAddToBag: (payload: ProductSelectionPayload) => void
    onBuyNow: (payload: ProductSelectionPayload) => void
  },
  options?: {
    promoPrice?: () => number | null | undefined
  },
) {
  const variants = computed(() => {
    const p = getProduct()
    const fallback = getProductVariants(p)
    if (!p.variants || p.variants.length === 0) {
      return fallback
    }

    const colorMap = new Map<string, { name: string; class: string }>()
    for (const v of p.variants) {
      if (!v.is_active || v.deleted_at) continue
      const colorName = (v.attributes as Record<string, string>)?.color || v.name
      if (colorName && !colorMap.has(colorName)) {
        colorMap.set(colorName, {
          name: colorName,
          class: (v.attributes as Record<string, string>)?.colorClass || 'bg-brand-ink',
        })
      }
    }

    const colors = Array.from(colorMap.values())
    return {
      colorTitle: fallback.colorTitle || 'Pilihan Warna',
      colors: colors.length > 0 ? colors : fallback.colors,
      optionTitle: fallback.optionTitle || 'Pilihan Opsi',
      options: fallback.options,
    }
  })

  const quantity = ref(1)
  const selectedColor = ref('')
  const selectedMaterial = ref('')

  // Sinkronkan pilihan default saat produk dimuat atau berubah
  watch(
    getProduct,
    () => {
      const firstColor = variants.value.colors[0]
      if (firstColor) selectedColor.value = firstColor.name
      const firstOption = variants.value.options[0]
      if (firstOption) selectedMaterial.value = firstOption.name
    },
    { immediate: true },
  )

  const selectedVariant = computed<ProductVariant | null>(() => {
    const p = getProduct()
    if (!p.variants || p.variants.length === 0) return null
    const match = p.variants.find((v) => {
      if (!v.is_active || v.deleted_at) return false
      const colorAttr = (v.attributes as Record<string, string>)?.color || v.name
      return (
        colorAttr.toLowerCase() === selectedColor.value.toLowerCase() ||
        v.name.toLowerCase().includes(selectedColor.value.toLowerCase()) ||
        selectedColor.value.toLowerCase().includes(colorAttr.toLowerCase())
      )
    })
    return match || p.variants[0] || null
  })

  const effectivePrice = computed(() => {
    const promo = options?.promoPrice?.()
    if (typeof promo === 'number' && promo > 0) {
      return promo
    }
    if (selectedVariant.value?.price_cents) {
      return selectedVariant.value.price_cents / 100
    }
    return getProduct().price
  })

  const effectiveStock = computed(() => {
    if (selectedVariant.value) {
      return selectedVariant.value.stock
    }
    return getProduct().stock
  })

  const effectiveSku = computed(() => {
    if (selectedVariant.value?.sku) {
      return selectedVariant.value.sku
    }
    return getProduct().sku || `SS-MOD-0${getProduct().id}`
  })

  const ratingValue = computed(() => {
    const r = getProduct().rating
    return r && Number(r) > 0 ? Number(r) : null
  })
  const reviewCountValue = computed(() => getProduct().review_count ?? null)

  const isOutOfStock = computed(() => effectiveStock.value === 0)
  const maxQuantity = computed(() => Math.max(1, effectiveStock.value))

  const incrementQty = () => {
    if (quantity.value < maxQuantity.value) {
      quantity.value++
    }
  }

  const decrementQty = () => {
    if (quantity.value > 1) {
      quantity.value--
    }
  }

  const handleQuantityInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const sanitized = target.value.replace(/[^0-9]/g, '')
    target.value = sanitized
    if (!sanitized) return
    const val = parseInt(sanitized, 10)
    if (val > maxQuantity.value) {
      quantity.value = maxQuantity.value
      target.value = String(maxQuantity.value)
    } else if (val >= 1) {
      quantity.value = val
    }
  }

  const handleQuantityBlur = (event: Event) => {
    const target = event.target as HTMLInputElement
    const val = parseInt(target.value, 10)
    if (!target.value || isNaN(val) || val < 1) {
      quantity.value = 1
      target.value = '1'
    } else if (val > maxQuantity.value) {
      quantity.value = maxQuantity.value
      target.value = String(maxQuantity.value)
    } else {
      quantity.value = val
      target.value = String(val)
    }
  }

  const handleAddToBag = () => {
    if (isOutOfStock.value) return
    callbacks.onAddToBag({
      quantity: quantity.value,
      color: selectedColor.value,
      material: selectedMaterial.value,
      variantId: selectedVariant.value?.id || null,
      variantName: selectedVariant.value?.name || null,
      sku: effectiveSku.value,
      price: effectivePrice.value,
    })
  }

  const handleBuyNow = () => {
    if (isOutOfStock.value) return
    callbacks.onBuyNow({
      quantity: quantity.value,
      color: selectedColor.value,
      material: selectedMaterial.value,
      variantId: selectedVariant.value?.id || null,
      variantName: selectedVariant.value?.name || null,
      sku: effectiveSku.value,
      price: effectivePrice.value,
    })
  }

  return {
    variants,
    selectedVariant,
    effectivePrice,
    effectiveStock,
    effectiveSku,
    quantity,
    selectedColor,
    selectedMaterial,
    ratingValue,
    reviewCountValue,
    isOutOfStock,
    maxQuantity,
    incrementQty,
    decrementQty,
    handleQuantityInput,
    handleQuantityBlur,
    handleAddToBag,
    handleBuyNow,
  }
}
