<script setup lang="ts">
import { computed } from 'vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'
import ProductList from '~/features/products/components/ProductList.vue'
import ProductCompactList from '~/features/products/components/ProductCompactList.vue'
import CategoryToolbar from '~/components/category/CategoryToolbar.vue'
import { CATEGORY_SORT_OPTIONS, useCategoryPage } from '~/composables/useCategoryPage'

const {
  slug,
  searchQuery,
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
} = useCategoryPage()

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

function onExploreCatalog() {
  return navigateTo('/katalog')
}
</script>

<template>
  <div class="space-y-5 pb-16">
    <!-- Breadcrumb Navigasi -->
    <nav aria-label="Breadcrumb" class="flex items-center gap-2 text-xs text-brand-muted">
      <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline text-brand-muted">
        Beranda
      </NuxtLink>
      <i class="pi pi-chevron-right text-[10px] text-brand-hair" aria-hidden="true" />
      <NuxtLink
        to="/katalog"
        class="hover:text-brand-ink transition-colors no-underline text-brand-muted"
      >
        Katalog
      </NuxtLink>
      <i class="pi pi-chevron-right text-[10px] text-brand-hair" aria-hidden="true" />
      <span class="font-medium text-brand-ink truncate max-w-[200px]">
        {{ currentCategory ? currentCategory.name : 'Kategori' }}
      </span>
    </nav>

    <!-- State: Kategori Ditemukan -->
    <template v-if="currentCategory">
      <header class="rounded-card border border-brand-hair bg-brand-canvas-soft p-4 sm:p-6">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div class="space-y-1.5 max-w-2xl min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs text-brand-muted font-medium tabular-nums">
                {{ totalProducts }} Produk Aktif
              </span>
            </div>
            <h1
              class="m-0 font-display text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight"
            >
              {{ currentCategory.name }}
            </h1>
            <p class="m-0 text-xs sm:text-sm text-brand-muted leading-relaxed">
              {{ currentCategory.description }}
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
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

        <!-- Ringkasan Informatif Kategori (dari data produk aktual) -->
        <dl
          v-if="!pending && products.length > 0"
          class="m-0 mt-4 pt-3.5 border-t border-brand-hairsoft grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-2 text-xs"
        >
          <div class="flex items-center gap-1.5">
            <dt class="text-brand-muted">Ketersediaan:</dt>
            <dd class="m-0 font-semibold text-brand-ink tabular-nums">
              {{ categoryInsights.inStockCount }}/{{ products.length }} siap kirim
            </dd>
          </div>
          <div v-if="categoryInsights.priceRangeText" class="flex items-center gap-1.5">
            <dt class="text-brand-muted">Rentang Harga:</dt>
            <dd class="m-0 font-semibold text-brand-ink tabular-nums">
              {{ categoryInsights.priceRangeText }}
            </dd>
          </div>
          <div v-if="categoryInsights.avgRatingText" class="flex items-center gap-1.5">
            <dt class="text-brand-muted">Rata-rata Ulasan:</dt>
            <dd
              class="m-0 inline-flex items-center gap-1 font-semibold text-brand-ink tabular-nums"
            >
              <i class="pi pi-star-fill text-[10px] text-brand-warning" aria-hidden="true" />
              <span>{{ categoryInsights.avgRatingText }}</span>
            </dd>
          </div>
        </dl>
      </header>

      <!-- Navigasi Cepat Antar Kategori (dengan jumlah produk nyata per kategori) -->
      <nav aria-label="Pilih kategori produk" class="min-w-0">
        <div
          class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:flex-wrap scroll-smooth"
        >
          <NuxtLink
            to="/katalog"
            class="inline-flex h-9 shrink-0 items-center rounded-full border border-brand-hair bg-brand-canvas px-3.5 text-xs font-medium text-brand-muted no-underline transition-colors hover:border-brand-ink/40 hover:text-brand-ink whitespace-nowrap"
          >
            Semua Katalog
          </NuxtLink>
          <NuxtLink
            v-for="cat in categoryNavItems"
            :key="cat.slug"
            :to="`/c/${cat.slug}`"
            :aria-current="cat.active ? 'page' : undefined"
            class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-colors no-underline whitespace-nowrap"
            :class="
              cat.active
                ? 'border-brand-ink bg-brand-ink text-brand-onink font-semibold shadow-whisper'
                : 'border-brand-hair bg-brand-canvas text-brand-muted font-medium hover:border-brand-ink/40 hover:text-brand-ink'
            "
          >
            <span>{{ cat.name }}</span>
            <span
              v-if="cat.count !== undefined"
              class="text-[11px] tabular-nums"
              :class="cat.active ? 'text-brand-onink' : 'text-brand-muted'"
            >
              ({{ cat.count }})
            </span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Category Interactive Toolbar -->
      <CategoryToolbar
        :selected-sort="selectedSort"
        :sort-options="CATEGORY_SORT_OPTIONS"
        :in-stock-only="inStockOnly"
        :view-mode="viewMode"
        :total-count="totalProducts"
        :displayed-count="products.length"
        :search-query="searchQuery"
        :selected-price-preset="selectedPricePreset"
        :selected-rating="selectedRating"
        :category-name="currentCategory.name"
        @update:selected-sort="onSortChange"
        @update:in-stock-only="onStockToggle"
        @update:view-mode="onViewModeChange"
        @update:search-query="onSearchChange"
        @update:selected-price-preset="onPricePresetChange"
        @update:selected-rating="onRatingChange"
        @clear-search="clearSearch"
        @reset-filters="resetFilters"
      />

      <!-- Daftar Produk Sesuai Mode Tampilan (Grid 6 Kolom atau Compact List) -->
      <section aria-label="Daftar Produk Kategori" class="min-w-0 space-y-6">
        <h2 class="sr-only">Katalog Produk {{ currentCategory.name }}</h2>

        <UiAlert
          v-if="categoryError"
          tone="danger"
          title="Gagal memuat produk kategori"
          class="text-xs"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span>Terjadi kendala saat mengambil daftar produk kategori.</span>
            <UiButton size="sm" variant="outline" @click="refreshCategoryProducts()">
              Coba Lagi
            </UiButton>
          </div>
        </UiAlert>

        <ProductList
          v-else-if="viewMode === 'grid'"
          :products="products"
          :loading="pending"
          :is-searching="hasActiveFilters"
          density="dense"
          hide-actions
          @reset-filters="resetFilters"
        />

        <ProductCompactList
          v-else
          :products="products"
          :loading="pending"
          :is-searching="hasActiveFilters"
          hide-actions
          @reset-filters="resetFilters"
        />

        <!-- Tombol Muat Lebih Banyak -->
        <div v-if="hasMore" class="flex justify-center pt-2">
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
