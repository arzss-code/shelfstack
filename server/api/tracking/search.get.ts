import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { errorResponse, successResponse } from '../../utils/response'
import { maskRecipientName, maskRecipientPhone } from '../../utils/shipping'
import type { CourierCode } from '../../../shared/schemas/shipping'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = typeof query.q === 'string' ? query.q.trim() : ''

  if (!searchQuery || searchQuery.length < 3) {
    return errorResponse(
      event,
      'Parameter pencarian (q) minimal 3 karakter nomor resi atau ID pesanan',
      null,
      400,
    )
  }

  // Gunakan service role agar pengunjung publik dapat melacak resi tanpa wajib login
  const client = serverSupabaseServiceRole<Database>(event)

  // Cari berdasarkan nomor resi terlebih dahulu, atau ID pesanan
  const dbQuery = client
    .from('orders')
    .select(
      'id, status, tracking_number, courier_code, courier_name, address, shipped_at, delivered_at, created_at',
    )
    .ilike('tracking_number', searchQuery)
    .limit(1)

  const { data: initialOrder, error: orderError } = await dbQuery.maybeSingle()
  let order = initialOrder

  // Jika tidak ditemukan via no resi, coba cari via order UUID jika format cocok
  if (!order) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      searchQuery,
    )
    if (isUuid) {
      const { data: orderById } = await client
        .from('orders')
        .select(
          'id, status, tracking_number, courier_code, courier_name, address, shipped_at, delivered_at, created_at',
        )
        .eq('id', searchQuery)
        .maybeSingle()
      order = orderById
    }
  }

  if (orderError) {
    return errorResponse(
      event,
      'Terjadi kesalahan saat mencari informasi pengiriman',
      orderError,
      500,
    )
  }

  if (!order || !order.tracking_number) {
    return errorResponse(
      event,
      'Informasi resi pengiriman tidak ditemukan. Pastikan nomor resi atau ID pesanan yang Anda masukkan sudah benar.',
      null,
      404,
    )
  }

  // Ambil daftar checkpoint pengiriman terurut dari yang terbaru
  const { data: rawCheckpoints, error: checkpointError } = await client
    .from('shipping_checkpoints')
    .select('id, order_id, tracking_number, status, title, description, location, created_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })

  if (checkpointError) {
    return errorResponse(event, 'Gagal memuat linimasa checkpoint ekspedisi', checkpointError, 500)
  }

  const rawAddress = (order.address as any) || {}
  const destinationCity = rawAddress.city || 'Kota Tujuan'

  const result = {
    order_id: order.id,
    tracking_number: order.tracking_number,
    courier_code: (order.courier_code as CourierCode) || 'jne',
    courier_name: order.courier_name || 'JNE Express',
    status: order.status,
    recipient_name_masked: maskRecipientName(rawAddress.name),
    recipient_phone_masked: maskRecipientPhone(rawAddress.phone),
    destination_city: destinationCity,
    shipped_at: order.shipped_at,
    delivered_at: order.delivered_at,
    checkpoints: rawCheckpoints || [],
  }

  return successResponse('Data pelacakan pengiriman berhasil ditemukan', result)
})
