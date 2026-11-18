<script setup lang="ts">
import UiSelect from '~/components/ui/UiSelect.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiTooltip from '~/components/ui/UiTooltip.vue'
import type { SortOption } from '~/components/katalog/KatalogToolbar.vue'

defineProps<{
  selectedSort: string
  sortOptions: SortOption[]
  inStockOnly: boolean
  viewMode: 'grid' | 'list'
  totalCount: number
  displayedCount: number
}>()

const emit = defineEmits<{
  'update:selectedSort': [value: string]
  'update:inStockOnly': [value: boolean]
  'update:viewMode': [value: 'grid' | 'list']
}>()
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper"
    data-testid="category-toolbar"
  >
    <!-- Left: Product Count Information -->
    <div class="flex items-center gap-2 text-xs text-brand-muted">
      <span class="font-medium text-brand-ink">
        {{ displayedCount }} dari {{ totalCount }} Produk
      </span>
      <span v-if="inStockOnly" class="text-brand-faint">·</span>
      <span v-if="inStockOnly" class="text-brand-success font-medium">Stok Tersedia</span>
    </div>

    <!-- Right Controls: In-Stock Filter, Sort Select & View Mode Toggle -->
    <div class="flex flex-wrap items-center gap-2.5 ml-auto">
      <!-- In-Stock Toggle Button -->
      <UiButton
        type="button"
        size="sm"
        :variant="inStockOnly ? 'primary' : 'outline'"
        icon="pi-check"
        class="min-h-[44px] text-xs font-semibold rounded-full px-3.5"
        @click="emit('update:inStockOnly', !inStockOnly)"
      >
        <span>Stok Tersedia</span>
      </UiButton>

      <!-- Sort Dropdown using UiSelect -->
      <UiSelect
        :model-value="selectedSort"
        :options="sortOptions.map((s) => ({ value: s.id, label: s.label }))"
        prefix="Urutkan:"
        size="sm"
        pill
        align="right"
        @update:model-value="emit('update:selectedSort', String($event))"
      />

      <!-- View Mode Switcher: Grid vs Compact List -->
      <div
        class="inline-flex items-center bg-brand-field p-0.5 rounded-full border border-brand-hairsoft"
        role="group"
        aria-label="Mode Tampilan Produk"
      >
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
            <i class="pi pi-th-large" aria-hidden="true" />
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
            <i class="pi pi-bars" aria-hidden="true" />
          </button>
        </UiTooltip>
      </div>
    </div>
  </div>
</template>
