import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'

const uuidSchema = z.string().uuid('ID kampanye flash sale tidak valid')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idCheck = uuidSchema.safeParse(getRouterParam(event, 'id') || '')
  if (!idCheck.success) {
    return errorResponse(event, idCheck.error.issues[0]?.message || 'ID tidak valid', null, 400)
  }

  const nowIso = new Date().toISOString()
  const client = serverSupabaseServiceRole<Database>(event)
  let result = await client
    .from('flash_deals')
    .update({
      deleted_at: nowIso,
      is_active: false,
      updated_at: nowIso,
    })
    .eq('id', idCheck.data)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (
    result.error &&
    (result.error.code === '42703' || result.error.message?.includes('deleted_at'))
  ) {
    result = await client
      .from('flash_deals')
      .update({ is_active: false })
      .eq('id', idCheck.data)
      .select('id')
      .maybeSingle()
  }

  if (result.error) {
    return errorResponse(event, 'Gagal menghapus kampanye flash sale', result.error.message, 500)
  }

  if (!result.data) {
    return errorResponse(event, 'Kampanye flash sale tidak ditemukan', null, 404)
  }

  return successResponse('Kampanye flash sale berhasil diarsipkan', { id: result.data.id })
})
