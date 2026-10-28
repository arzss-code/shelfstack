import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { createCouponSchema } from '~~/shared/schemas/coupon'
import { successResponse, errorResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = await serverSupabaseClient<Database>(event)

    const rawBody = await readBody(event)
    const parsed = createCouponSchema.safeParse(rawBody)

    if (!parsed.success) {
      return errorResponse(
        event,
        'Validasi formulir kupon gagal',
        parsed.error.flatten().fieldErrors,
        400,
      )
    }

    const input = parsed.data

    // Check if code already exists in active/non-deleted coupons
    const { data: existing } = await client
      .from('coupons')
      .select('id')
      .eq('code', input.code)
      .is('deleted_at', null)
      .maybeSingle()

    if (existing) {
      return errorResponse(
        event,
        `Kode kupon "${input.code}" sudah digunakan. Silakan gunakan kode lain.`,
        null,
        409,
      )
    }

    const { data: createdCoupon, error: insertError } = await client
      .from('coupons')
      .insert({
        code: input.code,
        name: input.name,
        description: input.description || null,
        discount_type: input.discount_type,
        discount_value: input.discount_value,
        max_discount_cents: input.max_discount_cents ?? null,
        min_purchase_cents: input.min_purchase_cents ?? 0,
        usage_limit: input.usage_limit ?? null,
        user_limit: input.user_limit ?? 1,
        starts_at: input.starts_at || null,
        expires_at: input.expires_at || null,
        is_active: input.is_active ?? true,
      })
      .select()
      .single()

    if (insertError) {
      return errorResponse(
        event,
        'Gagal menyimpan kupon baru ke database',
        insertError.message,
        500,
      )
    }

    setResponseStatus(event, 201)
    return successResponse('Kupon promosi baru berhasil dibuat', createdCoupon)
  } catch (err: any) {
    return errorResponse(
      event,
      err.message || 'Terjadi kesalahan sistem',
      null,
      err.statusCode || 500,
    )
  }
})
