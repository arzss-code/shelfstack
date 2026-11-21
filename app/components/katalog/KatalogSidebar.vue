<script setup lang="ts">
import type { RatingOption } from '~/composables/useKatalogFilters'
import KatalogPriceRangeFilter from './KatalogPriceRangeFilter.vue'

export interface CategoryOption {
  id: string
  label: string
}

defineProps<{
  categories: CategoryOption[]
  selectedCategory: string
  minPrice?: number
  maxPrice?: number
  selectedPriceChip?: string
  inStockOnly?: boolean
  ratingOptions?: RatingOption[]
  selectedRating?: string
}>()

const emit = defineEmits<{
  'update:selectedCategory': [value: string]
  applyPriceRange: [min?: number, max?: number, chipId?: string]
  clearPriceRange: []
  toggleInStock: []
  'update:selectedRating': [value: string]
  reset: []
}>()
</script>

<template>
  <aside class="hidden lg:flex lg:col-span-3 flex-col gap-6 select-none">
    <UiCard :padded="true">
      <!-- Filter Header -->
      <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft mb-5">
        <div class="flex items-center gap-2">
          <i class="pi pi-sliders-h text-sm text-brand-ink" />
          <h2 class="font-display text-sm font-bold text-brand-ink m-0">Filter Produk</h2>
        </div>
        <button
          type="button"
          class="text-xs text-brand-muted hover:text-brand-ink transition-colors cursor-pointer border-0 bg-transparent font-medium"
          @click="emit('reset')"
        >
          Reset
        </button>
      </div>

      <!-- Category Filter Section -->
      <div class="space-y-2.5 pb-5 border-b border-brand-hairsoft">
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-brand-muted m-0">
          Kategori
        </h3>
        <div class="flex flex-col gap-1">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            :class="[
              'text-left px-3 py-2 rounded-field text-xs font-medium transition-all cursor-pointer border-0 flex items-center justify-between',
              selectedCategory === cat.id
                ? 'bg-brand-ink text-brand-onink font-semibold shadow-whisper'
                : 'text-brand-muted bg-transparent hover:bg-brand-canvas-soft hover:text-brand-ink',
            ]"
            @click="emit('update:selectedCategory', cat.id)"
          >
            <span>{{ cat.label }}</span>
            <i v-if="selectedCategory === cat.id" class="pi pi-check text-[10px]" />
          </button>
        </div>
      </div>

      <!-- In-Stock Only Toggle Section -->
      <div class="py-4 border-b border-brand-hairsoft flex items-center justify-between">
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

      <!-- Price Range Filter Section -->
      <div class="space-y-2.5 py-5 border-b border-brand-hairsoft">
        <div class="flex items-center justify-between">
          <h3 class="text-[11px] font-bold uppercase tracking-wider text-brand-muted m-0">
            Rentang Harga
          </h3>
          <button
            v-if="minPrice !== undefined || maxPrice !== undefined"
            type="button"
            class="text-[11px] text-brand-accent hover:underline cursor-pointer border-0 bg-transparent p-0"
            @click="emit('clearPriceRange')"
          >
            Hapus
          </button>
        </div>
        <KatalogPriceRangeFilter
          :min-price="minPrice"
          :max-price="maxPrice"
          :selected-chip="selectedPriceChip"
          @apply-range="(min, max, chip) => emit('applyPriceRange', min, max, chip)"
          @clear-range="emit('clearPriceRange')"
        />
      </div>

      <!-- Rating Filter Section -->
      <div v-if="ratingOptions && ratingOptions.length > 0" class="space-y-2.5 pt-5">
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-brand-muted m-0">
          Rating Ulasan
        </h3>
        <div class="flex flex-col gap-1">
          <button
            v-for="r in ratingOptions"
            :key="r.id"
            type="button"
            :class="[
              'text-left px-3 py-2 rounded-field text-xs font-medium transition-all cursor-pointer border-0 flex items-center justify-between',
              selectedRating === r.id
                ? 'bg-brand-ink text-brand-onink font-semibold shadow-whisper'
                : 'text-brand-muted bg-transparent hover:bg-brand-canvas-soft hover:text-brand-ink',
            ]"
            @click="emit('update:selectedRating', r.id)"
          >
            <div class="flex items-center gap-1.5">
              <i v-if="r.id !== 'all'" class="pi pi-star-fill text-[11px] text-brand-warning" />
              <span>{{ r.label }}</span>
            </div>
            <i v-if="selectedRating === r.id" class="pi pi-check text-[10px]" />
          </button>
        </div>
      </div>

      <!-- Service Reassurance -->
      <div class="pt-5 mt-5 border-t border-brand-hairsoft space-y-2.5">
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-brand-muted m-0">
          Jaminan ShelfStack
        </h3>
        <div class="space-y-2 text-xs text-brand-muted">
          <div class="flex items-center gap-2">
            <i class="pi pi-check-circle text-brand-success text-xs" />
            <span>100% Produk Original</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-shield text-brand-accent text-xs" />
            <span>Garansi Resmi 2 Tahun</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-truck text-brand-ink text-xs" />
            <span>Gratis Ongkir min. Rp500rb</span>
          </div>
        </div>
      </div>
    </UiCard>
  </aside>
</template>
