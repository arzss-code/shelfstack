<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Teks di dalam badge */
    label: string
    /** Varian warna: 'default', 'success', 'warning', 'danger', 'info' */
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  }>(),
  {
    variant: 'default',
  },
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'warning':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'danger':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'info':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'default':
    default:
      return 'bg-brand-canvas-soft text-brand-muted border-brand-hair'
  }
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border',
      variantClasses,
    ]"
  >
    {{ label }}
  </span>
</template>
