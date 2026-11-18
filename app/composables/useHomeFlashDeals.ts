import type { Product } from '~/types/product'
import { calculateCountdownUntil, type CountdownTime } from '~/utils/countdown'
import { useProductStore } from '~/features/products/stores/product'

export interface UseHomeFlashDealsProps {
  products?: Product[]
  loading?: boolean
  promoEndsAt?: string | Date | null
}

export function useHomeFlashDeals(
  props: UseHomeFlashDealsProps,
  dbPromoEndsAt?: Ref<string | null | undefined>,
) {
  let productStore: ReturnType<typeof useProductStore> | null = null
  try {
    productStore = useProductStore()
  } catch {
    productStore = null
  }

  const resolvedPromoEndsAt = computed(() => props.promoEndsAt ?? dbPromoEndsAt?.value ?? null)

  const countdownData = ref<CountdownTime | null>(
    resolvedPromoEndsAt.value ? calculateCountdownUntil(resolvedPromoEndsAt.value) : null,
  )
  let timerInterval: ReturnType<typeof setInterval> | null = null

  const updateCountdown = () => {
    if (resolvedPromoEndsAt.value) {
      countdownData.value = calculateCountdownUntil(resolvedPromoEndsAt.value)
    } else {
      countdownData.value = null
    }
  }

  onMounted(() => {
    updateCountdown()
    if (resolvedPromoEndsAt.value) {
      timerInterval = setInterval(updateCountdown, 1000)
    }
  })

  watch(resolvedPromoEndsAt, (newVal) => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    updateCountdown()
    if (newVal) {
      timerInterval = setInterval(updateCountdown, 1000)
    }
  })

  onUnmounted(() => {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  })

  const isLoading = computed(() => {
    if (props.loading !== undefined) return props.loading
    return productStore?.loading ?? false
  })

  const displayProducts = computed<Product[]>(() => {
    if (props.products) {
      return props.products.slice(0, 4)
    }

    const source = productStore?.products ?? []
    if (!source || source.length === 0) return []

    const activeProducts = source.filter((p) => !p.deleted_at)

    // Prioritaskan produk featured atau stok tersedia saat membaca dari store
    const featured = activeProducts.filter((p) => p.is_featured && p.stock > 0)
    if (featured.length >= 4) {
      return featured.slice(0, 4)
    }

    const inStock = activeProducts.filter((p) => p.stock > 0)
    if (inStock.length > 0) {
      return inStock.slice(0, 4)
    }

    return activeProducts.slice(0, 4)
  })

  const getProductBadge = (product: Product): string => {
    if (product.stock === 0) {
      return 'Habis'
    }
    if (product.stock > 0 && product.stock <= 3) {
      return `Sisa ${product.stock}`
    }
    if (product.is_featured) {
      return 'Pilihan Unggulan'
    }
    if ((product.sold_count ?? 0) >= 30) {
      return 'Terlaris'
    }
    return 'Kurasi Pilihan'
  }

  const failedDealImages = ref<Record<number, boolean>>({})

  const onImageError = (productId: number) => {
    failedDealImages.value[productId] = true
  }

  const flashSectionRef = ref<HTMLElement | null>(null)

  onMounted(() => {
    if (flashSectionRef.value) {
      const imgs = flashSectionRef.value.querySelectorAll('img[data-product-id]')
      imgs.forEach((img) => {
        const htmlImg = img as HTMLImageElement
        if (htmlImg.complete && htmlImg.naturalWidth === 0) {
          const id = htmlImg.getAttribute('data-product-id')
          if (id) {
            failedDealImages.value[Number(id)] = true
          }
        }
      })
    }
  })

  return {
    countdownData,
    isLoading,
    displayProducts,
    getProductBadge,
    failedDealImages,
    onImageError,
    flashSectionRef,
  }
}
