import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { formatRupiah } from '~/utils/format'
import { logger } from '../../../utils/logger'
import { successResponse, errorResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event)
    const user = await serverSupabaseUser(event).catch(() => null)
    const rawId =
      (user as { id?: string; sub?: string } | null)?.id || (user as { sub?: string } | null)?.sub
    const userId = typeof rawId === 'string' && rawId !== 'undefined' ? rawId : null

    const { data: coupons, error } = await client
      .from('coupons')
      .select('*')
      .not('coin_cost', 'is', null)
      .gt('coin_cost', 0)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('coin_cost', { ascending: true })

    if (error) {
      const isMissingColumn =
        error.code === '42703' ||
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        error.code === 'PGRST205' ||
        error.code === '42501' ||
        error.message?.toLowerCase().includes('coin_cost') ||
        error.message?.toLowerCase().includes('schema cache') ||
        error.message?.toLowerCase().includes('does not exist')

      if (isMissingColumn) {
        logger.warn(
          '[Points Catalog] Kolom coin_cost belum tersedia di tabel coupons. Menampilkan katalog kosong.',
        )
        return successResponse('Katalog penukaran koin berhasil dimuat.', [])
      }

      return errorResponse(event, 'Gagal memuat katalog penukaran koin.', error.message, 500)
    }

    let claimedCouponIds = new Set<string>()
    if (userId) {
      const { data: userCoupons } = await client
        .from('user_coupons')
        .select('coupon_id')
        .eq('user_id', userId)
        .eq('status', 'claimed')

      if (userCoupons) {
        claimedCouponIds = new Set(userCoupons.map((uc: { coupon_id: string }) => uc.coupon_id))
      }
    }

    interface CouponCatalogRow {
      id: string
      code: string
      name: string
      description: string | null
      discount_type: 'percentage' | 'fixed'
      discount_value: number
      min_purchase_cents: number
      max_discount_cents: number | null
      coin_cost: number
      expires_at: string | null
    }

    const catalog = ((coupons || []) as unknown as CouponCatalogRow[]).map((c) => {
      const formattedDiscount =
        c.discount_type === 'percentage'
          ? `Diskon ${c.discount_value}%`
          : formatRupiah(c.discount_value / 100)

      const formattedMinPurchase =
        c.min_purchase_cents > 0 ? formatRupiah(c.min_purchase_cents / 100) : 'Tanpa Minimum'

      const formattedMaxDiscount =
        c.max_discount_cents != null ? formatRupiah(c.max_discount_cents / 100) : null

      return {
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        formatted_discount: formattedDiscount,
        min_purchase_cents: c.min_purchase_cents,
        formatted_min_purchase: formattedMinPurchase,
        max_discount_cents: c.max_discount_cents,
        formatted_max_discount: formattedMaxDiscount,
        coin_cost: c.coin_cost,
        formatted_coin_cost: `${new Intl.NumberFormat('id-ID').format(c.coin_cost)} Koin`,
        is_claimed: claimedCouponIds.has(c.id),
        expires_at: c.expires_at,
      }
    })

    return successResponse('Katalog penukaran koin berhasil dimuat.', catalog)
  } catch (err: unknown) {
    if (err && typeof err === 'object' && ('statusCode' in err || 'status' in err)) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
    return errorResponse(
      event,
      'Terjadi kesalahan saat memuat katalog penukaran koin.',
      message,
      500,
    )
  }
})
