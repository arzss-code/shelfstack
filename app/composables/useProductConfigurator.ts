import type { Product } from '~/types/product'
import { getProductVariants } from '~/utils/product-specs'

export interface ProductSelectionPayload {
  quantity: number
  color: string
  material: string
}

export function useProductConfigurator(
  getProduct: () => Product,
  callbacks: {
    onAddToBag: (payload: ProductSelectionPayload) => void
    onBuyNow: (payload: ProductSelectionPayload) => void
  },
) {
  const variants = computed(() => getProductVariants(getProduct()))

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

  const ratingValue = computed(() => {
    const r = getProduct().rating
    return r && Number(r) > 0 ? Number(r) : null
  })
  const reviewCountValue = computed(() => getProduct().review_count ?? null)

  const isOutOfStock = computed(() => getProduct().stock === 0)
  const maxQuantity = computed(() => Math.max(1, getProduct().stock))

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
    })
  }

  const handleBuyNow = () => {
    if (isOutOfStock.value) return
    callbacks.onBuyNow({
      quantity: quantity.value,
      color: selectedColor.value,
      material: selectedMaterial.value,
    })
  }

  return {
    variants,
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
