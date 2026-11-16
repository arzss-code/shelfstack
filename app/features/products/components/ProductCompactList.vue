<script setup lang="ts">
import type { Product } from '~/types/product'
import ProductCompactCard from './ProductCompactCard.vue'
import UiButton from '~/components/ui/UiButton.vue'

defineProps<{
  products: Product[]
  loading: boolean
  isSearching?: boolean
  hideActions?: boolean
}>()

const emit = defineEmits<{
  resetFilters: []
}>()
</script>

<template>
  <div class="space-y-3" data-testid="product-compact-list">
    <!-- Loading State: Skeletons -->
    <template v-if="loading">
      <div
        v-for="i in 6"
        :key="i"
        class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-card border border-brand-hair bg-brand-canvas animate-pulse"
      >
        <div class="flex items-center gap-4 flex-1 w-full">
          <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-media bg-brand-field shrink-0" />
          <div class="space-y-2.5 flex-1">
            <div class="h-3 w-20 bg-brand-field rounded" />
            <div class="h-4 w-3/5 bg-brand-field rounded" />
            <div class="h-3 w-4/5 bg-brand-field rounded hidden sm:block" />
            <div class="h-3 w-28 bg-brand-field rounded" />
          </div>
        </div>
        <div
          class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-36 gap-2"
        >
          <div class="h-5 w-24 bg-brand-field rounded" />
          <div class="h-8 w-20 bg-brand-field rounded" />
        </div>
      </div>
    </template>

    <!-- Empty State -->
    <template v-else-if="products.length === 0">
      <div
        class="flex flex-col items-center justify-center py-16 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card text-center my-4"
      >
        <div
          class="w-12 h-12 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mb-3 text-brand-muted shadow-whisper"
        >
          <i class="pi pi-box text-xl" />
        </div>
        <h3 class="m-0 font-display text-base font-bold text-brand-ink">
          Tidak ada produk ditemukan
        </h3>
        <p class="m-0 mt-1 font-body text-xs text-brand-muted max-w-sm leading-relaxed">
          Belum ada produk aktif yang sesuai dengan kriteria filter atau pencarian saat ini.
        </p>
        <UiButton
          variant="secondary"
          size="sm"
          class="mt-4"
          icon="pi-refresh"
          @click="emit('resetFilters')"
        >
          Reset Filter &amp; Tampilkan Semua
        </UiButton>
      </div>
    </template>

    <!-- Success State: List of Products -->
    <template v-else>
      <ProductCompactCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :hide-actions="hideActions"
      />
    </template>
  </div>
</template>
