import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  // 1. Otorisasi khusus Admin
  await requireAdmin(event)

  const idParam = getRouterParam(event, 'id')
  const productId = parseInt(idParam || '', 10)

  if (isNaN(productId) || productId <= 0) {
    return errorResponse(event, 'ID produk tidak valid', null, 400)
  }

  const query = getQuery(event)
  const page = Math.max(1, parseInt((query.page as string) || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt((query.limit as string) || '20', 10)))
  const reason = typeof query.reason === 'string' ? query.reason.trim() : ''

  const from = (page - 1) * limit
  const to = from + limit - 1

  const client = await serverSupabaseClient<Database>(event)

  // 2. Verifikasi produk ada
  const { data: product, error: productError } = await client
    .from('products')
    .select('id, name, sku, stock')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return errorResponse(event, 'Produk tidak ditemukan', null, 404)
  }

  // 3. Ambil riwayat audit mutasi stok
  let dbQuery = client
    .from('stock_movements')
    .select('*, order:orders(id, status, total_cents)', { count: 'exact' })
    .eq('product_id', productId)

  if (reason) {
    dbQuery = dbQuery.eq('reason', reason)
  }

  const {
    data: movements,
    count,
    error: movementError,
  } = await dbQuery.order('created_at', { ascending: false }).range(from, to)

  if (movementError) {
    return errorResponse(event, 'Gagal memuat audit trail mutasi stok', movementError, 500)
  }

  return successResponse('Riwayat mutasi stok berhasil dimuat', {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      current_stock: product.stock,
    },
    movements: movements || [],
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
})
