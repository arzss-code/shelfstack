import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

  // Autentikasi wajib untuk memuat notifikasi pengguna
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  // 1. Ekstrak query parameters untuk cursor pagination
  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 15, 1), 50)
  const cursor = typeof query.cursor === 'string' && query.cursor ? query.cursor : null
  const unreadOnly = query.unread === 'true'

  let dbQuery = client
    .from('notifications')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    dbQuery = dbQuery.lt('created_at', cursor)
  }
  if (unreadOnly) {
    dbQuery = dbQuery.eq('is_read', false)
  }

  const { data: rawNotifs, error: notifError } = await dbQuery

  if (notifError) {
    return errorResponse(event, 'Gagal memuat notifikasi', notifError, 500)
  }

  const hasMore = (rawNotifs?.length || 0) > limit
  const notifications = hasMore ? (rawNotifs || []).slice(0, limit) : rawNotifs || []
  const nextCursor =
    hasMore && notifications.length > 0 ? notifications[notifications.length - 1]?.created_at : null

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
    notifications,
    unread_count: unreadCount || 0,
    has_more: hasMore,
    next_cursor: nextCursor,
  })
})
