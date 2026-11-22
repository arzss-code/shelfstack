<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue'

const attrs = useAttrs()
const isPositioned = computed(() => {
  return (
    typeof attrs.class === 'string' && /(?:^|\s)(absolute|fixed|sticky)(?:\s|$)/.test(attrs.class)
  )
})

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
    /** Nonaktifkan teleport ke body jika ingin relative lokal */
    teleport?: boolean
  }>(),
  {
    text: '',
    position: 'bottom',
    align: 'center',
    disabled: false,
    variant: 'dark',
    teleport: true,
  },
)

const tooltipId = useId()
const isMounted = ref(false)
const isVisible = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

// Koordinat absolut fixed di viewport
const coords = ref({ top: 0, left: 0 })
const effectivePosition = ref<'top' | 'bottom' | 'left' | 'right'>(props.position)
const transformStyle = ref('')

function updatePosition() {
  if (!triggerRef.value || typeof window === 'undefined') return
  const triggerRect = triggerRef.value.getBoundingClientRect()
  if (triggerRect.width === 0 && triggerRect.height === 0) return

  const gap = 8
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let pos = props.position

  // Flip otomatis jika ruang di tepi viewport sempit
  if (pos === 'top' && triggerRect.top < 36) {
    pos = 'bottom'
  } else if (pos === 'bottom' && triggerRect.bottom + 36 > viewportHeight) {
    pos = 'top'
  }

  if (pos === 'left' && triggerRect.left < 80) {
    pos = 'right'
  } else if (pos === 'right' && triggerRect.right + 80 > viewportWidth) {
    pos = 'left'
  }

  effectivePosition.value = pos

  let top = 0
  let left = 0
  let transform = ''

  if (pos === 'top') {
    top = triggerRect.top - gap
    if (props.align === 'start') {
      left = triggerRect.left
      transform = 'translateY(-100%)'
    } else if (props.align === 'end') {
      left = triggerRect.right
      transform = 'translate(-100%, -100%)'
    } else {
      left = triggerRect.left + triggerRect.width / 2
      transform = 'translate(-50%, -100%)'
    }
  } else if (pos === 'bottom') {
    top = triggerRect.bottom + gap
    if (props.align === 'start') {
      left = triggerRect.left
      transform = 'translateY(0)'
    } else if (props.align === 'end') {
      left = triggerRect.right
      transform = 'translate(-100%, 0)'
    } else {
      left = triggerRect.left + triggerRect.width / 2
      transform = 'translate(-50%, 0)'
    }
  } else if (pos === 'left') {
    top = triggerRect.top + triggerRect.height / 2
    left = triggerRect.left - gap
    transform = 'translate(-100%, -50%)'
  } else if (pos === 'right') {
    top = triggerRect.top + triggerRect.height / 2
    left = triggerRect.right + gap
    transform = 'translate(0, -50%)'
  }

  coords.value = { top, left }
  transformStyle.value = transform

  // Safe clamping agar teks tooltip tidak menembus batas kiri/kanan layar
  nextTick(() => {
    if (!tooltipRef.value) return
    const rect = tooltipRef.value.getBoundingClientRect()
    const margin = 10
    if (rect.left < margin) {
      coords.value.left += margin - rect.left
    } else if (rect.right > window.innerWidth - margin) {
      coords.value.left -= rect.right - (window.innerWidth - margin)
    }
  })
}

function handleMouseEnter() {
  if (props.disabled || (!props.text && !attrs.content)) return
  updatePosition()
  isVisible.value = true
}

function handleMouseLeave() {
  isVisible.value = false
}

function handleFocusIn() {
  handleMouseEnter()
}

function handleFocusOut() {
  handleMouseLeave()
}

function handleScrollOrResize() {
  if (isVisible.value) {
    isVisible.value = false
  }
}

onMounted(() => {
  isMounted.value = true
  window.addEventListener('scroll', handleScrollOrResize, { passive: true })
  window.addEventListener('resize', handleScrollOrResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScrollOrResize)
  window.removeEventListener('resize', handleScrollOrResize)
})

watch(
  () => props.position,
  () => {
    if (isVisible.value) updatePosition()
  },
)

const cardClasses = computed(() => {
  const base = 'shadow-floating border whitespace-nowrap transition-all duration-150 select-none'
  const theme =
    props.variant === 'light'
      ? 'bg-brand-canvas text-brand-ink border-brand-hair'
      : 'bg-brand-ink text-brand-onink border-white/10'

  return `${base} ${theme}`
})
</script>

<template>
  <div
    ref="triggerRef"
    :class="[isPositioned ? '' : 'relative', 'group/tooltip inline-flex']"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <!-- Slot Elemen Pemicu (Button, Icon, Link) -->
    <slot />

    <!-- Teleported Floating Tooltip (Bebas dari clipping overflow container/card) -->
    <Teleport v-if="teleport && isMounted" to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isVisible && !disabled && (text || $slots.content)"
          :id="`tooltip-${tooltipId}`"
          ref="tooltipRef"
          role="tooltip"
          class="fixed pointer-events-none z-[9999] hidden sm:block"
          :style="{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: transformStyle,
          }"
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
      </Transition>
    </Teleport>

    <!-- Fallback Local Tooltip Container (Bila teleport dinonaktifkan) -->
    <div
      v-else-if="!teleport && !disabled && (text || $slots.content)"
      class="absolute pointer-events-none opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 ease-out z-50 hidden sm:block"
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
