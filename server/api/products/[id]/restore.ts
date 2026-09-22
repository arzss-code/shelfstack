import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id) {
    return errorResponse(event, 'Invalid ID', null, 400)
  }

  if (method === 'PUT') {
    await requireAdmin(event)

    const { error } = await client.from('products').update({ deleted_at: null }).eq('id', id)

    if (error) {
      return errorResponse(event, 'Failed to restore product', error, 500)
    }

    return successResponse('Product restored successfully', null)
  }

  return errorResponse(event, 'Method not allowed', null, 405)
})
