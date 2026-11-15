import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { formatRupiah } from '../../../../../app/utils/format'
import type { Customer360Detail, Customer360RecentOrder } from '~~/shared/types/admin-crm'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const userId = getRouterParam(event, 'id')
  if (!userId) {
    return errorResponse(event, 'ID pengguna wajib disertakan', null, 400)
  }

  const client = await serverSupabaseClient<Database>(event)

  try {
    // 1. Ambil data profil pelanggan
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, user_id, full_name, role, avatar_url, created_at')
      .or(`user_id.eq.${userId},id.eq.${userId}`)
      .maybeSingle()

    if (profileError) {
      return errorResponse(event, 'Gagal mengambil data profil pelanggan', profileError, 500)
    }

    if (!profile) {
      return errorResponse(event, 'Profil pelanggan tidak ditemukan', null, 404)
    }

    const targetUserId = profile.user_id || profile.id

    // 2. Ambil email dari Auth Admin jika tersedia
    let email: string | null = null
    try {
      const serviceClient = serverSupabaseServiceRole(event)
      const { data: authUser } = await serviceClient.auth.admin.getUserById(targetUserId)
      if (authUser?.user?.email) {
        email = authUser.user.email
      }
    } catch {
      // Abaikan jika auth admin tidak tersedia di lingkungan pengujian
    }

    // 3. Ambil data transaksi pesanan pelanggan
    const { data: ordersData, error: ordersError } = await client
      .from('orders')
      .select('id, user_id, status, total_cents, created_at')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (ordersError) {
      return errorResponse(event, 'Gagal mengambil riwayat pesanan', ordersError, 500)
    }

    const orders = ordersData || []
    const totalOrders = orders.length
    const completedOrders = orders.filter((o) => o.status === 'completed').length
    const pendingOrders = orders.filter(
      (o) => o.status === 'pending' || o.status === 'paid' || o.status === 'shipped',
    ).length
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length

    const totalSpentCents = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((acc, curr) => acc + (curr.total_cents || 0), 0)

    const averageOrderValueCents =
      completedOrders > 0 ? Math.round(totalSpentCents / completedOrders) : 0

    // 4. Ambil saldo koin loyalitas
    let loyaltyCoinBalance = 0
    try {
      const { data: coinsData } = await client
        .from('user_coins')
        .select('balance_coins')
        .eq('user_id', targetUserId)
        .maybeSingle()
      if (coinsData?.balance_coins) {
        loyaltyCoinBalance = Number(coinsData.balance_coins)
      }
    } catch {
      loyaltyCoinBalance = 0
    }

    // 5. Ambil tiket komplain / retur
    let supportTicketsCount = 0
    try {
      const { data: returnsData } = await client
        .from('return_requests')
        .select('id')
        .eq('user_id', targetUserId)
      supportTicketsCount = returnsData?.length || 0
    } catch {
      supportTicketsCount = 0
    }

    const recentOrders: Customer360RecentOrder[] = orders.slice(0, 5).map((o) => {
      return {
        id: o.id,
        status: o.status,
        totalCents: o.total_cents || 0,
        formattedTotal: formatRupiah((o.total_cents || 0) / 100),
        createdAt: o.created_at || new Date().toISOString(),
        itemCount: 1,
      }
    })

    const result: Customer360Detail = {
      userId: targetUserId,
      fullName: profile.full_name || 'Pelanggan',
      email,
      avatarUrl: profile.avatar_url,
      role: profile.role || 'customer',
      joinedAt: profile.created_at || new Date().toISOString(),
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalSpentCents,
      formattedLtv: formatRupiah(totalSpentCents / 100),
      averageOrderValueCents,
      formattedAov: formatRupiah(averageOrderValueCents / 100),
      loyaltyCoinBalance,
      recentOrders,
      supportTicketsCount,
    }

    return successResponse('Profil Customer 360 berhasil dimuat', result)
  } catch (err: unknown) {
    return errorResponse(
      event,
      'Gagal memproses data Customer 360',
      err instanceof Error ? err.message : String(err),
      500,
    )
  }
})
