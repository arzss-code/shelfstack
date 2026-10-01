import { serverSupabaseClient } from '#supabase/server'
import { productSchema } from '../../../../shared/schemas/product'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient(event)
  const rawParam = getRouterParam(event, 'id')

  if (!rawParam) {
    errorResponse(event, 'Identifier parameter is required', null, 400)
  }

  const isNumeric = /^\d+$/.test(rawParam)
  const numericId = isNumeric ? Number(rawParam) : null

  if (method === 'GET') {
    let query = client.from('products').select('*').is('deleted_at', null)
    if (numericId !== null) {
      query = query.eq('id', numericId)
    } else {
      query = query.eq('slug', rawParam)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      errorResponse(event, 'Product not found', error, 404)
    }

    return successResponse('Product retrieved successfully', data)
  }

  if (method === 'PUT') {
    await requireAdmin(event)

    const body = await readBody(event)

    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      errorResponse(event, 'Validation error', parsed.error.flatten().fieldErrors, 400)
    }

    let updateQuery = client.from('products').update(parsed.data as any)
    if (numericId !== null) {
      updateQuery = updateQuery.eq('id', numericId)
    } else {
      updateQuery = updateQuery.eq('slug', rawParam)
    }

    const { data, error } = await updateQuery.select().single()

    if (error) {
      errorResponse(event, 'Failed to update product', error, 500)
    }

    return successResponse('Product updated successfully', data)
  }

  if (method === 'DELETE') {
    await requireAdmin(event)

    let deleteQuery = client.from('products').update({ deleted_at: new Date().toISOString() })

    if (numericId !== null) {
      deleteQuery = deleteQuery.eq('id', numericId)
    } else {
      deleteQuery = deleteQuery.eq('slug', rawParam)
    }

    const { error } = await deleteQuery

    if (error) {
      errorResponse(event, 'Failed to delete product', error, 500)
    }

    return successResponse('Product deleted successfully', null)
  }

  return errorResponse(event, 'Method not allowed', null, 405)
})
