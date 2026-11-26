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
const svgHeight = 220
const padLeft = 65
const padRight = 25
const padTop = 20
const padBottom = 35

const chartWidth = computed(() => svgWidth - padLeft - padRight)
const chartHeight = computed(() => svgHeight - padTop - padBottom)
const points = computed<TrendDataPoint[]>(() => trendsData.value?.points || [])

const maxRevenue = computed(() => {
  const max = Math.max(...points.value.map((p) => p.revenue), 0)
  return max === 0 ? 1000000 : max * 1.15
})

const gridLevels = computed(() => {
  const max = maxRevenue.value
  return [
    { value: max, y: padTop },
    { value: max * 0.66, y: padTop + chartHeight.value * 0.33 },
    { value: max * 0.33, y: padTop + chartHeight.value * 0.66 },
    { value: 0, y: padTop + chartHeight.value },
  ]
})

const calculatedCoords = computed(() => {
  const total = points.value.length
  if (total === 0) return []
  return points.value.map((pt, idx) => {
    const x =
      total > 1 ? padLeft + (idx / (total - 1)) * chartWidth.value : padLeft + chartWidth.value / 2
    const y = padTop + chartHeight.value - (pt.revenue / maxRevenue.value) * chartHeight.value
    return { x, y, pt }
  })
})

const linePath = computed(() => {
  const coords = calculatedCoords.value
  if (coords.length === 0) return ''
  return coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
  }, '')
})

const areaPath = computed(() => {
  const coords = calculatedCoords.value
  if (coords.length === 0) return ''
  const bottomY = padTop + chartHeight.value
  const first = coords[0]!
  const last = coords[coords.length - 1]!
  return `${linePath.value} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
})

const activeHoverData = computed(() => {
  if (hoveredIndex.value === null) return null
  return calculatedCoords.value[hoveredIndex.value] || null
})

const shouldShowLabel = (idx: number, total: number) => {
  if (total <= 7) return true
  if (total <= 14) return idx % 2 === 0 || idx === total - 1
  return idx % 5 === 0 || idx === total - 1
}
</script>

<template>
  <div class="rounded-card border border-brand-hair bg-brand-canvas p-5 shadow-whisper space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="font-display text-base font-bold text-brand-ink m-0 flex items-center gap-2">
          <i class="pi pi-chart-line text-brand-accent text-sm" />
          <span>Tren Penjualan &amp; Pendapatan</span>
        </h2>
        <p class="text-xs text-brand-muted m-0 mt-0.5">
          Visualisasi omzet harian dari transaksi lunas dan selesai.
        </p>
      </div>

      <div
        class="inline-flex items-center rounded-lg border border-brand-hairsoft bg-brand-field p-1"
      >
        <button
          v-for="p in periods"
          :key="p.id"
          type="button"
          :class="[
            'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border-0',
            activePeriod === p.id
              ? 'bg-brand-canvas text-brand-ink shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink',
          ]"
          @click="activePeriod = p.id"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="p-3.5 rounded-field border border-brand-hairsoft bg-brand-canvas-soft space-y-1">
        <span class="text-[11px] font-medium text-brand-muted uppercase tracking-wider block">
          Total Omzet
        </span>
        <span class="font-display text-base font-bold text-brand-ink block tabular">
          {{ formatRupiah(trendsData?.summary.total_revenue || 0) }}
        </span>
      </div>
      <div class="p-3.5 rounded-field border border-brand-hairsoft bg-brand-canvas-soft space-y-1">
        <span class="text-[11px] font-medium text-brand-muted uppercase tracking-wider block">
          Volume Transaksi
        </span>
        <span class="font-display text-base font-bold text-brand-ink block tabular">
          {{ trendsData?.summary.total_orders || 0 }} Pesanan
        </span>
      </div>
      <div class="p-3.5 rounded-field border border-brand-hairsoft bg-brand-canvas-soft space-y-1">
        <span class="text-[11px] font-medium text-brand-muted uppercase tracking-wider block">
          Rata-rata Nilai Pesanan (AOV)
        </span>
        <span class="font-display text-base font-bold text-brand-ink block tabular">
          {{ formatRupiah(trendsData?.summary.average_order_value || 0) }}
        </span>
      </div>
    </div>

    <div class="relative w-full overflow-hidden">
      <div v-if="loading" class="h-56 w-full animate-pulse rounded-lg bg-brand-field" />

      <div v-else class="relative w-full">
        <div
          v-if="activeHoverData"
          class="absolute z-20 pointer-events-none rounded-lg border border-brand-hair bg-brand-canvas px-3 py-2 text-xs shadow-floating transition-all transform -translate-x-1/2 -translate-y-full"
          :style="{
            left: `${(activeHoverData.x / svgWidth) * 100}%`,
            top: `${(activeHoverData.y / svgHeight) * 100 - 4}%`,
          }"
        >
          <p class="font-bold text-brand-ink m-0">{{ activeHoverData.pt.label }}</p>
          <p class="font-display text-brand-accent-text font-bold m-0 mt-0.5 tabular">
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
              <circle :cx="coord.x" :cy="coord.y" r="14" fill="transparent" />
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
