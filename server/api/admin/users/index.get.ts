import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  calculateCustomerAggregations,
  filterAndSortCustomers,
  calculateCrmMetrics,
  type RawProfile,
} from '../../../utils/admin-users'
import type { AdminCustomersResponse } from '~~/shared/types/admin-crm'

export default defineEventHandler(async (event): Promise<AdminCustomersResponse> => {
  // Autentikasi dan otorisasi khusus Administrator
  await requireAdmin(event)

  const query = getQuery(event)
  const search = typeof query.search === 'string' ? query.search : ''
  const sort =
    query.sort === 'orders_desc' || query.sort === 'latest' || query.sort === 'name_asc'
      ? query.sort
      : 'ltv_desc'
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 15))

  const client = await serverSupabaseClient<Database>(event)

  try {
    const [profilesRes, ordersRes] = await Promise.all([
      client
        .from('profiles')
        .select('id, user_id, full_name, role, avatar_url, created_at')
        .order('created_at', { ascending: false }),
      client
        .from('orders')
        .select('id, user_id, status, total_cents, created_at')
        .in('status', ['paid', 'shipped', 'completed', 'pending']),
    ])

    const emailMap = new Map<string, string>()
    try {
      const serviceClient = serverSupabaseServiceRole(event)
      const { data: authData } = await serviceClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })
      authData?.users?.forEach((u) => {
        if (u.id && u.email) {
          emailMap.set(u.id, u.email)
        }
      })
    } catch {
      // Abaikan kegagalan akses auth admin di lingkungan pengujian
    }

    const rawProfiles: RawProfile[] = (profilesRes.data || []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.full_name,
      role: p.role,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      email: emailMap.get(p.user_id) || null,
    }))
    const rawOrders = ordersRes.data || []

    // Agregasi LTV dan ringkasan pesanan
    const aggregated = calculateCustomerAggregations(rawProfiles, rawOrders)
    const metrics = calculateCrmMetrics(aggregated)
    const filtered = filterAndSortCustomers(aggregated, { search, sort })

    const total = filtered.length
    const totalPages = Math.ceil(total / limit) || 1
    const offset = (page - 1) * limit
    const pagedCustomers = filtered.slice(offset, offset + limit)

    return {
      customers: pagedCustomers,
      metrics,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Gagal memuat data pelanggan admin CRM.',
    })
  }
})
