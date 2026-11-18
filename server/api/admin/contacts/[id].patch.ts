import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminContactUpdateSchema } from '../../../../shared/schemas/contact'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

const uuidSchema = z.string().uuid('ID pesan kontak tidak valid')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idCheck = uuidSchema.safeParse(getRouterParam(event, 'id') || '')
  if (!idCheck.success) {
    return errorResponse(event, idCheck.error.issues[0]?.message || 'ID tidak valid', null, 400)
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = adminContactUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Data pembaruan pesan kontak tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const nowIso = new Date().toISOString()
  const payload: Database['public']['Tables']['contact_messages']['Update'] = {
    status: parsed.data.status,
    resolved_at: parsed.data.status === 'resolved' ? nowIso : null,
    updated_at: nowIso,
  }
  if (parsed.data.admin_notes !== undefined) {
    payload.admin_notes = parsed.data.admin_notes
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: updated, error } = await client
    .from('contact_messages')
    .update(payload)
    .eq('id', idCheck.data)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle()

  if (error) {
    return errorResponse(event, 'Gagal memperbarui status pesan kontak', error.message, 500)
  }

  if (!updated) {
    return errorResponse(event, 'Pesan kontak tidak ditemukan', null, 404)
  }

  return successResponse('Status pesan kontak berhasil diperbarui', updated)
})
