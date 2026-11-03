import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireUser } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { checkReturnWindowEligibility } from '../../../../utils/return-request'

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id')
  if (!orderId) {
    return errorResponse(event, 'ID pesanan tidak valid', null, 400)
  }

  const client = await serverSupabaseClient<Database>(event)
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  // 1. Ambil data pesanan
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id, user_id, status, created_at, updated_at')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError) {
    return errorResponse(event, 'Gagal mengambil data pesanan', orderError.message, 500)
  }

  if (!order) {
    return errorResponse(event, 'Pesanan tidak ditemukan', null, 404)
  }

  // 2. Verifikasi hak akses (pemilik atau admin)
  const isAdmin = profile?.role === 'admin'
  if (order.user_id !== targetUserId && !isAdmin) {
    return errorResponse(event, 'Akses ditolak', null, 403)
  }

  // 3. Ambil data return_request aktif jika ada
  const { data: returnRequest, error: returnError } = await client
    .from('return_requests')
    .select('*')
    .eq('order_id', orderId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (returnError) {
    return errorResponse(event, 'Gagal mengambil data tiket retur', returnError.message, 500)
  }

  // 4. Hitung eligibilitas jendela retur
  const eligibility = checkReturnWindowEligibility({
    status: order.status,
    completed_at: order.updated_at,
  })

  return successResponse('Data retur pesanan berhasil diambil', {
    order_id: orderId,
    eligibility,
    return_request: returnRequest || null,
  })
})
