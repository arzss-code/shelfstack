<script setup lang="ts">
export type AddressFilterType = 'all' | 'default' | 'rumah' | 'kantor'

interface FilterOption {
  id: AddressFilterType
  label: string
}

const props = defineProps<{
  searchQuery: string
  activeFilter: AddressFilterType
}>()

const emit = defineEmits<{
  'update:searchQuery': [val: string]
  'update:activeFilter': [val: AddressFilterType]
}>()

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'Semua Alamat' },
  { id: 'default', label: 'Alamat Utama' },
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
  <div class="pt-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
    <div class="relative w-full sm:w-72">
      <i
        class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-faint"
        aria-hidden="true"
      />
      <input
        :value="searchQuery"
        type="text"
        placeholder="Cari penerima atau kota..."
        class="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-brand-hair bg-white text-brand-ink placeholder:text-brand-faint focus:outline-none focus:border-brand-ink transition-colors"
        @input="onSearchInput"
      />
    </div>

    <!-- Filter Chips -->
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
      <button
        v-for="opt in filterOptions"
        :key="opt.id"
        type="button"
        class="px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap active:scale-95"
        :class="[
          activeFilter === opt.id
            ? 'bg-brand-ink text-white border-brand-ink shadow-xs'
            : 'bg-brand-canvas text-brand-muted border-brand-hair hover:text-brand-ink hover:border-brand-ink/40',
        ]"
        @click="setFilter(opt.id)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
