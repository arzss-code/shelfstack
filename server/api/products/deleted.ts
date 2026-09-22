import { serverSupabaseClient } from '#supabase/server'
import { productListQuerySchema } from '../../../shared/schemas/product'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient(event)

  if (method === 'GET') {
    await requireAdmin(event)

    const parsedQuery = productListQuerySchema.safeParse(getQuery(event))

    if (!parsedQuery.success) {
      return errorResponse(event, 'Validation error', parsedQuery.error.flatten().fieldErrors, 400)
    }

    const { from, to } = parsedQuery.data

    const { data, error } = await client
      .from('products')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(from, to)

    if (error) {
      return errorResponse(event, 'Failed to fetch deleted products', error, 500)
    }

    return successResponse('Deleted products retrieved successfully', data)
  }

  return errorResponse(event, 'Method not allowed', null, 405)
})
