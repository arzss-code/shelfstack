import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  adminTrendsQuerySchema,
  type AdminTrendsResponseData,
  type TrendDataPoint,
} from '~~/shared/schemas/admin-stats'

const MONTH_NAMES = [
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

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-')
  const day = parts[2] || '01'
  const monthIdx = parseInt(parts[1] || '1', 10) - 1
  return `${day} ${MONTH_NAMES[monthIdx] || ''}`
}

function generateDateBuckets(period: '7d' | '30d' | 'month'): {
  buckets: Record<string, TrendDataPoint>
  startIso: string
  endIso: string
} {
  const now = new Date()
  const buckets: Record<string, TrendDataPoint> = {}

  let startDate: Date
  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === '30d') {
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 29)
  } else {
    // Default 7d
    startDate = new Date(now)
    startDate.setDate(now.getDate() - 6)
  }
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(now)
  endDate.setHours(23, 59, 59, 999)

  const cur = new Date(startDate)
  while (cur <= endDate) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    const key = `${y}-${m}-${d}`

    buckets[key] = {
      date: key,
      label: formatDateLabel(key),
      revenue_cents: 0,
      revenue: 0,
      order_count: 0,
    }

    cur.setDate(cur.getDate() + 1)
  }

  return {
    buckets,
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = await getValidatedQuery(event, (data) => adminTrendsQuerySchema.parse(data))
  const period = query.period || '7d'

  const client = await serverSupabaseClient<Database>(event)
  const { buckets, startIso, endIso } = generateDateBuckets(period)

  try {
    const { data: orders, error } = await client
      .from('orders')
      .select('id, total_cents, status, created_at')
      .in('status', ['paid', 'shipped', 'completed'])
      .gte('created_at', startIso)
      .lte('created_at', endIso)
      .order('created_at', { ascending: true })

    if (error) {
      return errorResponse(event, 'Gagal mengambil data pesanan tren.', error, 500)
    }

    for (const order of orders || []) {
      if (!order.created_at) continue
      const dateKey = order.created_at.slice(0, 10)
      if (buckets[dateKey]) {
        const cents = order.total_cents || 0
        buckets[dateKey].revenue_cents += cents
        buckets[dateKey].revenue = buckets[dateKey].revenue_cents / 100
        buckets[dateKey].order_count += 1
      }
    }

    const points = Object.values(buckets)
    const total_revenue_cents = points.reduce((acc, p) => acc + p.revenue_cents, 0)
    const total_orders = points.reduce((acc, p) => acc + p.order_count, 0)
    const total_revenue = total_revenue_cents / 100
    const average_order_value_cents =
      total_orders > 0 ? Math.round(total_revenue_cents / total_orders) : 0
    const average_order_value = average_order_value_cents / 100

    const responseData: AdminTrendsResponseData = {
      period,
      points,
      summary: {
        total_revenue_cents,
        total_revenue,
        total_orders,
        average_order_value_cents,
        average_order_value,
      },
    }

    return successResponse('Data tren penjualan berhasil dimuat', responseData)
  } catch (err: unknown) {
    return errorResponse(event, 'Terjadi kesalahan memproses statistik tren.', err, 500)
  }
})
