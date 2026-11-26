<script setup lang="ts">
import { computed } from 'vue'
import type { AdminReviewMetrics } from '~/composables/useAdminReviews'

const props = defineProps<{
  metrics: AdminReviewMetrics
  loading: boolean
}>()

const filledStarsCount = computed(() =>
  props.metrics.active > 0 ? Math.min(5, Math.max(0, Math.round(props.metrics.averageRating))) : 0,
)

const satisfactionRate = computed(() => {
  if (typeof props.metrics.positiveRate === 'number') return props.metrics.positiveRate
  if (props.metrics.active <= 0) return 0
  const positiveFallback = Math.max(0, props.metrics.active - props.metrics.attention)
  return Math.round((positiveFallback / props.metrics.active) * 100)
})

const formattedAverageRating = computed(() => {
  if (props.metrics.active <= 0) return '0.0'
  const avg = props.metrics.averageRating
  return Number.isInteger(avg) ? avg.toFixed(1) : String(avg)
})
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="admin-reviews-metrics">
    <!-- Card 1: Total Reviews -->
    <div
      class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between gap-2"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
          Total Ulasan
        </span>
        <div
          class="w-8 h-8 shrink-0 rounded-lg bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-ink"
        >
          <i class="pi pi-comments text-xs" aria-hidden="true" />
        </div>
      </div>
      <div>
        <p class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tabular">
          {{ metrics.total }}
        </p>
      </div>
    </div>

    <!-- Card 2: Average Rating -->
    <div
      class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between gap-2"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
          Rata-rata Rating
        </span>
        <div
          class="w-8 h-8 shrink-0 rounded-lg border border-brand-warning-edge bg-brand-warning-tint text-brand-warning-text flex items-center justify-center"
        >
          <i class="pi pi-star-fill text-xs" aria-hidden="true" />
        </div>
      </div>
      <div>
        <div class="flex items-baseline justify-between gap-2">
          <p class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tabular-nums">
            {{ formattedAverageRating }} / 5.0
          </p>
          <span
            v-if="metrics.active > 0"
            class="text-[11px] font-semibold text-brand-success-text tabular-nums"
          >
            {{ satisfactionRate }}% puas
          </span>
        </div>

        <div class="flex items-center justify-between gap-2 mt-1">
          <div class="flex items-center gap-0.5" aria-hidden="true">
            <i
              v-for="i in 5"
              :key="i"
              class="pi text-[10px]"
              :class="
                i <= filledStarsCount
                  ? 'pi-star-fill text-brand-warning'
                  : 'pi-star text-brand-hair'
              "
            />
          </div>
          <span v-if="metrics.active <= 0" class="text-[11px] text-brand-muted">
            Belum ada ulasan
          </span>
        </div>
      </div>
    </div>

    <!-- Card 3: 5 Star Reviews -->
    <div
      class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between gap-2"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
          Bintang 5 Sempurna
        </span>
        <div
          class="w-8 h-8 shrink-0 rounded-lg border border-brand-success-edge bg-brand-success-tint text-brand-success-text flex items-center justify-center"
        >
          <i class="pi pi-verified text-xs" aria-hidden="true" />
        </div>
      </div>
      <div>
        <p class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tabular">
          {{ metrics.fiveStar }}
        </p>
        <p class="text-[11px] text-brand-success-text font-medium m-0 mt-0.5">
          {{ metrics.active > 0 ? Math.round((metrics.fiveStar / metrics.active) * 100) : 0 }}% dari
          ulasan aktif
        </p>
      </div>
    </div>

    <!-- Card 4: Attention Needed (<= 3 Stars) -->
    <div
      class="p-4 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between gap-2"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
          Perlu Perhatian (Bintang &le; 3)
        </span>
        <div
          class="w-8 h-8 shrink-0 rounded-lg border border-brand-danger-edge bg-brand-danger-tint text-brand-danger-text flex items-center justify-center"
        >
          <i class="pi pi-exclamation-triangle text-xs" aria-hidden="true" />
        </div>
      </div>
      <div>
        <p class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tabular">
          {{ metrics.attention }}
        </p>
        <p class="text-[11px] text-brand-muted m-0 mt-0.5">Ulasan perlu evaluasi layanan</p>
      </div>
    </div>
  </div>
</template>
