import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { logger } from '../../../../utils/logger'

const restockSchema = z.object({
  quantity: z
    .number()
    .int('Jumlah restock harus bilangan bulat')
    .positive('Jumlah restock minimal 1 unit')
    .max(10000, 'Jumlah restock maksimal 10.000 unit per transaksi'),
  notes: z.string().trim().max(255, 'Catatan maksimal 255 karakter').optional(),
  variant_id: z.string().uuid('ID varian tidak valid').nullable().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idParam = getRouterParam(event, 'id')
  const productId = parseInt(idParam || '', 10)

  if (isNaN(productId) || productId <= 0) {
    return errorResponse(event, 'ID produk tidak valid', null, 400)
  }

  const rawBody = await readBody(event)
  const parseResult = restockSchema.safeParse(rawBody)

  if (!parseResult.success) {
    const errorMessages = parseResult.error.issues.map((i) => i.message).join(', ')
    return errorResponse(event, `Validasi gagal: ${errorMessages}`, parseResult.error.format(), 422)
  }

  const { quantity, notes, variant_id } = parseResult.data
  const client = serverSupabaseServiceRole<Database>(event)

  const { data: rpcData, error: rpcError } = await client.rpc('admin_restock_product', {
    p_product_id: productId,
    p_quantity: quantity,
    p_notes: notes || null,
    p_variant_id: variant_id || null,
  })

  if (rpcError) {
    const message = rpcError.message || 'Gagal memperbarui stok produk'
    if (message.includes('FORBIDDEN_NOT_ADMIN')) {
      return errorResponse(event, 'Akses ditolak', null, 403)
    }
    if (message.includes('PRODUCT_NOT_FOUND') || message.includes('VARIANT_NOT_FOUND')) {
      return errorResponse(event, message, null, 404)
    }
    if (message.includes('INVALID_RESTOCK_QUANTITY')) {
      return errorResponse(event, message, null, 422)
    }

    logger.error(
      '[QuickRestock] Gagal mengeksekusi RPC admin_restock_product',
      { productId, variantId: variant_id || undefined },
      rpcError,
    )
    return errorResponse(event, 'Gagal memperbarui stok produk', rpcError, 500)
  }

  return successResponse('Stok produk berhasil diperbarui', rpcData as Record<string, unknown>)
})
