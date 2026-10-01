import { serverSupabaseClient } from '#supabase/server'
import { productListQuerySchema, productSchema } from '../../../shared/schemas/product'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient(event)

  if (method === 'GET') {
    const parsedQuery = productListQuerySchema.safeParse(getQuery(event))

    if (!parsedQuery.success) {
      return errorResponse(event, 'Validation error', parsedQuery.error.flatten().fieldErrors, 400)
    }

    const { from, to } = parsedQuery.data

    const { data, error } = await client
      .from('products')
      .select('*')
      .is('deleted_at', null)
      .order('id', { ascending: false })
      .range(from, to)

    if (error) {
      return errorResponse(event, 'Failed to fetch products', error, 500)
    }

    return successResponse('Products retrieved successfully', data)
  }

  if (method === 'POST') {
    await requireAdmin(event)

    const body = await readBody(event)

    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(event, 'Validation error', parsed.error.flatten().fieldErrors, 400)
    }

    const { data, error } = await client
      .from('products')
      .insert([parsed.data as any])
      .select()
      .single()

    if (error) {
      return errorResponse(event, 'Failed to create product', error, 500)
    }

    return successResponse('Product created successfully', data)
  }

  return errorResponse(event, 'Method not allowed', null, 405)
})
