import type { SupabaseClient } from '@supabase/supabase-js'
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { reviewQuerySchema } from '../../../../../shared/schemas/review'

export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id')
  if (!rawId) {
    return errorResponse(event, 'Parameter produk diperlukan.', null, 400)
  }

  const client = await serverSupabaseClient<Database>(event)
  let serviceClient: SupabaseClient<Database> | undefined
  try {
    serviceClient = serverSupabaseServiceRole<Database>(event)
  } catch (_err) {
    serviceClient = undefined
  }

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
    const data = await getProductReviews(client, productId, queryParse.data, serviceClient)
    return successResponse('Daftar ulasan berhasil dimuat.', data.reviews, {
      stats: data.stats,
      pagination: data.pagination,
    })
  } catch (error) {
    return errorResponse(event, 'Gagal memuat daftar ulasan.', error, 500)
  }
})
