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
    class="sticky top-20 z-30 bg-brand-canvas/95 backdrop-blur-md py-3 px-4 rounded-card border border-brand-hair shadow-whisper flex flex-wrap items-center justify-between gap-3"
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
        class="absolute right-2.5 top-1/2 -translate-y-1/2"
      >
        <button
          type="button"
          class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[10px] text-brand-ink hover:text-brand-accent transition-colors cursor-pointer border-0"
          aria-label="Hapus pencarian"
          @click="emit('clearSearch')"
        >
          <i class="pi pi-times" />
        </button>
      </UiTooltip>
    </div>

    <!-- Controls Right: Mobile Filter Button, Sort Dropdown & Mode Switchers -->
    <div class="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-between sm:justify-end">
      <!-- Mobile Filter Button (lg:hidden) using UiButton -->
      <UiButton
        type="button"
        variant="secondary"
        size="sm"
        class="lg:hidden rounded-full font-semibold text-xs min-h-[44px]"
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

      <!-- View Mode & Density Controls (Desktop only) -->
      <div
        class="hidden sm:flex items-center bg-brand-field p-1 rounded-full border border-brand-hairsoft gap-1"
      >
        <!-- View Mode: Grid vs List -->
        <UiTooltip text="Tampilan Grid" position="top">
          <button
            type="button"
            :class="[
              'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0',
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

        <UiTooltip text="Tampilan List" position="top">
          <button
            type="button"
            :class="[
              'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0',
              viewMode === 'list'
                ? 'bg-brand-canvas text-brand-ink shadow-whisper'
                : 'text-brand-muted bg-transparent hover:text-brand-ink',
            ]"
            aria-label="Tampilan List"
            @click="emit('update:viewMode', 'list')"
          >
            <i class="pi pi-bars text-xs" aria-hidden="true" />
          </button>
        </UiTooltip>

        <!-- Divider if in grid mode to show 4 vs 3 cols -->
        <span v-if="viewMode === 'grid'" class="w-[1px] h-4 bg-brand-hair mx-0.5" />

        <template v-if="viewMode === 'grid'">
          <UiTooltip text="Tampilan 4 Kolom" position="top">
            <button
              type="button"
              :class="[
                'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0',
                gridDensity === 'compact'
                  ? 'bg-brand-canvas text-brand-ink shadow-whisper font-bold'
                  : 'text-brand-muted bg-transparent hover:text-brand-ink',
              ]"
              aria-label="Tampilan 4 Kolom"
              @click="emit('update:gridDensity', 'compact')"
            >
              <span class="text-[10px]">4</span>
            </button>
          </UiTooltip>
          <UiTooltip text="Tampilan 3 Kolom" position="top">
            <button
              type="button"
              :class="[
                'w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0',
                gridDensity === 'spacious'
                  ? 'bg-brand-canvas text-brand-ink shadow-whisper font-bold'
                  : 'text-brand-muted bg-transparent hover:text-brand-ink',
              ]"
              aria-label="Tampilan 3 Kolom"
              @click="emit('update:gridDensity', 'spacious')"
            >
              <span class="text-[10px]">3</span>
            </button>
          </UiTooltip>
        </template>
      </div>
    </div>
  </section>
</template>
