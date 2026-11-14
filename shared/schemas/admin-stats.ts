import { z } from 'zod'

export const adminTrendsPeriodSchema = z.enum(['7d', '30d', 'month'])

export const adminTrendsQuerySchema = z.object({
  period: adminTrendsPeriodSchema.default('7d'),
})

export type AdminTrendsPeriod = z.infer<typeof adminTrendsPeriodSchema>

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
}

export interface AdminTrendsResponseData {
  period: AdminTrendsPeriod
  points: TrendDataPoint[]
  summary: TrendsSummary
}
