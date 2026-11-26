<script setup lang="ts">
import { computed } from 'vue'
import { NuxtLink } from '#components'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    /** Destination NuxtLink. Bila diisi, komponen dirender sebagai tautan. */
    to?: string
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    icon?: string
    iconPos?: 'left' | 'right'
    block?: boolean
  }>(),
  {
    type: 'button',
    to: undefined,
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    icon: undefined,
    iconPos: 'left',
    block: false,
  },
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-brand-ink text-brand-onink hover:bg-brand-inkhover hover:shadow-floating active:scale-[0.98]'
    case 'accent':
      return 'bg-brand-accent text-white hover:bg-brand-accent-hover hover:shadow-floating active:scale-[0.98]'
    case 'danger':
      return 'bg-brand-danger-tint text-brand-danger-text border border-brand-danger-edge hover:bg-brand-danger hover:text-white hover:border-brand-danger'
    case 'secondary':
      return 'bg-brand-canvas-soft text-brand-ink border border-brand-hair hover:bg-brand-field'
    case 'outline':
      return 'bg-brand-canvas text-brand-ink border border-brand-hair hover:border-brand-ink hover:bg-brand-canvas-soft'
    case 'ghost':
    default:
      return 'bg-transparent text-brand-muted hover:bg-brand-field hover:text-brand-ink'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-7 px-3 text-[11px] gap-1.5'
    case 'sm':
      return 'h-9 px-4 text-xs gap-1.5'
    case 'lg':
      return 'h-12 px-7 text-base gap-2'
    case 'md':
    default:
      return 'h-11 px-6 text-sm gap-2'
  }
})

const iconSizeClass = computed(() => (props.size === 'xs' ? 'text-[10px]' : 'text-[11px]'))

const isInert = computed(() => props.disabled || props.loading)

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center rounded-full font-semibold no-underline transition-all',
  'focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0',
  variantClasses.value,
  sizeClasses.value,
  props.block ? 'w-full' : '',
  isInert.value ? 'pointer-events-none opacity-55' : '',
])
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="buttonClasses">
    <i
      v-if="loading"
      class="pi pi-spin pi-spinner shrink-0"
      :class="iconSizeClass"
      aria-hidden="true"
    />
    <i
      v-else-if="icon && iconPos === 'left'"
      :class="['pi', icon, 'shrink-0', iconSizeClass]"
      aria-hidden="true"
    />
    <span><slot /></span>
    <i
      v-if="icon && iconPos === 'right' && !loading"
      :class="['pi', icon, 'shrink-0', iconSizeClass]"
      aria-hidden="true"
    />
  </NuxtLink>

  <button
    v-else
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :class="buttonClasses"
  >
    <i
      v-if="loading"
      class="pi pi-spin pi-spinner shrink-0"
      :class="iconSizeClass"
      aria-hidden="true"
    />
    <i
      v-else-if="icon && iconPos === 'left'"
      :class="['pi', icon, 'shrink-0', iconSizeClass]"
      aria-hidden="true"
    />
    <span><slot /></span>
    <i
      v-if="icon && iconPos === 'right' && !loading"
      :class="['pi', icon, 'shrink-0', iconSizeClass]"
      aria-hidden="true"
    />
  </button>
</template>
