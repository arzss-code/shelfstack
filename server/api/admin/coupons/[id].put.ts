import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { updateCouponSchema } from '~~/shared/schemas/coupon'
import { requireAdmin } from '../../../utils/auth'
import { successResponse, errorResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = await serverSupabaseClient<Database>(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      return errorResponse(event, 'ID kupon diperlukan', null, 400)
    }

    const rawBody = await readBody(event)
    const parsed = updateCouponSchema.safeParse(rawBody)

    if (!parsed.success) {
      return errorResponse(
        event,
        'Validasi data kupon gagal',
        parsed.error.flatten().fieldErrors,
        400,
      )
    }

    const updates = parsed.data

    const { data: updatedCoupon, error: updateError } = await client
      .from('coupons')
      // @ts-expect-error Supabase Database types might omit coin_cost if not regenerated
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (updateError) {
      return errorResponse(event, 'Gagal memperbarui data kupon', updateError.message, 500)
    }

    if (!updatedCoupon) {
      return errorResponse(event, 'Kupon tidak ditemukan atau telah dihapus', null, 404)
    }

    return successResponse('Kupon promosi berhasil diperbarui', updatedCoupon)
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
