<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { formatRupiah } from '~/utils/format'
import type {
  AdminTrendsPeriod,
  AdminTrendsResponseData,
  TrendDataPoint,
} from '~~/shared/schemas/admin-stats'

const props = withDefaults(defineProps<{ initialPeriod?: AdminTrendsPeriod }>(), {
  initialPeriod: '7d',
})

const activePeriod = ref<AdminTrendsPeriod>(props.initialPeriod)
const loading = ref(true)
const trendsData = ref<AdminTrendsResponseData | null>(null)
const hoveredIndex = ref<number | null>(null)

const periods: Array<{ id: AdminTrendsPeriod; label: string }> = [
  { id: '7d', label: '7 Hari' },
  { id: '30d', label: '30 Hari' },
  { id: 'month', label: 'Bulan Ini' },
]

const fetchTrends = async () => {
  loading.value = true
  try {
    const res = await $fetch<{ status: string; data: AdminTrendsResponseData }>(
      '/api/admin/stats/trends',
      { params: { period: activePeriod.value } },
    )
    trendsData.value = res.data
  } catch (err: unknown) {
    if (import.meta.dev) console.error('Failed to load sales trends:', err)
  } finally {
    loading.value = false
  }
}

watch(activePeriod, () => {
  hoveredIndex.value = null
  fetchTrends()
})

onMounted(() => {
  fetchTrends()
})

const svgWidth = 800
const svgHeight = 228
const padLeft = 65
const padRight = 25
const padTop = 28
const padBottom = 35
const chartWidth = svgWidth - padLeft - padRight
const chartHeight = svgHeight - padTop - padBottom
const points = computed<TrendDataPoint[]>(() => trendsData.value?.points || [])
const hitWidth = computed(() => Math.max(32, chartWidth / Math.max(points.value.length - 1, 1)))
const maxRevenue = computed(() => {
  const max = Math.max(...points.value.map((p) => p.revenue), 0)
  return max === 0 ? 1000000 : max * 1.15
})
const gridLevels = computed(() => [
  { value: maxRevenue.value, y: padTop },
  { value: maxRevenue.value * 0.66, y: padTop + chartHeight * 0.33 },
  { value: maxRevenue.value * 0.33, y: padTop + chartHeight * 0.66 },
  { value: 0, y: padTop + chartHeight },
])
const calculatedCoords = computed(() => {
  const total = points.value.length
  return points.value.map((pt, idx) => ({
    x: total > 1 ? padLeft + (idx / (total - 1)) * chartWidth : padLeft + chartWidth / 2,
    y: padTop + chartHeight - (pt.revenue / maxRevenue.value) * chartHeight,
    pt,
  }))
})
const linePath = computed(() =>
  calculatedCoords.value.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' '),
)
const areaPath = computed(() => {
  const coords = calculatedCoords.value
  if (coords.length === 0) return ''
  const bottomY = padTop + chartHeight
  return `${linePath.value} L ${coords[coords.length - 1]!.x} ${bottomY} L ${coords[0]!.x} ${bottomY} Z`
})

const activeHoverData = computed(() => {
  if (hoveredIndex.value === null) return null
  return calculatedCoords.value[hoveredIndex.value] || null
})

const tooltipStyle = computed(() => {
  const data = activeHoverData.value
  if (!data) return {}
  const rawLeft = (data.x / svgWidth) * 100
  const clampedLeft = Math.min(86, Math.max(14, rawLeft))
  const placeBelow = data.y < 105
  const topPct = placeBelow ? (data.y / svgHeight) * 100 + 6 : (data.y / svgHeight) * 100 - 5
  return {
    left: `${clampedLeft}%`,
    top: `${topPct}%`,
    transform: placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
  }
})

const shouldShowLabel = (idx: number, total: number) => {
  if (total <= 7) return true
  if (total <= 14) return idx % 2 === 0 || idx === total - 1
  return idx % 5 === 0 || idx === total - 1
}

const summaryStats = computed(() => [
  { label: 'Total Omzet', value: formatRupiah(trendsData.value?.summary.total_revenue || 0) },
  { label: 'Total Pesanan', value: `${trendsData.value?.summary.total_orders || 0} pesanan` },
  {
    label: 'Rata-rata Nilai Pesanan',
    value: formatRupiah(trendsData.value?.summary.average_order_value || 0),
  },
])
</script>

<template>
  <div class="rounded-card border border-brand-hair bg-brand-canvas p-5 shadow-whisper space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Grafik Penjualan</h2>
        <p class="text-xs text-brand-muted m-0 mt-0.5">
          Pendapatan harian dari pesanan lunas dan selesai.
        </p>
      </div>

      <div
        class="inline-flex items-center rounded-full border border-brand-hair bg-brand-canvas-soft p-1 self-start sm:self-auto"
      >
        <button
          v-for="p in periods"
          :key="p.id"
          type="button"
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border-0',
            activePeriod === p.id
              ? 'bg-brand-ink text-brand-onink shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink',
          ]"
          @click="activePeriod = p.id"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div
        v-for="item in summaryStats"
        :key="item.label"
        class="p-3 rounded-field border border-brand-hairsoft bg-brand-canvas-soft space-y-1"
      >
        <span class="text-[11px] font-medium text-brand-muted uppercase tracking-wider block">
          {{ item.label }}
        </span>
        <span class="font-display text-base font-bold text-brand-ink block tabular-nums">
          {{ item.value }}
        </span>
      </div>
    </div>

    <div class="relative w-full overflow-visible">
      <div
        v-if="loading"
        class="h-56 w-full animate-pulse rounded-lg bg-brand-field overflow-hidden"
      />

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
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0066ff" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#0066ff" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <g class="grid-lines">
            <line
              v-for="grid in gridLevels"
              :key="grid.y"
              :x1="padLeft"
              :y1="grid.y"
              :x2="svgWidth - padRight"
              :y2="grid.y"
              stroke="currentColor"
              class="text-brand-hairsoft"
              stroke-dasharray="3,3"
            />
            <text
              v-for="grid in gridLevels"
              :key="'txt-' + grid.y"
              :x="padLeft - 8"
              :y="grid.y + 3"
              text-anchor="end"
              class="text-[9px] fill-brand-muted font-medium"
            >
              {{ grid.value >= 1000000 ? (grid.value / 1000000).toFixed(1) + 'M' : grid.value }}
            </text>
          </g>

          <path :d="areaPath" fill="url(#salesGrad)" />
          <path
            :d="linePath"
            fill="none"
            stroke="#0066ff"
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
                :y="padTop"
                :width="hitWidth"
                :height="chartHeight + 24"
                fill="transparent"
              />
              <line
                v-if="hoveredIndex === idx"
                :x1="coord.x"
                :y1="padTop"
                :x2="coord.x"
                :y2="padTop + chartHeight"
                stroke="#0066ff"
                stroke-width="1"
                stroke-dasharray="3,3"
                opacity="0.35"
              />
              <circle
                v-if="hoveredIndex === idx"
                :cx="coord.x"
                :cy="coord.y"
                r="6.5"
                fill="#0066ff"
                opacity="0.25"
              />
              <circle
                :cx="coord.x"
                :cy="coord.y"
                :r="hoveredIndex === idx ? 4 : 2.5"
                fill="#ffffff"
                stroke="#0066ff"
                stroke-width="2"
              />
              <text
                v-if="shouldShowLabel(idx, calculatedCoords.length)"
                :x="coord.x"
                :y="padTop + chartHeight + 20"
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
  </div>
</template>
