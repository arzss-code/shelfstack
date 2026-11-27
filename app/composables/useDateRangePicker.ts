import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  buildMonthGrid,
  formatIsoShortId,
  getCalendarYearOptions,
  getPresetDateRange,
  parseIsoDateParts,
  toLocalIsoDate,
} from '~/composables/useCalendarGrid'

export interface DateRangePickerProps {
  from?: string
  to?: string
  placeholder?: string
  ariaLabel?: string
  align?: 'left' | 'right'
}

export interface DateRangePickerCallbacks {
  onUpdateFrom: (value: string) => void
  onUpdateTo: (value: string) => void
  onChange: (range: { from: string; to: string }) => void
}

export function useDateRangePicker(
  props: DateRangePickerProps,
  callbacks: DateRangePickerCallbacks,
) {
  const rootRef = ref<HTMLElement | null>(null)
  const triggerRef = ref<HTMLButtonElement | null>(null)
  const isOpen = ref(false)
  const panelView = ref<'days' | 'months' | 'years'>('days')
  const draftStart = ref(props.from || '')

  const now = new Date()
  const todayIso = toLocalIsoDate(now)
  const initialFocus = parseIsoDateParts(props.from || props.to || '')
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
    return props.placeholder || 'Rentang Tanggal'
  })

  const yearOptions = computed(() => getCalendarYearOptions(viewYear.value))
  const cells = computed(() => buildMonthGrid(viewYear.value, viewMonth.value, todayIso))

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear.value, viewMonth.value + delta, 1)
    viewYear.value = next.getFullYear()
    viewMonth.value = next.getMonth()
  }

  const selectMonth = (monthIndex: number) => {
    viewMonth.value = monthIndex
    panelView.value = 'days'
  }

  const selectYear = (yearValue: number) => {
    viewYear.value = yearValue
    panelView.value = 'days'
  }

  const commitRange = (from: string, to: string, closeAfter = true) => {
    callbacks.onUpdateFrom(from)
    callbacks.onUpdateTo(to)
    callbacks.onChange({ from, to })
    if (closeAfter) {
      isOpen.value = false
      panelView.value = 'days'
    }
  }

  const onDayClick = (iso: string) => {
    if (!draftStart.value) {
      draftStart.value = iso
      callbacks.onUpdateFrom(iso)
      callbacks.onUpdateTo('')
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

  const activeStart = computed(() => draftStart.value || props.from || '')
  const activeEnd = computed(() => (draftStart.value ? '' : props.to || ''))
  const isSelectedEndpoint = (iso: string) => iso === activeStart.value || iso === activeEnd.value
  const isInSelectedRange = (iso: string) =>
    Boolean(
      activeStart.value && activeEnd.value && iso > activeStart.value && iso < activeEnd.value,
    )

  const closeAndFocusTrigger = () => {
    isOpen.value = false
    panelView.value = 'days'
    triggerRef.value?.focus()
  }

  const handleDocumentPointerDown = (event: PointerEvent) => {
    if (!isOpen.value || !rootRef.value) return
    const target = event.target as Node | null
    if (!target || !target.isConnected) return
    if (!rootRef.value.contains(target)) {
      isOpen.value = false
      panelView.value = 'days'
    }
  }

  onMounted(() => document.addEventListener('pointerdown', handleDocumentPointerDown))
  onBeforeUnmount(() => document.removeEventListener('pointerdown', handleDocumentPointerDown))

  return {
    rootRef,
    triggerRef,
    isOpen,
    panelView,
    draftStart,
    viewYear,
    viewMonth,
    hasRange,
    triggerLabel,
    yearOptions,
    cells,
    shiftMonth,
    selectMonth,
    selectYear,
    commitRange,
    onDayClick,
    applyPreset,
    clearRange,
    isSelectedEndpoint,
    isInSelectedRange,
    closeAndFocusTrigger,
  }
}
