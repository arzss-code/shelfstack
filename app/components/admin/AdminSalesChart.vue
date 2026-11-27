<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AdminSalesChartControls from '~/components/admin/AdminSalesChartControls.vue'
import {
  CHART_PAD_BOTTOM,
  CHART_PAD_LEFT,
  CHART_PAD_RIGHT,
  CHART_PAD_TOP,
  CHART_PLOT_HEIGHT,
  CHART_SVG_HEIGHT,
  CHART_SVG_WIDTH,
  type ChartMetric,
  formatSalesAxisTick,
  useAdminSalesChart,
} from '~/composables/useAdminSalesChart'
import { formatRupiah } from '~/utils/format'
import type {
  AdminTrendsPeriod,
  AdminTrendsResponseData,
  AdminTrendsStatusScope,
} from '~~/shared/schemas/admin-stats'

const props = withDefaults(defineProps<{ initialPeriod?: AdminTrendsPeriod }>(), {
  initialPeriod: '7d',
})

const activePeriod = ref<AdminTrendsPeriod>(props.initialPeriod)
const statusScope = ref<AdminTrendsStatusScope>('confirmed')
const activeMetric = ref<ChartMetric>('revenue')
const customFrom = ref('')
const customTo = ref('')
const loading = ref(true)
const trendsData = ref<AdminTrendsResponseData | null>(null)

const {
  hoveredIndex,
  gridLevels,
  hitWidth,
  calculatedCoords,
  linePath,
  areaPath,
  activeHoverData,
  tooltipStyle,
  shouldShowXAxisLabel,
  summaryStats,
} = useAdminSalesChart(trendsData, activeMetric)

const fetchTrends = async () => {
  loading.value = true
  try {
    const params: Record<string, string> = { period: activePeriod.value }
    if (statusScope.value !== 'confirmed') {
      params.status_scope = statusScope.value
    }
    if (activePeriod.value === 'custom' && (customFrom.value || customTo.value)) {
      if (customFrom.value) params.from = customFrom.value
      if (customTo.value) params.to = customTo.value
    }
    const res = await $fetch<{ status: string; data: AdminTrendsResponseData }>(
      '/api/admin/stats/trends',
      { params },
    )
    trendsData.value = res.data
  } catch (err: unknown) {
    if (import.meta.dev) console.error('Failed to load sales trends:', err)
  } finally {
    loading.value = false
  }
}

const selectPeriod = (next: AdminTrendsPeriod) => {
  activePeriod.value = next
  hoveredIndex.value = null
  if (next === 'custom' && !customFrom.value && !customTo.value) {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13)
    customFrom.value = startDate.toISOString().slice(0, 10)
    customTo.value = now.toISOString().slice(0, 10)
  }
  fetchTrends()
}

const onCustomDateChange = () => {
  if (activePeriod.value !== 'custom') activePeriod.value = 'custom'
  hoveredIndex.value = null
  fetchTrends()
}

watch(statusScope, () => {
  hoveredIndex.value = null
  fetchTrends()
})

onMounted(() => {
  fetchTrends()
})

const lineStroke = computed(() => (activeMetric.value === 'orders' ? '#0f766e' : '#0066ff'))
const granularityHint = computed(() => {
  const g = trendsData.value?.granularity
  if (g === 'month') return 'Agregasi bulanan'
  if (g === 'week') return 'Agregasi mingguan'
  return 'Agregasi harian'
})
</script>

<template>
  <section
    aria-label="Grafik tren penjualan"
    class="rounded-card border border-brand-hair bg-brand-canvas p-5 shadow-whisper space-y-4"
  >
    <AdminSalesChartControls
      v-model:status-scope="statusScope"
      v-model:active-metric="activeMetric"
      v-model:custom-from="customFrom"
      v-model:custom-to="customTo"
      :active-period="activePeriod"
      :granularity-hint="granularityHint"
      @select-period="selectPeriod"
      @custom-date-change="onCustomDateChange"
    />

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="item in summaryStats"
        :key="item.label"
        class="p-3 rounded-field border border-brand-hairsoft bg-brand-canvas-soft space-y-1"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-medium text-brand-muted uppercase tracking-wider">
            {{ item.label }}
          </span>
          <span
            v-if="item.delta !== null"
            class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular"
            :class="
              item.delta >= 0
                ? 'bg-brand-success-tint text-brand-success-text'
                : 'bg-brand-danger-tint text-brand-danger-text'
            "
          >
            {{ item.delta >= 0 ? `+${item.delta}%` : `${item.delta}%` }}
          </span>
        </div>
        <span class="font-display text-base font-bold text-brand-ink block tabular-nums">
          {{ item.value }}
        </span>
        <span class="text-[11px] text-brand-muted block truncate">{{ item.hint }}</span>
      </div>
    </div>

    <div class="relative w-full overflow-visible">
      <div v-if="loading" class="h-56 w-full animate-pulse rounded-lg bg-brand-field" />

      <div v-else class="relative w-full overflow-visible">
        <div
          v-if="activeHoverData"
          data-testid="sales-chart-tooltip"
          class="absolute z-30 pointer-events-none rounded-lg border border-brand-hair bg-brand-canvas px-3 py-2 text-xs shadow-floating whitespace-nowrap"
          :style="tooltipStyle"
        >
          <p class="font-bold text-brand-ink m-0">{{ activeHoverData.pt.label }}</p>
          <p class="font-display text-brand-accent-text font-bold m-0 mt-0.5 tabular-nums">
            {{ formatRupiah(activeHoverData.pt.revenue) }}
          </p>
          <p class="text-[11px] text-brand-muted m-0">
            {{ activeHoverData.pt.order_count }} transaksi
          </p>
        </div>

        <svg
          class="w-full h-auto overflow-visible select-none"
          :viewBox="`0 0 ${CHART_SVG_WIDTH} ${CHART_SVG_HEIGHT}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="lineStroke" stop-opacity="0.2" />
              <stop offset="100%" :stop-color="lineStroke" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <g class="grid-lines">
            <line
              v-for="grid in gridLevels"
              :key="grid.y"
              :x1="CHART_PAD_LEFT"
              :y1="grid.y"
              :x2="CHART_SVG_WIDTH - CHART_PAD_RIGHT"
              :y2="grid.y"
              stroke="currentColor"
              class="text-brand-hairsoft"
              stroke-dasharray="3,3"
            />
            <text
              v-for="grid in gridLevels"
              :key="'txt-' + grid.y"
              :x="CHART_PAD_LEFT - 8"
              :y="grid.y + 3"
              text-anchor="end"
              class="text-[10px] fill-brand-muted font-medium"
            >
              {{ formatSalesAxisTick(grid.value, activeMetric) }}
            </text>
          </g>

          <path :d="areaPath" fill="url(#salesGrad)" />
          <path
            :d="linePath"
            fill="none"
            :stroke="lineStroke"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <g class="data-points">
            <g
              v-for="(coord, idx) in calculatedCoords"
              :key="coord.pt.date"
              class="cursor-pointer"
              @mouseenter="hoveredIndex = idx"
              @mouseleave="hoveredIndex = null"
            >
              <rect
                :x="coord.x - hitWidth / 2"
                :y="CHART_PAD_TOP"
                :width="hitWidth"
                :height="CHART_PLOT_HEIGHT + 24"
                fill="transparent"
              />
              <line
                v-if="hoveredIndex === idx"
                :x1="coord.x"
                :y1="CHART_PAD_TOP"
                :x2="coord.x"
                :y2="CHART_PAD_TOP + CHART_PLOT_HEIGHT"
                :stroke="lineStroke"
                stroke-width="1"
                stroke-dasharray="3,3"
                opacity="0.35"
              />
              <circle
                v-if="hoveredIndex === idx"
                :cx="coord.x"
                :cy="coord.y"
                r="6.5"
                :fill="lineStroke"
                opacity="0.25"
              />
              <circle
                :cx="coord.x"
                :cy="coord.y"
                :r="hoveredIndex === idx ? 4 : 2.5"
                fill="#ffffff"
                :stroke="lineStroke"
                stroke-width="2"
              />
              <text
                v-if="shouldShowXAxisLabel(idx, calculatedCoords.length)"
                :x="coord.x"
                :y="CHART_SVG_HEIGHT - CHART_PAD_BOTTOM + 20"
                text-anchor="middle"
                class="text-[10px] fill-brand-muted font-medium"
              >
                {{ coord.pt.label }}
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  </section>
</template>
