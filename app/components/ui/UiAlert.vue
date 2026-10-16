<script setup lang="ts">
import { computed } from 'vue'

export type UiAlertTone = 'danger' | 'warning' | 'info' | 'success'

const props = withDefaults(
  defineProps<{
    tone?: UiAlertTone
    title?: string
  }>(),
  { tone: 'info', title: '' },
)

const toneClass = computed(() => {
  switch (props.tone) {
    case 'danger':
      return 'border-brand-danger-edge bg-brand-danger-tint text-brand-danger-text'
    case 'warning':
      return 'border-brand-warning-edge bg-brand-warning-tint text-brand-warning-text'
    case 'success':
      return 'border-brand-success-edge bg-brand-success-tint text-brand-success-text'
    case 'info':
    default:
      return 'border-brand-hair bg-brand-canvas-soft text-brand-ink-soft'
  }
})

const iconClass = computed(() => {
  switch (props.tone) {
    case 'danger':
      return 'pi pi-exclamation-circle'
    case 'warning':
      return 'pi pi-exclamation-triangle'
    case 'success':
      return 'pi pi-check-circle'
    case 'info':
    default:
      return 'pi pi-info-circle'
  }
})
</script>

<template>
  <div
    role="status"
    :class="[
      'flex items-start gap-2.5 rounded-field border px-3.5 py-3 text-xs leading-relaxed',
      toneClass,
    ]"
  >
    <i :class="['pi', iconClass, 'mt-0.5 shrink-0 text-xs']" aria-hidden="true" />
    <div class="min-w-0 flex-1">
      <p v-if="title" class="m-0 font-semibold">{{ title }}</p>
      <div class="[&>:first-child]:mt-0 [&>*:last-child]:mb-0"><slot /></div>
    </div>
  </div>
</template>
