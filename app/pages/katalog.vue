<script setup lang="ts">
import { useCategories } from '~/composables/useCategories'
import { useKatalogFilters } from '~/composables/useKatalogFilters'
import ProductList from '~/features/products/components/ProductList.vue'
import KatalogToolbar from '~/components/katalog/KatalogToolbar.vue'
import KatalogSidebar from '~/components/katalog/KatalogSidebar.vue'
import KatalogActiveFilters from '~/components/katalog/KatalogActiveFilters.vue'
import KatalogMobileFilter from '~/components/katalog/KatalogMobileFilter.vue'
import type { Product } from '~/types/product'

useSeoMeta({
  title: 'Katalog Produk - ShelfStack',
  description:
    'Jelajahi etalase ShelfStack: peralatan presisi, koleksi meja kerja, furnitur, dan perkakas terkurasi berkualitas tinggi.',
})

const { categories: dynamicCategories, fetchCategories } = useCategories()

const {
  searchQuery,
  selectedCategory,
  selectedPriceRange,
  selectedSort,
  currentPage,
  gridDensity,
  showMobileFilterModal,
  itemsPerPage,
  queryParams,
  sortOptions,
  priceRanges,
  activeFiltersCount,
  selectCategory,
  clearSearch,
  handleSearchUpdate,
  handleSortUpdate,
  handlePriceRangeUpdate,
  handleClearPriceRange,
  resetAllFilters,
  changePage,
} = useKatalogFilters()

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

onMounted(async () => {
  await fetchCategories()
})
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- Clean Minimalist Header -->
    <header class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
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
        <h1 class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0">Katalog</h1>
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
              @click="changePage(currentPage - 1, totalPages)"
            >
              Sebelumnya
            </UiButton>
            <UiButton
              variant="secondary"
              size="sm"
              icon="pi-chevron-right"
              :disabled="currentPage >= totalPages || pending"
              @click="changePage(currentPage + 1, totalPages)"
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
