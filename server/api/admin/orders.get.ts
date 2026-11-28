import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { parseExportDateRange } from '~/utils/csv'
import { buildAdminOrderSearchFilter } from '../../utils/order-search'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = await serverSupabaseClient<Database>(event)
  const query = getQuery(event)

  const status = (query.status as string) || ''
  const search = (query.search as string) || ''
  const rawSort = (query.sort as string) || ''
  const dateResult = parseExportDateRange(query.date_from, query.date_to)
  if (!dateResult.ok) {
    return errorResponse(event, dateResult.error, null, 400)
  }
  const sortAllowlist: readonly string[] = [
    'created_at_desc',
    'created_at_asc',
    'total_desc',
    'total_asc',
    'name_asc',
    'name_desc',
    'status_asc',
    'status_desc',
  ]
  const sort = sortAllowlist.includes(rawSort) ? rawSort : 'created_at_desc'
  const from = query.from ? Math.max(0, parseInt(query.from as string, 10)) : 0
  const to = query.to ? Math.max(from, parseInt(query.to as string, 10)) : from + 19

  let dbQuery = client
    .from('orders')
    .select('*, order_items(*, product:products(id, name, image_url))', { count: 'exact' })

  if (status && ['pending', 'paid', 'shipped', 'completed', 'cancelled'].includes(status)) {
    dbQuery = dbQuery.eq('status', status as Database['public']['Enums']['order_status'])
  }

  const searchFilter = buildAdminOrderSearchFilter(search)
  if (searchFilter) {
    dbQuery = dbQuery.or(searchFilter)
  }

  if (dateResult.range.fromIso) {
    dbQuery = dbQuery.gte('created_at', dateResult.range.fromIso)
  }

  if (dateResult.range.toExclusiveIso) {
    dbQuery = dbQuery.lt('created_at', dateResult.range.toExclusiveIso)
  }

  const { data, count, error } = await (() => {
    switch (sort) {
      case 'created_at_asc':
        return dbQuery.order('created_at', { ascending: true }).range(from, to)
      case 'total_desc':
        return dbQuery.order('total_cents', { ascending: false }).range(from, to)
      case 'total_asc':
        return dbQuery.order('total_cents', { ascending: true }).range(from, to)
      case 'name_asc':
        return dbQuery.order('address->>name', { ascending: true }).range(from, to)
      case 'name_desc':
        return dbQuery.order('address->>name', { ascending: false }).range(from, to)
      case 'status_asc':
        return dbQuery.order('status', { ascending: true }).range(from, to)
      case 'status_desc':
        return dbQuery.order('status', { ascending: false }).range(from, to)
      case 'created_at_desc':
      default:
        return dbQuery.order('created_at', { ascending: false }).range(from, to)
    }
  })()

  if (error) {
    return errorResponse(event, 'Gagal memuat daftar pesanan admin', error, 500)
  }

  return successResponse('Daftar pesanan admin berhasil dimuat', {
    orders: data || [],
    total: count ?? 0,
    from,
    to,
  })
})
