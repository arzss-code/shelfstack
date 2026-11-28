<script setup lang="ts">
import { computed } from 'vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'
import type { SortOption } from '~/components/katalog/KatalogToolbar.vue'
import { CATEGORY_PRICE_PRESETS, CATEGORY_RATING_OPTIONS } from '~/composables/useCategoryPage'

const props = withDefaults(
  defineProps<{
    selectedSort: string
    sortOptions: SortOption[]
    inStockOnly: boolean
    viewMode: 'grid' | 'list'
    totalCount: number
    displayedCount: number
    searchQuery?: string
    selectedPricePreset?: string
    selectedRating?: string
    categoryName?: string
  }>(),
  {
    searchQuery: '',
    selectedPricePreset: 'all',
    selectedRating: 'all',
    categoryName: '',
  },
)

const emit = defineEmits<{
  'update:selectedSort': [value: string]
  'update:inStockOnly': [value: boolean]
  'update:viewMode': [value: 'grid' | 'list']
  'update:searchQuery': [value: string]
  'update:selectedPricePreset': [value: string]
  'update:selectedRating': [value: string]
  clearSearch: []
  resetFilters: []
}>()

const activePriceLabel = computed(
  () => CATEGORY_PRICE_PRESETS.find((p) => p.value === props.selectedPricePreset)?.label,
)
const activeRatingLabel = computed(
  () => CATEGORY_RATING_OPTIONS.find((r) => r.value === props.selectedRating)?.label,
)
const hasActiveFilters = computed(
  () =>
    Boolean(props.searchQuery.trim()) ||
    props.inStockOnly ||
    props.selectedPricePreset !== 'all' ||
    props.selectedRating !== 'all',
)
</script>

<template>
  <div
    class="rounded-card border border-brand-hair bg-brand-canvas p-3 sm:p-3.5 shadow-whisper space-y-2.5"
    data-testid="category-toolbar"
  >
    <!-- Primary Filter & Sort Row -->
    <div class="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
      <div class="relative w-full xl:w-64 shrink-0">
        <label for="category-search-input" class="sr-only">
          Cari produk{{ categoryName ? ` di ${categoryName}` : '' }}
        </label>
        <UiInput
          id="category-search-input"
          :model-value="searchQuery"
          type="search"
          size="sm"
          left-icon="pi-search"
          :placeholder="categoryName ? `Cari di ${categoryName}...` : 'Cari di kategori ini...'"
          @update:model-value="emit('update:searchQuery', $event)"
        />
        <button
          v-if="searchQuery.trim()"
          type="button"
          class="absolute end-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft transition-colors cursor-pointer border-0 bg-transparent focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink"
          aria-label="Hapus pencarian kategori"
          @click="emit('clearSearch')"
        >
          <i class="pi pi-times" aria-hidden="true" />
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2 min-w-0 xl:justify-end">
        <UiSelect
          :model-value="selectedPricePreset"
          :options="CATEGORY_PRICE_PRESETS.map((p) => ({ value: p.value, label: p.label }))"
          prefix="Harga:"
          size="sm"
          pill
          align="left"
          aria-label="Filter rentang harga kategori"
          @update:model-value="emit('update:selectedPricePreset', String($event))"
        />

        <UiSelect
          :model-value="selectedRating"
          :options="CATEGORY_RATING_OPTIONS.map((r) => ({ value: r.value, label: r.label }))"
          prefix="Rating:"
          size="sm"
          pill
          align="left"
          aria-label="Filter rating minimum kategori"
          @update:model-value="emit('update:selectedRating', String($event))"
        />

        <UiButton
          type="button"
          size="sm"
          :variant="inStockOnly ? 'primary' : 'outline'"
          icon="pi-check"
          :aria-pressed="inStockOnly"
          class="h-9 text-xs font-semibold rounded-full px-3.5 shrink-0"
          @click="emit('update:inStockOnly', !inStockOnly)"
        >
          <span>Stok Tersedia</span>
        </UiButton>

        <UiSelect
          :model-value="selectedSort"
          :options="sortOptions.map((s) => ({ value: s.id, label: s.label }))"
          prefix="Urutkan:"
          size="sm"
          pill
          align="right"
          aria-label="Urutkan produk kategori"
          @update:model-value="emit('update:selectedSort', String($event))"
        />

        <div
          class="inline-flex items-center h-9 bg-brand-field p-1 rounded-full border border-brand-hairsoft gap-1 shrink-0"
          role="group"
          aria-label="Mode Tampilan Produk"
        >
          <UiTooltip text="Tampilan Grid 6 Kolom" position="top">
            <button
              type="button"
              :aria-pressed="viewMode === 'grid'"
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0 focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink',
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
              :aria-pressed="viewMode === 'list'"
              :class="[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer border-0 focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink',
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
        </div>
      </div>
    </div>

    <!-- Result Summary & Active Filter Chips Row -->
    <div
      class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-brand-hairsoft text-xs text-brand-muted"
    >
      <div role="status" aria-live="polite" class="flex flex-wrap items-center gap-2">
        <span class="font-medium text-brand-ink tabular-nums">
          {{ displayedCount }} dari {{ totalCount }} Produk
        </span>
        <span v-if="inStockOnly" class="text-brand-faint" aria-hidden="true">·</span>
        <span v-if="inStockOnly" class="text-brand-success-text font-medium">
          Menampilkan stok tersedia
        </span>
      </div>

      <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-1.5">
        <span
          v-if="searchQuery.trim()"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-field text-[11px] font-medium text-brand-ink border border-brand-hairsoft"
        >
          <span>Kata kunci: "{{ searchQuery.trim() }}"</span>
          <button
            type="button"
            class="cursor-pointer border-0 bg-transparent p-0 text-brand-muted hover:text-brand-danger-text inline-flex items-center"
            aria-label="Hapus filter kata kunci"
            @click="emit('clearSearch')"
          >
            <i class="pi pi-times text-[10px]" aria-hidden="true" />
          </button>
        </span>

        <span
          v-if="selectedPricePreset !== 'all' && activePriceLabel"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-field text-[11px] font-medium text-brand-ink border border-brand-hairsoft"
        >
          <span>{{ activePriceLabel }}</span>
          <button
            type="button"
            class="cursor-pointer border-0 bg-transparent p-0 text-brand-muted hover:text-brand-danger-text inline-flex items-center"
            aria-label="Hapus filter harga"
            @click="emit('update:selectedPricePreset', 'all')"
          >
            <i class="pi pi-times text-[10px]" aria-hidden="true" />
          </button>
        </span>

        <span
          v-if="selectedRating !== 'all' && activeRatingLabel"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-field text-[11px] font-medium text-brand-ink border border-brand-hairsoft"
        >
          <span>{{ activeRatingLabel }}</span>
          <button
            type="button"
            class="cursor-pointer border-0 bg-transparent p-0 text-brand-muted hover:text-brand-danger-text inline-flex items-center"
            aria-label="Hapus filter rating"
            @click="emit('update:selectedRating', 'all')"
          >
            <i class="pi pi-times text-[10px]" aria-hidden="true" />
          </button>
        </span>

        <button
          type="button"
          class="ms-1 text-[11px] font-semibold text-brand-accent-text hover:underline cursor-pointer border-0 bg-transparent p-1"
          @click="emit('resetFilters')"
        >
          Reset Filter
        </button>
      </div>
    </div>
  </div>
</template>
