import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import type { CourierCode } from '../../../../../shared/schemas/shipping'
import type { CheckpointStatus } from '../../../../../shared/schemas/shipping-checkpoint-input'
import { defaultCheckpointTemplates } from '../../../../../shared/schemas/shipping-checkpoint-input'
import { generateTrackingNumber } from '../../../../utils/shipping'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const body = await readBody(event).catch(() => ({}))
  const mode = (body?.mode as 'all' | 'next') || 'all'

  const client = serverSupabaseServiceRole<Database>(event)

  // 1. Ambil data pesanan
  const { data: order, error: orderErr } = await client
    .from('orders')
    .select('id, user_id, status, tracking_number, courier_code, courier_name, address')
    .eq('id', orderId)
    .maybeSingle()

  if (orderErr) return errorResponse(event, 'Gagal mengambil data pesanan', orderErr, 500)
  if (!order) return errorResponse(event, 'Pesanan tidak ditemukan', null, 404)

  if (order.status === 'pending' || order.status === 'cancelled' || order.status === 'refunded') {
    return errorResponse(
      event,
      `Pesanan berstatus ${order.status} tidak dapat disimulasikan pengirimannya`,
      null,
      409,
    )
  }

  const rawAddress = (order.address as { name?: string; city?: string } | null) || {}
  const destinationCity = rawAddress.city || 'Kota Tujuan'
  const courierCode = (order.courier_code as CourierCode) || 'jne'
  const courierName = order.courier_name || 'JNE Express'

  let trackingNumber = order.tracking_number
  let currentStatus = order.status

  // 2. Transisikan status paid -> shipped via RPC dulu (memicu guard REFUND_PENDING_CONFLICT)
  if (currentStatus === 'paid') {
    const { error: shipErr } = await client.rpc('transition_order_status', {
      p_order_id: orderId,
      p_target_status: 'shipped',
      p_reason: 'Simulasi pengiriman ekspedisi otomatis oleh admin',
    })
    if (shipErr) {
      return errorResponse(
        event,
        shipErr.message || 'Pesanan tidak dapat ditransisikan ke status dikirim',
        shipErr,
        409,
      )
    }
    currentStatus = 'shipped'
  }

  // 3. Pastikan pesanan memiliki nomor resi
  if (!trackingNumber) {
    trackingNumber = generateTrackingNumber(courierCode)
    await client
      .from('orders')
      .update({
        tracking_number: trackingNumber,
        shipped_at: new Date().toISOString(),
      })
      .eq('id', orderId)
  }

  // 3. Ambil checkpoint yang sudah ada
  const { data: existingCheckpoints } = await client
    .from('shipping_checkpoints')
    .select('status')
    .eq('order_id', orderId)

  const existingStatuses = new Set((existingCheckpoints || []).map((c) => c.status))

  // 4. Urutan simulasi perjalanan paket
  const journey: Array<{
    status: CheckpointStatus
    location: string
    title: string
    description: string
    offsetMinutes: number
  }> = [
    {
      status: 'manifested',
      location: 'ShelfStack Fulfillment Center, Jakarta',
      title: defaultCheckpointTemplates.manifested.defaultTitle,
      description: `Data pengiriman tercatat di sistem ${courierName}. Paket disiapkan.`,
      offsetMinutes: 180,
    },
    {
      status: 'picked_up',
      location: 'Origin Hub Jakarta Barat',
      title: defaultCheckpointTemplates.picked_up.defaultTitle,
      description: `Paket telah dijemput kurir ${courierName} dan menuju sorting facility.`,
      offsetMinutes: 120,
    },
    {
      status: 'in_transit',
      location: `Transit Sorting Hub, Cikarang`,
      title: defaultCheckpointTemplates.in_transit.defaultTitle,
      description: `Paket sedang diproses dan diberangkatkan ke fasilitas logistik di ${destinationCity}.`,
      offsetMinutes: 60,
    },
    {
      status: 'out_for_delivery',
      location: `Delivery Hub, ${destinationCity}`,
      title: defaultCheckpointTemplates.out_for_delivery.defaultTitle,
      description: `Paket telah tiba di hub terdekat dan dibawa kurir menuju alamat tujuan.`,
      offsetMinutes: 20,
    },
    {
      status: 'delivered',
      location: destinationCity,
      title: defaultCheckpointTemplates.delivered.defaultTitle,
      description: `Paket telah diterima dengan baik oleh ${rawAddress.name || 'Penerima'}.`,
      offsetMinutes: 0,
    },
  ]

  const now = Date.now()
  const toInsert: Array<{
    order_id: string
    tracking_number: string
    status: CheckpointStatus
    location: string
    title: string
    description: string
    created_at: string
  }> = []

  for (const step of journey) {
    if (existingStatuses.has(step.status)) continue
    toInsert.push({
      order_id: order.id,
      tracking_number: trackingNumber,
      status: step.status,
      location: step.location,
      title: step.title,
      description: step.description,
      created_at: new Date(now - step.offsetMinutes * 60 * 1000).toISOString(),
    })
    if (mode === 'next') break
  }

  if (toInsert.length > 0) {
    const { error: insertErr } = await client.from('shipping_checkpoints').insert(toInsert)
    if (insertErr)
      return errorResponse(event, 'Gagal menyimpan simulasi checkpoint', insertErr, 500)
  }

  // 5. Jika mencapai status delivered dan pesanan masih shipped, selesaikan pesanan
  const hasDelivered =
    toInsert.some((c) => c.status === 'delivered') || existingStatuses.has('delivered')
  if (hasDelivered && currentStatus === 'shipped') {
    await client.rpc('transition_order_status', {
      p_order_id: orderId,
      p_target_status: 'completed',
      p_reason: 'Paket telah sampai di tujuan (Simulasi Otomatis)',
    })
    await client.from('orders').update({ delivered_at: new Date().toISOString() }).eq('id', orderId)
    currentStatus = 'completed'
  }

  return successResponse('Simulasi perjalanan ekspedisi berhasil dijalankan', {
    order_id: order.id,
    tracking_number: trackingNumber,
    new_checkpoints_count: toInsert.length,
    final_status: currentStatus,
  })
})
