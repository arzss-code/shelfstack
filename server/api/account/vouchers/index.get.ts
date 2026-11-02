import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { formatRupiah } from '~/utils/format'
import { successResponse, errorResponse } from '../../../utils/response'
import type {
  UserVoucherItem,
  VoucherWalletResponse,
} from '../../../../shared/schemas/user-voucher'

interface CouponJoinData {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_purchase_cents: number
  max_discount_cents: number | null
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  deleted_at: string | null
}

interface UserCouponJoinRow {
  id: string
  user_id: string
  coupon_id: string
  status: 'claimed' | 'used' | 'expired'
  claimed_at: string
  used_at: string | null
  order_id: string | null
  coupons: CouponJoinData | null
}

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      return errorResponse(event, 'Sesi tidak valid. Silakan masuk kembali.', null, 401)
    }

    const client = await serverSupabaseClient<Database>(event)

    // 1. Ambil seluruh kupon yang diklaim oleh pengguna
    const { data: userCoupons, error: ucError } = await client
      .from('user_coupons')
      .select(
        `
        id,
        coupon_id,
        claimed_at,
        status,
        used_at,
        order_id,
        coupons:coupon_id (
          id,
          code,
          name,
          description,
          discount_type,
          discount_value,
          min_purchase_cents,
          max_discount_cents,
          starts_at,
          expires_at,
          is_active,
          deleted_at
        )
      `,
      )
      .eq('user_id', user.id)
      .order('claimed_at', { ascending: false })

    if (ucError) {
      return errorResponse(event, 'Gagal mengambil data voucher dompet.', ucError.message, 500)
    }

    // 2. Ambil seluruh kupon publik yang aktif
    const { data: allActiveCoupons, error: acError } = await client
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (acError) {
      return errorResponse(event, 'Gagal mengambil data katalog kupon.', acError.message, 500)
    }

    const claimedCouponIds = new Set<string>()

    const claimedList: UserVoucherItem[] = []
    const historyList: UserVoucherItem[] = []

    const now = Date.now()

    // 3. Format voucher yang sudah diklaim
    for (const uc of (userCoupons as unknown as UserCouponJoinRow[]) || []) {
      const c = uc.coupons
      if (!c) continue

      claimedCouponIds.add(uc.coupon_id)

      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < now : false
      const formattedDiscount =
        c.discount_type === 'percentage'
          ? `Diskon ${c.discount_value}%`
          : `Potongan ${formatRupiah(c.discount_value / 100)}`

      const formattedMinPurchase =
        c.min_purchase_cents > 0 ? formatRupiah(c.min_purchase_cents / 100) : 'Tanpa Minimum'

      const formattedMaxDiscount =
        c.max_discount_cents != null ? formatRupiah(c.max_discount_cents / 100) : null

      const voucherItem: UserVoucherItem = {
        id: uc.id,
        coupon_id: uc.coupon_id,
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
        starts_at: c.starts_at,
        expires_at: c.expires_at,
        status: uc.status as 'claimed' | 'used' | 'expired',
        claimed_at: uc.claimed_at,
        used_at: uc.used_at,
        is_expired: isExpired,
        order_id: uc.order_id,
      }

      if (uc.status === 'claimed' && !isExpired) {
        claimedList.push(voucherItem)
      } else {
        historyList.push(voucherItem)
      }
    }

    // 4. Format kupon publik yang belum diklaim
    const discoverableList: UserVoucherItem[] = []

    for (const c of allActiveCoupons || []) {
      if (claimedCouponIds.has(c.id)) continue

      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < now : false
      const isQuotaFull = c.usage_limit != null && c.usage_count >= c.usage_limit

      if (isExpired || isQuotaFull) continue

      const formattedDiscount =
        c.discount_type === 'percentage'
          ? `Diskon ${c.discount_value}%`
          : `Potongan ${formatRupiah(c.discount_value / 100)}`

      const formattedMinPurchase =
        c.min_purchase_cents > 0 ? formatRupiah(c.min_purchase_cents / 100) : 'Tanpa Minimum'

      const formattedMaxDiscount =
        c.max_discount_cents != null ? formatRupiah(c.max_discount_cents / 100) : null

      discoverableList.push({
        id: `discover-${c.id}`,
        coupon_id: c.id,
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
        starts_at: c.starts_at,
        expires_at: c.expires_at,
        status: 'available',
        claimed_at: null,
        used_at: null,
        is_expired: isExpired,
        order_id: null,
      })
    }

    const payload: VoucherWalletResponse = {
      claimed: claimedList,
      discoverable: discoverableList,
      history: historyList,
      active_count: claimedList.length,
    }

    return successResponse('Data dompet voucher berhasil diambil.', payload)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal server.'
    return errorResponse(event, 'Gagal memproses permintaan voucher dompet.', message, 500)
  }
})
