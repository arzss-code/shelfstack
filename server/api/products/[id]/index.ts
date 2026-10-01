import { serverSupabaseClient } from '#supabase/server'
import { productSchema } from '../../../../shared/schemas/product'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient(event)
  const rawParam = getRouterParam(event, 'id')

  if (!rawParam || typeof rawParam !== 'string') {
    errorResponse(event, 'Identifier parameter is required', null, 400)
  }

  // Security Sanitization: cegah path traversal, invalid characters, atau ReDoS
  const param = rawParam.trim()
  if (param.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(param)) {
    errorResponse(event, 'Format parameter produk tidak valid', null, 400)
  }

  const isNumeric = /^\d+$/.test(param)
  const numericId = isNumeric ? Number(param) : null

  if (method === 'GET') {
    // Performance: Browser cache 60s, Shared CDN cache 5m, SWR 10m
    setHeader(
      event,
      'Cache-Control',
      'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    )

    let query = client.from('products').select('*').is('deleted_at', null)
    if (numericId !== null) {
      query = query.eq('id', numericId)
    } else {
      query = query.eq('slug', param)
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
      updateQuery = updateQuery.eq('slug', param)
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
      deleteQuery = deleteQuery.eq('slug', param)
    }

    const { error } = await deleteQuery

    if (error) {
      errorResponse(event, 'Failed to delete product', error, 500)
    }

    return successResponse('Product deleted successfully', null)
  }

  return errorResponse(event, 'Method not allowed', null, 405)
})
