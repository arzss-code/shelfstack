import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'
import { rehydratePrivateStorageUrl } from '../../../utils/private-storage'
import type { ReturnRequestItem } from '../../../../shared/schemas/return-request'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = serverSupabaseServiceRole<Database>(event)

    const query = getQuery(event)
    const statusFilter = (query.status as string) || 'all'
    const searchQuery = (query.search as string)?.trim().toLowerCase() || ''

    // 1. Ambil seluruh data return_requests aktif
    let dbQuery = client
      .from('return_requests')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (statusFilter && statusFilter !== 'all') {
      dbQuery = dbQuery.eq('status', statusFilter)
    }

    const { data: rawReturns, error } = await dbQuery

    if (error) {
      return errorResponse(event, 'Gagal memuat daftar retur', error.message, 500)
    }

    const returnsList = rawReturns || []

    // 2. Ambil metadata orders dan profiles terkait
    const orderIds = [...new Set(returnsList.map((r) => r.order_id))]
    const userIds = [...new Set(returnsList.map((r) => r.user_id))]

    const orderMap = new Map<string, { order_number?: string; total_cents?: number }>()
    if (orderIds.length > 0) {
      const { data: ordersData } = await client
        .from('orders')
        .select('id, total_cents')
        .in('id', orderIds)

      ordersData?.forEach((o) => {
        orderMap.set(o.id, {
          order_number: `ORD-${o.id.slice(0, 8).toUpperCase()}`,
          total_cents: o.total_cents,
        })
      })
    }

    const profileMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: profilesData } = await client
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds)

      profilesData?.forEach((p) => {
        if (p.full_name) profileMap.set(p.user_id, p.full_name)
      })
    }

    // 3. Format hasil return requests + tanda tangani ulang URL bukti retur privat
    let formattedList: ReturnRequestItem[] = await Promise.all(
      returnsList.map(async (r) => {
        const ord = orderMap.get(r.order_id)
        const signedUrls = await Promise.all(
          (r.proof_image_urls || []).map((url) =>
            rehydratePrivateStorageUrl(client, 'return-proofs', url),
          ),
        )
        return {
          ...r,
          proof_image_urls: signedUrls.filter((u): u is string => Boolean(u)),
          order_number: ord?.order_number || `ORD-${r.order_id.slice(0, 8).toUpperCase()}`,
          total_price_cents: ord?.total_cents ?? r.refund_amount_cents ?? 0,
          customer_name: profileMap.get(r.user_id) || 'Pelanggan ShelfStack',
        } as ReturnRequestItem
      }),
    )

    // 4. Client-side search filter jika search query terisi
    if (searchQuery) {
      formattedList = formattedList.filter(
        (item) =>
          item.order_number?.toLowerCase().includes(searchQuery) ||
          item.customer_name?.toLowerCase().includes(searchQuery) ||
          item.customer_notes.toLowerCase().includes(searchQuery) ||
          (item.return_tracking_number &&
            item.return_tracking_number.toLowerCase().includes(searchQuery)),
      )
    }

    // 5. Hitung metrik ringkasan
    const { data: allMetricsData } = await client
      .from('return_requests')
      .select('status')
      .is('deleted_at', null)

    const metrics = {
      total: allMetricsData?.length || 0,
      requested: allMetricsData?.filter((m) => m.status === 'requested').length || 0,
      approved: allMetricsData?.filter((m) => m.status === 'approved').length || 0,
      item_received: allMetricsData?.filter((m) => m.status === 'item_received').length || 0,
      completed: allMetricsData?.filter((m) => m.status === 'completed').length || 0,
      rejected: allMetricsData?.filter((m) => m.status === 'rejected').length || 0,
    }

    return successResponse('Daftar retur berhasil dimuat', {
      metrics,
      returns: formattedList,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal'
    return errorResponse(event, message, null, 500)
  }
})
