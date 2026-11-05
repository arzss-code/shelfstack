export interface PromoCoupon {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  formatted_discount: string
  max_discount_cents: number | null
  formatted_max_discount: string | null
  min_purchase_cents: number
  formatted_min_purchase: string
  usage_limit: number | null
  usage_count: number
  remaining_quota: number | null
  user_limit: number
  starts_at: string | null
  expires_at: string | null
  is_expired: boolean
  is_available: boolean
}
