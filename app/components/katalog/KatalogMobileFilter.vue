<script setup lang="ts">
import type { CategoryOption, PriceRange } from './KatalogSidebar.vue'
import type { RatingOption } from '~/composables/useKatalogFilters'

defineProps<{
  show: boolean
  categories: CategoryOption[]
  selectedCategory: string
  priceRanges: PriceRange[]
  selectedPriceRange: string
  ratingOptions?: RatingOption[]
  selectedRating?: string
  filteredProductsCount: number
}>()

const emit = defineEmits<{
  close: []
  'update:selectedCategory': [value: string]
  'update:selectedPriceRange': [value: string]
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

      <!-- Mobile Price Filter -->
      <div class="space-y-2 pt-2 border-t border-brand-hairsoft">
        <label class="text-[11px] font-bold uppercase tracking-wider text-brand-muted block">
          Rentang Harga
        </label>
        <div class="grid grid-cols-2 gap-1.5">
          <button
            v-for="range in priceRanges"
            :key="range.id"
            type="button"
            :class="[
              'p-2.5 rounded-field text-xs font-medium border text-center transition-colors cursor-pointer truncate',
              selectedPriceRange === range.id
                ? 'bg-brand-ink text-white border-brand-ink font-semibold'
                : 'bg-brand-canvas-soft border-brand-hair text-brand-muted hover:text-brand-ink',
            ]"
            @click="emit('update:selectedPriceRange', range.id)"
          >
            {{ range.label }}
          </button>
        </div>
      </div>

      <!-- Mobile Rating Filter -->
      <div
        v-if="ratingOptions && ratingOptions.length > 0"
        class="space-y-2 pt-2 border-t border-brand-hairsoft"
      >
        <label class="text-[11px] font-bold uppercase tracking-wider text-brand-muted block">
          Rating Ulasan
        </label>
        <div class="grid grid-cols-1 gap-1.5">
          <button
            v-for="r in ratingOptions"
            :key="r.id"
            type="button"
            :class="[
              'p-2.5 rounded-field text-xs font-medium border text-center transition-colors cursor-pointer truncate flex items-center justify-center gap-1.5',
              selectedRating === r.id
                ? 'bg-brand-ink text-white border-brand-ink font-semibold'
                : 'bg-brand-canvas-soft border-brand-hair text-brand-muted hover:text-brand-ink',
            ]"
            @click="emit('update:selectedRating', r.id)"
          >
            <i v-if="r.id !== 'all'" class="pi pi-star-fill text-[11px] text-brand-warning" />
            <span>{{ r.label }}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Actions using UiButton -->
      <div class="pt-4 border-t border-brand-hairsoft flex items-center gap-3">
        <UiButton variant="secondary" size="sm" block @click="emit('reset')">
          Reset Filter
        </UiButton>
        <UiButton variant="primary" size="sm" block @click="emit('close')">
          Terapkan ({{ filteredProductsCount }})
        </UiButton>
      </div>
    </div>
  </div>
</template>
