import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

  // Autentikasi wajib
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  const now = new Date().toISOString()

  // Perbarui semua notifikasi yang belum dibaca menjadi dibaca
  const { error } = await client
    .from('notifications')
    .update({
      is_read: true,
      read_at: now,
    })
    .eq('user_id', targetUserId)
    .eq('is_read', false)

  if (error) {
    return errorResponse(event, 'Gagal menandai semua notifikasi telah dibaca', error, 500)
  }

  return successResponse('Semua notifikasi berhasil ditandai telah dibaca', {
    read_at: now,
  })
})
