<script setup lang="ts">
import { computed } from 'vue'

export type UiAlertTone = 'danger' | 'warning' | 'info' | 'success' | 'error'

const props = withDefaults(
  defineProps<{
    tone?: UiAlertTone
    variant?: UiAlertTone
    title?: string
    align?: 'start' | 'center'
  }>(),
  { tone: undefined, variant: undefined, title: '', align: undefined },
)

const resolvedTone = computed<UiAlertTone>(() => {
  const val = props.tone || props.variant || 'info'
  return val === 'error' ? 'danger' : val
})

const toneClass = computed(() => {
  switch (resolvedTone.value) {
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
  switch (resolvedTone.value) {
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

const isCentered = computed(() => {
  if (props.align === 'center') return true
  if (props.align === 'start') return false
  return !props.title
})
</script>

<template>
  <div
    role="status"
    :class="[
      'flex gap-2.5 rounded-field border px-3.5 py-3 text-xs leading-relaxed',
      isCentered ? 'items-center' : 'items-start',
      toneClass,
    ]"
  >
    <i
      :class="['pi', iconClass, 'shrink-0 text-sm leading-none', isCentered ? '' : 'mt-0.5']"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <p v-if="title" class="m-0 font-semibold">
        {{ title }}
      </p>
      <div class="[&>:first-child]:mt-0 [&>*:last-child]:mb-0">
        <slot />
      </div>
    </div>
  </div>
</template>
