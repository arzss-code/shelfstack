import { serverSupabaseClient } from '#supabase/server'
import { productSchema } from '../../../../shared/schemas/product'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    return errorResponse(event, 'Invalid ID', null, 400)
  }

  if (method === 'GET') {
    const { data, error } = await client.from('products').select('*').eq('id', id).single()

    if (error) {
      return errorResponse(event, 'Product not found', error, 404)
    }

    return successResponse('Product retrieved successfully', data)
  }

  if (method === 'PUT') {
    await requireAdmin(event)

    const body = await readBody(event)

    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(event, 'Validation error', parsed.error.flatten().fieldErrors, 400)
    }

    const { data, error } = await client
      .from('products')
      .update(parsed.data as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return errorResponse(event, 'Failed to update product', error, 500)
    }

    return successResponse('Product updated successfully', data)
  }

  if (method === 'DELETE') {
    await requireAdmin(event)

    const { error } = await client
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return errorResponse(event, 'Failed to delete product', error, 500)
    }

    return successResponse('Product deleted successfully', null)
  }

  return errorResponse(event, 'Method not allowed', null, 405)
})
