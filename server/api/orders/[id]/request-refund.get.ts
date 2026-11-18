import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

const uuidSchema = z.string().uuid('ID pesanan tidak valid')

export default defineEventHandler(async (event) => {
  const { user, profile } = await requireUser(event)

  const idCheck = uuidSchema.safeParse(getRouterParam(event, 'id') || '')
  if (!idCheck.success) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: order, error: orderErr } = await client
    .from('orders')
    .select('id, user_id')
    .eq('id', idCheck.data)
    .maybeSingle()

  if (orderErr || !order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', null, 404)
  }

  if (order.user_id !== user.id && profile.role !== 'admin') {
    return errorResponse(event, 'Akses pesanan ditolak', null, 403)
  }

  const { data: refundRow, error: refundErr } = await client
    .from('refunds')
    .select('id, order_id, status, amount_cents, reason, created_at, updated_at')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (refundErr) {
    return errorResponse(event, 'Gagal memuat status pengajuan refund', refundErr.message, 500)
  }

  return successResponse('Status pengajuan refund dimuat', refundRow || null)
})
