import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  createReturnRequestSchema,
  type ReturnSolutionType,
} from '../../../../../shared/schemas/return-request'
import { requireUser } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import {
  checkReturnWindowEligibility,
  RETURN_SOLUTION_LABELS,
} from '../../../../utils/return-request'
import { createNotification } from '../../../../utils/notifications'
import { logger } from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id
  const client = await serverSupabaseClient<Database>(event)

  // 1. Validasi payload body dengan Zod
  const body = await readBody(event)
  const parseResult = createReturnRequestSchema.safeParse(body)
  if (!parseResult.success) {
    return errorResponse(
      event,
      parseResult.error.issues[0]?.message || 'Data pengajuan retur tidak valid',
      parseResult.error.issues,
      400,
    )
  }
  const payload = parseResult.data

  // 2. Ambil data pesanan dan verifikasi hak kepemilikan
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id, user_id, status, total_cents, created_at, updated_at')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) {
    return errorResponse(event, 'Gagal mengambil data pesanan', orderError.message, 500)
  }

  if (!order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', null, 404)
  }

  if (order.user_id !== targetUserId) {
    return errorResponse(event, 'Akses ditolak: pesanan bukan milik Anda', null, 403)
  }

  // 3. Verifikasi jendela garansi retur (7 hari sejak selesai)
  const eligibility = checkReturnWindowEligibility({
    status: order.status,
    completed_at: order.updated_at,
  })

  if (!eligibility.isEligible) {
    return errorResponse(
      event,
      eligibility.reason || 'Pesanan tidak memenuhi syarat retur',
      null,
      422,
    )
  }

  // 4. Periksa apakah sudah ada tiket retur aktif untuk pesanan ini
  const { data: existingTicket, error: checkError } = await client
    .from('return_requests')
    .select('id, status')
    .eq('order_id', orderId)
    .is('deleted_at', null)
    .not('status', 'in', '("rejected","cancelled")')
    .maybeSingle()

  if (checkError) {
    return errorResponse(event, 'Gagal memeriksa tiket retur', checkError.message, 500)
  }

  if (existingTicket) {
    return errorResponse(
      event,
      'Sudah ada pengajuan retur aktif untuk pesanan ini yang sedang berjalan.',
      null,
      409,
    )
  }

  // 5. Simpan pengajuan retur ke database
  const insertData = {
    order_id: orderId,
    user_id: targetUserId,
    reason_type: payload.reason_type,
    solution_type: payload.solution_type,
    customer_notes: payload.customer_notes,
    proof_image_urls: payload.proof_image_urls,
    unboxing_video_url: payload.unboxing_video_url || null,
    status: 'requested',
    refund_amount_cents: payload.solution_type === 'refund' ? order.total_cents : null,
  }

  const { data: createdRequest, error: insertError } = await client
    .from('return_requests')
    .insert(insertData)
    .select()
    .single()

  if (insertError) {
    return errorResponse(event, 'Gagal menyimpan pengajuan retur', insertError.message, 500)
  }

  // 6. Buat in-app notification untuk pelanggan
  const solutionLabel = RETURN_SOLUTION_LABELS[payload.solution_type as ReturnSolutionType]
  await createNotification(client, {
    user_id: targetUserId,
    title: 'Pengajuan Retur Diterima',
    message: `Tiket komplain untuk pesanan ${orderId.slice(0, 8)} telah tercatat dengan opsi resolusi: ${solutionLabel}. Tim kami akan meninjau dalam 1x24 jam kerja.`,
    type: 'system',
    reference_id: createdRequest.id,
    reference_url: `/orders/${orderId}`,
  }).catch((err) => {
    logger.warn('[RMA] Gagal membuat notifikasi tiket retur', {}, err)
  })

  // 7. Catat audit log aktivitas
  try {
    await client.from('activity_logs').insert({
      entity_type: 'return_request',
      entity_id: 0,
      action: 'CREATE',
      description: `Pengajuan retur dibuat oleh pelanggan untuk pesanan ${orderId} (${payload.reason_type})`,
    })
  } catch {
    // non-blocking
  }

  return successResponse(
    'Pengajuan retur berhasil dikirim dan sedang ditinjau tim ShelfStack',
    createdRequest,
  )
})
