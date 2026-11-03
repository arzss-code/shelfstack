import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { formatRupiah } from '~/utils/format'
import { requireAdmin } from '../../../../utils/auth'
import { successResponse, errorResponse } from '../../../../utils/response'

export interface CouponUsageItem {
  id: string
  order_id: string
  user_id: string
  discount_cents: number
  formatted_discount: string
  order_total_cents: number
  formatted_order_total: string
  order_status: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = await serverSupabaseClient<Database>(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      return errorResponse(event, 'ID kupon diperlukan', null, 400)
    }

    // 1. Ambil detail kupon untuk verifikasi eksistensi
    const { data: coupon, error: couponError } = await client
      .from('coupons')
      .select('id, code, name')
      .eq('id', id)
      .maybeSingle()

    if (couponError || !coupon) {
      return errorResponse(event, 'Voucher tidak ditemukan', couponError?.message, 404)
    }

    // 2. Ambil riwayat pemakaian dari tabel coupon_usages
    const { data: usages, error: usagesError } = await client
      .from('coupon_usages')
      .select('id, order_id, user_id, discount_cents, created_at')
      .eq('coupon_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (usagesError) {
      return errorResponse(
        event,
        'Gagal mengambil riwayat pemakaian voucher',
        usagesError.message,
        500,
      )
    }

    // 3. Ambil data order terkait untuk melengkapi status dan total nilai pesanan
    const orderIds = (usages || []).map((u) => u.order_id)
    let orderMap: Record<string, { total_cents: number; status: string }> = {}

    if (orderIds.length > 0) {
      const { data: orders } = await client
        .from('orders')
        .select('id, total_cents, status')
        .in('id', orderIds)

      if (orders) {
        orderMap = orders.reduce<Record<string, { total_cents: number; status: string }>>(
          (acc, o) => {
            acc[o.id] = { total_cents: o.total_cents, status: o.status }
            return acc
          },
          {},
        )
      }
    }

    const items: CouponUsageItem[] = (usages || []).map((u) => {
      const ord = orderMap[u.order_id] || { total_cents: 0, status: 'unknown' }
      return {
        id: u.id,
        order_id: u.order_id,
        user_id: u.user_id,
        discount_cents: u.discount_cents,
        formatted_discount: formatRupiah(u.discount_cents / 100),
        order_total_cents: ord.total_cents,
        formatted_order_total: formatRupiah(ord.total_cents / 100),
        order_status: ord.status,
        created_at: u.created_at,
      }
    })

    return successResponse('Riwayat pemakaian voucher berhasil diambil', {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
      },
      usages: items,
      total_records: items.length,
    })
  } catch (err: unknown) {
    const errorObj = err as { message?: string; statusCode?: number }
    return errorResponse(
      event,
      errorObj?.message || 'Terjadi kesalahan sistem',
      null,
      errorObj?.statusCode || 500,
    )
  }
})
