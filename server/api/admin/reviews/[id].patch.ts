import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminReviewUpdateSchema } from '../../../../shared/schemas/review'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

const uuidSchema = z.string().uuid('ID ulasan tidak valid')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idCheck = uuidSchema.safeParse(getRouterParam(event, 'id') || '')
  if (!idCheck.success) {
    return errorResponse(event, idCheck.error.issues[0]?.message || 'ID tidak valid', null, 400)
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = adminReviewUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Data moderasi ulasan tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const nowIso = new Date().toISOString()
  const payload: Database['public']['Tables']['product_reviews']['Update'] = {
    deleted_at: parsed.data.is_hidden ? nowIso : null,
    updated_at: nowIso,
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: updated, error } = await client
    .from('product_reviews')
    .update(payload)
    .eq('id', idCheck.data)
    .select('id, product_id, user_id, rating, review_text, deleted_at, updated_at')
    .maybeSingle()

  if (error) {
    return errorResponse(event, 'Gagal memoderasi status ulasan', error.message, 500)
  }

  if (!updated) {
    return errorResponse(event, 'Ulasan tidak ditemukan', null, 404)
  }

  const actionMsg = parsed.data.is_hidden
    ? 'Ulasan berhasil disembunyikan dari etalase'
    : 'Ulasan berhasil dipulihkan ke etalase'

  return successResponse(actionMsg, updated)
})
