<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import { useToast } from 'primevue/usetoast'
import { useCategories } from '~/composables/useCategories'
import ProductList from '~/features/products/components/ProductList.vue'
import KatalogToolbar, { type SortOption } from '~/components/katalog/KatalogToolbar.vue'
import KatalogSidebar, { type PriceRange } from '~/components/katalog/KatalogSidebar.vue'
import KatalogActiveFilters from '~/components/katalog/KatalogActiveFilters.vue'
import KatalogMobileFilter from '~/components/katalog/KatalogMobileFilter.vue'

useSeoMeta({
  title: 'Katalog Produk — ShelfStack',
  description:
    'Jelajahi etalase ShelfStack: peralatan presisi, koleksi meja kerja, furnitur, dan perkakas terkurasi berkualitas tinggi.',
})

const productStore = useProductStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const { categories: dynamicCategories, fetchCategories, CATEGORY_KEYWORDS } = useCategories()

const searchQuery = ref((route.query.q as string) || '')
const selectedCategory = ref((route.query.category as string) || 'all')
const selectedPriceRange = ref((route.query.price as string) || 'all')
const selectedSort = ref((route.query.sort as string) || 'featured')
const gridDensity = ref<'compact' | 'spacious'>('compact')
const showMobileFilterModal = ref(false)

// Kategori filter chips
const categories = computed(() => [
  { id: 'all', label: 'Semua Kategori', keywords: [] as string[] },
  ...dynamicCategories.value.map((c) => ({
    id: c.slug,
    label: c.name,
    keywords: CATEGORY_KEYWORDS[c.slug] ?? [],
  })),
])

const sortOptions: SortOption[] = [
  { id: 'featured', label: 'Pilihan Kurator' },
  { id: 'price-low', label: 'Harga: Rendah ke Tinggi' },
  { id: 'price-high', label: 'Harga: Tinggi ke Rendah' },
  { id: 'name-asc', label: 'Nama: A — Z' },
]

const priceRanges: PriceRange[] = [
  { id: 'all', label: 'Semua Harga' },
  { id: 'under500k', label: 'Di bawah Rp 500rb' },
  { id: '500k-2m', label: 'Rp 500rb – Rp 2jt' },
  { id: 'above2m', label: 'Di atas Rp 2jt' },
]

onMounted(async () => {
  try {
    await Promise.all([productStore.fetchProducts(), fetchCategories()])
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Memuat Katalog',
      detail: error instanceof Error ? error.message : 'Gagal mengambil daftar produk.',
      life: 5000,
    })
  }
})

// Sync query params when route changes
watch(
  () => route.query.q,
  (newQ) => {
    if (typeof newQ === 'string') searchQuery.value = newQ
  },
)

const syncQuery = () => {
  const query: Record<string, string> = {}
  if (searchQuery.value.trim()) query.q = searchQuery.value.trim()
  if (selectedCategory.value !== 'all') query.category = selectedCategory.value
  if (selectedPriceRange.value !== 'all') query.price = selectedPriceRange.value
  if (selectedSort.value !== 'featured') query.sort = selectedSort.value
  router.replace({ query })
}

const filteredProducts = computed(() => {
  let list = [...productStore.products]

  // 1. Text Search Filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    )
  }

  // 2. Category Filter
  if (selectedCategory.value !== 'all') {
    const cat = categories.value.find((c) => c.id === selectedCategory.value)
    if (cat && cat.keywords.length > 0) {
      list = list.filter((p) => {
        const text = `${p.name} ${p.description || ''}`.toLowerCase()
        return cat.keywords.some((kw) => text.includes(kw))
      })
    }
  }

  // 3. Price Range Filter
  if (selectedPriceRange.value === 'under500k') {
    list = list.filter((p) => p.price < 500000)
  } else if (selectedPriceRange.value === '500k-2m') {
    list = list.filter((p) => p.price >= 500000 && p.price <= 2000000)
  } else if (selectedPriceRange.value === 'above2m') {
    list = list.filter((p) => p.price > 2000000)
  }

  // 4. Sorting
  if (selectedSort.value === 'price-low') {
    list.sort((a, b) => a.price - b.price)
  } else if (selectedSort.value === 'price-high') {
    list.sort((a, b) => b.price - a.price)
  } else if (selectedSort.value === 'name-asc') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  return list
})

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
  syncQuery()
}

const clearSearch = () => {
  searchQuery.value = ''
  syncQuery()
}

const handleSearchUpdate = (val: string) => {
  searchQuery.value = val
  syncQuery()
}

const handleSortUpdate = (val: string) => {
  selectedSort.value = val
  syncQuery()
}

const handlePriceRangeUpdate = (val: string) => {
  selectedPriceRange.value = val
  syncQuery()
}

const handleClearPriceRange = () => {
  selectedPriceRange.value = 'all'
  syncQuery()
}

const resetAllFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedPriceRange.value = 'all'
  selectedSort.value = 'featured'
  router.replace({ query: {} })
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
            {{ filteredProducts.length }}
          </span>
        </div>
      </div>

      <!-- Quick subtle assurances -->
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
          :products="filteredProducts"
          :loading="productStore.loading"
          :is-searching="activeFiltersCount > 0"
          :density="gridDensity"
          hide-actions
        />

        <!-- Load More Action -->
        <div
          v-if="productStore.hasMore && activeFiltersCount === 0"
          class="flex justify-center pt-6"
        >
          <UiButton
            variant="secondary"
            :loading="productStore.loading"
            icon="pi-sync"
            @click="productStore.fetchProducts(true)"
          >
            Muat Lebih Banyak
          </UiButton>
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
      :filtered-products-count="filteredProducts.length"
      @close="showMobileFilterModal = false"
      @update:selected-category="selectCategory"
      @update:selected-price-range="handlePriceRangeUpdate"
      @reset="resetAllFilters"
    />
  </div>
</template>
