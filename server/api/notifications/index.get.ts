import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

  // Autentikasi wajib untuk memuat notifikasi pengguna
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  // 1. Ambil 30 notifikasi terbaru milik pengguna
  const { data: notifications, error: notifError } = await client
    .from('notifications')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (notifError) {
    return errorResponse(event, 'Gagal memuat notifikasi', notifError, 500)
  }

  // 2. Hitung jumlah notifikasi yang belum dibaca (unread count)
  const { count: unreadCount, error: countError } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', targetUserId)
    .eq('is_read', false)

  if (countError) {
    return errorResponse(event, 'Gagal menghitung notifikasi belum dibaca', countError, 500)
  }

  return successResponse('Notifikasi berhasil dimuat', {
    notifications: notifications || [],
    unread_count: unreadCount || 0,
  })
})
