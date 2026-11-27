<script setup lang="ts">
import {
  formatIsoShortId,
  ID_MONTH_NAMES,
  ID_MONTH_SHORT,
  ID_WEEKDAY_SHORT,
} from '~/composables/useCalendarGrid'
import { useDateRangePicker } from '~/composables/useDateRangePicker'

const props = withDefaults(
  defineProps<{
    from?: string
    to?: string
    placeholder?: string
    ariaLabel?: string
    align?: 'left' | 'right'
  }>(),
  {
    from: '',
    to: '',
    placeholder: 'Rentang Tanggal',
    ariaLabel: 'Pilih rentang tanggal',
    align: 'right',
  },
)

const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  change: [range: { from: string; to: string }]
}>()

const {
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
} = useDateRangePicker(props, {
  onUpdateFrom: (value) => emit('update:from', value),
  onUpdateTo: (value) => emit('update:to', value),
  onChange: (range) => emit('change', range),
})
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
      :class="[
        'absolute left-0 top-[calc(100%+6px)] z-50 w-[300px] max-w-[calc(100vw-2rem)] rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-floating space-y-2.5',
        align === 'left' ? 'sm:left-0 sm:right-auto' : 'sm:left-auto sm:right-0',
      ]"
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

      <div class="flex items-center justify-between gap-1.5 pt-0.5">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft cursor-pointer"
          @click="shiftMonth(-1)"
        >
          <i class="pi pi-chevron-left text-[10px]" aria-hidden="true" />
        </button>

        <div class="flex items-center gap-1 min-w-0">
          <button
            type="button"
            data-testid="date-range-month-btn"
            aria-label="Pilih bulan"
            :aria-pressed="panelView === 'months'"
            class="inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold transition-colors cursor-pointer"
            :class="
              panelView === 'months'
                ? 'border-brand-ink bg-brand-ink text-brand-onink'
                : 'border-brand-hair bg-brand-canvas-soft text-brand-ink hover:border-brand-ink/40'
            "
            @click="panelView = panelView === 'months' ? 'days' : 'months'"
          >
            <span>{{ ID_MONTH_NAMES[viewMonth] }}</span>
            <i class="pi pi-chevron-down text-[9px]" aria-hidden="true" />
          </button>

          <button
            type="button"
            data-testid="date-range-year-btn"
            aria-label="Pilih tahun"
            :aria-pressed="panelView === 'years'"
            class="inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-semibold tabular transition-colors cursor-pointer"
            :class="
              panelView === 'years'
                ? 'border-brand-ink bg-brand-ink text-brand-onink'
                : 'border-brand-hair bg-brand-canvas-soft text-brand-ink hover:border-brand-ink/40'
            "
            @click="panelView = panelView === 'years' ? 'days' : 'years'"
          >
            <span>{{ viewYear }}</span>
            <i class="pi pi-chevron-down text-[9px]" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Bulan berikutnya"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft cursor-pointer"
          @click="shiftMonth(1)"
        >
          <i class="pi pi-chevron-right text-[10px]" aria-hidden="true" />
        </button>
      </div>

      <div
        v-if="panelView === 'months'"
        data-testid="date-range-month-grid"
        class="grid grid-cols-3 gap-1.5 py-1"
      >
        <button
          v-for="(mLabel, mIdx) in ID_MONTH_SHORT"
          :key="mLabel"
          type="button"
          class="h-8 rounded-field border text-xs font-medium transition-colors cursor-pointer"
          :class="
            viewMonth === mIdx
              ? 'border-brand-ink bg-brand-ink text-brand-onink font-semibold'
              : 'border-brand-hairsoft bg-brand-canvas-soft text-brand-ink hover:border-brand-ink/40'
          "
          @click="selectMonth(mIdx)"
        >
          {{ mLabel }}
        </button>
      </div>

      <div
        v-else-if="panelView === 'years'"
        data-testid="date-range-year-grid"
        class="grid grid-cols-3 gap-1.5 py-1 max-h-48 overflow-y-auto"
      >
        <button
          v-for="yVal in yearOptions"
          :key="yVal"
          type="button"
          class="h-8 rounded-field border text-xs font-medium tabular transition-colors cursor-pointer"
          :class="
            viewYear === yVal
              ? 'border-brand-ink bg-brand-ink text-brand-onink font-semibold'
              : 'border-brand-hairsoft bg-brand-canvas-soft text-brand-ink hover:border-brand-ink/40'
          "
          @click="selectYear(yVal)"
        >
          {{ yVal }}
        </button>
      </div>

      <div v-else class="grid grid-cols-7 gap-y-0.5 text-center">
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
