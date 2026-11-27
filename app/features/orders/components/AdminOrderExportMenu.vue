<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

export type OrderExportFormat = 'xlsx' | 'csv'

const props = withDefaults(
  defineProps<{
    exporting?: boolean
    activeFormat?: OrderExportFormat | null
  }>(),
  {
    exporting: false,
    activeFormat: null,
  },
)

const emit = defineEmits<{
  export: [format: OrderExportFormat]
}>()

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const itemRefs = ref<HTMLButtonElement[]>([])

const options: Array<{
  format: OrderExportFormat
  label: string
  hint: string
  icon: string
}> = [
  {
    format: 'xlsx',
    label: 'Unduh Excel (.xlsx)',
    hint: 'Workbook rapi dengan format angka IDR',
    icon: 'pi-file-excel',
  },
  {
    format: 'csv',
    label: 'Unduh CSV (.csv)',
    hint: 'Teks dipisah koma (UTF-8 BOM)',
    icon: 'pi-file',
  },
]

const closeMenu = (restoreFocus = false) => {
  isOpen.value = false
  if (restoreFocus) {
    nextTick(() => triggerRef.value?.focus())
  }
}

const toggleMenu = async () => {
  if (props.exporting) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    itemRefs.value[0]?.focus()
  }
}

const selectFormat = (format: OrderExportFormat) => {
  closeMenu()
  emit('export', format)
}

const onKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu(true)
    return
  }
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const currentIndex = itemRefs.value.findIndex((el) => el === document.activeElement)
    const dir = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + dir + itemRefs.value.length) % itemRefs.value.length
    itemRefs.value[nextIndex]?.focus()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (isOpen.value && rootRef.value && !rootRef.value.contains(event.target as Node)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="rootRef" class="relative inline-block" @keydown="onKeydown">
    <button
      ref="triggerRef"
      type="button"
      :disabled="exporting"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      :aria-busy="exporting || undefined"
      data-testid="admin-orders-export-trigger"
      class="inline-flex items-center justify-center gap-1.5 rounded-full border border-brand-hair bg-brand-canvas px-4 py-2 text-xs font-semibold text-brand-ink transition-all hover:border-brand-ink hover:bg-brand-canvas-soft disabled:pointer-events-none disabled:opacity-55 cursor-pointer"
      @click="toggleMenu"
    >
      <i
        :class="['pi shrink-0 text-[11px]', exporting ? 'pi-spin pi-spinner' : 'pi-download']"
        aria-hidden="true"
      />
      <span>
        {{
          exporting
            ? activeFormat === 'xlsx'
              ? 'Menyiapkan Excel...'
              : 'Menyiapkan CSV...'
            : 'Ekspor Data'
        }}
      </span>
      <i
        :class="[
          'pi pi-chevron-down shrink-0 text-[10px] text-brand-muted transition-transform duration-150',
          isOpen ? 'rotate-180' : '',
        ]"
        aria-hidden="true"
      />
    </button>

    <Transition
      enter-active-class="transition duration-75 ease-out"
      enter-from-class="scale-95 opacity-0 -translate-y-1"
      enter-to-class="scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="scale-100 opacity-100 translate-y-0"
      leave-to-class="scale-95 opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        role="menu"
        aria-label="Pilih format ekspor pesanan"
        class="absolute left-0 sm:left-auto sm:right-0 z-40 mt-1.5 w-64 rounded-card border border-brand-hair-strong bg-brand-canvas p-1.5 shadow-floating"
      >
        <button
          v-for="opt in options"
          :key="opt.format"
          ref="itemRefs"
          type="button"
          role="menuitem"
          :data-testid="`export-format-${opt.format}`"
          class="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-brand-canvas-soft focus-visible:bg-brand-canvas-soft focus-visible:outline-none cursor-pointer border-0 bg-transparent"
          @click="selectFormat(opt.format)"
        >
          <span
            class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-hair bg-brand-canvas-soft text-brand-ink"
          >
            <i :class="['pi text-xs', opt.icon]" aria-hidden="true" />
          </span>
          <span class="min-w-0">
            <span class="block text-xs font-semibold text-brand-ink">{{ opt.label }}</span>
            <span class="block text-[11px] text-brand-muted">{{ opt.hint }}</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>
