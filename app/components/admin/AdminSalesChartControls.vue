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
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Grafik Penjualan</h2>
        <p class="text-xs text-brand-muted m-0 mt-0.5">
          Pantau pergerakan omzet dan volume pesanan secara terukur ({{ granularityHint }}).
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Metrik grafik"
          class="inline-flex items-center rounded-full border border-brand-hair bg-brand-canvas-soft p-0.5"
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
              'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border-0',
              activeMetric === m.id
                ? 'bg-brand-ink text-brand-onink'
                : 'bg-transparent text-brand-muted hover:text-brand-ink',
            ]"
            @click="emit('update:activeMetric', m.id)"
          >
            {{ m.label }}
          </button>
        </div>

        <UiSelect
          :model-value="statusScope"
          :options="STATUS_SCOPE_OPTIONS"
          size="sm"
          pill
          align="right"
          aria-label="Filter status pesanan grafik"
          @update:model-value="emit('update:statusScope', $event as AdminTrendsStatusScope)"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <div
        role="group"
        aria-label="Periode waktu grafik"
        class="inline-flex flex-wrap items-center gap-1 rounded-2xl sm:rounded-full border border-brand-hair bg-brand-canvas-soft p-1"
      >
        <button
          v-for="p in PERIOD_OPTIONS"
          :key="p.id"
          type="button"
          :aria-pressed="activePeriod === p.id"
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border-0 whitespace-nowrap',
            activePeriod === p.id
              ? 'bg-brand-ink text-brand-onink shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink',
          ]"
          @click="emit('selectPeriod', p.id)"
        >
          {{ p.label }}
        </button>
      </div>

      <UiDateRangePicker
        v-if="activePeriod === 'custom'"
        :from="customFrom"
        :to="customTo"
        placeholder="Pilih rentang grafik"
        aria-label="Rentang tanggal kustom grafik"
        @update:from="emit('update:customFrom', $event)"
        @update:to="emit('update:customTo', $event)"
        @change="emit('customDateChange')"
      />
    </div>
  </div>
</template>
