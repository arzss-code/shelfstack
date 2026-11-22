<script setup lang="ts">
export interface SortOption {
  id: string
  label: string
}

withDefaults(
  defineProps<{
    searchQuery: string
    selectedSort: string
    sortOptions: SortOption[]
    gridDensity: 'compact' | 'spacious'
    activeFiltersCount: number
    viewMode?: 'grid' | 'list'
  }>(),
  {
    viewMode: 'grid',
  },
)

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:selectedSort': [value: string]
  'update:gridDensity': [value: 'compact' | 'spacious']
  'update:viewMode': [value: 'grid' | 'list']
  openMobileFilter: []
  clearSearch: []
}>()
</script>

<template>
  <section
    class="bg-brand-canvas py-3 px-4 rounded-card border border-brand-hair shadow-whisper flex flex-wrap items-center justify-between gap-3"
  >
    <!-- Search Input Field with UiInput Primitive -->
    <div class="relative w-full sm:w-80">
      <UiInput
        :model-value="searchQuery"
        type="search"
        size="sm"
        left-icon="pi-search"
        placeholder="Cari produk..."
        @update:model-value="emit('update:searchQuery', $event)"
      />
      <UiTooltip
        v-if="searchQuery"
        text="Hapus pencarian"
        position="top"
        class="absolute right-2 top-1/2 -translate-y-1/2"
      >
        <button
          type="button"
          class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft transition-colors cursor-pointer border-0"
          aria-label="Hapus pencarian"
          @click="emit('clearSearch')"
        >
          <i class="pi pi-times" />
        </button>
      </UiTooltip>
    </div>

    <!-- Controls Right: Mobile Filter Button, Sort Dropdown & Mode Switcher -->
    <div class="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-between sm:justify-end">
      <!-- Mobile Filter Button (lg:hidden) using UiButton -->
      <UiButton
        type="button"
        variant="secondary"
        size="sm"
        class="lg:hidden rounded-full font-semibold text-xs h-9"
        icon="pi-filter"
        @click="emit('openMobileFilter')"
      >
        <span>Filter</span>
        <span
          v-if="activeFiltersCount > 0"
          class="ml-1 w-4 h-4 rounded-full bg-brand-ink text-brand-onink text-[10px] flex items-center justify-center font-bold"
        >
          {{ activeFiltersCount }}
        </span>
      </UiButton>

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

      <!-- View Mode Switcher (Desktop only): Compact 2-way Grid vs List -->
      <div
        class="hidden sm:inline-flex items-center h-9 bg-brand-field p-1 rounded-full border border-brand-hairsoft gap-1"
        role="group"
        aria-label="Mode Tampilan Katalog"
      >
        <UiTooltip text="Tampilan Grid" position="top">
          <button
            type="button"
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0',
              viewMode === 'grid'
                ? 'bg-brand-canvas text-brand-ink shadow-whisper'
                : 'text-brand-muted bg-transparent hover:text-brand-ink',
            ]"
            aria-label="Tampilan Grid"
            @click="emit('update:viewMode', 'grid')"
          >
            <i class="pi pi-th-large text-xs" aria-hidden="true" />
          </button>
        </UiTooltip>

        <UiTooltip text="Tampilan Daftar" position="top">
          <button
            type="button"
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0',
              viewMode === 'list'
                ? 'bg-brand-canvas text-brand-ink shadow-whisper'
                : 'text-brand-muted bg-transparent hover:text-brand-ink',
            ]"
            aria-label="Tampilan Daftar"
            @click="emit('update:viewMode', 'list')"
          >
            <i class="pi pi-bars text-xs" aria-hidden="true" />
          </button>
        </UiTooltip>
      </div>
    </div>
  </section>
</template>
