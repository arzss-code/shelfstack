import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { checkReviewEligibility, resolveProductId } from '../../../../utils/review'

export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event)

  const rawId = getRouterParam(event, 'id')
  if (!rawId) {
    return errorResponse(event, 'Parameter produk diperlukan.', null, 400)
  }

  const client = await serverSupabaseClient<Database>(event)
  const productId = await resolveProductId(client, rawId)
  if (!productId) {
    return errorResponse(event, 'Produk tidak ditemukan.', null, 404)
  }

  try {
    const eligibility = await checkReviewEligibility(client, productId, user.id)
    return successResponse('Status kelayakan ulasan berhasil diperiksa.', eligibility)
  } catch (error) {
    return errorResponse(event, 'Gagal memeriksa kelayakan ulasan.', error, 500)
  }
})
