import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'
import type { SortOption } from '~/components/katalog/KatalogToolbar.vue'
import type { PriceRange } from '~/components/katalog/KatalogSidebar.vue'

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

export const priceRanges: PriceRange[] = [
  { id: 'all', label: 'Semua Harga' },
  { id: 'under500k', label: 'Di bawah Rp 500rb' },
  { id: '500k-2m', label: 'Rp 500rb – Rp 2jt' },
  { id: 'above2m', label: 'Di atas Rp 2jt' },
]

export function useKatalogFilters() {
  const route = useRoute()
  const router = useRouter()

  const searchQuery = ref((route.query.q as string) || '')
  const selectedCategory = ref((route.query.category as string) || 'all')
  const selectedPriceRange = ref((route.query.price as string) || 'all')
  const selectedRating = ref((route.query.rating as string) || 'all')
  const selectedSort = ref((route.query.sort as string) || 'featured')
  const currentPage = ref(parseInt((route.query.page as string) || '1', 10) || 1)
  const gridDensity = ref<'compact' | 'spacious'>('compact')
  const showMobileFilterModal = ref(false)
  const itemsPerPage = 12

  const queryParams = computed(() => {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: itemsPerPage,
      sort: selectedSort.value,
    }
    if (searchQuery.value.trim()) params.q = searchQuery.value.trim()
    if (selectedCategory.value !== 'all') params.category = selectedCategory.value

    if (selectedPriceRange.value === 'under500k') {
      params.max_price = 500000
    } else if (selectedPriceRange.value === '500k-2m') {
      params.min_price = 500000
      params.max_price = 2000000
    } else if (selectedPriceRange.value === 'above2m') {
      params.min_price = 2000000
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
    if (selectedPriceRange.value !== 'all') query.price = selectedPriceRange.value
    if (selectedRating.value !== 'all') query.rating = selectedRating.value
    if (selectedSort.value !== 'featured') query.sort = selectedSort.value
    if (currentPage.value > 1) query.page = String(currentPage.value)
    router.replace({ query })
  }

  const activeFiltersCount = computed(() => {
    let count = 0
    if (searchQuery.value.trim()) count++
    if (selectedCategory.value !== 'all') count++
    if (selectedPriceRange.value !== 'all') count++
    if (selectedRating.value !== 'all') count++
    if (selectedSort.value !== 'featured') count++
    return count
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

  const handlePriceRangeUpdate = (val: string) => {
    selectedPriceRange.value = val
    currentPage.value = 1
    syncQuery()
  }

  const handleClearPriceRange = () => {
    selectedPriceRange.value = 'all'
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
    selectedPriceRange.value = 'all'
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
    selectedPriceRange,
    selectedRating,
    selectedSort,
    currentPage,
    gridDensity,
    showMobileFilterModal,
    itemsPerPage,
    queryParams,
    sortOptions,
    priceRanges,
    ratingOptions,
    activeFiltersCount,
    selectCategory,
    clearSearch,
    handleSearchUpdate,
    handleSortUpdate,
    handlePriceRangeUpdate,
    handleClearPriceRange,
    handleRatingUpdate,
    handleClearRating,
    resetAllFilters,
    changePage,
  }
}
