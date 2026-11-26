import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { generateOrdersCsv, parseExportDateRange, type OrderCsvRow } from '~/utils/csv'
import { generateOrdersXlsx } from '~~/server/utils/xlsx'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = await serverSupabaseClient<Database>(event)
  const query = getQuery(event)

  const rawFormat = typeof query.format === 'string' ? query.format.trim().toLowerCase() : 'csv'
  if (rawFormat !== 'csv' && rawFormat !== 'xlsx') {
    return errorResponse(event, 'Format ekspor harus csv atau xlsx.', null, 400)
  }

  const status = (query.status as string) || ''
  const search = (query.search as string) || ''
  const rawSort = (query.sort as string) || ''
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

  const dateResult = parseExportDateRange(query.from, query.to)
  if (!dateResult.ok) {
    return errorResponse(event, dateResult.error, null, 400)
  }

  let dbQuery = client
    .from('orders')
    .select('id, created_at, status, total_cents, address, order_items(id)')

  if (
    status &&
    ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'].includes(status)
  ) {
    dbQuery = dbQuery.eq('status', status as Database['public']['Enums']['order_status'])
  }

  if (dateResult.range.fromIso) {
    dbQuery = dbQuery.gte('created_at', dateResult.range.fromIso)
  }

  if (dateResult.range.toExclusiveIso) {
    dbQuery = dbQuery.lt('created_at', dateResult.range.toExclusiveIso)
  }

  if (search.trim()) {
    dbQuery = dbQuery.or(`id.ilike.%${search.trim()}%,address->>name.ilike.%${search.trim()}%`)
  }

  const { data, error } = await (() => {
    switch (sort) {
      case 'created_at_asc':
        return dbQuery.order('created_at', { ascending: true }).limit(1000)
      case 'total_desc':
        return dbQuery.order('total_cents', { ascending: false }).limit(1000)
      case 'total_asc':
        return dbQuery.order('total_cents', { ascending: true }).limit(1000)
      case 'name_asc':
        return dbQuery.order('address->>name', { ascending: true }).limit(1000)
      case 'name_desc':
        return dbQuery.order('address->>name', { ascending: false }).limit(1000)
      case 'status_asc':
        return dbQuery.order('status', { ascending: true }).limit(1000)
      case 'status_desc':
        return dbQuery.order('status', { ascending: false }).limit(1000)
      case 'created_at_desc':
      default:
        return dbQuery.order('created_at', { ascending: false }).limit(1000)
    }
  })()

  if (error) {
    return errorResponse(event, 'Gagal mengekspor data pesanan', error, 500)
  }

  const rows: OrderCsvRow[] = (data || []).map((o) => {
    const addr = o.address as { name?: string; city?: string; phone?: string } | null
    return {
      id: o.id,
      created_at: o.created_at || '',
      customer_name: addr?.name || 'Pelanggan',
      city: addr?.city || '-',
      phone: addr?.phone || '-',
      status: o.status,
      item_count: o.order_items?.length || 0,
      total_idr: Math.round((o.total_cents || 0) / 100),
    }
  })

  const dateStamp = new Date().toISOString().slice(0, 10)
  if (rawFormat === 'xlsx') {
    const xlsxBuffer = generateOrdersXlsx(rows)
    const filename = `laporan-pesanan-shelfstack-${dateStamp}.xlsx`

    setHeader(
      event,
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

    return xlsxBuffer
  }

  const csvContent = generateOrdersCsv(rows)
  const filename = `laporan-pesanan-shelfstack-${dateStamp}.csv`

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return csvContent
})
