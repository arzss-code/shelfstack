import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id
  const client = await serverSupabaseClient<Database>(event)

  try {
    // Jalankan seluruh kueri ringkasan akun secara paralel untuk memangkas latensi
    const [totalOrdersRes, activeOrdersRes, completedOrdersRes, addressesRes, profileRecordRes] =
      await Promise.all([
        client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId),
        client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId)
          .in('status', ['pending', 'paid', 'shipped']),
        client
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId)
          .eq('status', 'completed'),
        client
          .from('user_addresses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', targetUserId)
          .is('deleted_at', null),
        client.from('profiles').select('created_at').eq('user_id', targetUserId).maybeSingle(),
      ])

    if (totalOrdersRes.error) {
      return errorResponse(event, 'Gagal memuat metrik pesanan', totalOrdersRes.error, 500)
    }
    if (activeOrdersRes.error) {
      return errorResponse(event, 'Gagal memuat pesanan aktif', activeOrdersRes.error, 500)
    }
    if (completedOrdersRes.error) {
      return errorResponse(event, 'Gagal memuat pesanan selesai', completedOrdersRes.error, 500)
    }

    const memberSince =
      profileRecordRes.data?.created_at ||
      (user as { created_at?: string }).created_at ||
      new Date().toISOString()

    return successResponse('Statistik akun berhasil dimuat', {
      totalOrders: totalOrdersRes.count ?? 0,
      activeOrders: activeOrdersRes.count ?? 0,
      completedOrders: completedOrdersRes.count ?? 0,
      totalAddresses: addressesRes.count ?? 0,
      memberSince,
    })
  } catch (err: unknown) {
    return errorResponse(event, 'Gagal memuat ringkasan akun', err, 500)
  }
})
