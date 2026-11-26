<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AdminReviewStatus } from '~~/shared/schemas/review'
import type { AdminReviewMetrics } from '~/composables/useAdminReviews'

const props = defineProps<{
  metrics: AdminReviewMetrics
  activeStatus: AdminReviewStatus
  activeRating?: number
  searchQuery: string
}>()

const emit = defineEmits<{
  (e: 'update:status', value: AdminReviewStatus): void
  (e: 'update:rating', value: number | undefined): void
  (e: 'update:search', value: string): void
}>()

const localSearch = ref(props.searchQuery)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(localSearch, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:search', val)
  }, 300)
})

const statusOptions: {
  value: AdminReviewStatus
  label: string
  count: (m: AdminReviewMetrics) => number
}[] = [
  { value: 'all', label: 'Semua', count: (m) => m.total },
  { value: 'active', label: 'Aktif di Etalase', count: (m) => m.active },
  { value: 'hidden', label: 'Disembunyikan', count: (m) => m.hidden },
]

const ratingOptions = [
  { value: undefined, label: 'Semua Bintang' },
  { value: 5, label: '5 Bintang' },
  { value: 4, label: '4 Bintang' },
  { value: 3, label: '3 Bintang' },
  { value: 2, label: '2 Bintang' },
  { value: 1, label: '1 Bintang' },
]
</script>

<template>
  <div
    class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col md:flex-row md:items-center justify-between gap-4"
    data-testid="admin-reviews-filter-bar"
  >
    <!-- Status Tabs -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
      <button
        v-for="opt in statusOptions"
        :key="opt.value"
        type="button"
        class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 border cursor-pointer select-none"
        :class="[
          activeStatus === opt.value
            ? 'bg-brand-ink text-brand-onink border-brand-ink shadow-whisper'
            : 'bg-brand-canvas-soft text-brand-muted border-brand-hair hover:text-brand-ink hover:bg-brand-canvas',
        ]"
        @click="emit('update:status', opt.value)"
      >
        <span>{{ opt.label }}</span>
        <span
          class="px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular"
          :class="
            activeStatus === opt.value
              ? 'bg-brand-onink/15 text-brand-onink'
              : 'bg-brand-hair text-brand-muted'
          "
        >
          {{ opt.count(metrics) }}
        </span>
      </button>
    </div>

    <!-- Rating & Search Controls -->
    <div class="flex flex-wrap items-center gap-2.5">
      <!-- Rating Filter Pills -->
      <div class="flex items-center gap-1">
        <button
          v-for="r in ratingOptions"
          :key="String(r.value)"
          type="button"
          class="px-2.5 py-1.5 rounded-lg text-caption font-semibold transition-colors border cursor-pointer select-none"
          :class="[
            activeRating === r.value
              ? 'bg-brand-warning-tint text-brand-warning-text border-brand-warning-edge font-bold'
              : 'bg-brand-canvas-soft text-brand-muted border-brand-hair hover:text-brand-ink',
          ]"
          @click="emit('update:rating', r.value)"
        >
          <span v-if="r.value" class="flex items-center gap-1">
            <span>{{ r.value }}</span>
            <i class="pi pi-star-fill text-[9px] text-brand-warning" />
          </span>
          <span v-else>{{ r.label }}</span>
        </button>
      </div>

      <!-- Search Input -->
      <div class="relative min-w-[200px] flex-1 sm:flex-initial">
        <i
          class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-faint pointer-events-none"
        />
        <input
          v-model="localSearch"
          type="text"
          placeholder="Cari teks ulasan..."
          class="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-brand-hair bg-brand-canvas text-brand-ink placeholder:text-brand-faint focus:outline-none focus:border-brand-ink transition-colors"
        />
      </div>
    </div>
  </div>
</template>
