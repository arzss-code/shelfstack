<script setup lang="ts">
export interface PriceRange {
  id: string
  label: string
}

export interface CategoryOption {
  id: string
  label: string
}

defineProps<{
  categories: CategoryOption[]
  selectedCategory: string
  priceRanges: PriceRange[]
  selectedPriceRange: string
}>()

const emit = defineEmits<{
  'update:selectedCategory': [value: string]
  'update:selectedPriceRange': [value: string]
  reset: []
}>()
</script>

<template>
  <aside class="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-40 select-none">
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
                ? 'bg-brand-ink text-white font-semibold shadow-whisper'
                : 'text-brand-muted bg-transparent hover:bg-brand-canvas-soft hover:text-brand-ink',
            ]"
            @click="emit('update:selectedCategory', cat.id)"
          >
            <span>{{ cat.label }}</span>
            <i v-if="selectedCategory === cat.id" class="pi pi-check text-[10px]" />
          </button>
        </div>
      </div>

      <!-- Price Range Filter Section -->
      <div class="space-y-2.5 pt-5">
        <h3 class="text-[11px] font-bold uppercase tracking-wider text-brand-muted m-0">
          Rentang Harga
        </h3>
        <div class="flex flex-col gap-1">
          <button
            v-for="range in priceRanges"
            :key="range.id"
            type="button"
            :class="[
              'text-left px-3 py-2 rounded-field text-xs font-medium transition-all cursor-pointer border-0 flex items-center justify-between',
              selectedPriceRange === range.id
                ? 'bg-brand-ink text-white font-semibold shadow-whisper'
                : 'text-brand-muted bg-transparent hover:bg-brand-canvas-soft hover:text-brand-ink',
            ]"
            @click="emit('update:selectedPriceRange', range.id)"
          >
            <span>{{ range.label }}</span>
            <i v-if="selectedPriceRange === range.id" class="pi pi-check text-[10px]" />
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
