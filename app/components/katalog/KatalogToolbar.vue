<script setup lang="ts">
export interface SortOption {
  id: string
  label: string
}

defineProps<{
  searchQuery: string
  selectedSort: string
  sortOptions: SortOption[]
  gridDensity: 'compact' | 'spacious'
  activeFiltersCount: number
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:selectedSort': [value: string]
  'update:gridDensity': [value: 'compact' | 'spacious']
  openMobileFilter: []
  clearSearch: []
}>()
</script>

<template>
  <section
    class="sticky top-20 z-30 bg-brand-canvas/95 backdrop-blur-md py-3 px-4 rounded-card border border-brand-hair shadow-whisper flex flex-wrap items-center justify-between gap-3"
  >
    <!-- Search Input Field -->
    <div class="relative w-full sm:w-80">
      <i
        class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-brand-faint z-10"
      />
      <input
        :value="searchQuery"
        type="text"
        placeholder="Cari produk..."
        aria-label="Cari produk..."
        class="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-brand-field text-brand-ink placeholder:text-brand-faint rounded-full border border-transparent outline-none focus:border-brand-hair focus:bg-brand-canvas focus:ring-2 focus:ring-brand-ink transition-all"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
      <UiTooltip
        v-if="searchQuery"
        text="Hapus pencarian"
        position="top"
        class="absolute right-2.5 top-1/2 -translate-y-1/2"
      >
        <button
          type="button"
          class="w-5 h-5 rounded-full bg-brand-hair flex items-center justify-center text-[10px] text-brand-ink hover:bg-brand-muted hover:text-white transition-colors cursor-pointer border-0"
          aria-label="Hapus pencarian"
          @click="emit('clearSearch')"
        >
          <i class="pi pi-times" />
        </button>
      </UiTooltip>
    </div>

    <!-- Controls Right: Mobile Filter Button, Sort Dropdown & Density Toggle -->
    <div class="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-between sm:justify-end">
      <!-- Mobile Filter Button (lg:hidden) -->
      <button
        type="button"
        class="lg:hidden inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-xs font-semibold text-brand-ink cursor-pointer"
        @click="emit('openMobileFilter')"
      >
        <i class="pi pi-filter text-xs" />
        <span>Filter</span>
        <span
          v-if="activeFiltersCount > 0"
          class="w-4 h-4 rounded-full bg-brand-ink text-white text-[10px] flex items-center justify-center font-bold"
        >
          {{ activeFiltersCount }}
        </span>
      </button>

      <!-- Sort Select Dropdown -->
      <UiSelect
        :model-value="selectedSort"
        :options="sortOptions.map((s) => ({ value: s.id, label: s.label }))"
        prefix="Urutkan:"
        size="sm"
        pill
        align="right"
        @update:model-value="emit('update:selectedSort', String($event))"
      />

      <!-- Grid Density Switcher (Desktop only) -->
      <div
        class="hidden sm:flex items-center bg-brand-field p-1 rounded-full border border-brand-hairsoft"
      >
        <UiTooltip text="Tampilan 4 Kolom" position="top">
          <button
            type="button"
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0',
              gridDensity === 'compact'
                ? 'bg-brand-canvas text-brand-ink shadow-whisper'
                : 'text-brand-muted bg-transparent hover:text-brand-ink',
            ]"
            aria-label="Tampilan 4 Kolom"
            @click="emit('update:gridDensity', 'compact')"
          >
            <i class="pi pi-th-large text-xs" />
          </button>
        </UiTooltip>
        <UiTooltip text="Tampilan 3 Kolom" position="top">
          <button
            type="button"
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0',
              gridDensity === 'spacious'
                ? 'bg-brand-canvas text-brand-ink shadow-whisper'
                : 'text-brand-muted bg-transparent hover:text-brand-ink',
            ]"
            aria-label="Tampilan 3 Kolom"
            @click="emit('update:gridDensity', 'spacious')"
          >
            <i class="pi pi-table text-xs" />
          </button>
        </UiTooltip>
      </div>
    </div>
  </section>
</template>
