import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id
  const client = await serverSupabaseClient<Database>(event)

  try {
    // 1. Total seluruh pesanan
    const { count: totalOrders, error: totalOrdersErr } = await client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)

    if (totalOrdersErr) {
      return errorResponse(event, 'Gagal memuat metrik pesanan', totalOrdersErr, 500)
    }

    // 2. Pesanan aktif (pending, paid, shipped)
    const { count: activeOrders, error: activeOrdersErr } = await client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .in('status', ['pending', 'paid', 'shipped'])

    if (activeOrdersErr) {
      return errorResponse(event, 'Gagal memuat pesanan aktif', activeOrdersErr, 500)
    }

    // 3. Pesanan selesai (completed)
    const { count: completedOrders, error: completedOrdersErr } = await client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .eq('status', 'completed')

    if (completedOrdersErr) {
      return errorResponse(event, 'Gagal memuat pesanan selesai', completedOrdersErr, 500)
    }

    // 4. Total buku alamat tersimpan
    const { count: totalAddresses } = await client
      .from('user_addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId)
      .is('deleted_at', null)

    // 5. Waktu bergabung (member since)
    const { data: profileRecord } = await client
      .from('profiles')
      .select('created_at')
      .eq('user_id', targetUserId)
      .maybeSingle()

    const memberSince =
      profileRecord?.created_at ||
      (user as { created_at?: string }).created_at ||
      new Date().toISOString()

    return successResponse('Statistik akun berhasil dimuat', {
      totalOrders: totalOrders ?? 0,
      activeOrders: activeOrders ?? 0,
      completedOrders: completedOrders ?? 0,
      totalAddresses: totalAddresses ?? 0,
      memberSince,
    })
  } catch (err: unknown) {
    return errorResponse(event, 'Gagal memuat ringkasan akun', err, 500)
  }
})
