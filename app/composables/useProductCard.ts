import type { Product } from '~/types/product'
import { useCategories } from '~/composables/useCategories'
import { useCartStore } from '~/features/cart/stores/cart'

export function useProductCard(getProduct: () => Product) {
  const router = useRouter()
  const toast = useUiToast()
  const cartStore = useCartStore()
  const { categories: dynamicCategories } = useCategories()

  const justAdded = ref(false)
  const imageLoadError = ref(false)
  const imageEl = ref<HTMLImageElement | null>(null)

  const onImgError = () => {
    imageLoadError.value = true
  }

  onMounted(() => {
    // Catch SSR hydration race condition where image 404 happened before @error listener attached
    if (imageEl.value && imageEl.value.complete && imageEl.value.naturalWidth === 0) {
      imageLoadError.value = true
    }
  })

  watch(
    () => getProduct().image_url,
    () => {
      imageLoadError.value = false
      nextTick(() => {
        if (imageEl.value && imageEl.value.complete && imageEl.value.naturalWidth === 0) {
          imageLoadError.value = true
        }
      })
    },
  )

  const categoryName = computed(() => {
    const product = getProduct()
    if (!product.category_id) return null
    const cat = dynamicCategories.value.find((c) => c.id === product.category_id)
    return cat ? cat.name : null
  })

  const formattedRating = computed(() => {
    const r = getProduct().rating
    if (!r || Number(r) <= 0) return null
    return Number(r).toFixed(1)
  })

  const stockStatusText = computed(() => {
    const product = getProduct()
    if (product.stock === 0) return 'Stok Habis'
    if (product.stock <= 3) return `Sisa ${product.stock}`
    if (product.sold_count && product.sold_count > 0) {
      return product.sold_count >= 1000
        ? `${(product.sold_count / 1000).toFixed(1)}rb+ terjual`
        : `${product.sold_count} terjual`
    }
    return 'Tersedia'
  })

  const badgeInfo = computed(() => {
    const product = getProduct()
    if (product.stock === 0) {
      return {
        label: 'Habis',
        badgeClass: 'bg-brand-danger text-white',
      }
    }
    if (product.stock > 0 && product.stock <= 3) {
      return {
        label: `Sisa ${product.stock}`,
        badgeClass:
          'bg-brand-warning-tint text-brand-warning-text border border-brand-warning-edge font-semibold',
      }
    }
    if (product.is_featured) {
      return {
        label: 'Unggulan',
        badgeClass: 'bg-brand-ink text-brand-onink shadow-sm',
      }
    }
    return null
  })

  const navigateToDetail = () => {
    const product = getProduct()
    const target = product.slug || product.id
    router.push(`/product/${target}`)
  }

  const handleQuickAdd = () => {
    const product = getProduct()
    if (product.stock <= 0) return

    cartStore.addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      priceCents: product.price_cents ?? Math.round(product.price * 100),
      imageUrl: product.image_url,
      stock: product.stock,
      openCartDrawer: true,
    })

    justAdded.value = true
    setTimeout(() => {
      justAdded.value = false
    }, 1500)

    toast.add({
      severity: 'success',
      summary: 'Ditambahkan ke Keranjang',
      detail: `${product.name} masuk ke pesanan.`,
      life: 2500,
    })
  }

  return {
    justAdded,
    imageLoadError,
    imageEl,
    onImgError,
    categoryName,
    formattedRating,
    stockStatusText,
    badgeInfo,
    navigateToDetail,
    handleQuickAdd,
  }
}
