import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { reviewInputSchema } from '../../../../../shared/schemas/review'
import { requireUser } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { resolveProductId, submitProductReview } from '../../../../utils/review'

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

  const body = await readBody(event)
  const bodyParse = reviewInputSchema.safeParse(body)
  if (!bodyParse.success) {
    return errorResponse(
      event,
      'Validasi formulir ulasan gagal.',
      bodyParse.error.flatten().fieldErrors,
      400,
    )
  }

  try {
    const review = await submitProductReview(client, {
      productId,
      userId: user.id,
      input: bodyParse.data,
    })

    return successResponse('Ulasan produk berhasil dikirim.', review)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim ulasan produk.'
    const isClientError =
      message.includes('Pesanan') ||
      message.includes('akses') ||
      message.includes('Produk tidak ditemukan') ||
      message.includes('selesai')

    const statusCode = isClientError ? 400 : 500
    return errorResponse(
      event,
      message,
      error instanceof Error ? error.message : String(error),
      statusCode,
    )
  }
})
