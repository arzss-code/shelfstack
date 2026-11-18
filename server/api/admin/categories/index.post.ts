import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminCategoryCreateSchema } from '../../../../shared/schemas/category'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = adminCategoryCreateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Data kategori tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { name, slug, description, image_url, display_order } = parsed.data

  const { data: created, error: insertError } = await client
    .from('categories')
    .insert({
      name,
      slug,
      description: description || null,
      image_url: image_url || null,
      display_order,
    })
    .select('id, name, slug, description, image_url, display_order')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return errorResponse(event, `Slug kategori "${slug}" sudah digunakan.`, null, 409)
    }
    return errorResponse(event, 'Gagal membuat kategori baru', insertError.message, 500)
  }

  setResponseStatus(event, 201)
  return successResponse('Kategori baru berhasil dibuat', created)
})
