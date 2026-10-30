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

    <!-- Sort Selector -->
    <div class="flex items-center gap-2 shrink-0">
      <label for="review-sort" class="text-xs font-medium text-brand-muted"> Urutkan: </label>
      <select
        id="review-sort"
        :value="selectedSort"
        class="rounded-field border border-brand-hair bg-brand-canvas px-3 py-1.5 text-xs font-medium text-brand-ink transition-colors hover:border-brand-ink focus:border-brand-ink focus:outline-none"
        @change="
          emit(
            'change-sort',
            ($event.target as HTMLSelectElement).value as 'newest' | 'highest' | 'lowest',
          )
        "
      >
        <option value="newest">Terbaru</option>
        <option value="highest">Rating Tertinggi</option>
        <option value="lowest">Rating Terendah</option>
      </select>
    </div>
  </div>
</template>
