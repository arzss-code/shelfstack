<script setup lang="ts">
import { computed } from 'vue'
import type { ProductReviewsSummary } from '~/types/review'

const props = defineProps<{
  summary: ProductReviewsSummary
  selectedStar: number | null
}>()

const emit = defineEmits<{
  'select-star': [star: number]
}>()

const formattedAverage = computed(() => {
  const avg = props.summary.average_rating || 0
  return avg.toFixed(1)
})

const distributionList = computed(() => {
  const total = props.summary.total_reviews || 0
  return [5, 4, 3, 2, 1].map((star) => {
    const count = props.summary.distribution?.[star] || 0
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0
    return {
      star,
      count,
      percentage,
    }
  })
})

const handleStarClick = (star: number) => {
  emit('select-star', star)
}
</script>

<template>
  <UiCard :padded="true" class="bg-brand-canvas border-brand-hair shadow-whisper">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      <!-- Left: Large Average Score Bento -->
      <div
        class="md:col-span-4 flex flex-col items-center justify-center text-center sm:border-r sm:border-brand-hairsoft sm:pr-6"
      >
        <span class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
          Skor Kepuasan
        </span>
        <div class="mt-2 flex items-baseline gap-1">
          <span
            class="font-display text-4xl sm:text-5xl font-bold tracking-tight text-brand-ink tabular-nums"
          >
            {{ formattedAverage }}
          </span>
          <span class="font-display text-base font-medium text-brand-muted"> / 5.0 </span>
        </div>

        <div
          class="mt-2 flex items-center gap-1"
          :aria-label="`Rata-rata ${formattedAverage} dari 5 bintang`"
        >
          <i
            v-for="s in 5"
            :key="s"
            :class="[
              'pi',
              s <= Math.round(summary.average_rating || 0)
                ? 'pi-star-fill text-amber-400'
                : 'pi-star text-stone-200',
              'text-sm',
            ]"
          />
        </div>

        <p class="m-0 mt-2 text-xs text-brand-muted">
          Berdasarkan {{ summary.total_reviews }} ulasan pelanggan
        </p>
      </div>

      <!-- Right: Interactive Rating Distribution Bar Chart -->
      <div class="md:col-span-8 space-y-2">
        <button
          v-for="item in distributionList"
          :key="item.star"
          type="button"
          :class="[
            'group flex w-full items-center gap-3 rounded-field px-2.5 py-1.5 text-left text-xs transition-colors',
            selectedStar === item.star
              ? 'bg-brand-canvas-soft ring-1 ring-brand-ink'
              : 'hover:bg-brand-canvas-soft',
          ]"
          :aria-label="`Filter ulasan ${item.star} bintang, ${item.count} ulasan`"
          @click="handleStarClick(item.star)"
        >
          <!-- Star label -->
          <div class="flex items-center gap-1 w-14 shrink-0 font-medium text-brand-ink">
            <span>{{ item.star }}</span>
            <i class="pi pi-star-fill text-amber-400 text-[11px]" />
          </div>

          <!-- Distribution Bar Track -->
          <div class="relative h-2 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              class="h-full rounded-full bg-amber-400 transition-all duration-300"
              :style="{ width: `${item.percentage}%` }"
            />
          </div>

          <!-- Count & Percentage -->
          <div class="w-16 shrink-0 text-right font-mono text-[11px] text-brand-muted tabular-nums">
            {{ item.count }} ({{ item.percentage }}%)
          </div>
        </button>
      </div>
    </div>
  </UiCard>
</template>
