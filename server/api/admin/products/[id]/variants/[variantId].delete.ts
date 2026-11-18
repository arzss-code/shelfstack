import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../../utils/response'

const uuidSchema = z.string().uuid('ID varian tidak valid')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const productId = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  const variantIdRaw = getRouterParam(event, 'variantId') || ''
  const variantCheck = uuidSchema.safeParse(variantIdRaw)

  if (Number.isNaN(productId) || productId <= 0 || !variantCheck.success) {
    return errorResponse(event, 'Parameter ID produk atau varian tidak valid', null, 400)
  }

  const nowIso = new Date().toISOString()
  const client = serverSupabaseServiceRole<Database>(event)
  const { data: deleted, error: deleteError } = await client
    .from('product_variants')
    .update({
      deleted_at: nowIso,
      is_active: false,
      updated_at: nowIso,
    })
    .eq('id', variantCheck.data)
    .eq('product_id', productId)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (deleteError) {
    return errorResponse(event, 'Gagal mengarsipkan varian produk', deleteError.message, 500)
  }

  if (!deleted) {
    return errorResponse(event, 'Varian produk tidak ditemukan atau sudah dihapus', null, 404)
  }

  return successResponse('Varian produk berhasil dihapus (arsip)', { id: deleted.id })
})
