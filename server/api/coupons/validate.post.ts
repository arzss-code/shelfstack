import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { validateCouponSchema } from '../../../shared/schemas/coupon'
import { extractAuthUserId } from '../../../shared/utils/auth'
import { buildCouponSummary, validateCouponEligibility } from '../../utils/coupon'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method !== 'POST') {
    return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
  }

  const body = await readBody(event)
  const parsed = validateCouponSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(event, 'Validasi kupon gagal', parsed.error.flatten().fieldErrors, 400)
  }

  const { code, subtotal_cents } = parsed.data
  const client = await serverSupabaseClient<Database>(event)

  // 1. Cari data kupon aktif di database
  const { data: coupon, error } = await client
    .from('coupons')
    .select('*')
    .ilike('code', code)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    return errorResponse(event, 'Gagal memvalidasi kupon di sistem', error, 500)
  }

  if (!coupon) {
    return errorResponse(
      event,
      `Kode voucher promo "${code}" tidak ditemukan.`,
      { code: 'COUPON_NOT_FOUND' },
      404,
    )
  }

  // 2. Cek limit pengguna jika pengguna sudah login
  let userUsageCount = 0
  const authUser = await serverSupabaseUser(event).catch(() => null)
  const userId = authUser ? extractAuthUserId(authUser) : null

  if (userId) {
    const { count } = await client
      .from('coupon_usages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('coupon_id', coupon.id)

    userUsageCount = count || 0
  }

  // 3. Validasi aturan kelayakan
  const eligibility = validateCouponEligibility(coupon, subtotal_cents, userUsageCount)
  if (!eligibility.valid) {
    return errorResponse(
      event,
      eligibility.error || 'Kupon tidak dapat digunakan.',
      { code: 'COUPON_INELIGIBLE' },
      400,
    )
  }

  // 4. Bangun ringkasan perhitungan diskon
  const summary = buildCouponSummary(coupon, subtotal_cents)

  return successResponse('Kupon promo berhasil diterapkan', summary)
})
