import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  adminReviewReturnRequestSchema,
  type ReturnRequestStatus,
} from '../../../../../shared/schemas/return-request'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { createNotification } from '../../../../utils/notifications'
import { RETURN_STATUS_MAP } from '../../../../utils/return-request'
import { logger } from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = serverSupabaseServiceRole<Database>(event)

    const returnId = getRouterParam(event, 'id')
    if (!returnId) {
      return errorResponse(event, 'ID tiket retur tidak valid', null, 400)
    }

    // 1. Validasi body keputusan admin
    const body = await readBody(event)
    const parseResult = adminReviewReturnRequestSchema.safeParse(body)
    if (!parseResult.success) {
      return errorResponse(
        event,
        parseResult.error.issues[0]?.message || 'Data keputusan retur tidak valid',
        parseResult.error.issues,
        400,
      )
    }
    const payload = parseResult.data

    // 2. Ambil tiket retur
    const { data: ticket, error: ticketError } = await client
      .from('return_requests')
      .select('*')
      .eq('id', returnId)
      .is('deleted_at', null)
      .maybeSingle()

    if (ticketError) {
      return errorResponse(event, 'Gagal mengambil data tiket retur', ticketError.message, 500)
    }

    if (!ticket) {
      return errorResponse(event, 'Tiket retur tidak ditemukan', null, 404)
    }

    // 3. Persiapkan payload update
    const isResolving = payload.status === 'completed' || payload.status === 'rejected'
    const nowIso = new Date().toISOString()

    const updatePayload: Database['public']['Tables']['return_requests']['Update'] = {
      status: payload.status,
      admin_notes: payload.admin_notes || ticket.admin_notes,
      updated_at: nowIso,
      resolved_at: isResolving ? nowIso : ticket.resolved_at,
    }

    if (payload.replacement_courier) updatePayload.replacement_courier = payload.replacement_courier
    if (payload.replacement_tracking_number) {
      updatePayload.replacement_tracking_number = payload.replacement_tracking_number
    }
    if (payload.refund_amount_cents !== undefined) {
      updatePayload.refund_amount_cents = payload.refund_amount_cents
    }

    // 4. Jika selesai dan restock disetujui: kembalikan stok produk ke inventaris
    if (payload.status === 'completed' && payload.restock_inventory && !ticket.restocked_at) {
      const { data: orderItems } = await client
        .from('order_items')
        .select('product_id, qty')
        .eq('order_id', ticket.order_id)

      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const { data: prod } = await client
            .from('products')
            .select('id, stock')
            .eq('id', item.product_id)
            .single()

          if (prod) {
            const newStock = prod.stock + item.qty
            await client.from('products').update({ stock: newStock }).eq('id', item.product_id)

            await client.from('stock_movements').insert({
              product_id: item.product_id,
              delta: item.qty,
              balance_after: newStock,
              reason: 'return_restock',
              order_id: ticket.order_id,
              notes: `Restock pengembalian barang retur tiket ${ticket.id.slice(0, 8)}`,
            })
          }
        }
        updatePayload.restocked_at = nowIso
      }
    }

    // 5. Simpan pembaruan tiket
    const { data: updatedTicket, error: updateError } = await client
      .from('return_requests')
      .update(updatePayload)
      .eq('id', returnId)
      .select()
      .single()

    if (updateError) {
      return errorResponse(event, 'Gagal memperbarui status tiket retur', updateError.message, 500)
    }

    // 6. Buat notifikasi in-app untuk pelanggan
    const statusMeta = RETURN_STATUS_MAP[payload.status as ReturnRequestStatus]
    let notifMessage = statusMeta.description
    if (payload.status === 'rejected' && payload.admin_notes) {
      notifMessage += ` Catatan: ${payload.admin_notes}`
    } else if (payload.status === 'completed' && payload.replacement_tracking_number) {
      notifMessage += ` Nomor resi unit baru: ${payload.replacement_courier || 'Kurir'} - ${payload.replacement_tracking_number}`
    }

    await createNotification(client, {
      user_id: ticket.user_id,
      title: `Update Tiket Retur: ${statusMeta.label}`,
      message: notifMessage,
      type: 'system',
      reference_id: ticket.id,
      reference_url: `/orders/${ticket.order_id}`,
    }).catch((err) => {
      logger.warn('[RMA Review] Gagal mengirim notifikasi', {}, err)
    })

    // 7. Audit log
    try {
      await client.from('activity_logs').insert({
        entity_type: 'return_request',
        entity_id: 0,
        action: 'UPDATE',
        description: `Admin memperbarui status tiket retur ${returnId} menjadi ${payload.status}`,
      })
    } catch {
      // non-blocking
    }

    return successResponse('Keputusan tiket retur berhasil disimpan', updatedTicket)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal'
    return errorResponse(event, message, null, 500)
  }
})
