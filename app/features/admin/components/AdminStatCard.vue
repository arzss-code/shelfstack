<script setup lang="ts">
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
        bg: 'bg-brand-success-tint text-brand-success-text border-brand-success-edge',
        badge: 'text-brand-success-text',
      }
    case 'warning':
      return {
        bg: 'bg-brand-warning-tint text-brand-warning-text border-brand-warning-edge',
        badge: 'text-brand-warning-text',
      }
    case 'danger':
      return {
        bg: 'bg-brand-danger-tint text-brand-danger-text border-brand-danger-edge',
        badge: 'text-brand-danger-text',
      }
    case 'info':
      return {
        bg: 'bg-brand-accent-tint text-brand-accent-text border-brand-accent-edge',
        badge: 'text-brand-accent-text',
      }
    case 'neutral':
    default:
      return {
        bg: 'bg-brand-canvas-soft text-brand-ink border-brand-hairsoft',
        badge: 'text-brand-muted',
      }
  }
})
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to || undefined"
    class="relative overflow-hidden rounded-card border p-5 transition-all duration-200 no-underline shadow-whisper"
    :class="[
      to ? 'hover:-translate-y-0.5 hover:shadow-floating cursor-pointer' : '',
      colorStyles.bg,
    ]"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1.5 flex-1 min-w-0">
        <p class="text-xs font-medium uppercase tracking-wider text-brand-muted m-0">
          {{ title }}
        </p>

        <div v-if="loading" class="h-8 w-28 animate-pulse rounded bg-brand-hairsoft" />
        <h3 v-else class="text-2xl font-bold tracking-tight tabular text-brand-ink m-0">
          {{ value }}
        </h3>

        <p v-if="subtitle" class="text-xs leading-relaxed text-brand-muted m-0">
          {{ subtitle }}
        </p>
      </div>

      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-hair bg-brand-canvas shadow-whisper"
      >
        <i :class="['pi text-lg', icon, colorStyles.badge]" />
      </div>
    </div>
  </component>
</template>
