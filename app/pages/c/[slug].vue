<script setup lang="ts">
import { useCategories, CANONICAL_CATEGORIES } from '~/composables/useCategories'
import ProductList from '~/features/products/components/ProductList.vue'
import ProductCompactList from '~/features/products/components/ProductCompactList.vue'
import CategoryToolbar from '~/components/category/CategoryToolbar.vue'
import type { SortOption } from '~/components/katalog/KatalogToolbar.vue'
import type { Product } from '~/types/product'

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
}

const sortOptions: SortOption[] = [
  { id: 'featured', label: 'Pilihan Kurator' },
  { id: 'popular', label: 'Paling Populer' },
  { id: 'price-low', label: 'Harga: Rendah ke Tinggi' },
  { id: 'price-high', label: 'Harga: Tinggi ke Rendah' },
  { id: 'name-asc', label: 'Nama: A-Z' },
]

const route = useRoute()
const router = useRouter()

const slug = computed(() =>
  String(route.params.slug || '')
    .trim()
    .toLowerCase(),
)

const selectedSort = ref((route.query.sort as string) || 'featured')
const inStockOnly = ref(route.query.stock === 'in_stock')
const viewMode = ref<'grid' | 'list'>((route.query.view as 'grid' | 'list') || 'grid')
const pageLimit = 16
const currentPage = ref(1)

const syncQuery = () => {
  router.replace({
    query: {
      ...route.query,
      sort: selectedSort.value !== 'featured' ? selectedSort.value : undefined,
      stock: inStockOnly.value ? 'in_stock' : undefined,
      view: viewMode.value !== 'grid' ? viewMode.value : undefined,
    },
  })
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

const onViewModeChange = (newMode: 'grid' | 'list') => {
  viewMode.value = newMode
  syncQuery()
}

const resetFilters = () => {
  selectedSort.value = 'featured'
  inStockOnly.value = false
  currentPage.value = 1
  syncQuery()
}

const { categories, fetchCategories } = useCategories()

onMounted(async () => {
  if (categories.value.length === 0) {
    await fetchCategories()
  }
})

const currentCategory = computed(() => {
  const currentSlug = slug.value
  return (
    categories.value.find((c) => c.slug.toLowerCase() === currentSlug) ||
    CANONICAL_CATEGORIES.find((c) => c.slug.toLowerCase() === currentSlug) ||
    null
  )
})

const pageTitle = computed(() => {
  if (!currentCategory.value) {
    return 'Kategori Tidak Ditemukan - ShelfStack'
  }
  return `${currentCategory.value.name} - Koleksi Terkurasi ShelfStack`
})

const pageDescription = computed(() => {
  return (
    currentCategory.value?.description ||
    'Jelajahi etalase kategori terkurasi resmi di ShelfStack dengan standar kualitas terpercaya.'
  )
})

useSeoMeta({
  title: () => pageTitle.value,
  description: () => pageDescription.value,
  ogTitle: () => pageTitle.value,
  ogDescription: () => pageDescription.value,
  ogImage: () => currentCategory.value?.image_url || '/logo.svg',
})

const { data: catalogResponse, pending } = useAsyncData<CatalogApiResponse>(
  () =>
    `category-products-${slug.value}-${selectedSort.value}-${inStockOnly.value}-${currentPage.value}`,
  () =>
    $fetch<CatalogApiResponse>('/api/products', {
      params: {
        category: slug.value,
        sort: selectedSort.value,
        stock_status: inStockOnly.value ? 'in_stock' : undefined,
        limit: pageLimit * currentPage.value,
        page: 1,
      },
    }),
  {
    watch: [slug, selectedSort, inStockOnly, currentPage],
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

const loadMore = () => {
  if (hasMore.value && !pending.value) {
    currentPage.value++
  }
}

function onExploreCatalog() {
  return navigateTo('/katalog')
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
    <!-- Breadcrumb Navigasi -->
    <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs text-brand-muted">
      <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline">
        Beranda
      </NuxtLink>
      <i class="pi pi-chevron-right text-[10px] text-brand-hair" aria-hidden="true" />
      <NuxtLink to="/katalog" class="hover:text-brand-ink transition-colors no-underline">
        Katalog
      </NuxtLink>
      <i class="pi pi-chevron-right text-[10px] text-brand-hair" aria-hidden="true" />
      <span class="font-medium text-brand-ink truncate max-w-[200px]">
        {{ currentCategory ? currentCategory.name : 'Kategori' }}
      </span>
    </nav>

    <!-- State: Kategori Ditemukan -->
    <template v-if="currentCategory">
      <header
        class="relative overflow-hidden rounded-card border border-brand-hair bg-brand-canvas-soft p-6 sm:p-8"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="space-y-2 max-w-2xl">
            <div class="flex items-center gap-2">
              <UiBadge variant="info" label="Kategori Resmi" />
              <span class="text-xs text-brand-muted font-medium">
                {{ totalProducts }} Produk Aktif
              </span>
            </div>
            <h1
              class="m-0 font-display text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight"
            >
              {{ currentCategory.name }}
            </h1>
            <p class="m-0 text-sm sm:text-base text-brand-muted leading-relaxed">
              {{ currentCategory.description }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
            <UiButton
              variant="outline"
              size="sm"
              icon="pi-sliders-h"
              :to="'/katalog?category=' + currentCategory.slug"
            >
              Filter Lengkap di Katalog
            </UiButton>
          </div>
        </div>
      </header>

      <!-- Category Interactive Toolbar -->
      <CategoryToolbar
        :selected-sort="selectedSort"
        :sort-options="sortOptions"
        :in-stock-only="inStockOnly"
        :view-mode="viewMode"
        :total-count="totalProducts"
        :displayed-count="products.length"
        @update:selected-sort="onSortChange"
        @update:in-stock-only="onStockToggle"
        @update:view-mode="onViewModeChange"
      />

      <!-- Daftar Produk Sesuai Mode Tampilan -->
      <section aria-label="Daftar Produk Kategori" class="space-y-6">
        <h2 class="sr-only">Katalog Produk {{ currentCategory.name }}</h2>

        <ProductList
          v-if="viewMode === 'grid'"
          :products="products"
          :loading="pending"
          density="spacious"
          hide-actions
          @reset-filters="resetFilters"
        />

        <ProductCompactList
          v-else
          :products="products"
          :loading="pending"
          hide-actions
          @reset-filters="resetFilters"
        />

        <!-- Tombol Muat Lebih Banyak -->
        <div v-if="hasMore" class="flex justify-center pt-4">
          <UiButton
            variant="outline"
            size="sm"
            icon="pi-arrow-down"
            :loading="pending"
            class="rounded-full px-6 py-2.5 font-medium text-xs"
            @click="loadMore"
          >
            Muat Lebih Banyak ({{ remainingCount }} Produk Tersisa)
          </UiButton>
        </div>
      </section>
    </template>

    <!-- State: Slug Kategori Tidak Dikenal -->
    <div v-else class="py-12">
      <UiEmptyState
        icon="pi-compass"
        title="Kategori Tidak Ditemukan"
        :description="`Kategori '${slug}' tidak terdaftar di etalase resmi ShelfStack.`"
        action-label="Jelajahi Semua Produk di Katalog"
        @action="onExploreCatalog"
      />
    </div>
  </div>
</template>
