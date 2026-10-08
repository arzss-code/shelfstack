import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = await serverSupabaseClient<Database>(event)
  const query = getQuery(event)

  const status = (query.status as string) || ''
  const search = (query.search as string) || ''
  const from = query.from ? Math.max(0, parseInt(query.from as string, 10)) : 0
  const to = query.to ? Math.max(from, parseInt(query.to as string, 10)) : from + 19

  let dbQuery = client
    .from('orders')
    .select('*, order_items(*, product:products(id, name, image_url))', { count: 'exact' })

  if (status && ['pending', 'paid', 'shipped', 'completed', 'cancelled'].includes(status)) {
    dbQuery = dbQuery.eq('status', status as Database['public']['Enums']['order_status'])
  }

  if (search.trim()) {
    dbQuery = dbQuery.or(`id.ilike.%${search.trim()}%,address->>name.ilike.%${search.trim()}%`)
  }

  const { data, count, error } = await dbQuery
    .order('created_at', { ascending: false })
    .range(from, to)

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
