import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { reviewQuerySchema } from '../../../../../shared/schemas/review'
import { errorResponse, successResponse } from '../../../../utils/response'
import { getProductReviews, resolveProductId } from '../../../../utils/review'

export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id')
  if (!rawId) {
    return errorResponse(event, 'Parameter produk diperlukan.', null, 400)
  }

  const client = await serverSupabaseClient<Database>(event)
  const productId = await resolveProductId(client, rawId)
  if (!productId) {
    return errorResponse(event, 'Produk tidak ditemukan.', null, 404)
  }

  const queryParams = getQuery(event)
  const queryParse = reviewQuerySchema.safeParse(queryParams)
  if (!queryParse.success) {
    return errorResponse(
      event,
      'Parameter query tidak valid.',
      queryParse.error.flatten().fieldErrors,
      400,
    )
  }

  try {
    const data = await getProductReviews(client, productId, queryParse.data)
    return successResponse('Daftar ulasan berhasil dimuat.', data.reviews, {
      stats: data.stats,
      pagination: data.pagination,
    })
  } catch (error) {
    return errorResponse(event, 'Gagal memuat daftar ulasan.', error, 500)
  }
})
