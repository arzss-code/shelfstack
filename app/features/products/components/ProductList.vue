<script setup lang="ts">
import type { Product } from '~/types/product'
import ProductCard from './ProductCard.vue'

defineProps<{
  products: Product[]
  loading: boolean
  isSearching?: boolean
  isTrash?: boolean
  /** Mode etalase publik: sembunyikan tombol edit/hapus, kartu klik ke detail. */
  hideActions?: boolean
  /** Kepadatan grid: compact (4 kolom) atau spacious (3 kolom) */
  density?: 'compact' | 'spacious'
}>()

const emit = defineEmits<{
  edit: [product: Product]
  delete: [id: number]
  restore: [id: number]
  resetFilters: []
}>()
</script>

<template>
  <div>
    <!-- Loading State: Modernist Skeletal Grid -->
    <div
      v-if="loading"
      :class="[
        'grid gap-6',
        density === 'spacious'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      ]"
    >
      <div
        v-for="i in 8"
        :key="i"
        class="flex flex-col bg-brand-canvas border border-brand-hairsoft/80 rounded-2xl overflow-hidden animate-pulse"
      >
        <div class="aspect-square w-full bg-brand-field" />
        <div class="p-3.5 space-y-2 flex-1">
          <div class="h-3.5 w-3/4 bg-brand-field rounded" />
          <div class="h-2.5 w-1/3 bg-brand-field rounded" />
          <div class="pt-2 border-t border-brand-hairsoft/60 flex items-center justify-between">
            <div class="h-4 w-20 bg-brand-field rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State: Modernist Composed Empty View -->
    <div
      v-else-if="products.length === 0"
      class="flex flex-col items-center justify-center py-20 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card text-center my-6"
    >
      <template v-if="isSearching">
        <div
          class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mb-4 text-brand-muted shadow-whisper"
        >
          <i class="pi pi-search text-xl" />
        </div>
        <h3 class="font-display m-0 mb-2 text-lg font-bold text-brand-ink">Tidak ada produk</h3>
        <p class="font-body m-0 text-sm text-brand-muted max-w-md leading-relaxed">
          Belum ada produk aktif yang ditemukan dengan kata kunci atau filter saat ini.
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
      </template>

      <template v-else-if="isTrash">
        <div
          class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mb-4 text-brand-muted shadow-whisper"
        >
          <i class="pi pi-trash text-xl" />
        </div>
        <h3 class="font-display m-0 mb-2 text-lg font-bold text-brand-ink">
          Keranjang Sampah Kosong
        </h3>
        <p class="font-body m-0 text-sm text-brand-muted max-w-md leading-relaxed">
          Tidak ada produk yang dihapus saat ini. Semua data tersimpan dengan aman di database.
        </p>
      </template>

      <template v-else>
        <div
          class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mb-4 text-brand-muted shadow-whisper"
        >
          <i class="pi pi-box text-xl" />
        </div>
        <h3 class="font-display m-0 mb-2 text-lg font-bold text-brand-ink">Tidak ada hasil</h3>
        <p class="font-body m-0 text-sm text-brand-muted max-w-md leading-relaxed">
          Belum ada produk dalam katalog. Anda dapat mulai menambahkan item baru melalui dashboard
          manajemen katalog.
        </p>
      </template>
    </div>

    <!-- Product Grid: Modernist Product Cards -->
    <div
      v-else
      :class="[
        'grid gap-6',
        density === 'spacious'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      ]"
    >
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :hide-actions="hideActions"
        :is-trash="isTrash"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
        @restore="emit('restore', $event)"
      />
    </div>
  </div>
</template>
