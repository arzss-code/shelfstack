import { getCurrentInstance } from 'vue'
import type {
  InstantSearchProduct,
  InstantSearchCategory,
  InstantSearchResponse,
} from '~~/shared/types/search'

export function useInstantSearch(initialQuery: Ref<string> | string = '') {
  let router: ReturnType<typeof useRouter> | null = null
  try {
    router = useRouter()
  } catch {
    // Graceful fallback when executed outside active NuxtApp context (e.g. isolated component unit tests)
  }

  const query = isRef(initialQuery) ? initialQuery : ref(initialQuery)

  const products = ref<InstantSearchProduct[]>([])
  const categories = ref<InstantSearchCategory[]>([])
  const isOpen = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const activeIndex = ref(-1)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let abortController: AbortController | null = null

  // Total item yang dapat dinavigasi panah keyboard:
  // Kategori (N item) + Produk (M item) + Tombol Footer "Lihat semua" (1 item)
  const totalNavigableItems = computed(() => {
    const catCount = categories.value.length
    const prodCount = products.value.length
    const hasFooter = query.value.trim().length >= 2
    return catCount + prodCount + (hasFooter ? 1 : 0)
  })

  const clearTimer = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  const cancelPendingRequest = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  }

  const executeSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim()
    if (trimmed.length < 2) {
      products.value = []
      categories.value = []
      isLoading.value = false
      isOpen.value = false
      errorMessage.value = null
      activeIndex.value = -1
      return
    }

    cancelPendingRequest()
    abortController = new AbortController()

    isLoading.value = true
    isOpen.value = true
    errorMessage.value = null

    try {
      const response = await $fetch<{
        status: string
        data: InstantSearchResponse
      }>('/api/products/search-instant', {
        query: { q: trimmed },
        signal: abortController.signal,
      })

      if (response && response.data) {
        products.value = response.data.products || []
        categories.value = response.data.categories || []
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      errorMessage.value = 'Gagal memuat hasil pencarian. Silakan coba lagi.'
      products.value = []
      categories.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Watch query changes with 250ms debounce
  watch(query, (newVal) => {
    clearTimer()
    activeIndex.value = -1

    const trimmed = newVal.trim()
    if (trimmed.length < 2) {
      isOpen.value = false
      products.value = []
      categories.value = []
      isLoading.value = false
      return
    }

    debounceTimer = setTimeout(() => {
      executeSearch(trimmed)
    }, 250)
  })

  const navigateNext = () => {
    if (!isOpen.value || totalNavigableItems.value === 0) return
    activeIndex.value = (activeIndex.value + 1) % totalNavigableItems.value
  }

  const navigatePrev = () => {
    if (!isOpen.value || totalNavigableItems.value === 0) return
    activeIndex.value =
      (activeIndex.value - 1 + totalNavigableItems.value) % totalNavigableItems.value
  }

  const close = () => {
    isOpen.value = false
    activeIndex.value = -1
  }

  const selectCategory = (category: InstantSearchCategory) => {
    close()
    if (router) {
      router.push({ path: `/c/${category.slug}` })
    }
  }

  const selectProduct = (product: InstantSearchProduct) => {
    close()
    if (router) {
      router.push({ path: `/product/${product.slug || product.id}` })
    }
  }

  const submitFullSearch = (fallbackQuery?: string) => {
    const q = (fallbackQuery ?? query.value).trim()
    close()
    if (router) {
      if (q) {
        router.push({ path: '/katalog', query: { q } })
      } else {
        router.push({ path: '/katalog' })
      }
    }
  }

  const selectActiveItem = () => {
    if (!isOpen.value || activeIndex.value < 0) {
      submitFullSearch()
      return
    }

    const catCount = categories.value.length
    const prodCount = products.value.length

    if (activeIndex.value < catCount) {
      const cat = categories.value[activeIndex.value]
      if (cat) selectCategory(cat)
    } else if (activeIndex.value < catCount + prodCount) {
      const prodIndex = activeIndex.value - catCount
      const prod = products.value[prodIndex]
      if (prod) selectProduct(prod)
    } else {
      submitFullSearch()
    }
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      clearTimer()
      cancelPendingRequest()
    })
  }

  return {
    query,
    products,
    categories,
    isOpen,
    isLoading,
    errorMessage,
    activeIndex,
    totalNavigableItems,
    navigateNext,
    navigatePrev,
    selectActiveItem,
    selectCategory,
    selectProduct,
    submitFullSearch,
    retrySearch: () => executeSearch(query.value),
    close,
  }
}
