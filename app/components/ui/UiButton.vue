<script setup lang="ts">
import { computed } from 'vue'
import { NuxtLink } from '#components'

const props = withDefaults(
  defineProps<{
    /** Type of the button: 'button', 'submit', 'reset' */
    type?: 'button' | 'submit' | 'reset'
    /** NuxtLink 'to' destination. If provided, renders as NuxtLink instead of button */
    to?: string
    /** Visual variant of the button */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent'
    /** Size of the button */
    size?: 'sm' | 'md' | 'lg'
    /** Show loading spinner and disable button */
    loading?: boolean
    /** Disable button */
    disabled?: boolean
    /** Custom icon class (e.g., 'pi-arrow-right') */
    icon?: string
    /** Icon position */
    iconPos?: 'left' | 'right'
    /** Full width button */
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

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all rounded-full no-underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1'

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-brand-ink text-white hover:bg-black hover:shadow-floating active:scale-[0.98] focus:ring-brand-ink/50'
    case 'secondary':
      return 'bg-brand-canvas-soft text-brand-ink border border-brand-hair hover:bg-brand-field hover:shadow-whisper focus:ring-brand-ink/20'
    case 'accent':
      return 'bg-brand-accent text-white hover:bg-brand-accent-hover hover:shadow-floating active:scale-[0.98] focus:ring-brand-accent/50'
    case 'outline':
      return 'bg-transparent text-brand-ink border border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 focus:ring-brand-ink/20'
    case 'ghost':
      return 'bg-transparent text-brand-ink hover:bg-brand-canvas-soft focus:ring-brand-ink/20'
    default:
      return ''
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'text-xs px-5 py-2.5'
    case 'md':
      return 'text-sm px-7 py-3.5'
    case 'lg':
      return 'text-base px-8 py-4'
    default:
      return ''
  }
})

const stateClasses = computed(() => {
  if (props.disabled || props.loading) {
    return 'opacity-60 pointer-events-none'
  }
  return ''
})

const componentType = computed(() => (props.to ? NuxtLink : 'button'))
</script>

<template>
  <component
    :is="componentType"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses, stateClasses, block ? 'w-full' : '']"
  >
    <!-- Left Icon / Loading Spinner -->
    <i v-if="loading" class="pi pi-spin pi-spinner text-xs shrink-0" />
    <i v-else-if="icon && iconPos === 'left'" :class="['pi', icon, 'text-xs shrink-0']" />

    <!-- Slot Text -->
    <span><slot /></span>

    <!-- Right Icon -->
    <i v-if="icon && iconPos === 'right' && !loading" :class="['pi', icon, 'text-xs shrink-0']" />
  </component>
</template>
