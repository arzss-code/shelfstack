<script setup lang="ts">
import type { Product } from '~/types/product'
import ProductCard from '~/features/products/components/ProductCard.vue'
import { useRelatedProducts } from '~/composables/useRelatedProducts'

const props = defineProps<{
  product: Product
}>()

const { relatedProducts, isLoading, isError, categoryName, viewAllUrl, fetchRelated } =
  useRelatedProducts(() => props.product)
</script>

<template>
  <section
    v-if="isLoading || isError || relatedProducts.length > 0"
    aria-labelledby="related-products-heading"
    class="space-y-6 pt-10 border-t border-brand-hair"
  >
    <!-- Section Header -->
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <div
          class="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-brand-muted mb-1"
        >
          <i class="pi pi-compass text-[11px]" aria-hidden="true" />
          <span>Kurasi Pilihan</span>
        </div>
        <h2
          id="related-products-heading"
          class="font-display text-xl sm:text-2xl font-bold tracking-tight text-brand-ink m-0"
        >
          Koleksi Terkait
        </h2>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
          Instrumen kerja dan perangkat kurasi serupa dengan standar kualitas resmi ShelfStack.
        </p>
      </div>

      <NuxtLink
        :to="viewAllUrl"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent hover:underline shrink-0 group no-underline"
      >
        <span>Lihat Semua di {{ categoryName }}</span>
        <i
          class="pi pi-arrow-right text-[10px] transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </NuxtLink>
    </div>

    <!-- 1. Loading State: 6 Skeleton Cards -->
    <div
      v-if="isLoading"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 animate-pulse"
      aria-busy="true"
      aria-label="Memuat rekomendasi produk terkait"
    >
      <div
        v-for="i in 6"
        :key="i"
        class="flex flex-col bg-brand-canvas border border-brand-hair rounded-card overflow-hidden"
      >
        <div class="aspect-square w-full bg-brand-field" />
        <div class="p-3.5 space-y-2.5 flex-1">
          <div class="h-3 w-1/3 bg-brand-field rounded" />
          <div class="h-4 w-3/4 bg-brand-field rounded" />
          <div class="pt-2 border-t border-brand-hairsoft flex items-center justify-between">
            <div class="h-4 w-20 bg-brand-field rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Error State -->
    <div
      v-else-if="isError && relatedProducts.length === 0"
      class="rounded-card border border-dashed border-brand-hair bg-brand-canvas-soft p-6 text-center text-xs text-brand-muted space-y-2"
    >
      <p class="m-0">Rekomendasi produk belum dapat dimuat saat ini.</p>
      <UiButton variant="outline" size="sm" icon="pi-refresh" @click="fetchRelated">
        Coba Lagi
      </UiButton>
    </div>

    <!-- 3. Success State: 6 Related Product Cards -->
    <div
      v-else-if="relatedProducts.length > 0"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
    >
      <ProductCard
        v-for="item in relatedProducts"
        :key="item.id"
        :product="item"
        :hide-actions="true"
      />
    </div>
  </section>
</template>
