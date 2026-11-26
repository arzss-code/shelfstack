<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  buildMonthGrid,
  formatIsoShortId,
  getPresetDateRange,
  ID_MONTH_NAMES,
  ID_WEEKDAY_SHORT,
  parseIsoDateParts,
  toLocalIsoDate,
} from '~/composables/useCalendarGrid'

const props = withDefaults(
  defineProps<{
    from?: string
    to?: string
    placeholder?: string
    ariaLabel?: string
  }>(),
  {
    from: '',
    to: '',
    placeholder: 'Rentang Tanggal',
    ariaLabel: 'Pilih rentang tanggal pesanan',
  },
)

const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  change: [range: { from: string; to: string }]
}>()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLButtonElement | null>(null)
const isOpen = ref(false)
const draftStart = ref(props.from)

const now = new Date()
const todayIso = toLocalIsoDate(now)
const initialFocus = parseIsoDateParts(props.from || props.to)
const viewYear = ref(initialFocus?.year ?? now.getFullYear())
const viewMonth = ref(initialFocus?.month ?? now.getMonth())

watch(
  () => [props.from, props.to],
  ([nextFrom, nextTo]) => {
    draftStart.value = nextFrom && !nextTo ? nextFrom : ''
    const parts = parseIsoDateParts(nextFrom || nextTo || '')
    if (parts) {
      viewYear.value = parts.year
      viewMonth.value = parts.month
    }
  },
)

const hasRange = computed(() => Boolean(props.from || props.to))

const triggerLabel = computed(() => {
  if (props.from && props.to) {
    if (props.from === props.to) return formatIsoShortId(props.from)
    const fromYear = parseIsoDateParts(props.from)?.year
    const toYear = parseIsoDateParts(props.to)?.year
    return `${formatIsoShortId(props.from, fromYear !== toYear)} - ${formatIsoShortId(props.to)}`
  }
  if (props.from) return `Dari ${formatIsoShortId(props.from)}`
  if (props.to) return `Sampai ${formatIsoShortId(props.to)}`
  return props.placeholder
})

const monthHeading = computed(() => `${ID_MONTH_NAMES[viewMonth.value]} ${viewYear.value}`)
const cells = computed(() => buildMonthGrid(viewYear.value, viewMonth.value, todayIso))

const shiftMonth = (delta: number) => {
  const next = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = next.getFullYear()
  viewMonth.value = next.getMonth()
}

const commitRange = (from: string, to: string, closeAfter = true) => {
  emit('update:from', from)
  emit('update:to', to)
  emit('change', { from, to })
  if (closeAfter) {
    isOpen.value = false
  }
}

const onDayClick = (iso: string) => {
  if (!draftStart.value) {
    draftStart.value = iso
    emit('update:from', iso)
    emit('update:to', '')
    return
  }
  const [from, to] = iso < draftStart.value ? [iso, draftStart.value] : [draftStart.value, iso]
  draftStart.value = ''
  commitRange(from, to, true)
}

const applyPreset = (preset: 'today' | 'last7' | 'last30' | 'thisMonth') => {
  draftStart.value = ''
  const range = getPresetDateRange(preset)
  const parts = parseIsoDateParts(range.to)
  if (parts) {
    viewYear.value = parts.year
    viewMonth.value = parts.month
  }
  commitRange(range.from, range.to, true)
}

const clearRange = () => {
  draftStart.value = ''
  commitRange('', '', true)
}

const activeStart = computed(() => draftStart.value || props.from)
const activeEnd = computed(() => (draftStart.value ? '' : props.to))

const isSelectedEndpoint = (iso: string) => iso === activeStart.value || iso === activeEnd.value
const isInSelectedRange = (iso: string) =>
  Boolean(activeStart.value && activeEnd.value && iso > activeStart.value && iso < activeEnd.value)

const closeAndFocusTrigger = () => {
  isOpen.value = false
  triggerRef.value?.focus()
}

const handleDocumentClick = (event: MouseEvent) => {
  if (!isOpen.value || !rootRef.value) return
  if (!rootRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
  <div ref="rootRef" class="relative" @keydown.escape="closeAndFocusTrigger">
    <button
      ref="triggerRef"
      type="button"
      data-testid="date-range-trigger"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      :aria-label="ariaLabel"
      class="inline-flex h-9 w-full items-center justify-between gap-2 rounded-full border bg-brand-canvas px-3.5 text-xs transition-colors cursor-pointer sm:w-auto focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0"
      :class="
        hasRange || isOpen
          ? 'border-brand-ink font-semibold text-brand-ink'
          : 'border-brand-hair font-medium text-brand-muted hover:border-brand-faint hover:text-brand-ink'
      "
      @click="isOpen = !isOpen"
    >
      <span class="inline-flex items-center gap-2 min-w-0">
        <i class="pi pi-calendar text-[11px] shrink-0" aria-hidden="true" />
        <span class="truncate tabular">{{ triggerLabel }}</span>
      </span>
      <i
        class="pi pi-chevron-down text-[10px] shrink-0 transition-transform duration-150"
        :class="isOpen ? 'rotate-180' : ''"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="isOpen"
      role="dialog"
      aria-label="Kalender rentang tanggal"
      data-testid="date-range-popover"
      class="absolute left-0 sm:left-auto sm:right-0 top-[calc(100%+6px)] z-50 w-[300px] max-w-[calc(100vw-2rem)] rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-floating space-y-2.5"
    >
      <div class="flex flex-wrap gap-1">
        <button
          v-for="item in [
            { id: 'today' as const, label: 'Hari Ini' },
            { id: 'last7' as const, label: '7 Hari' },
            { id: 'last30' as const, label: '30 Hari' },
            { id: 'thisMonth' as const, label: 'Bulan Ini' },
          ]"
          :key="item.id"
          type="button"
          class="rounded-full border border-brand-hair bg-brand-canvas-soft px-2.5 py-1 text-[11px] font-medium text-brand-ink transition-colors hover:bg-brand-ink hover:text-brand-onink hover:border-brand-ink cursor-pointer"
          @click="applyPreset(item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="flex items-center justify-between pt-0.5">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          class="flex h-7 w-7 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft cursor-pointer"
          @click="shiftMonth(-1)"
        >
          <i class="pi pi-chevron-left text-[10px]" aria-hidden="true" />
        </button>
        <span class="text-xs font-semibold text-brand-ink">{{ monthHeading }}</span>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          class="flex h-7 w-7 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft cursor-pointer"
          @click="shiftMonth(1)"
        >
          <i class="pi pi-chevron-right text-[10px]" aria-hidden="true" />
        </button>
      </div>

      <div class="grid grid-cols-7 gap-y-0.5 text-center">
        <span
          v-for="wd in ID_WEEKDAY_SHORT"
          :key="wd"
          class="py-1 text-[10px] font-semibold uppercase text-brand-muted"
        >
          {{ wd }}
        </span>

        <button
          v-for="cell in cells"
          :key="cell.iso"
          type="button"
          :aria-label="formatIsoShortId(cell.iso)"
          :aria-pressed="isSelectedEndpoint(cell.iso)"
          class="h-8 w-full text-[11px] font-medium tabular transition-colors cursor-pointer border-0"
          :class="[
            isSelectedEndpoint(cell.iso)
              ? 'rounded-full bg-brand-ink text-brand-onink font-semibold'
              : isInSelectedRange(cell.iso)
                ? 'bg-brand-canvas-soft text-brand-ink rounded-none'
                : cell.isCurrentMonth
                  ? 'rounded-full bg-transparent text-brand-ink hover:bg-brand-canvas-soft'
                  : 'rounded-full bg-transparent text-brand-faint hover:bg-brand-canvas-soft',
            cell.isToday && !isSelectedEndpoint(cell.iso)
              ? 'ring-1 ring-inset ring-brand-ink/40'
              : '',
          ]"
          @click="onDayClick(cell.iso)"
        >
          {{ cell.day }}
        </button>
      </div>

      <div
        class="flex items-center justify-between border-t border-brand-hairsoft pt-2 text-[11px]"
      >
        <span class="text-brand-muted truncate">
          {{
            draftStart
              ? `Pilih tanggal akhir (${formatIsoShortId(draftStart, false)})`
              : triggerLabel
          }}
        </span>
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            v-if="hasRange || draftStart"
            type="button"
            data-testid="date-range-clear"
            class="rounded-full border border-brand-hair bg-brand-canvas px-2.5 py-1 text-[11px] font-medium text-brand-danger-text hover:bg-brand-danger-tint cursor-pointer"
            @click="clearRange"
          >
            Hapus
          </button>
          <button
            v-if="draftStart"
            type="button"
            class="rounded-full bg-brand-ink px-2.5 py-1 text-[11px] font-semibold text-brand-onink cursor-pointer border-0"
            @click="commitRange(draftStart, draftStart, true)"
          >
            Terapkan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
