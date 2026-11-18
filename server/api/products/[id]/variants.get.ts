import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)
  const rawId = getRouterParam(event, 'id')

  if (!rawId) {
    return errorResponse(event, 'ID produk diperlukan', null, 400)
  }

  const productId = parseInt(rawId, 10)
  if (isNaN(productId) || productId <= 0) {
    return errorResponse(event, 'ID produk tidak valid', null, 400)
  }

  // Set response caching for product variants
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')

  const { data, error } = await client
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('price_cents', { ascending: true })

  if (error) {
    return errorResponse(event, 'Gagal memuat varian produk', error, 500)
  }

  return successResponse('Varian produk berhasil dimuat', data || [])
})
