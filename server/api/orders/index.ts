import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { checkoutSchema } from '../../../shared/schemas/order'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient<Database>(event)

  // Autentikasi wajib untuk semua operasi order pelanggan
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  if (method === 'GET') {
    const query = getQuery(event)
    const from = query.from ? Math.max(0, parseInt(query.from as string, 10)) : 0
    const to = query.to ? Math.max(from, parseInt(query.to as string, 10)) : from + 9

    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return errorResponse(event, 'Gagal memuat riwayat pesanan', error, 500)
    }

    return successResponse('Riwayat pesanan berhasil dimuat', data)
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(
        event,
        'Validasi data pesanan gagal',
        parsed.error.flatten().fieldErrors,
        400,
      )
    }

    // Panggil RPC create_order yang atomik di Postgres (Security Definer)
    const { data: orderId, error } = await client.rpc('create_order', {
      p_items: parsed.data.items,
      p_address: parsed.data.address,
    })

    if (error) {
      return errorResponse(
        event,
        error.message || 'Gagal memproses pesanan di database',
        error,
        400,
      )
    }

    return successResponse('Pesanan berhasil dibuat', { order_id: orderId })
  }

  return errorResponse(event, 'Metode HTTP tidak diizinkan', null, 405)
})
