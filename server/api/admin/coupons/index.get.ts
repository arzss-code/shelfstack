import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { formatRupiah } from '~/utils/format'
import { successResponse, errorResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = await serverSupabaseClient<Database>(event)
    const query = getQuery(event)

    const search = ((query.search as string) || '').trim()
    const status = (query.status as string) || 'all'
    const discountType = (query.discount_type as string) || 'all'

    // Fetch all non-deleted coupons
    let dbQuery = client
      .from('coupons')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (search) {
      dbQuery = dbQuery.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    if (discountType === 'percentage' || discountType === 'fixed') {
      dbQuery = dbQuery.eq('discount_type', discountType)
    }

    const { data: rawCoupons, error } = await dbQuery

    if (error) {
      return errorResponse(event, 'Gagal mengambil daftar voucher admin', error.message, 500)
    }

    const now = Date.now()

    // Calculate metrics
    const totalCoupons = rawCoupons?.length || 0
    let activeCouponsCount = 0
    let totalUsages = 0

    for (const c of rawCoupons || []) {
      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < now : false
      if (c.is_active && !isExpired) {
        activeCouponsCount++
      }
      totalUsages += c.usage_count || 0
    }

    // Get total discount given across all orders
    const { data: ordersWithDiscount } = await client
      .from('orders')
      .select('discount_cents')
      .gt('discount_cents', 0)

    const totalDiscountCents = (ordersWithDiscount || []).reduce(
      (acc, curr) => acc + (curr.discount_cents || 0),
      0,
    )

    // Filter by status if specified
    const filteredCoupons = (rawCoupons || []).filter((c) => {
      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < now : false
      if (status === 'active') {
        return c.is_active && !isExpired
      }
      if (status === 'inactive') {
        return !c.is_active
      }
      if (status === 'expired') {
        return isExpired
      }
      return true
    })

    const formattedList = filteredCoupons.map((coupon) => {
      const isExpired = coupon.expires_at ? new Date(coupon.expires_at).getTime() < now : false
      const formattedDiscount =
        coupon.discount_type === 'percentage'
          ? `${coupon.discount_value}%`
          : formatRupiah(coupon.discount_value / 100)

      const formattedMaxDiscount =
        coupon.max_discount_cents != null
          ? formatRupiah(coupon.max_discount_cents / 100)
          : 'Tanpa Pagu'

      const formattedMinPurchase =
        coupon.min_purchase_cents > 0 ? formatRupiah(coupon.min_purchase_cents / 100) : 'Rp0'

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
        user_limit: coupon.user_limit,
        starts_at: coupon.starts_at,
        expires_at: coupon.expires_at,
        is_active: coupon.is_active,
        is_expired: isExpired,
        created_at: coupon.created_at,
      }
    })

    return successResponse('Daftar voucher admin berhasil diambil', {
      coupons: formattedList,
      metrics: {
        total_coupons: totalCoupons,
        active_coupons: activeCouponsCount,
        total_usages: totalUsages,
        total_discount_cents: totalDiscountCents,
        formatted_total_discount: formatRupiah(totalDiscountCents / 100),
      },
    })
  } catch (err: any) {
    return errorResponse(
      event,
      err.message || 'Terjadi kesalahan sistem',
      null,
      err.statusCode || 500,
    )
  }
})
