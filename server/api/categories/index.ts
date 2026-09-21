import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET') {
    return errorResponse(event, 'Method not allowed', null, 405)
  }

  const client = await serverSupabaseClient(event)

  const { data, error } = await client.from('categories').select('id, name, slug').order('name')

  if (error) {
    return errorResponse(event, 'Failed to fetch categories', error, 500)
  }

  return successResponse('Categories retrieved successfully', data ?? [])
})
