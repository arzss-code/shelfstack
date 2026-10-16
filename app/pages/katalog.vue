<script setup lang="ts">
import { useCategories } from '~/composables/useCategories'
import ProductList from '~/features/products/components/ProductList.vue'
import KatalogToolbar, { type SortOption } from '~/components/katalog/KatalogToolbar.vue'
import KatalogSidebar, { type PriceRange } from '~/components/katalog/KatalogSidebar.vue'
import KatalogActiveFilters from '~/components/katalog/KatalogActiveFilters.vue'
import KatalogMobileFilter from '~/components/katalog/KatalogMobileFilter.vue'
import type { Product } from '~/types/product'

useSeoMeta({
  title: 'Katalog Produk - ShelfStack',
  description:
    'Jelajahi etalase ShelfStack: peralatan presisi, koleksi meja kerja, furnitur, dan perkakas terkurasi berkualitas tinggi.',
})

const route = useRoute()
const router = useRouter()
const { categories: dynamicCategories, fetchCategories } = useCategories()

const searchQuery = ref((route.query.q as string) || '')
const selectedCategory = ref((route.query.category as string) || 'all')
const selectedPriceRange = ref((route.query.price as string) || 'all')
const selectedSort = ref((route.query.sort as string) || 'featured')
const currentPage = ref(parseInt((route.query.page as string) || '1', 10) || 1)
const gridDensity = ref<'compact' | 'spacious'>('compact')
const showMobileFilterModal = ref(false)
const itemsPerPage = 12

// Susun params server-side secara reaktif
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

  return params
})

interface CatalogApiResponse {
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

// Fetch katalog di server (SSR-first + reactive updates saat filter berganti)
const { data: catalogResponse, pending } = await useAsyncData<CatalogApiResponse>(
  'katalog-products',
  () => $fetch<CatalogApiResponse>('/api/products', { params: queryParams.value }),
  {
    watch: [queryParams],
    default: () => ({
      status: 'success',
      message: '',
      data: [] as Product[],
      total: 0,
    }),
  },
)

const products = computed(() => catalogResponse.value?.data || [])
const totalProducts = computed(
  () =>
    catalogResponse.value?.total ??
    catalogResponse.value?.pagination?.totalCount ??
    products.value.length,
)
const totalPages = computed(
  () =>
    catalogResponse.value?.pagination?.totalPages ||
    Math.ceil(totalProducts.value / itemsPerPage) ||
    1,
)
const categoryCounts = computed(() => catalogResponse.value?.facets?.categoryCounts || {})

// Kategori filter chips & sidebar dengan Faceted count
const categories = computed(() => [
  { id: 'all', label: `Semua Kategori (${totalProducts.value})` },
  ...dynamicCategories.value.map((c) => {
    const count = categoryCounts.value[c.id]
    return {
      id: c.slug,
      label: count !== undefined ? `${c.name} (${count})` : c.name,
    }
  }),
])

const sortOptions: SortOption[] = [
  { id: 'featured', label: 'Pilihan Kurator' },
  { id: 'popular', label: 'Paling Populer' },
  { id: 'price-low', label: 'Harga: Rendah ke Tinggi' },
  { id: 'price-high', label: 'Harga: Tinggi ke Rendah' },
  { id: 'name-asc', label: 'Nama: A-Z' },
]

const priceRanges: PriceRange[] = [
  { id: 'all', label: 'Semua Harga' },
  { id: 'under500k', label: 'Di bawah Rp 500rb' },
  { id: '500k-2m', label: 'Rp 500rb – Rp 2jt' },
  { id: 'above2m', label: 'Di atas Rp 2jt' },
]

onMounted(async () => {
  await fetchCategories()
})

const syncQuery = () => {
  const query: Record<string, string> = {}
  if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
  if (selectedCategory.value !== 'all') query.category = selectedCategory.value
  if (selectedPriceRange.value !== 'all') query.price = selectedPriceRange.value
  if (selectedSort.value !== 'featured') query.sort = selectedSort.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  router.replace({ query })
}

const activeFiltersCount = computed(() => {
  let count = 0
  if (searchQuery.value.trim()) count++
  if (selectedCategory.value !== 'all') count++
  if (selectedPriceRange.value !== 'all') count++
  if (selectedSort.value !== 'featured') count++
  return count
})

const selectCategory = (catId: string) => {
  selectedCategory.value = catId
  currentPage.value = 1
  syncQuery()
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
})

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

const resetAllFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedPriceRange.value = 'all'
  selectedSort.value = 'featured'
  currentPage.value = 1
  router.replace({ query: {} })
}

const changePage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return
  currentPage.value = newPage
  syncQuery()
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="space-y-6 pb-16 pt-2">
    <!-- Clean Minimalist Header -->
    <header
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-hairsoft"
    >
      <div>
        <nav
          aria-label="Breadcrumb"
          class="flex items-center gap-2 text-xs font-medium text-brand-muted mb-1"
        >
          <NuxtLink
            to="/"
            class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
          >
            ShelfStack
          </NuxtLink>
          <span class="text-brand-faint">/</span>
          <span class="text-brand-ink font-semibold">Katalog</span>
        </nav>

        <div class="flex items-center gap-2.5">
          <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0">
            Katalog Produk
          </h1>
          <span
            class="bg-brand-canvas-soft border border-brand-hair px-2.5 py-0.5 rounded-full text-xs font-semibold text-brand-muted tabular-nums"
          >
            {{ totalProducts }}
          </span>
        </div>
      </div>

      <div class="hidden sm:flex items-center gap-4 text-xs text-brand-muted">
        <span class="flex items-center gap-1.5">
          <i class="pi pi-shield text-brand-accent text-xs" />
          <span>Garansi 2 Tahun</span>
        </span>
        <span class="text-brand-faint">·</span>
        <span class="flex items-center gap-1.5">
          <i class="pi pi-truck text-brand-ink text-xs" />
          <span>Siap Kirim</span>
        </span>
      </div>
    </header>

    <!-- Toolbar: Search, Sort & View Controls -->
    <KatalogToolbar
      :search-query="searchQuery"
      :selected-sort="selectedSort"
      :sort-options="sortOptions"
      :grid-density="gridDensity"
      :active-filters-count="activeFiltersCount"
      @update:search-query="handleSearchUpdate"
      @update:selected-sort="handleSortUpdate"
      @update:grid-density="gridDensity = $event"
      @open-mobile-filter="showMobileFilterModal = true"
      @clear-search="clearSearch"
    />

    <!-- Active Filters Strip -->
    <KatalogActiveFilters
      :active-filters-count="activeFiltersCount"
      :search-query="searchQuery"
      :selected-category="selectedCategory"
      :category-label="categories.find((c) => c.id === selectedCategory)?.label"
      :selected-price-range="selectedPriceRange"
      :price-range-label="priceRanges.find((p) => p.id === selectedPriceRange)?.label"
      @clear-search="clearSearch"
      @clear-category="selectCategory('all')"
      @clear-price-range="handleClearPriceRange"
      @reset-all="resetAllFilters"
    />

    <!-- MAIN BODY: Sidebar + Product Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <KatalogSidebar
        :categories="categories"
        :selected-category="selectedCategory"
        :price-ranges="priceRanges"
        :selected-price-range="selectedPriceRange"
        @update:selected-category="selectCategory"
        @update:selected-price-range="handlePriceRangeUpdate"
        @reset="resetAllFilters"
      />

      <section class="lg:col-span-9 space-y-6">
        <ProductList
          :products="products"
          :loading="pending"
          :is-searching="activeFiltersCount > 0"
          :density="gridDensity"
          hide-actions
          @reset-filters="resetAllFilters"
        />

        <!-- Paginasi Server-side (Tier-1 E-Commerce Standard) -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between border-t border-brand-hairsoft pt-6"
        >
          <p class="text-xs text-brand-muted m-0">
            Halaman <span class="font-semibold text-brand-ink">{{ currentPage }}</span> dari
            <span class="font-semibold text-brand-ink">{{ totalPages }}</span>
          </p>
          <div class="flex items-center gap-1.5">
            <UiButton
              variant="secondary"
              size="sm"
              icon="pi-chevron-left"
              :disabled="currentPage <= 1 || pending"
              @click="changePage(currentPage - 1)"
            >
              Sebelumnya
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              icon="pi-chevron-right"
              :disabled="currentPage >= totalPages || pending"
              @click="changePage(currentPage + 1)"
            >
              Selanjutnya
            </UiButton>
          </div>
        </div>
      </section>
    </div>

    <!-- Mobile Filter Sheet Modal -->
    <KatalogMobileFilter
      :show="showMobileFilterModal"
      :categories="categories"
      :selected-category="selectedCategory"
      :price-ranges="priceRanges"
      :selected-price-range="selectedPriceRange"
      :filtered-products-count="totalProducts"
      @close="showMobileFilterModal = false"
      @update:selected-category="selectCategory"
      @update:selected-price-range="handlePriceRangeUpdate"
      @reset="resetAllFilters"
    />
  </div>
</template>
