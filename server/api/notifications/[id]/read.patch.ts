import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

  // Autentikasi wajib
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  const notificationId = getRouterParam(event, 'id')
  if (!notificationId) {
    return errorResponse(event, 'ID notifikasi tidak valid', null, 400)
  }

  const now = new Date().toISOString()

  // Perbarui notifikasi spesifik milik pengguna aktif
  const { data, error } = await client
    .from('notifications')
    .update({
      is_read: true,
      read_at: now,
    })
    .eq('id', notificationId)
    .eq('user_id', targetUserId)
    .select()
    .maybeSingle()

  if (error) {
    return errorResponse(event, 'Gagal memperbarui notifikasi', error, 500)
  }

  if (!data) {
    return errorResponse(event, 'Notifikasi tidak ditemukan', null, 404)
  }

  return successResponse('Notifikasi berhasil ditandai telah dibaca', data)
})
