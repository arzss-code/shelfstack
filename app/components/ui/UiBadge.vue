<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    /** Resep warna status, satu ramp yang sama dipakai badge, alert, dan toast. */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }>(),
  { variant: 'default' },
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-brand-success-tint text-brand-success-text border-brand-success-edge'
    case 'warning':
      return 'bg-brand-warning-tint text-brand-warning-text border-brand-warning-edge'
    case 'danger':
      return 'bg-brand-danger-tint text-brand-danger-text border-brand-danger-edge'
    case 'info':
      return 'bg-brand-accent-tint text-brand-accent-text border-brand-accent-edge'
    case 'default':
    default:
      return 'bg-brand-neutral-tint text-brand-muted border-brand-hair'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
    :class="variantClasses"
  >
    {{ label }}
  </span>
</template>
