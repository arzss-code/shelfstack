import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'

const FLASH_DEAL_SELECT =
  'id, product_id, promo_price_cents, discount_percentage, quota, claimed, starts_at, ends_at, is_active, created_at, updated_at, products(id, name, slug, price, price_cents, stock, image_url)'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = serverSupabaseServiceRole<Database>(event)
  let result = await client
    .from('flash_deals')
    .select(FLASH_DEAL_SELECT)
    .is('deleted_at', null)
    .order('ends_at', { ascending: false })

  if (
    result.error &&
    (result.error.code === '42703' || result.error.message?.includes('deleted_at'))
  ) {
    result = await client
      .from('flash_deals')
      .select(FLASH_DEAL_SELECT)
      .order('ends_at', { ascending: false })
  }

  if (result.error) {
    return errorResponse(
      event,
      'Gagal memuat daftar kampanye flash sale',
      result.error.message,
      500,
    )
  }

  return successResponse('Daftar kampanye flash sale berhasil dimuat', result.data || [])
})
