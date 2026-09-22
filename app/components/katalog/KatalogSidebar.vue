<script setup lang="ts">
export interface PriceRange {
  id: string
  label: string
}

defineProps<{
  priceRanges: PriceRange[]
  selectedPriceRange: string
}>()

const emit = defineEmits<{
  'update:selectedPriceRange': [value: string]
  reset: []
}>()
</script>

<template>
  <aside class="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-40">
    <UiCard :padded="true">
      <!-- Filter Header -->
      <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft mb-6">
        <div class="flex items-center gap-2">
          <i class="pi pi-sliders-h text-sm text-brand-ink" />
          <h2 class="font-display text-sm font-bold text-brand-ink m-0">Filter Produk</h2>
        </div>
        <button
          type="button"
          class="text-xs text-brand-muted hover:text-brand-ink transition-colors cursor-pointer border-0 bg-transparent"
          @click="emit('reset')"
        >
          Reset
        </button>
      </div>

      <!-- Price Range Filter -->
      <div class="space-y-3">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-brand-muted m-0">
          Rentang Harga
        </h3>
        <div class="flex flex-col gap-1.5">
          <button
            v-for="range in priceRanges"
            :key="range.id"
            type="button"
            :class="[
              'text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border-0',
              selectedPriceRange === range.id
                ? 'bg-brand-ink text-brand-onink'
                : 'text-brand-muted bg-transparent hover:bg-brand-canvas-soft hover:text-brand-ink',
            ]"
            @click="emit('update:selectedPriceRange', range.id)"
          >
            {{ range.label }}
          </button>
        </div>
      </div>

      <!-- Service Reassurance -->
      <div class="pt-6 mt-6 border-t border-brand-hairsoft space-y-3">
        <h3 class="text-xs font-semibold uppercase tracking-wider text-brand-muted m-0">
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
            <span>Gratis Ongkir &gt; Rp 200rb</span>
          </div>
        </div>
      </div>
    </UiCard>
  </aside>
</template>
