<script setup lang="ts">
import { computed } from 'vue'
import type { AdminReviewStatus } from '~~/shared/schemas/review'
import type { AdminReviewMetrics } from '~/composables/useAdminReviews'
import UiTabs, { type UiTabItem } from '~/components/ui/UiTabs.vue'
import UiSelect, { type UiSelectOption } from '~/components/ui/UiSelect.vue'
import UiInput from '~/components/ui/UiInput.vue'

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
  (e: 'submitSearch'): void
}>()

const statusTabs = computed<UiTabItem[]>(() => [
  { value: 'all', label: 'Semua', count: props.metrics.total },
  { value: 'active', label: 'Aktif di Etalase', count: props.metrics.active },
  { value: 'hidden', label: 'Disembunyikan', count: props.metrics.hidden },
])

const ratingSelectOptions: UiSelectOption[] = [
  { value: 'all', label: 'Semua Bintang' },
  { value: '5', label: '5 Bintang' },
  { value: '4', label: '4 Bintang' },
  { value: '3', label: '3 Bintang' },
  { value: '2', label: '2 Bintang' },
  { value: '1', label: '1 Bintang' },
]

const ratingModel = computed(() => (props.activeRating ? String(props.activeRating) : 'all'))

function onStatusChange(value: string) {
  emit('update:status', value as AdminReviewStatus)
}

function onRatingChange(value: string) {
  emit('update:rating', value && value !== 'all' ? Number(value) : undefined)
}
</script>

<template>
  <div
    class="rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between"
    data-testid="admin-reviews-filter-bar"
  >
    <UiTabs
      :model-value="activeStatus"
      :items="statusTabs"
      aria-label="Filter status moderasi ulasan"
      class="self-start"
      @update:model-value="onStatusChange"
    />

    <div class="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap lg:w-auto">
      <div class="w-full sm:w-40">
        <label for="admin-reviews-rating-filter" class="sr-only">Filter rating bintang</label>
        <UiSelect
          id="admin-reviews-rating-filter"
          :model-value="ratingModel"
          :options="ratingSelectOptions"
          size="sm"
          block
          aria-label="Filter rating bintang"
          @change="onRatingChange"
        />
      </div>

      <form class="w-full sm:w-60" @submit.prevent="emit('submitSearch')">
        <label for="admin-reviews-search" class="sr-only">Cari teks ulasan</label>
        <UiInput
          id="admin-reviews-search"
          :model-value="searchQuery"
          type="search"
          size="sm"
          left-icon="pi-search"
          placeholder="Cari teks ulasan..."
          @update:model-value="emit('update:search', $event)"
        />
      </form>
    </div>
  </div>
</template>
