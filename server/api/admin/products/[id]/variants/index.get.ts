import { defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idParam = getRouterParam(event, 'id')
  const productId = Number.parseInt(idParam || '', 10)
  if (Number.isNaN(productId) || productId <= 0) {
    return errorResponse(event, 'ID produk tidak valid', null, 400)
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await client
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    return errorResponse(event, 'Gagal memuat varian produk', error.message, 500)
  }

  return successResponse('Varian produk berhasil dimuat', data || [])
})
