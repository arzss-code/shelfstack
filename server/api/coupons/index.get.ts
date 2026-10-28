import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { formatRupiah } from '~/utils/format'
import { successResponse, errorResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event)

    const now = new Date().toISOString()

    const { data: coupons, error } = await client
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      return errorResponse(event, 'Gagal mengambil data kupon promosi', error.message, 500)
    }

    const formattedCoupons = (coupons || []).map((coupon) => {
      const isExpired = coupon.expires_at
        ? new Date(coupon.expires_at).getTime() < Date.now()
        : false
      const formattedDiscount =
        coupon.discount_type === 'percentage'
          ? `Diskon ${coupon.discount_value}%`
          : `Potongan ${formatRupiah(coupon.discount_value / 100)}`

      const formattedMinPurchase =
        coupon.min_purchase_cents > 0
          ? formatRupiah(coupon.min_purchase_cents / 100)
          : 'Tanpa Minimum'

      const formattedMaxDiscount =
        coupon.max_discount_cents != null ? formatRupiah(coupon.max_discount_cents / 100) : null

      const remainingQuota =
        coupon.usage_limit != null ? Math.max(0, coupon.usage_limit - coupon.usage_count) : null

      return {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        formatted_discount: formattedDiscount,
        max_discount_cents: coupon.max_discount_cents,
        formatted_max_discount: formattedMaxDiscount,
        min_purchase_cents: coupon.min_purchase_cents,
        formatted_min_purchase: formattedMinPurchase,
        usage_limit: coupon.usage_limit,
        usage_count: coupon.usage_count,
        remaining_quota: remainingQuota,
        user_limit: coupon.user_limit,
        starts_at: coupon.starts_at,
        expires_at: coupon.expires_at,
        is_expired: isExpired,
        is_available:
          !isExpired && (coupon.usage_limit == null || coupon.usage_count < coupon.usage_limit),
      }
    })

    return successResponse('Daftar kupon promosi aktif berhasil diambil', formattedCoupons)
  } catch (err: any) {
    return errorResponse(event, 'Terjadi kesalahan internal', err.message, 500)
  }
})
