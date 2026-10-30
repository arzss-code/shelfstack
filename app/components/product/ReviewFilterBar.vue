<script setup lang="ts">
defineProps<{
  selectedStar: number | null
  selectedSort: 'newest' | 'highest' | 'lowest'
}>()

const emit = defineEmits<{
  'select-star': [star: number | null]
  'change-sort': [sort: 'newest' | 'highest' | 'lowest']
}>()

const starFilterPills: Array<{ label: string; value: number | null }> = [
  { label: 'Semua', value: null },
  { label: '5 Bintang', value: 5 },
  { label: '4 Bintang', value: 4 },
  { label: '3 Bintang', value: 3 },
  { label: '2 Bintang', value: 2 },
  { label: '1 Bintang', value: 1 },
]

const sortOptions: Array<{ value: 'newest' | 'highest' | 'lowest'; label: string }> = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'highest', label: 'Rating Tertinggi' },
  { value: 'lowest', label: 'Rating Terendah' },
]
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
    <!-- Filter Pills -->
    <div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Filter ulasan">
      <button
        v-for="pill in starFilterPills"
        :key="pill.value ?? 'all'"
        type="button"
        :class="[
          'rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-150',
          selectedStar === pill.value || (pill.value === null && selectedStar === null)
            ? 'bg-brand-ink text-brand-onink shadow-whisper'
            : 'bg-brand-canvas border border-brand-hair text-brand-muted hover:border-brand-ink hover:text-brand-ink',
        ]"
        @click="emit('select-star', pill.value)"
      >
        {{ pill.label }}
      </button>
    </div>

    <!-- Sort Selector using UiSelect Component -->
    <div class="shrink-0">
      <UiSelect
        :model-value="selectedSort"
        :options="sortOptions"
        prefix="Urutkan:"
        size="sm"
        :pill="true"
        align="right"
        title="Urutkan ulasan"
        @update:model-value="emit('change-sort', $event as 'newest' | 'highest' | 'lowest')"
      />
    </div>
  </div>
</template>
