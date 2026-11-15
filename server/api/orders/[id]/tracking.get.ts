import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'
import type { CourierCode } from '../../../../shared/schemas/shipping'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const client = await serverSupabaseClient<Database>(event)
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  // Ambil data pesanan milik pengguna
  const { data: order, error: orderError } = await client
    .from('orders')
    .select(
      'id, user_id, status, tracking_number, courier_code, courier_name, address, shipped_at, delivered_at, created_at',
    )
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) {
    return errorResponse(event, 'Gagal mengambil data pesanan', orderError, 500)
  }

  if (!order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', null, 404)
  }

  // Verifikasi kepemilikan
  const isAdmin = profile?.role === 'admin'
  if (order.user_id !== targetUserId && !isAdmin) {
    return errorResponse(event, 'Akses ditolak', null, 403)
  }

  // Ambil daftar checkpoint pengiriman
  const { data: checkpoints, error: checkpointError } = await client
    .from('shipping_checkpoints')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  if (checkpointError) {
    return errorResponse(event, 'Gagal memuat checkpoint pengiriman', checkpointError, 500)
  }

  interface OrderAddressPayload {
    name?: string
    phone?: string
    city?: string
  }
  const rawAddress = (order.address as OrderAddressPayload | null) || {}

  return successResponse('Data pelacakan pesanan berhasil dimuat', {
    order_id: order.id,
    tracking_number: order.tracking_number,
    courier_code: (order.courier_code as CourierCode) || 'jne',
    courier_name: order.courier_name || 'JNE Express',
    status: order.status,
    recipient_name: rawAddress.name || 'Penerima',
    recipient_phone: rawAddress.phone || '-',
    destination_city: rawAddress.city || 'Kota Tujuan',
    shipped_at: order.shipped_at,
    delivered_at: order.delivered_at,
    checkpoints: checkpoints || [],
  })
})
