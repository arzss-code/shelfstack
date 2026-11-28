import { computed, getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'vue'
import { CANONICAL_CATEGORIES, useCategories } from '~/composables/useCategories'
import type { SortOption } from '~/components/katalog/KatalogToolbar.vue'
import { formatRupiah } from '~/utils/format'
import type { Product } from '~/types/product'

export interface CatalogApiResponse {
  status: string
  message: string
  data: Product[]
  total?: number
  pagination?: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
  facets?: {
    categoryCounts?: Record<string, number>
  }
}

export const CATEGORY_SORT_OPTIONS: SortOption[] = [
  { id: 'featured', label: 'Pilihan Kurator' },
  { id: 'popular', label: 'Paling Populer' },
  { id: 'price-low', label: 'Harga: Rendah ke Tinggi' },
  { id: 'price-high', label: 'Harga: Tinggi ke Rendah' },
  { id: 'name-asc', label: 'Nama: A-Z' },
]

export const CATEGORY_PRICE_PRESETS = [
  { value: 'all', label: 'Semua Harga', min: undefined, max: undefined },
  { value: 'under250k', label: '< Rp 250rb', min: undefined, max: 250000 },
  { value: '250k-1m', label: 'Rp 250rb - 1jt', min: 250000, max: 1000000 },
  { value: 'above1m', label: '> Rp 1jt', min: 1000000, max: undefined },
] as const

export const CATEGORY_RATING_OPTIONS = [
  { value: 'all', label: 'Semua Rating' },
  { value: '4.5', label: 'Bintang 4.5+' },
  { value: '4.0', label: 'Bintang 4.0+' },
] as const

export function useCategoryPage() {
  const route = useRoute()
  const router = useRouter()

  const slug = computed(() =>
    String(route.params.slug || '')
      .trim()
      .toLowerCase(),
  )

  const searchQuery = ref((route.query.q as string) || '')
  const appliedSearch = ref((route.query.q as string) || '')
  const selectedSort = ref((route.query.sort as string) || 'featured')
  const inStockOnly = ref(route.query.stock === 'in_stock')
  const selectedPricePreset = ref((route.query.price as string) || 'all')
  const selectedRating = ref((route.query.rating as string) || 'all')
  const viewMode = ref<'grid' | 'list'>((route.query.view as 'grid' | 'list') || 'grid')
  const pageLimit = 18
  const currentPage = ref(1)

  const activePriceBounds = computed(() => {
    const preset = CATEGORY_PRICE_PRESETS.find((p) => p.value === selectedPricePreset.value)
    return {
      min: preset?.min,
      max: preset?.max,
    }
  })

  const syncQuery = () => {
    router.replace({
      query: {
        ...route.query,
        q: appliedSearch.value.trim() || undefined,
        sort: selectedSort.value !== 'featured' ? selectedSort.value : undefined,
        stock: inStockOnly.value ? 'in_stock' : undefined,
        price: selectedPricePreset.value !== 'all' ? selectedPricePreset.value : undefined,
        rating: selectedRating.value !== 'all' ? selectedRating.value : undefined,
        view: viewMode.value !== 'grid' ? viewMode.value : undefined,
      },
    })
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null
  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (searchTimer) clearTimeout(searchTimer)
    })
  }

  const onSearchChange = (value: string) => {
    searchQuery.value = value
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      appliedSearch.value = value.trim()
      currentPage.value = 1
      syncQuery()
    }, 300)
  }

  const clearSearch = () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchQuery.value = ''
    appliedSearch.value = ''
    currentPage.value = 1
    syncQuery()
  }

  const onSortChange = (newSort: string) => {
    selectedSort.value = newSort
    currentPage.value = 1
    syncQuery()
  }

  const onStockToggle = (newVal: boolean) => {
    inStockOnly.value = newVal
    currentPage.value = 1
    syncQuery()
  }

  const onPricePresetChange = (preset: string) => {
    selectedPricePreset.value = preset || 'all'
    currentPage.value = 1
    syncQuery()
  }

  const onRatingChange = (rating: string) => {
    selectedRating.value = rating || 'all'
    currentPage.value = 1
    syncQuery()
  }

  const onViewModeChange = (newMode: 'grid' | 'list') => {
    viewMode.value = newMode
    syncQuery()
  }

  const resetFilters = () => {
    if (searchTimer) clearTimeout(searchTimer)
    searchQuery.value = ''
    appliedSearch.value = ''
    selectedSort.value = 'featured'
    inStockOnly.value = false
    selectedPricePreset.value = 'all'
    selectedRating.value = 'all'
    currentPage.value = 1
    syncQuery()
  }

  watch(slug, () => {
    currentPage.value = 1
  })

  const { categories, fetchCategories } = useCategories()
  onMounted(async () => {
    if (categories.value.length === 0) {
      await fetchCategories()
    }
  })

  const resolvedCategories = computed(() =>
    categories.value.length > 0 ? categories.value : CANONICAL_CATEGORIES,
  )

  const currentCategory = computed(() => {
    const currentSlug = slug.value
    return (
      resolvedCategories.value.find((c) => c.slug.toLowerCase() === currentSlug) ||
      CANONICAL_CATEGORIES.find((c) => c.slug.toLowerCase() === currentSlug) ||
      null
    )
  })

  const {
    data: catalogResponse,
    pending,
    error: categoryError,
    refresh: refreshCategoryProducts,
  } = useAsyncData<CatalogApiResponse>(
    () =>
      `category-products-${slug.value}-${appliedSearch.value}-${selectedSort.value}-${inStockOnly.value}-${selectedPricePreset.value}-${selectedRating.value}-${currentPage.value}`,
    () => {
      const ratingNum =
        selectedRating.value !== 'all' ? parseFloat(selectedRating.value) : undefined
      return $fetch<CatalogApiResponse>('/api/products', {
        params: {
          category: slug.value,
          q: appliedSearch.value.trim() || undefined,
          sort: selectedSort.value,
          stock_status: inStockOnly.value ? 'in_stock' : undefined,
          min_price: activePriceBounds.value.min,
          max_price: activePriceBounds.value.max,
          min_rating: ratingNum && !Number.isNaN(ratingNum) ? ratingNum : undefined,
          limit: pageLimit * currentPage.value,
          page: 1,
        },
      })
    },
    {
      watch: [
        slug,
        appliedSearch,
        selectedSort,
        inStockOnly,
        selectedPricePreset,
        selectedRating,
        currentPage,
      ],
      default: () => ({
        status: 'success',
        message: '',
        data: [] as Product[],
        total: 0,
      }),
    },
  )

  const products = computed(() => catalogResponse.value?.data || [])
  const totalProducts = computed(() => catalogResponse.value?.total ?? products.value.length)
  const hasMore = computed(() => products.value.length < totalProducts.value)
  const remainingCount = computed(() => Math.max(0, totalProducts.value - products.value.length))
  const categoryCounts = computed(() => catalogResponse.value?.facets?.categoryCounts || {})

  const categoryNavItems = computed(() =>
    resolvedCategories.value.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      count: categoryCounts.value[cat.id],
      active: cat.slug.toLowerCase() === slug.value,
    })),
  )

  const categoryInsights = computed(() => {
    const list = products.value
    if (list.length === 0) {
      return {
        inStockCount: 0,
        priceRangeText: '',
        avgRatingText: '',
      }
    }
    const inStockCount = list.filter((p) => p.stock > 0).length
    const prices = list.map((p) => p.price).filter((p) => typeof p === 'number' && p >= 0)
    const minP = prices.length > 0 ? Math.min(...prices) : 0
    const maxP = prices.length > 0 ? Math.max(...prices) : 0
    const priceRangeText =
      prices.length === 0
        ? ''
        : minP === maxP
          ? formatRupiah(minP)
          : `${formatRupiah(minP)} - ${formatRupiah(maxP)}`

    const rated = list.map((p) => Number(p.rating || 0)).filter((r) => r > 0)
    const avgRatingText =
      rated.length > 0 ? (rated.reduce((sum, val) => sum + val, 0) / rated.length).toFixed(1) : ''

    return {
      inStockCount,
      priceRangeText,
      avgRatingText,
    }
  })

  const hasActiveFilters = computed(
    () =>
      Boolean(appliedSearch.value.trim()) ||
      inStockOnly.value ||
      selectedPricePreset.value !== 'all' ||
      selectedRating.value !== 'all' ||
      selectedSort.value !== 'featured',
  )

  const loadMore = () => {
    if (hasMore.value && !pending.value) {
      currentPage.value++
    }
  }

  return {
    slug,
    searchQuery,
    appliedSearch,
    selectedSort,
    inStockOnly,
    selectedPricePreset,
    selectedRating,
    viewMode,
    currentCategory,
    categoryNavItems,
    categoryInsights,
    products,
    totalProducts,
    pending,
    categoryError,
    hasMore,
    remainingCount,
    hasActiveFilters,
    refreshCategoryProducts,
    onSearchChange,
    clearSearch,
    onSortChange,
    onStockToggle,
    onPricePresetChange,
    onRatingChange,
    onViewModeChange,
    resetFilters,
    loadMore,
  }
}
