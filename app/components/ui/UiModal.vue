<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const visible = defineModel<boolean>('visible', { default: false })

const props = withDefaults(
  defineProps<{
    /** Judul panel. Kosongkan jika isi slot header memakai judul sendiri. */
    title?: string
    /** Kalimat pendukung di bawah judul. */
    description?: string
    /** Lebar panel: sm untuk konfirmasi, md default, lg untuk formulir lebar. */
    size?: 'sm' | 'md' | 'lg'
    /** Batas tinggi maksimum panel modal. Default 'max-h-[90dvh] sm:max-h-[85vh]'. */
    maxHeight?: string
    /** Tutup saat area gelap di luar panel diklik. */
    closeOnOverlay?: boolean
    /** Tutup saat tombol Escape ditekan. */
    closeOnEscape?: boolean
  }>(),
  {
    title: '',
    description: '',
    size: 'md',
    maxHeight: 'max-h-[90dvh] sm:max-h-[85vh]',
    closeOnOverlay: true,
    closeOnEscape: true,
  },
)

const emit = defineEmits<{
  closed: []
}>()

const panelRef = ref<HTMLElement | null>(null)
let restoreFocusTo: HTMLElement | null = null

const panelWidth = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-w-md'
    case 'lg':
      return 'max-w-3xl'
    case 'md':
    default:
      return 'max-w-xl'
  }
})

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const focusableItems = () => {
  if (!panelRef.value) return [] as HTMLElement[]
  return Array.from(panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.getClientRects().length > 0,
  )
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape) {
    visible.value = false
    return
  }
  if (event.key !== 'Tab') return

  const items = focusableItems()
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) return

  const active = document.activeElement as HTMLElement | null
  const insidePanel = !!active && !!panelRef.value?.contains(active)

  if (event.shiftKey && (active === first || !insidePanel)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

const lockBodyScroll = (locked: boolean) => {
  if (!import.meta.client) return
  document.body.style.overflow = locked ? 'hidden' : ''
}

const focusFirstField = () => {
  const target = panelRef.value?.querySelector<HTMLElement>(
    'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])',
  )
  ;(target ?? focusableItems()[0])?.focus()
}

watch(visible, async (open) => {
  if (!import.meta.client) return

  if (open) {
    restoreFocusTo = document.activeElement as HTMLElement | null
    lockBodyScroll(true)
    await nextTick()
    focusFirstField()
  } else {
    lockBodyScroll(false)
    restoreFocusTo?.focus()
    restoreFocusTo = null
    emit('closed')
  }
})

onBeforeUnmount(() => lockBodyScroll(false))
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="ui-modal">
        <div
          v-if="visible"
          class="fixed inset-0 z-[1000] flex items-end justify-center overflow-y-auto bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
          @click.self="closeOnOverlay && (visible = false)"
        >
          <div
            ref="panelRef"
            role="dialog"
            aria-modal="true"
            :aria-label="title || undefined"
            :class="[
              'relative flex w-full flex-col overflow-hidden border border-brand-hair bg-brand-canvas shadow-floating',
              'rounded-t-card sm:rounded-card',
              maxHeight,
              panelWidth,
            ]"
            @keydown="handleKeydown"
          >
            <!-- Header -->
            <header
              v-if="title || $slots.header"
              class="flex shrink-0 items-start justify-between gap-4 border-b border-brand-hairsoft px-5 py-3.5 sm:px-6 sm:py-4"
            >
              <slot name="header">
                <div class="min-w-0">
                  <h2 class="m-0 font-display text-base font-bold tracking-tight text-brand-ink">
                    {{ title }}
                  </h2>
                  <p v-if="description" class="m-0 mt-1 text-xs leading-relaxed text-brand-muted">
                    {{ description }}
                  </p>
                </div>
              </slot>
              <button
                type="button"
                class="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-muted transition-colors hover:bg-brand-canvas-soft hover:text-brand-ink"
                aria-label="Tutup dialog"
                @click="visible = false"
              >
                <i class="pi pi-times text-xs" />
              </button>
            </header>

            <!-- Body -->
            <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <slot />
            </div>

            <!-- Footer -->
            <footer
              v-if="$slots.footer"
              class="flex shrink-0 flex-col-reverse gap-2 border-t border-brand-hairsoft px-5 py-3 sm:flex-row sm:justify-end sm:px-6"
            >
              <slot name="footer" />
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped>
.ui-modal-enter-active,
.ui-modal-leave-active {
  transition: opacity 0.2s ease;
}
.ui-modal-enter-active > div,
.ui-modal-leave-active > div {
  transition:
    transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.2s ease;
}
.ui-modal-enter-from,
.ui-modal-leave-to {
  opacity: 0;
}
.ui-modal-enter-from > div,
.ui-modal-leave-to > div {
  transform: translateY(12px) scale(0.985);
  opacity: 0;
}
</style>
