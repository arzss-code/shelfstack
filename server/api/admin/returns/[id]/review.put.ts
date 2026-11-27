import { defineEventHandler, getRouterParam, H3Error, readBody } from 'h3'
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
import { insertActivityLogWithDevice } from '../../../../utils/activity-log'
import { rehydratePrivateStorageUrl } from '../../../../utils/private-storage'
import { logger } from '../../../../utils/logger'

type ReturnRequestRow = Database['public']['Tables']['return_requests']['Row']

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const client = serverSupabaseServiceRole<Database>(event)

    const returnId = getRouterParam(event, 'id')
    if (!returnId) {
      return errorResponse(event, 'ID tiket retur tidak valid', null, 400)
    }

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

    // Eksekusi review + restock stok & varian atomik via PostgreSQL RPC
    const { data: rpcData, error: rpcError } = await client.rpc('admin_review_return_request', {
      p_return_id: returnId,
      p_status: payload.status,
      p_admin_notes: payload.admin_notes || null,
      p_replacement_courier: payload.replacement_courier || null,
      p_replacement_tracking_number: payload.replacement_tracking_number || null,
      p_refund_amount_cents: payload.refund_amount_cents ?? null,
      p_restock_inventory: payload.restock_inventory,
    })

    if (rpcError) {
      const msg = rpcError.message || 'Gagal memperbarui status tiket retur'
      if (msg.includes('RETURN_NOT_FOUND')) {
        return errorResponse(event, 'Tiket retur tidak ditemukan', null, 404)
      }
      if (msg.includes('FORBIDDEN_NOT_ADMIN')) {
        return errorResponse(event, 'Akses ditolak', null, 403)
      }
      if (msg.includes('INVALID_RETURN_')) {
        return errorResponse(event, msg, rpcError, 409)
      }
      return errorResponse(event, 'Gagal memperbarui status tiket retur', msg, 500)
    }

    const updatedTicket = rpcData as unknown as ReturnRequestRow
    if (!updatedTicket || !updatedTicket.id) {
      return errorResponse(event, 'Respons RPC review retur tidak valid', null, 500)
    }

    const signedUrls = updatedTicket.proof_image_urls?.length
      ? (
          await Promise.all(
            updatedTicket.proof_image_urls.map((url) =>
              rehydratePrivateStorageUrl(client, 'return-proofs', url),
            ),
          )
        ).filter((u): u is string => Boolean(u))
      : []

    const statusMeta = RETURN_STATUS_MAP[payload.status as ReturnRequestStatus]
    let notifMessage = statusMeta.description
    if (payload.status === 'rejected' && payload.admin_notes) {
      notifMessage += ` Catatan: ${payload.admin_notes}`
    } else if (payload.status === 'completed' && payload.replacement_tracking_number) {
      notifMessage += ` Nomor resi unit baru: ${payload.replacement_courier || 'Kurir'} - ${payload.replacement_tracking_number}`
    }

    await createNotification(client, {
      user_id: updatedTicket.user_id,
      title: `Update Tiket Retur: ${statusMeta.label}`,
      message: notifMessage,
      type: 'system',
      reference_id: updatedTicket.id,
      reference_url: `/orders/${updatedTicket.order_id}`,
    }).catch((err) => {
      logger.warn('[RMA Review] Gagal mengirim notifikasi', {}, err)
    })

    await insertActivityLogWithDevice(client, event, {
      entity_type: 'return_request',
      entity_id: 0,
      action: 'UPDATE',
      description: `Admin memperbarui status tiket retur ${returnId} menjadi ${payload.status}`,
      new_data: { return_id: returnId, order_id: updatedTicket.order_id, status: payload.status },
    })

    return successResponse('Keputusan tiket retur berhasil disimpan', {
      ...updatedTicket,
      proof_image_urls: signedUrls,
    })
  } catch (err: unknown) {
    if (
      err instanceof H3Error ||
      (typeof err === 'object' && err !== null && 'statusCode' in err)
    ) {
      throw err
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan internal'
    return errorResponse(event, message, null, 500)
  }
})
