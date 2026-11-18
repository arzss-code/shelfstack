import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminCategoryUpdateSchema } from '../../../../shared/schemas/category'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

const uuidSchema = z.string().uuid('ID kategori tidak valid')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idCheck = uuidSchema.safeParse(getRouterParam(event, 'id') || '')
  if (!idCheck.success) {
    return errorResponse(event, idCheck.error.issues[0]?.message || 'ID tidak valid', null, 400)
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = adminCategoryUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Data pembaruan kategori tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const payload: Database['public']['Tables']['categories']['Update'] = {
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.name !== undefined) payload.name = parsed.data.name
  if (parsed.data.slug !== undefined) payload.slug = parsed.data.slug
  if (parsed.data.description !== undefined) payload.description = parsed.data.description
  if (parsed.data.image_url !== undefined) payload.image_url = parsed.data.image_url
  if (parsed.data.display_order !== undefined) payload.display_order = parsed.data.display_order

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: updated, error: updateErr } = await client
    .from('categories')
    .update(payload)
    .eq('id', idCheck.data)
    .is('deleted_at', null)
    .select('id, name, slug, description, image_url, display_order')
    .maybeSingle()

  if (updateErr) {
    if (updateErr.code === '23505') {
      return errorResponse(event, 'Slug kategori sudah digunakan kategori lain.', null, 409)
    }
    return errorResponse(event, 'Gagal memperbarui kategori', updateErr.message, 500)
  }

  if (!updated) {
    return errorResponse(event, 'Kategori tidak ditemukan', null, 404)
  }

  return successResponse('Kategori berhasil diperbarui', updated)
})
