<script setup lang="ts">
import { computed } from 'vue'
import { calculateClaimPercentage } from '~~/shared/schemas/flash-deals'

const props = withDefaults(
  defineProps<{
    claimed: number
    quota: number
    showLabel?: boolean
    theme?: 'dark' | 'light'
  }>(),
  {
    showLabel: true,
    theme: 'dark',
  },
)

const percentage = computed(() => calculateClaimPercentage(props.claimed, props.quota))
const remaining = computed(() => Math.max(0, props.quota - props.claimed))
const isAlmostGone = computed(() => percentage.value >= 75)
</script>

<template>
  <div class="w-full space-y-1.5" role="region" aria-label="Status Kuota Flash Sale">
    <div
      v-if="showLabel"
      class="flex items-center justify-between text-[11px] font-medium"
      :class="theme === 'dark' ? 'text-white/70' : 'text-brand-muted'"
    >
      <div class="flex items-center gap-1.5">
        <span
          :class="[
            isAlmostGone
              ? 'text-rose-400 font-bold'
              : theme === 'dark'
                ? 'text-white/90 font-semibold'
                : 'text-brand-ink font-semibold',
          ]"
        >
          Terjual {{ percentage }}%
        </span>
      </div>
      <span :class="theme === 'dark' ? 'text-white/50' : 'text-brand-faint'">
        Sisa {{ remaining }} dari {{ quota }} unit
      </span>
    </div>

    <!-- Progress Track & Fill with High-Contrast Solid Red -->
    <div
      class="h-2 w-full overflow-hidden rounded-full border"
      :class="
        theme === 'dark'
          ? 'bg-white/10 border-white/10'
          : 'bg-brand-canvas-soft border-brand-hairsoft'
      "
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`Tersisa ${remaining} dari ${quota} unit promo`"
    >
      <div
        class="h-full rounded-full transition-all duration-500 shadow-sm bg-gradient-to-r from-rose-600 to-rose-500"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>
