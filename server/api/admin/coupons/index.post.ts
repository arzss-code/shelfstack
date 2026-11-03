import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { createCouponSchema } from '~~/shared/schemas/coupon'
import { requireAdmin } from '../../../utils/auth'
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

    const insertPayload: Record<string, unknown> = {
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
      coin_cost: input.coin_cost ?? null,
    }

    const { data: createdCoupon, error: insertError } = await client
      .from('coupons')
      // @ts-expect-error Supabase Database types might omit coin_cost if not regenerated
      .insert(insertPayload)
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
