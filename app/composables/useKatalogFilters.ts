import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'
import type { SortOption } from '~/components/katalog/KatalogToolbar.vue'

export interface RatingOption {
  id: string
  label: string
  minRating: number
}

export const ratingOptions: RatingOption[] = [
  { id: 'all', label: 'Semua Rating', minRating: 0 },
  { id: '4.5', label: 'Bintang 4.5 ke atas', minRating: 4.5 },
  { id: '4.0', label: 'Bintang 4.0 ke atas', minRating: 4.0 },
]

export const sortOptions: SortOption[] = [
  { id: 'featured', label: 'Pilihan Kurator' },
  { id: 'popular', label: 'Paling Populer' },
  { id: 'price-low', label: 'Harga: Rendah ke Tinggi' },
  { id: 'price-high', label: 'Harga: Tinggi ke Rendah' },
  { id: 'name-asc', label: 'Nama: A-Z' },
]

export function useKatalogFilters() {
  const route = useRoute()
  const router = useRouter()

  const searchQuery = ref((route.query.q as string) || '')
  const selectedCategory = ref((route.query.category as string) || 'all')
  const selectedRating = ref((route.query.rating as string) || 'all')
  const selectedSort = ref((route.query.sort as string) || 'featured')
  const currentPage = ref(parseInt((route.query.page as string) || '1', 10) || 1)
  const gridDensity = ref<'compact' | 'spacious'>('compact')
  const showMobileFilterModal = ref(false)
  const itemsPerPage = 12

  // Filter Rentang Harga (Min, Max, dan Quick Chip ID)
  const minPrice = ref<number | undefined>(
    route.query.min_price ? parseInt(route.query.min_price as string, 10) : undefined,
  )
  const maxPrice = ref<number | undefined>(
    route.query.max_price ? parseInt(route.query.max_price as string, 10) : undefined,
  )
  const selectedPriceChip = ref<string>((route.query.price_chip as string) || 'all')

  // Filter Ketersediaan Stok (In-Stock Only)
  const inStockOnly = ref<boolean>(route.query.stock_status === 'in_stock')

  const queryParams = computed(() => {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: itemsPerPage,
      sort: selectedSort.value,
    }
    if (searchQuery.value.trim()) params.q = searchQuery.value.trim()
    if (selectedCategory.value !== 'all') params.category = selectedCategory.value

    if (minPrice.value !== undefined) params.min_price = minPrice.value
    if (maxPrice.value !== undefined) params.max_price = maxPrice.value

    if (inStockOnly.value) {
      params.stock_status = 'in_stock'
    }

    if (selectedRating.value !== 'all') {
      const r = parseFloat(selectedRating.value)
      if (!isNaN(r) && r > 0) {
        params.min_rating = r
      }
    }

    return params
  })

  const syncQuery = () => {
    const query: Record<string, string> = {}
    if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
    if (selectedCategory.value !== 'all') query.category = selectedCategory.value
    if (minPrice.value !== undefined) query.min_price = String(minPrice.value)
    if (maxPrice.value !== undefined) query.max_price = String(maxPrice.value)
    if (selectedPriceChip.value && selectedPriceChip.value !== 'all') {
      query.price_chip = selectedPriceChip.value
    }
    if (inStockOnly.value) query.stock_status = 'in_stock'
    if (selectedRating.value !== 'all') query.rating = selectedRating.value
    if (selectedSort.value !== 'featured') query.sort = selectedSort.value
    if (currentPage.value > 1) query.page = String(currentPage.value)

    router.replace({ query })
  }

  const activeFiltersCount = computed(() => {
    let count = 0
    if (searchQuery.value.trim()) count++
    if (selectedCategory.value !== 'all') count++
    if (minPrice.value !== undefined || maxPrice.value !== undefined) count++
    if (inStockOnly.value) count++
    if (selectedRating.value !== 'all') count++
    if (selectedSort.value !== 'featured') count++
    return count
  })

  const priceRangeLabel = computed(() => {
    if (selectedPriceChip.value === 'under250k') return '< Rp 250rb'
    if (selectedPriceChip.value === '250k-1m') return 'Rp 250rb - 1jt'
    if (selectedPriceChip.value === 'above1m') return '> Rp 1jt'

    if (minPrice.value !== undefined && maxPrice.value !== undefined) {
      return `Rp ${(minPrice.value / 1000).toLocaleString('id-ID')}rb - ${(maxPrice.value / 1000).toLocaleString('id-ID')}rb`
    }
    if (minPrice.value !== undefined) {
      return `> Rp ${(minPrice.value / 1000).toLocaleString('id-ID')}rb`
    }
    if (maxPrice.value !== undefined) {
      return `< Rp ${(maxPrice.value / 1000).toLocaleString('id-ID')}rb`
    }
    return undefined
  })

  const selectCategory = (catId: string) => {
    selectedCategory.value = catId
    currentPage.value = 1
    syncQuery()
  }

  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer)
      }
    })
  }

  const clearSearch = () => {
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }
    searchQuery.value = ''
    currentPage.value = 1
    syncQuery()
  }

  const handleSearchUpdate = (val: string) => {
    searchQuery.value = val
    currentPage.value = 1
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }
    searchDebounceTimer = setTimeout(() => {
      syncQuery()
    }, 300)
  }

  const handleSortUpdate = (val: string) => {
    selectedSort.value = val
    syncQuery()
  }

  const handlePriceRangeApply = (min?: number, max?: number, chipId?: string) => {
    minPrice.value = min
    maxPrice.value = max
    selectedPriceChip.value = chipId || 'custom'
    currentPage.value = 1
    syncQuery()
  }

  const handleClearPriceRange = () => {
    minPrice.value = undefined
    maxPrice.value = undefined
    selectedPriceChip.value = 'all'
    currentPage.value = 1
    syncQuery()
  }

  const toggleInStockOnly = () => {
    inStockOnly.value = !inStockOnly.value
    currentPage.value = 1
    syncQuery()
  }

  const handleRatingUpdate = (val: string) => {
    selectedRating.value = val
    currentPage.value = 1
    syncQuery()
  }

  const handleClearRating = () => {
    selectedRating.value = 'all'
    currentPage.value = 1
    syncQuery()
  }

  const resetAllFilters = () => {
    searchQuery.value = ''
    selectedCategory.value = 'all'
    minPrice.value = undefined
    maxPrice.value = undefined
    selectedPriceChip.value = 'all'
    inStockOnly.value = false
    selectedRating.value = 'all'
    selectedSort.value = 'featured'
    currentPage.value = 1
    router.replace({ query: {} })
  }

  const changePage = (newPage: number, totalPages: number) => {
    if (newPage < 1 || newPage > totalPages) return
    currentPage.value = newPage
    syncQuery()
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return {
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    selectedPriceChip,
    priceRangeLabel,
    inStockOnly,
    selectedRating,
    selectedSort,
    currentPage,
    gridDensity,
    showMobileFilterModal,
    itemsPerPage,
    queryParams,
    sortOptions,
    ratingOptions,
    activeFiltersCount,
    selectCategory,
    clearSearch,
    handleSearchUpdate,
    handleSortUpdate,
    handlePriceRangeApply,
    handleClearPriceRange,
    toggleInStockOnly,
    handleRatingUpdate,
    handleClearRating,
    resetAllFilters,
    changePage,
  }
}
