import { computed, ref, type Ref } from 'vue'
import { formatRupiah } from '~/utils/format'
import type {
  AdminTrendsPeriod,
  AdminTrendsResponseData,
  AdminTrendsStatusScope,
  TrendDataPoint,
} from '~~/shared/schemas/admin-stats'

export type ChartMetric = 'revenue' | 'orders'

export const CHART_SVG_WIDTH = 800
export const CHART_SVG_HEIGHT = 228
export const CHART_PAD_LEFT = 68
export const CHART_PAD_RIGHT = 24
export const CHART_PAD_TOP = 24
export const CHART_PAD_BOTTOM = 34
export const CHART_PLOT_WIDTH = CHART_SVG_WIDTH - CHART_PAD_LEFT - CHART_PAD_RIGHT
export const CHART_PLOT_HEIGHT = CHART_SVG_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM

function formatCompactDecimal(val: number): string {
  const fixed = val >= 10 ? val.toFixed(0) : val.toFixed(1)
  return fixed.replace(/\.0$/, '').replace('.', ',')
}

export function formatSalesAxisTick(value: number, metric: ChartMetric): string {
  if (value <= 0) return metric === 'revenue' ? 'Rp 0' : '0'
  if (metric === 'orders') {
    return `${Math.round(value)}`
  }
  if (value >= 1_000_000_000) return `Rp ${formatCompactDecimal(value / 1_000_000_000)}M`
  if (value >= 1_000_000) return `Rp ${formatCompactDecimal(value / 1_000_000)}jt`
  if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}rb`
  return `Rp ${Math.round(value)}`
}

export function useAdminSalesChart(
  trendsData: Ref<AdminTrendsResponseData | null>,
  metric: Ref<ChartMetric>,
) {
  const hoveredIndex = ref<number | null>(null)
  const points = computed<TrendDataPoint[]>(() => trendsData.value?.points || [])

  const getMetricValue = (pt: TrendDataPoint) =>
    metric.value === 'orders' ? pt.order_count : pt.revenue

  const maxValue = computed(() => {
    const rawMax = Math.max(...points.value.map(getMetricValue), 0)
    if (rawMax === 0) return metric.value === 'orders' ? 10 : 1_000_000
    if (metric.value === 'orders') return Math.max(4, Math.ceil(rawMax * 1.25))
    return rawMax * 1.15
  })

  const gridLevels = computed(() => [
    { value: maxValue.value, y: CHART_PAD_TOP },
    { value: maxValue.value * 0.66, y: CHART_PAD_TOP + CHART_PLOT_HEIGHT * 0.33 },
    { value: maxValue.value * 0.33, y: CHART_PAD_TOP + CHART_PLOT_HEIGHT * 0.66 },
    { value: 0, y: CHART_PAD_TOP + CHART_PLOT_HEIGHT },
  ])

  const hitWidth = computed(() =>
    Math.max(24, CHART_PLOT_WIDTH / Math.max(points.value.length - 1, 1)),
  )

  const calculatedCoords = computed(() => {
    const total = points.value.length
    return points.value.map((pt, idx) => ({
      x:
        total > 1
          ? CHART_PAD_LEFT + (idx / (total - 1)) * CHART_PLOT_WIDTH
          : CHART_PAD_LEFT + CHART_PLOT_WIDTH / 2,
      y:
        CHART_PAD_TOP +
        CHART_PLOT_HEIGHT -
        (getMetricValue(pt) / maxValue.value) * CHART_PLOT_HEIGHT,
      pt,
    }))
  })

  const linePath = computed(() =>
    calculatedCoords.value.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' '),
  )

  const areaPath = computed(() => {
    const coords = calculatedCoords.value
    if (coords.length === 0) return ''
    const bottomY = CHART_PAD_TOP + CHART_PLOT_HEIGHT
    return `${linePath.value} L ${coords[coords.length - 1]!.x} ${bottomY} L ${coords[0]!.x} ${bottomY} Z`
  })

  const activeHoverData = computed(() => {
    if (hoveredIndex.value === null) return null
    return calculatedCoords.value[hoveredIndex.value] || null
  })

  const tooltipStyle = computed(() => {
    const data = activeHoverData.value
    if (!data) return {}
    const rawLeft = (data.x / CHART_SVG_WIDTH) * 100
    const clampedLeft = Math.min(84, Math.max(16, rawLeft))
    const placeBelow = data.y < 102
    const topPct = placeBelow
      ? (data.y / CHART_SVG_HEIGHT) * 100 + 6
      : (data.y / CHART_SVG_HEIGHT) * 100 - 5
    return {
      left: `${clampedLeft}%`,
      top: `${topPct}%`,
      transform: placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
    }
  })

  const shouldShowXAxisLabel = (idx: number, total: number) => {
    if (total <= 8) return true
    if (total <= 16) return idx % 2 === 0 || idx === total - 1
    if (total <= 35) return idx % 5 === 0 || idx === total - 1
    return idx % 3 === 0 || idx === total - 1
  }

  const summaryStats = computed(() => {
    const sum = trendsData.value?.summary
    const revDelta = sum?.revenue_delta_pct
    const ordDelta = sum?.orders_delta_pct
    return [
      {
        label: 'Total Omzet',
        value: formatRupiah(sum?.total_revenue || 0),
        delta: revDelta ?? null,
        hint: revDelta != null ? 'vs periode lalu' : 'Pendapatan terakumulasi',
      },
      {
        label: 'Total Pesanan',
        value: `${sum?.total_orders || 0} pesanan`,
        delta: ordDelta ?? null,
        hint:
          sum?.active_buckets != null ? `${sum.active_buckets} titik aktif` : 'Transaksi tercatat',
      },
      {
        label: 'Rata-rata Nilai Pesanan',
        value: formatRupiah(sum?.average_order_value || 0),
        delta: null,
        hint: 'Nilai rata-rata per transaksi',
      },
      {
        label: 'Puncak Periode',
        value: sum?.peak_revenue ? formatRupiah(sum.peak_revenue) : 'Rp 0',
        delta: null,
        hint:
          sum?.peak_label && sum.peak_label !== '-'
            ? `${sum.peak_label} (${sum.peak_orders || 0} transaksi)`
            : 'Belum ada transaksi',
      },
    ]
  })

  return {
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
  }
}

export const PERIOD_OPTIONS: Array<{ id: AdminTrendsPeriod; label: string }> = [
  { id: '7d', label: '7 Hari' },
  { id: '30d', label: '30 Hari' },
  { id: '90d', label: '90 Hari' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'year', label: 'Tahun Ini' },
  { id: 'custom', label: 'Kustom' },
]

export const STATUS_SCOPE_OPTIONS: Array<{ value: AdminTrendsStatusScope; label: string }> = [
  { value: 'confirmed', label: 'Lunas & Selesai' },
  { value: 'completed', label: 'Khusus Selesai' },
  { value: 'all_active', label: 'Semua Aktif' },
]
