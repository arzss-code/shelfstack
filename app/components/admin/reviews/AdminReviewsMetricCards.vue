<script setup lang="ts">
import type { AdminReviewMetrics } from '~/composables/useAdminReviews'

defineProps<{
  metrics: AdminReviewMetrics
  loading: boolean
}>()
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="admin-reviews-metrics">
    <!-- Card 1: Total Reviews -->
    <div
      class="p-4 sm:p-5 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between gap-2"
    >
      <div class="flex items-center justify-between">
        <span class="text-caption font-semibold text-brand-muted uppercase tracking-wider">
          Total Ulasan
        </span>
        <div
          class="w-8 h-8 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-ink"
        >
          <i class="pi pi-comments text-xs" />
        </div>
      </div>
      <div>
        <p class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0 tabular">
          {{ metrics.total }}
        </p>
        <p class="text-caption text-brand-muted m-0 mt-0.5">
          {{ metrics.active }} aktif, {{ metrics.hidden }} disembunyikan
        </p>
      </div>
    </div>

    <!-- Card 2: Average Rating -->
    <div
      class="p-4 sm:p-5 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between gap-2"
    >
      <div class="flex items-center justify-between">
        <span class="text-caption font-semibold text-brand-muted uppercase tracking-wider">
          Rata-rata Rating
        </span>
        <div
          class="w-8 h-8 rounded-full bg-brand-warning-tint text-brand-warning flex items-center justify-center"
        >
          <i class="pi pi-star-fill text-xs" />
        </div>
      </div>
      <div>
        <p class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0 tabular">
          {{ metrics.averageRating }} / 5.0
        </p>
        <div class="flex items-center gap-1 text-brand-warning mt-1">
          <i v-for="i in 5" :key="i" class="pi pi-star-fill text-[11px]" />
        </div>
      </div>
    </div>

    <!-- Card 3: 5 Star Reviews -->
    <div
      class="p-4 sm:p-5 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between gap-2"
    >
      <div class="flex items-center justify-between">
        <span class="text-caption font-semibold text-brand-muted uppercase tracking-wider">
          Bintang 5 Sempurna
        </span>
        <div
          class="w-8 h-8 rounded-full bg-brand-success-tint text-brand-success flex items-center justify-center"
        >
          <i class="pi pi-verified text-xs" />
        </div>
      </div>
      <div>
        <p class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0 tabular">
          {{ metrics.fiveStar }}
        </p>
        <p class="text-caption text-brand-success-text font-medium m-0 mt-0.5">
          {{ metrics.active > 0 ? Math.round((metrics.fiveStar / metrics.active) * 100) : 0 }}% dari
          ulasan aktif
        </p>
      </div>
    </div>

    <!-- Card 4: Attention Needed (<= 3 Stars) -->
    <div
      class="p-4 sm:p-5 rounded-card border border-brand-hair bg-brand-canvas shadow-whisper flex flex-col justify-between gap-2"
    >
      <div class="flex items-center justify-between">
        <span class="text-caption font-semibold text-brand-muted uppercase tracking-wider">
          Perlu Perhatian (Bintang &le; 3)
        </span>
        <div
          class="w-8 h-8 rounded-full bg-brand-danger-tint text-brand-danger flex items-center justify-center"
        >
          <i class="pi pi-exclamation-triangle text-xs" />
        </div>
      </div>
      <div>
        <p class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0 tabular">
          {{ metrics.attention }}
        </p>
        <p class="text-caption text-brand-muted m-0 mt-0.5">Ulasan perlu evaluasi layanan</p>
      </div>
    </div>
  </div>
</template>
