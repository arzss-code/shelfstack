<script setup lang="ts">
import type { CategoryOption } from './KatalogSidebar.vue'
import type { RatingOption } from '~/composables/useKatalogFilters'
import KatalogPriceRangeFilter from './KatalogPriceRangeFilter.vue'

defineProps<{
  show: boolean
  categories: CategoryOption[]
  selectedCategory: string
  minPrice?: number
  maxPrice?: number
  selectedPriceChip?: string
  inStockOnly?: boolean
  ratingOptions?: RatingOption[]
  selectedRating?: string
  filteredProductsCount: number
}>()

const emit = defineEmits<{
  close: []
  'update:selectedCategory': [value: string]
  applyPriceRange: [min?: number, max?: number, chipId?: string]
  clearPriceRange: []
  toggleInStock: []
  'update:selectedRating': [value: string]
  reset: []
}>()
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 lg:hidden select-none"
    @click.self="emit('close')"
  >
    <div
      class="w-full sm:max-w-md bg-brand-canvas rounded-t-card sm:rounded-card p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-floating border border-brand-hair"
    >
      <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Filter Katalog</h2>
        <button
          type="button"
          class="w-8 h-8 rounded-full bg-brand-field flex items-center justify-center text-brand-muted hover:text-brand-ink cursor-pointer border-0"
          @click="emit('close')"
        >
          <i class="pi pi-times text-xs" />
        </button>
      </div>

      <!-- Mobile Category Filter -->
      <div class="space-y-2">
        <label class="text-[11px] font-bold uppercase tracking-wider text-brand-muted block">
          Kategori
        </label>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            :class="[
              'p-2.5 rounded-field text-xs font-medium border text-center transition-colors cursor-pointer truncate',
              selectedCategory === cat.id
                ? 'bg-brand-ink text-white border-brand-ink font-semibold'
                : 'bg-brand-canvas-soft border-brand-hair text-brand-muted hover:text-brand-ink',
            ]"
            @click="emit('update:selectedCategory', cat.id)"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- Mobile In-Stock Toggle -->
      <div class="py-3 border-t border-b border-brand-hairsoft flex items-center justify-between">
        <div>
          <span class="text-xs font-semibold text-brand-ink block">Produk Tersedia</span>
          <span class="text-[11px] text-brand-muted block">Sembunyikan stok habis</span>
        </div>
        <button
          type="button"
          role="switch"
          :aria-checked="inStockOnly"
          class="w-10 h-6 rounded-full transition-colors relative cursor-pointer border-0 p-0.5"
          :class="inStockOnly ? 'bg-brand-ink' : 'bg-brand-hair'"
          @click="emit('toggleInStock')"
        >
          <span
            class="w-5 h-5 rounded-full bg-white block shadow-whisper transition-transform duration-200"
            :class="inStockOnly ? 'translate-x-4' : 'translate-x-0'"
          />
        </button>
      </div>

      <!-- Mobile Price Range Filter -->
      <div class="space-y-2">
        <label class="text-[11px] font-bold uppercase tracking-wider text-brand-muted block">
          Rentang Harga
        </label>
        <KatalogPriceRangeFilter
          :min-price="minPrice"
          :max-price="maxPrice"
          :selected-chip="selectedPriceChip"
          @apply-range="(min, max, chip) => emit('applyPriceRange', min, max, chip)"
          @clear-range="emit('clearPriceRange')"
        />
      </div>

      <!-- Mobile Rating Filter -->
      <div v-if="ratingOptions && ratingOptions.length > 0" class="space-y-2">
        <label class="text-[11px] font-bold uppercase tracking-wider text-brand-muted block">
          Rating Ulasan
        </label>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="r in ratingOptions"
            :key="r.id"
            type="button"
            :class="[
              'p-2.5 rounded-field text-xs font-medium border text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5',
              selectedRating === r.id
                ? 'bg-brand-ink text-white border-brand-ink font-semibold'
                : 'bg-brand-canvas-soft border-brand-hair text-brand-muted hover:text-brand-ink',
            ]"
            @click="emit('update:selectedRating', r.id)"
          >
            <i v-if="r.id !== 'all'" class="pi pi-star-fill text-[10px] text-brand-warning" />
            <span>{{ r.label }}</span>
          </button>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="pt-4 border-t border-brand-hairsoft flex items-center gap-2">
        <button
          type="button"
          class="flex-1 py-2.5 rounded-field bg-brand-ink text-white text-xs font-semibold hover:bg-brand-inkhover transition-colors cursor-pointer shadow-whisper"
          @click="emit('close')"
        >
          Tampilkan {{ filteredProductsCount }} Produk
        </button>
        <button
          type="button"
          class="py-2.5 px-3 rounded-field border border-brand-hair text-xs font-medium text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
          @click="emit('reset')"
        >
          Reset
        </button>
      </div>
    </div>
  </div>
</template>
