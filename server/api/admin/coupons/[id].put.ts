import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { updateCouponSchema } from '~~/shared/schemas/coupon'
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
  } catch (err: any) {
    return errorResponse(
      event,
      err.message || 'Terjadi kesalahan sistem',
      null,
      err.statusCode || 500,
    )
  }
})
