import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { successResponse, errorResponse } from '../../utils/response'
import {
  sanitizeInstantSearchKeyword,
  isValidInstantSearchQuery,
  buildInstantSearchPayload,
} from '../../utils/instant-search'
import type { InstantSearchResponse } from '~~/shared/types/search'

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event)
  const rawQ = typeof queryParams.q === 'string' ? queryParams.q.trim() : ''

  if (!isValidInstantSearchQuery(rawQ)) {
    const emptyPayload: InstantSearchResponse = {
      products: [],
      categories: [],
      query: rawQ,
    }
    return successResponse('Pencarian instan berhasil', emptyPayload)
  }

  const client = await serverSupabaseClient<Database>(event)
  const sanitizedKeyword = sanitizeInstantSearchKeyword(rawQ)

  try {
    const [productsResult, categoriesResult] = await Promise.all([
      client
        .from('products')
        .select('id, name, slug, price, image_url, stock, categories(id, name, slug)')
        .is('deleted_at', null)
        .ilike('name', `%${sanitizedKeyword}%`)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(5),
      client
        .from('categories')
        .select('id, name, slug')
        .or(`name.ilike.%${sanitizedKeyword}%,slug.ilike.%${sanitizedKeyword}%`)
        .limit(3),
    ])

    if (productsResult.error) {
      return errorResponse(event, 'Gagal mencari produk instan', productsResult.error.message, 500)
    }

    setHeader(event, 'Cache-Control', 'public, max-age=30, stale-while-revalidate=60')

    const responsePayload = buildInstantSearchPayload(
      rawQ,
      productsResult.data || [],
      categoriesResult.data || [],
    )

    return successResponse('Pencarian instan berhasil', responsePayload)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Kesalahan server'
    return errorResponse(event, 'Terjadi kendala pada pencarian instan', errorMsg, 500)
  }
})
