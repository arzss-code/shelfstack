<script setup lang="ts">
import { computed } from 'vue'
import type { UiSelectOption } from '~/components/ui/UiSelect.vue'
import type {
  WishlistSortOption,
  WishlistStockFilter,
} from '~/features/wishlist/utils/wishlist-helper'

interface StockChipOption {
  id: WishlistStockFilter
  label: string
  count: number
}

const props = defineProps<{
  searchQuery: string
  stockFilter: WishlistStockFilter
  sortBy: WishlistSortOption
  totalCount: number
  availableCount: number
  outOfStockCount: number
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:stockFilter': [value: WishlistStockFilter]
  'update:sortBy': [value: WishlistSortOption]
}>()

const stockOptions = computed<StockChipOption[]>(() => {
  const options: StockChipOption[] = [
    { id: 'all', label: 'Semua', count: props.totalCount },
    { id: 'available', label: 'Siap Dibeli', count: props.availableCount },
  ]
  if (props.outOfStockCount > 0 || props.stockFilter === 'out_of_stock') {
    options.push({ id: 'out_of_stock', label: 'Habis', count: props.outOfStockCount })
  }
  return options
})

const sortOptions: UiSelectOption[] = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Termurah' },
  { value: 'price_desc', label: 'Termahal' },
]

const onSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}

const onSortChange = (value: string) => {
  if (value === 'newest' || value === 'price_asc' || value === 'price_desc') {
    emit('update:sortBy', value)
  }
}
</script>

<template>
  <div
    class="wishlist-toolbar flex flex-col-reverse lg:flex-row lg:items-center justify-between gap-2.5"
    role="region"
    aria-label="Filter dan urutkan wishlist"
  >
    <!-- Stock Availability Chips -->
    <div
      class="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
      role="group"
      aria-label="Filter ketersediaan stok"
    >
      <button
        v-for="opt in stockOptions"
        :key="opt.id"
        type="button"
        :aria-pressed="stockFilter === opt.id"
        class="wishlist-chip inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap cursor-pointer transition-colors duration-150 motion-reduce:transition-none focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0"
        :class="
          stockFilter === opt.id
            ? 'bg-brand-ink text-brand-onink border-brand-ink'
            : 'bg-brand-canvas text-brand-muted border-brand-hair hover:text-brand-ink hover:border-brand-ink/40'
        "
        @click="emit('update:stockFilter', opt.id)"
      >
        <span>{{ opt.label }}</span>
        <span
          class="text-[11px] tabular-nums"
          :class="stockFilter === opt.id ? 'opacity-80' : 'text-brand-faint'"
        >
          {{ opt.count }}
        </span>
      </button>
    </div>

    <!-- Single-Line Search + Sort on Mobile and Desktop -->
    <div class="flex items-center gap-2 shrink-0">
      <div class="relative flex-1 min-w-0 lg:w-52 lg:flex-none">
        <label for="wishlist-search" class="sr-only">Cari produk di wishlist</label>
        <i
          class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-faint pointer-events-none"
          aria-hidden="true"
        />
        <input
          id="wishlist-search"
          name="q"
          type="search"
          autocomplete="off"
          :value="searchQuery"
          placeholder="Cari di wishlist…"
          class="wishlist-search-input w-full h-9 pl-8 pr-8 text-xs rounded-full border border-brand-hair bg-brand-canvas text-brand-ink placeholder:text-brand-faint transition-colors focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-inset focus:ring-brand-ink [&::-webkit-search-cancel-button]:hidden"
          @input="onSearchInput"
        />
        <button
          v-if="searchQuery"
          type="button"
          aria-label="Hapus pencarian wishlist"
          class="wishlist-clear-btn absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-brand-muted hover:text-brand-ink hover:bg-brand-field transition-colors focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0 cursor-pointer"
          @click="emit('update:searchQuery', '')"
        >
          <i class="pi pi-times text-[10px]" aria-hidden="true" />
        </button>
      </div>

      <UiSelect
        id="wishlist-sort"
        :model-value="sortBy"
        :options="sortOptions"
        size="sm"
        align="right"
        title="Urutkan produk wishlist"
        class="shrink-0"
        @update:model-value="onSortChange"
      />
    </div>
  </div>
</template>

<style scoped>
.wishlist-chip,
.wishlist-clear-btn {
  touch-action: manipulation;
}

@media (pointer: coarse) {
  .wishlist-chip {
    min-block-size: 36px;
    position: relative;
  }

  .wishlist-chip::after {
    content: '';
    position: absolute;
    inset: -4px 0;
  }

  .wishlist-search-input {
    min-block-size: 40px;
  }

  .wishlist-clear-btn::after {
    content: '';
    position: absolute;
    inset: -9px;
  }
}
</style>
