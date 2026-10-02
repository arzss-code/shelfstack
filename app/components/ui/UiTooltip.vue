<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Teks tooltip sederhana. Abaikan jika menggunakan slot #content */
    text?: string
    /** Posisi mengambang tooltip: 'top', 'bottom', 'left', 'right' */
    position?: 'top' | 'bottom' | 'left' | 'right'
    /** Perataan horizontal: 'start', 'center', 'end' */
    align?: 'start' | 'center' | 'end'
    /** Nonaktifkan kemunculan tooltip */
    disabled?: boolean
    /** Tema visual tooltip: 'dark' (obsidian) atau 'light' */
    variant?: 'dark' | 'light'
  }>(),
  {
    text: '',
    position: 'bottom',
    align: 'center',
    disabled: false,
    variant: 'dark',
  },
)

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top':
      return [
        'bottom-full pb-2',
        props.align === 'start'
          ? 'left-0'
          : props.align === 'end'
            ? 'right-0'
            : 'left-1/2 -translate-x-1/2',
        '-translate-y-1 group-hover:translate-y-0',
      ].join(' ')
    case 'left':
      return 'right-full pr-2 top-1/2 -translate-y-1/2 -translate-x-1 group-hover:translate-x-0'
    case 'right':
      return 'left-full pl-2 top-1/2 -translate-y-1/2 translate-x-1 group-hover:translate-x-0'
    case 'bottom':
    default:
      return [
        'top-full pt-2',
        props.align === 'start'
          ? 'left-0'
          : props.align === 'end'
            ? 'right-0'
            : 'left-1/2 -translate-x-1/2',
        'translate-y-1 group-hover:translate-y-0',
      ].join(' ')
  }
})

const cardClasses = computed(() => {
  const base = 'shadow-floating border whitespace-nowrap transition-all duration-200 select-none'
  const theme =
    props.variant === 'light'
      ? 'bg-white text-brand-ink border-brand-hair'
      : 'bg-brand-ink text-white border-white/10'

  return `${base} ${theme}`
})
</script>

<template>
  <div class="relative group inline-flex">
    <!-- Slot Elemen Pemicu (Button, Icon, Link) -->
    <slot />

    <!-- Floating Tooltip Container -->
    <div
      v-if="!disabled && (text || $slots.content)"
      :class="[
        'absolute pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out z-50 hidden sm:block',
        positionClasses,
      ]"
      role="tooltip"
    >
      <div
        :class="[
          cardClasses,
          $slots.content
            ? 'rounded-xl py-2 px-3'
            : 'rounded-lg py-1 px-2.5 text-[11px] font-medium',
        ]"
      >
        <slot name="content">
          {{ text }}
        </slot>
      </div>
    </div>
  </div>
</template>
