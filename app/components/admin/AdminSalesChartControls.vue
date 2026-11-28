<script setup lang="ts">
import UiDateRangePicker from '~/components/ui/UiDateRangePicker.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import {
  type ChartMetric,
  PERIOD_OPTIONS,
  STATUS_SCOPE_OPTIONS,
} from '~/composables/useAdminSalesChart'
import type { AdminTrendsPeriod, AdminTrendsStatusScope } from '~~/shared/schemas/admin-stats'

defineProps<{
  activePeriod: AdminTrendsPeriod
  statusScope: AdminTrendsStatusScope
  activeMetric: ChartMetric
  customFrom: string
  customTo: string
  granularityHint: string
}>()

const emit = defineEmits<{
  'update:statusScope': [value: AdminTrendsStatusScope]
  'update:activeMetric': [value: ChartMetric]
  'update:customFrom': [value: string]
  'update:customTo': [value: string]
  selectPeriod: [period: AdminTrendsPeriod]
  customDateChange: []
}>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0 flex-1">
        <h2 class="font-display text-base font-bold leading-snug text-brand-ink m-0">
          Grafik Penjualan
        </h2>
        <p class="text-xs text-brand-muted m-0 mt-0.5 leading-relaxed">
          Omzet dan volume pesanan · {{ granularityHint }}
        </p>
      </div>

      <div
        role="group"
        aria-label="Metrik grafik"
        class="grid w-full min-h-9 shrink-0 grid-cols-2 items-center rounded-full border border-brand-hair bg-brand-canvas-soft p-[3px] sm:inline-flex sm:w-auto"
      >
        <button
          v-for="m in [
            { id: 'revenue' as const, label: 'Omzet' },
            { id: 'orders' as const, label: 'Transaksi' },
          ]"
          :key="m.id"
          type="button"
          :aria-pressed="activeMetric === m.id"
          :class="[
            'inline-flex min-h-[28px] items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors cursor-pointer border-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-1',
            activeMetric === m.id
              ? 'bg-brand-ink text-brand-onink shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink',
          ]"
          @click="emit('update:activeMetric', m.id)"
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Periode waktu grafik"
        class="grid w-full grid-cols-3 gap-1 rounded-field border border-brand-hair bg-brand-canvas-soft p-1 sm:inline-flex sm:min-h-9 sm:w-auto sm:flex-nowrap sm:items-center sm:gap-0.5 sm:rounded-full sm:p-[3px]"
      >
        <button
          v-for="p in PERIOD_OPTIONS"
          :key="p.id"
          type="button"
          :aria-pressed="activePeriod === p.id"
          :class="[
            'inline-flex min-h-8 sm:min-h-[28px] items-center justify-center rounded-[7px] sm:rounded-full px-2 sm:px-2.5 text-xs font-semibold transition-colors cursor-pointer border-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:ring-offset-1',
            activePeriod === p.id
              ? 'bg-brand-ink text-brand-onink shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink',
          ]"
          @click="emit('selectPeriod', p.id)"
        >
          {{ p.label }}
        </button>
      </div>

      <div
        class="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
      >
        <UiDateRangePicker
          v-if="activePeriod === 'custom'"
          :from="customFrom"
          :to="customTo"
          align="left"
          placeholder="Pilih rentang grafik"
          aria-label="Rentang tanggal kustom grafik"
          class="w-full sm:w-auto shrink-0"
          @update:from="emit('update:customFrom', $event)"
          @update:to="emit('update:customTo', $event)"
          @change="emit('customDateChange')"
        />

        <div class="w-full max-w-full shrink-0 sm:w-auto">
          <UiSelect
            :model-value="statusScope"
            :options="STATUS_SCOPE_OPTIONS"
            size="sm"
            prefix="Status:"
            pill
            block
            align="right"
            aria-label="Filter status pesanan grafik"
            @update:model-value="emit('update:statusScope', $event as AdminTrendsStatusScope)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
