import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { deleteProductReview } from '../../../../utils/review'

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)

  const reviewId = getRouterParam(event, 'reviewId')
  if (!reviewId) {
    return errorResponse(event, 'ID ulasan diperlukan.', null, 400)
  }

  const client = await serverSupabaseClient<Database>(event)

  try {
    const result = await deleteProductReview(client, {
      reviewId,
      userId: user.id,
      isAdmin: profile.role === 'admin',
    })

    return successResponse('Ulasan produk berhasil dihapus.', result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus ulasan produk.'
    const isForbidden = message.includes('wewenang')
    const isNotFound = message.includes('tidak ditemukan')
    const statusCode = isForbidden ? 403 : isNotFound ? 404 : 500

    return errorResponse(
      event,
      message,
      error instanceof Error ? error.message : String(error),
      statusCode,
    )
  }
})
