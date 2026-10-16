<script setup lang="ts">
interface Props {
  title: string
  value: string
  subtitle?: string
  icon: string
  color?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'brand'
  to?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  color: 'brand',
  to: '',
  loading: false,
})

const colorStyles = computed(() => {
  switch (props.color) {
    case 'emerald':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40',
        badge: 'text-emerald-700 dark:text-emerald-400',
      }
    case 'amber':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/40',
        badge: 'text-amber-700 dark:text-amber-400',
      }
    case 'rose':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800/40',
        badge: 'text-rose-700 dark:text-rose-400',
      }
    case 'indigo':
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/40',
        badge: 'text-indigo-700 dark:text-indigo-400',
      }
    case 'brand':
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
        <p class="text-xs font-medium uppercase tracking-wider text-brand-muted m-0 truncate">
          {{ title }}
        </p>

        <div v-if="loading" class="h-8 w-28 animate-pulse rounded bg-brand-hairsoft" />
        <h3 v-else class="text-2xl font-bold tracking-tight text-brand-ink m-0 truncate">
          {{ value }}
        </h3>

        <p v-if="subtitle" class="text-xs text-brand-muted m-0 truncate">
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
