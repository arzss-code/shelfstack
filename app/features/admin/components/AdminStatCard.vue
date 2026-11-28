<script setup lang="ts">
import { NuxtLink } from '#components'

export type AdminStatTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface Props {
  title: string
  value: string
  subtitle?: string
  icon: string
  color?: AdminStatTone
  to?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  color: 'neutral',
  to: '',
  loading: false,
})

/*
 * Semua warna KPI memakai satu ramp status brand yang sama dengan UiBadge, UiAlert,
 * dan toast, jadi kartu sekelompok selalu terbaca sebagai satu keluarga.
 */
const colorStyles = computed(() => {
  switch (props.color) {
    case 'success':
      return {
        iconBox: 'border-brand-success-edge bg-brand-success-tint text-brand-success-text',
      }
    case 'warning':
      return {
        iconBox: 'border-brand-warning-edge bg-brand-warning-tint text-brand-warning-text',
      }
    case 'danger':
      return {
        iconBox: 'border-brand-danger-edge bg-brand-danger-tint text-brand-danger-text',
      }
    case 'info':
      return {
        iconBox: 'border-brand-accent-edge bg-brand-accent-tint text-brand-accent-text',
      }
    case 'neutral':
    default:
      return {
        iconBox: 'border-brand-hair bg-brand-canvas-soft text-brand-ink',
      }
  }
})
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to || undefined"
    class="block relative overflow-hidden rounded-card border border-brand-hair bg-brand-canvas p-4 no-underline shadow-whisper"
    :class="
      to
        ? 'transition-colors duration-150 hover:border-brand-ink focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-2 cursor-pointer group'
        : ''
    "
  >
    <div class="space-y-2 min-w-0">
      <div class="flex items-center justify-between gap-2">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted m-0 truncate">
          {{ title }}
        </p>
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
          :class="colorStyles.iconBox"
        >
          <i :class="['pi text-xs', icon]" aria-hidden="true" />
        </div>
      </div>

      <div v-if="loading" class="h-7 w-28 animate-pulse rounded bg-brand-hairsoft" />
      <h3
        v-else
        class="font-display text-xl sm:text-2xl font-bold tracking-tight tabular text-brand-ink m-0 truncate"
        :title="value"
      >
        {{ value }}
      </h3>

      <div v-if="subtitle || to" class="flex items-center justify-between gap-2">
        <p v-if="subtitle" class="text-[11px] leading-relaxed text-brand-muted m-0">
          {{ subtitle }}
        </p>
        <span
          v-if="to"
          class="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-brand-ink opacity-70 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          <span>Lihat</span>
          <i class="pi pi-arrow-right text-[9px]" />
        </span>
      </div>
    </div>
  </component>
</template>
