import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { customerRefundRequestSchema } from '../../../../shared/schemas/refund-request'
import { requireUser } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'
import { createNotification } from '../../../utils/notifications'
import { logger } from '../../../utils/logger'

const uuidSchema = z.string().uuid('ID pesanan tidak valid')

export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event)

  const idCheck = uuidSchema.safeParse(getRouterParam(event, 'id') || '')
  if (!idCheck.success) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = customerRefundRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Alasan pembatalan tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: order, error: orderErr } = await client
    .from('orders')
    .select('id, user_id, status, tracking_number, total_cents, midtrans_id')
    .eq('id', idCheck.data)
    .maybeSingle()

  if (orderErr || !order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', null, 404)
  }

  if (order.user_id !== user.id) {
    return errorResponse(event, 'Akses pesanan ditolak', null, 403)
  }

  if (order.status !== 'paid' || Boolean(order.tracking_number)) {
    return errorResponse(
      event,
      'Pembatalan mandiri hanya tersedia untuk pesanan lunas yang belum dikirim',
      null,
      409,
    )
  }

  const { data: existingRefund } = await client
    .from('refunds')
    .select('id, order_id, status, amount_cents, reason, created_at, updated_at')
    .eq('order_id', order.id)
    .in('status', ['pending', 'succeeded'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingRefund) {
    return successResponse('Pengajuan pembatalan & refund sudah tercatat', existingRefund)
  }

  const { data: createdRefund, error: insertError } = await client
    .from('refunds')
    .insert({
      order_id: order.id,
      user_id: order.user_id,
      amount_cents: order.total_cents,
      reason: parsed.data.reason,
      status: 'pending',
      gateway: 'midtrans',
      gateway_transaction_id: order.midtrans_id || order.id,
      idempotency_key: `cust-refund-req-${order.id}`,
    })
    .select('id, order_id, status, amount_cents, reason, created_at, updated_at')
    .single()

  if (insertError) {
    logger.error(
      '[CustomerRefundRequest] Gagal menyimpan pengajuan refund',
      { orderId: order.id },
      insertError,
    )
    return errorResponse(event, 'Gagal menyimpan pengajuan pembatalan', insertError.message, 500)
  }

  await createNotification(client, {
    user_id: order.user_id,
    title: 'Pengajuan Pembatalan & Refund Diterima',
    message: `Pengajuan pembatalan untuk pesanan #${order.id.slice(0, 8).toUpperCase()} sedang ditinjau Admin sebelum pengiriman diproses.`,
    type: 'system',
    reference_id: order.id,
    reference_url: `/orders/${order.id}`,
  }).catch(() => {})

  setResponseStatus(event, 201)
  return successResponse('Pengajuan pembatalan & refund berhasil dikirim', createdRefund)
})
