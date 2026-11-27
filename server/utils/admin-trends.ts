import type {
  AdminTrendsGranularity,
  AdminTrendsPeriod,
  AdminTrendsStatusScope,
  TrendDataPoint,
} from '../../shared/schemas/admin-stats'

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatBucketLabel(dateStr: string, granularity: AdminTrendsGranularity): string {
  const parts = dateStr.split('-')
  const year = parts[0] || ''
  const monthIdx = Number.parseInt(parts[1] || '1', 10) - 1
  const day = parts[2] || '01'
  const month = MONTH_SHORT[monthIdx] || ''
  if (granularity === 'month') {
    return `${month} ${year.slice(-2)}`
  }
  return `${day} ${month}`
}

export function resolveTrendsStatuses(
  scope: AdminTrendsStatusScope,
): Array<'pending' | 'paid' | 'shipped' | 'completed'> {
  if (scope === 'completed') return ['completed']
  if (scope === 'all_active') return ['pending', 'paid', 'shipped', 'completed']
  return ['paid', 'shipped', 'completed']
}

export function resolveTrendsWindow(
  period: AdminTrendsPeriod,
  customFrom?: string,
  customTo?: string,
  now: Date = new Date(),
): {
  startDate: Date
  endDate: Date
  prevStartDate: Date
  prevEndDate: Date
  granularity: AdminTrendsGranularity
} {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let startDate = new Date(today)
  let endDate = new Date(today)

  if (period === 'custom' && (customFrom || customTo)) {
    const parsedFrom = customFrom ? parseIsoDate(customFrom) : null
    const parsedTo = customTo ? parseIsoDate(customTo) : null
    startDate =
      parsedFrom ||
      parsedTo ||
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
    endDate = parsedTo || parsedFrom || today
    if (startDate > endDate) {
      const tmp = startDate
      startDate = endDate
      endDate = tmp
    }
    const maxSpanMs = 365 * 24 * 60 * 60 * 1000
    if (endDate.getTime() - startDate.getTime() > maxSpanMs) {
      startDate = new Date(endDate.getTime() - maxSpanMs)
    }
  } else if (period === '30d') {
    startDate.setDate(today.getDate() - 29)
  } else if (period === '90d') {
    startDate.setDate(today.getDate() - 89)
  } else if (period === 'month') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
  } else if (period === 'year') {
    startDate = new Date(today.getFullYear(), 0, 1)
  } else {
    startDate.setDate(today.getDate() - 6)
  }

  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  const spanDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
  )
  const granularity: AdminTrendsGranularity =
    spanDays > 160 ? 'month' : spanDays > 45 ? 'week' : 'day'

  const prevEndDate = new Date(startDate.getTime() - 1)
  const prevStartDate = new Date(prevEndDate)
  prevStartDate.setDate(prevEndDate.getDate() - (spanDays - 1))
  prevStartDate.setHours(0, 0, 0, 0)

  return { startDate, endDate, prevStartDate, prevEndDate, granularity }
}

function getBucketKey(date: Date, granularity: AdminTrendsGranularity): string {
  if (granularity === 'month') {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }
  if (granularity === 'week') {
    const mondayOffset = (date.getDay() + 6) % 7
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset)
    return toIsoDate(monday)
  }
  return toIsoDate(date)
}

export function createTrendsBuckets(
  startDate: Date,
  endDate: Date,
  granularity: AdminTrendsGranularity,
): Record<string, TrendDataPoint> {
  const buckets: Record<string, TrendDataPoint> = {}
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())

  while (cursor <= endDate) {
    const key = getBucketKey(cursor, granularity)
    if (!buckets[key]) {
      buckets[key] = {
        date: key,
        label: formatBucketLabel(key, granularity),
        revenue_cents: 0,
        revenue: 0,
        order_count: 0,
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return buckets
}

export function resolveOrderBucketKey(
  createdAtIso: string,
  granularity: AdminTrendsGranularity,
): string | null {
  const date = new Date(createdAtIso)
  if (Number.isNaN(date.getTime())) return null
  return getBucketKey(date, granularity)
}

export function calculateDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 1000) / 10
}
