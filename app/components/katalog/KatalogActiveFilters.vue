<script setup lang="ts">
defineProps<{
  activeFiltersCount: number
  searchQuery: string
  selectedCategory: string
  categoryLabel?: string
  selectedPriceRange: string
  priceRangeLabel?: string
}>()

const emit = defineEmits<{
  clearSearch: []
  clearCategory: []
  clearPriceRange: []
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
      <button
        type="button"
        class="hover:text-red-500 cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
        title="Hapus filter pencarian"
        @click="emit('clearSearch')"
      >
        <i class="pi pi-times text-[10px]" />
      </button>
    </span>

    <!-- Category tag -->
    <span
      v-if="selectedCategory !== 'all' && categoryLabel"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink border border-brand-hairsoft"
    >
      <span>Kategori: {{ categoryLabel }}</span>
      <button
        type="button"
        class="hover:text-red-500 cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
        title="Hapus filter kategori"
        @click="emit('clearCategory')"
      >
        <i class="pi pi-times text-[10px]" />
      </button>
    </span>

    <!-- Price range tag -->
    <span
      v-if="selectedPriceRange !== 'all' && priceRangeLabel"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink border border-brand-hairsoft"
    >
      <span>Harga: {{ priceRangeLabel }}</span>
      <button
        type="button"
        class="hover:text-red-500 cursor-pointer border-0 bg-transparent p-0 inline-flex items-center"
        title="Hapus filter harga"
        @click="emit('clearPriceRange')"
      >
        <i class="pi pi-times text-[10px]" />
      </button>
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
