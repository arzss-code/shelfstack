import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  // Autentikasi dan otorisasi khusus Administrator
  await requireAdmin(event)

  const client = await serverSupabaseClient<Database>(event)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  try {
    const [
      monthlyOrdersRes,
      allPaidOrdersRes,
      pendingCountRes,
      lowStockCountRes,
      customersCountRes,
      recentOrdersRes,
    ] = await Promise.all([
      client
        .from('orders')
        .select('total_cents')
        .in('status', ['paid', 'shipped', 'completed'])
        .gte('created_at', startOfMonth),
      client.from('orders').select('total_cents').in('status', ['paid', 'shipped', 'completed']),
      client.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client
        .from('products')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .lt('stock', 5),
      client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      client
        .from('orders')
        .select('id, user_id, status, total_cents, created_at, address')
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    const monthlyRevenueCents = (monthlyOrdersRes.data || []).reduce(
      (acc, o) => acc + (o.total_cents || 0),
      0,
    )
    const totalRevenueCents = (allPaidOrdersRes.data || []).reduce(
      (acc, o) => acc + (o.total_cents || 0),
      0,
    )

    return successResponse('Statistik admin berhasil dimuat', {
      revenue: {
        monthly_cents: monthlyRevenueCents,
        total_cents: totalRevenueCents,
      },
      counts: {
        pending_orders: pendingCountRes.count ?? 0,
        low_stock_products: lowStockCountRes.count ?? 0,
        total_customers: customersCountRes.count ?? 0,
      },
      recent_orders: recentOrdersRes.data || [],
    })
  } catch (error: unknown) {
    return errorResponse(
      event,
      'Gagal memuat statistik admin',
      error instanceof Error ? error.message : String(error),
      500,
    )
  }
})
