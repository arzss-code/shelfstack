import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { successResponse, errorResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = await serverSupabaseClient<Database>(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      return errorResponse(event, 'ID kupon diperlukan', null, 400)
    }

    const { data: softDeleted, error: deleteError } = await client
      .from('coupons')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .maybeSingle()

    if (deleteError) {
      return errorResponse(event, 'Gagal menghapus kupon', deleteError.message, 500)
    }

    if (!softDeleted) {
      return errorResponse(event, 'Kupon tidak ditemukan atau sudah dihapus sebelumnya', null, 404)
    }

    return successResponse('Kupon promosi berhasil dihapus', { id })
  } catch (err: any) {
    return errorResponse(
      event,
      err.message || 'Terjadi kesalahan sistem',
      null,
      err.statusCode || 500,
    )
  }
})
