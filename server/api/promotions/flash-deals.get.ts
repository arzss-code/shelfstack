import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { getActiveFlashSaleCampaign } from '../../utils/flash-sale'
import { successResponse, errorResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient<Database>(event)
    const campaign = await getActiveFlashSaleCampaign(client)

    return successResponse('Data promo flash sale berhasil dimuat', campaign)
  } catch (err: unknown) {
    return errorResponse(
      event,
      'Terjadi kesalahan saat memproses promo flash sale',
      err instanceof Error ? err.message : String(err),
      500,
    )
  }
})
