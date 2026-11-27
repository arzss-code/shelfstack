import { z } from 'zod'

export const adminTrendsPeriodSchema = z.enum(['7d', '30d', '90d', 'month', 'year', 'custom'])

export const adminTrendsStatusScopeSchema = z.enum(['confirmed', 'completed', 'all_active'])

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

export const adminTrendsQuerySchema = z.object({
  period: adminTrendsPeriodSchema.default('7d'),
  status_scope: adminTrendsStatusScopeSchema.default('confirmed'),
  from: z.string().regex(isoDatePattern).optional(),
  to: z.string().regex(isoDatePattern).optional(),
})

export type AdminTrendsPeriod = z.infer<typeof adminTrendsPeriodSchema>
export type AdminTrendsStatusScope = z.infer<typeof adminTrendsStatusScopeSchema>
export type AdminTrendsGranularity = 'day' | 'week' | 'month'

export interface TrendDataPoint {
  date: string
  label: string
  revenue_cents: number
  revenue: number
  order_count: number
}

export interface TrendsSummary {
  total_revenue_cents: number
  total_revenue: number
  total_orders: number
  average_order_value_cents: number
  average_order_value: number
  peak_label?: string
  peak_revenue?: number
  peak_orders?: number
  active_buckets?: number
  revenue_delta_pct?: number | null
  orders_delta_pct?: number | null
}

export interface AdminTrendsResponseData {
  period: AdminTrendsPeriod
  status_scope?: AdminTrendsStatusScope
  granularity?: AdminTrendsGranularity
  start_date?: string
  end_date?: string
  points: TrendDataPoint[]
  summary: TrendsSummary
}
