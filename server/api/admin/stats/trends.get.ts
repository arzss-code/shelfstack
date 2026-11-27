import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminTrendsQuerySchema, type AdminTrendsResponseData } from '~~/shared/schemas/admin-stats'
import {
  calculateDeltaPct,
  createTrendsBuckets,
  resolveOrderBucketKey,
  resolveTrendsStatuses,
  resolveTrendsWindow,
} from '../../../utils/admin-trends'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = await getValidatedQuery(event, (data) => adminTrendsQuerySchema.parse(data))
  const period = query.period || '7d'
  const statusScope = query.status_scope || 'confirmed'

  const client = await serverSupabaseClient<Database>(event)
  const { startDate, endDate, prevStartDate, prevEndDate, granularity } = resolveTrendsWindow(
    period,
    query.from,
    query.to,
  )
  const buckets = createTrendsBuckets(startDate, endDate, granularity)
  const statuses = resolveTrendsStatuses(statusScope)

  try {
    const [currentRes, prevRes] = await Promise.all([
      client
        .from('orders')
        .select('id, total_cents, status, created_at')
        .in('status', statuses)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true }),
      client
        .from('orders')
        .select('id, total_cents')
        .in('status', statuses)
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString()),
    ])

    if (currentRes.error) {
      return errorResponse(event, 'Gagal mengambil data pesanan tren.', currentRes.error, 500)
    }

    for (const order of currentRes.data || []) {
      if (!order.created_at) continue
      const key = resolveOrderBucketKey(order.created_at, granularity)
      if (key && buckets[key]) {
        const cents = order.total_cents || 0
        buckets[key].revenue_cents += cents
        buckets[key].revenue = buckets[key].revenue_cents / 100
        buckets[key].order_count += 1
      }
    }

    const points = Object.values(buckets)
    const total_revenue_cents = points.reduce((acc, p) => acc + p.revenue_cents, 0)
    const total_orders = points.reduce((acc, p) => acc + p.order_count, 0)
    const total_revenue = total_revenue_cents / 100
    const average_order_value_cents =
      total_orders > 0 ? Math.round(total_revenue_cents / total_orders) : 0

    const prevOrders = prevRes.data || []
    const prevRevenueCents = prevOrders.reduce((acc, o) => acc + (o.total_cents || 0), 0)

    const peakPoint = points.reduce(
      (best, pt) => (pt.revenue > best.revenue ? pt : best),
      points[0] || { label: '-', revenue: 0, order_count: 0 },
    )

    const responseData: AdminTrendsResponseData = {
      period,
      status_scope: statusScope,
      granularity,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      points,
      summary: {
        total_revenue_cents,
        total_revenue,
        total_orders,
        average_order_value_cents,
        average_order_value: average_order_value_cents / 100,
        peak_label: peakPoint.revenue > 0 ? peakPoint.label : '-',
        peak_revenue: peakPoint.revenue,
        peak_orders: peakPoint.order_count,
        active_buckets: points.filter((p) => p.order_count > 0).length,
        revenue_delta_pct: prevRes.error
          ? null
          : calculateDeltaPct(total_revenue_cents, prevRevenueCents),
        orders_delta_pct: prevRes.error ? null : calculateDeltaPct(total_orders, prevOrders.length),
      },
    }

    return successResponse('Data tren penjualan berhasil dimuat', responseData)
  } catch (err: unknown) {
    return errorResponse(event, 'Terjadi kesalahan memproses statistik tren.', err, 500)
  }
})
