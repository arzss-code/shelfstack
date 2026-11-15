import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  createShippingCheckpointSchema,
  defaultCheckpointTemplates,
} from '../../../../../shared/schemas/shipping-checkpoint-input'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = createShippingCheckpointSchema.safeParse(rawBody)

  if (!parsed.success) {
    return errorResponse(
      event,
      'Validasi checkpoint pengiriman gagal',
      parsed.error.flatten().fieldErrors,
      422,
    )
  }

  const client = serverSupabaseServiceRole<Database>(event)

  // 1. Ambil data pesanan untuk memastikan pesanan valid dan memiliki nomor resi
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id, tracking_number, status, delivered_at')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) {
    return errorResponse(event, 'Gagal mengambil data pesanan', orderError, 500)
  }

  if (!order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', null, 404)
  }

  if (!order.tracking_number) {
    return errorResponse(
      event,
      'Pesanan belum memiliki nomor resi pengiriman. Terbitkan resi terlebih dahulu.',
      null,
      400,
    )
  }

  const { status, location } = parsed.data
  const template = defaultCheckpointTemplates[status]
  const title = parsed.data.title || template.defaultTitle
  const description = parsed.data.description || template.defaultDescription

  // 2. Simpan checkpoint pengiriman baru
  const newCheckpoint = {
    order_id: order.id,
    tracking_number: order.tracking_number,
    status,
    title,
    description,
    location,
    created_at: new Date().toISOString(),
  }

  const { data: inserted, error: insertError } = await client
    .from('shipping_checkpoints')
    .insert(newCheckpoint)
    .select()
    .single()

  if (insertError) {
    return errorResponse(event, 'Gagal menyimpan checkpoint pengiriman', insertError, 500)
  }

  // 3. Jika status adalah delivered dan delivered_at belum tercatat, perbarui secara otomatis
  if (status === 'delivered' && !order.delivered_at) {
    await client
      .from('orders')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', order.id)
  }

  setResponseStatus(event, 201)
  return successResponse('Checkpoint pengiriman berhasil ditambahkan', inserted)
})
