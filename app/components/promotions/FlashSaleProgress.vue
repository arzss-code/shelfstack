<script setup lang="ts">
import { computed } from 'vue'
import { calculateClaimPercentage } from '~~/shared/schemas/flash-deals'

const props = withDefaults(
  defineProps<{
    claimed: number
    quota: number
    showLabel?: boolean
  }>(),
  {
    showLabel: true,
  },
)

const percentage = computed(() => calculateClaimPercentage(props.claimed, props.quota))
const remaining = computed(() => Math.max(0, props.quota - props.claimed))
const isAlmostGone = computed(() => percentage.value >= 80)
</script>

<template>
  <div class="w-full space-y-1.5" role="region" aria-label="Status Kuota Flash Sale">
    <div
      v-if="showLabel"
      class="flex items-center justify-between text-[11px] font-medium text-brand-muted"
    >
      <div class="flex items-center gap-1">
        <i
          v-if="isAlmostGone"
          class="pi pi-bolt text-brand-warning animate-pulse"
          aria-hidden="true"
        />
        <span :class="{ 'text-brand-warning font-semibold': isAlmostGone }">
          Terjual {{ percentage }}%
        </span>
      </div>
      <span class="text-brand-faint"> Sisa {{ remaining }} unit </span>
    </div>

    <!-- Progress Track & Fill -->
    <div
      class="h-2 w-full overflow-hidden rounded-full bg-brand-hairsoft border border-brand-hair"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="`Tersisa ${remaining} dari ${quota} unit promo`"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="[
          isAlmostGone ? 'bg-gradient-to-r from-brand-warning to-brand-danger' : 'bg-brand-ink',
        ]"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>
