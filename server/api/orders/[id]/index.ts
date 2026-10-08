import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  if (method !== 'GET') {
    return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
  }

  const { user, profile } = await requireUser(event)
  const client = await serverSupabaseClient<Database>(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    return errorResponse(event, 'ID pesanan diperlukan', null, 400)
  }

  // Ambil data order + order_items beserta data relasi products
  const { data: order, error } = await client
    .from('orders')
    .select(
      `
      *,
      items:order_items (
        id,
        order_id,
        product_id,
        qty,
        price_cents,
        product:products (
          id,
          name,
          image_url
        )
      )
    `,
    )
    .eq('id', id)
    .single()

  if (error || !order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', error, 404)
  }

  // Otorisasi: hanya pemilik atau admin yang bisa mengakses
  if (order.user_id !== user.id && profile.role !== 'admin') {
    return errorResponse(event, 'Akses pesanan ditolak', null, 403)
  }

  return successResponse('Detail pesanan berhasil dimuat', order)
})
