<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Nama kelas ikon PrimeIcons, misal `pi-eye`. */
    icon: string
    /** Wajib untuk kontrol ikon-only agar tetap punya nama yang terbaca. */
    label: string
    variant?: 'neutral' | 'primary' | 'danger'
    size?: 'sm' | 'md'
    disabled?: boolean
    loading?: boolean
  }>(),
  { variant: 'neutral', size: 'sm', disabled: false, loading: false },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'border-brand-hair bg-brand-canvas text-brand-ink hover:border-brand-ink hover:bg-brand-canvas-soft'
    case 'danger':
      return 'border-transparent bg-transparent text-brand-muted hover:border-brand-danger-edge hover:bg-brand-danger-tint hover:text-brand-danger-text'
    case 'neutral':
    default:
      return 'border-brand-hair bg-brand-canvas text-brand-muted hover:border-brand-ink hover:text-brand-ink'
  }
})

const boxClass = computed(() => (props.size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-xs'))
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    :disabled="disabled || loading"
    :class="[
      'inline-flex shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer',
      'focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0',
      'disabled:pointer-events-none disabled:opacity-50',
      variantClass,
      boxClass,
    ]"
    @click="emit('click', $event)"
  >
    <i v-if="loading" class="pi pi-spin pi-spinner" aria-hidden="true" />
    <i v-else :class="['pi', icon]" aria-hidden="true" />
  </button>
</template>
