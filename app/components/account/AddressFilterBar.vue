<script setup lang="ts">
export type AddressFilterType = 'all' | 'default' | 'rumah' | 'kantor'

interface FilterOption {
  id: AddressFilterType
  label: string
}

defineProps<{
  searchQuery: string
  activeFilter: AddressFilterType
}>()

const emit = defineEmits<{
  'update:searchQuery': [val: string]
  'update:activeFilter': [val: AddressFilterType]
}>()

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'Semua' },
  { id: 'default', label: 'Utama' },
  { id: 'rumah', label: 'Rumah' },
  { id: 'kantor', label: 'Kantor' },
]

const onSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:searchQuery', target.value)
}

const setFilter = (filter: AddressFilterType) => {
  emit('update:activeFilter', filter)
}
</script>

<template>
  <div
    class="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5"
    role="region"
    aria-label="Filter dan cari alamat"
  >
    <!-- Filter Chips -->
    <div
      class="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
      role="group"
      aria-label="Filter kategori alamat"
    >
      <button
        v-for="opt in filterOptions"
        :key="opt.id"
        type="button"
        :aria-pressed="activeFilter === opt.id"
        class="address-chip px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors duration-150 cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0"
        :class="
          activeFilter === opt.id
            ? 'bg-brand-ink text-brand-onink border-brand-ink'
            : 'bg-brand-canvas text-brand-muted border-brand-hair hover:text-brand-ink hover:border-brand-ink/40'
        "
        @click="setFilter(opt.id)"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Compact Search Input -->
    <div class="relative w-full sm:w-64 shrink-0">
      <label for="address-search" class="sr-only">Cari penerima, jalan, atau kota</label>
      <i
        class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-faint pointer-events-none"
        aria-hidden="true"
      />
      <input
        id="address-search"
        name="q"
        type="search"
        autocomplete="off"
        :value="searchQuery"
        placeholder="Cari penerima atau kota…"
        class="address-search-input w-full h-9 pl-8 pr-8 text-xs rounded-full border border-brand-hair bg-brand-canvas text-brand-ink placeholder:text-brand-faint transition-colors focus:border-brand-ink focus:outline-none focus:ring-1 focus:ring-inset focus:ring-brand-ink [&::-webkit-search-cancel-button]:hidden"
        @input="onSearchInput"
      />
      <button
        v-if="searchQuery"
        type="button"
        aria-label="Hapus pencarian alamat"
        class="address-clear-btn absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-brand-muted hover:text-brand-ink hover:bg-brand-field transition-colors focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0 cursor-pointer"
        @click="emit('update:searchQuery', '')"
      >
        <i class="pi pi-times text-[10px]" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.address-chip,
.address-clear-btn {
  touch-action: manipulation;
}

@media (pointer: coarse) {
  .address-chip {
    min-block-size: 36px;
    position: relative;
  }

  .address-chip::after {
    content: '';
    position: absolute;
    inset: -4px 0;
  }

  .address-search-input {
    min-block-size: 40px;
  }

  .address-clear-btn::after {
    content: '';
    position: absolute;
    inset: -9px;
  }
}
</style>
