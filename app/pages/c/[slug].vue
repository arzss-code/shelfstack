<script setup lang="ts">
import { useCategories, CANONICAL_CATEGORIES } from '~/composables/useCategories'
import ProductList from '~/features/products/components/ProductList.vue'
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

const route = useRoute()
const slug = computed(() =>
  String(route.params.slug || '')
    .trim()
    .toLowerCase(),
)

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
  () => `category-products-${slug.value}`,
  () =>
    $fetch<CatalogApiResponse>('/api/products', {
      params: {
        category: slug.value,
        limit: 24,
      },
    }),
  {
    watch: [slug],
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

function onExploreCatalog() {
  return navigateTo('/katalog')
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
    <!-- Breadcrumb Navigasi -->
    <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs text-brand-muted">
      <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline"
        >Beranda</NuxtLink
      >
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

      <!-- Grid Daftar Produk -->
      <section aria-label="Daftar Produk Kategori" class="space-y-4">
        <h2 class="sr-only">Katalog Produk {{ currentCategory.name }}</h2>
        <ProductList :products="products" :loading="pending" density="spacious" hide-actions />
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
