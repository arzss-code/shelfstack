<script setup lang="ts">
defineProps<{
  activeFiltersCount: number
  searchQuery: string
  selectedCategory: string
  categoryLabel?: string
  priceRangeLabel?: string
  inStockOnly?: boolean
  selectedRating?: string
  ratingLabel?: string
}>()

const emit = defineEmits<{
  clearSearch: []
  clearCategory: []
  clearPriceRange: []
  clearInStock: []
  clearRating: []
  resetAll: []
}>()
</script>

<template>
  <div v-if="activeFiltersCount > 0" class="flex items-center flex-wrap gap-2 pt-1">
    <span class="text-xs font-semibold text-brand-muted">Filter Aktif:</span>

    <!-- Search keyword tag -->
    <span
      v-if="searchQuery.trim()"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink border border-brand-hairsoft"
    >
      <span>Kata Kunci: "{{ searchQuery }}"</span>
      <UiTooltip text="Hapus filter pencarian" position="top">
        <button
          type="button"
          class="hover:text-red-500 cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
          aria-label="Hapus filter pencarian"
          @click="emit('clearSearch')"
        >
          <i class="pi pi-times text-[10px]" />
        </button>
      </UiTooltip>
    </span>

    <!-- Category tag -->
    <span
      v-if="selectedCategory !== 'all' && categoryLabel"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink border border-brand-hairsoft"
    >
      <span>Kategori: {{ categoryLabel }}</span>
      <UiTooltip text="Hapus filter kategori" position="top">
        <button
          type="button"
          class="hover:text-red-500 cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
          aria-label="Hapus filter kategori"
          @click="emit('clearCategory')"
        >
          <i class="pi pi-times text-[10px]" />
        </button>
      </UiTooltip>
    </span>

    <!-- Price range tag -->
    <span
      v-if="priceRangeLabel"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink border border-brand-hairsoft"
    >
      <span>Harga: {{ priceRangeLabel }}</span>
      <UiTooltip text="Hapus filter harga" position="top">
        <button
          type="button"
          class="hover:text-red-500 cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
          aria-label="Hapus filter harga"
          @click="emit('clearPriceRange')"
        >
          <i class="pi pi-times text-[10px]" />
        </button>
      </UiTooltip>
    </span>

    <!-- In-Stock Only tag -->
    <span
      v-if="inStockOnly"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink border border-brand-hairsoft"
    >
      <span class="inline-flex items-center gap-1">
        <i class="pi pi-check text-[10px] text-brand-success" />
        <span>Stok Tersedia</span>
      </span>
      <UiTooltip text="Hapus filter stok tersedia" position="top">
        <button
          type="button"
          class="hover:text-red-500 cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
          aria-label="Hapus filter stok tersedia"
          @click="emit('clearInStock')"
        >
          <i class="pi pi-times text-[10px]" />
        </button>
      </UiTooltip>
    </span>

    <!-- Rating tag -->
    <span
      v-if="selectedRating && selectedRating !== 'all' && ratingLabel"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink border border-brand-hairsoft"
    >
      <span class="inline-flex items-center gap-1">
        <i class="pi pi-star-fill text-[10px] text-brand-warning" />
        <span>Rating: {{ ratingLabel }}</span>
      </span>
      <UiTooltip text="Hapus filter rating" position="top">
        <button
          type="button"
          class="hover:text-red-500 cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
          aria-label="Hapus filter rating"
          @click="emit('clearRating')"
        >
          <i class="pi pi-times text-[10px]" />
        </button>
      </UiTooltip>
    </span>

    <!-- Reset all button -->
    <button
      type="button"
      class="text-xs font-semibold text-brand-accent hover:underline cursor-pointer border-0 bg-transparent ml-1"
      @click="emit('resetAll')"
    >
      Hapus Semua Filter
    </button>
  </div>
</template>
