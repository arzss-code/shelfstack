import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminVariantUpdateSchema } from '../../../../../../shared/schemas/product-variant'
import { requireAdmin } from '../../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../../utils/response'
import { logger } from '../../../../../utils/logger'

const uuidSchema = z.string().uuid('ID varian tidak valid')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const productId = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  const variantIdRaw = getRouterParam(event, 'variantId') || ''
  const variantCheck = uuidSchema.safeParse(variantIdRaw)

  if (Number.isNaN(productId) || productId <= 0 || !variantCheck.success) {
    return errorResponse(event, 'Parameter ID produk atau varian tidak valid', null, 400)
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = adminVariantUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Data pembaruan varian tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const payload: Database['public']['Tables']['product_variants']['Update'] = {
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.sku !== undefined) payload.sku = parsed.data.sku.toUpperCase()
  if (parsed.data.name !== undefined) payload.name = parsed.data.name
  if (parsed.data.attributes !== undefined) payload.attributes = parsed.data.attributes
  if (parsed.data.price_cents !== undefined) payload.price_cents = parsed.data.price_cents
  if (parsed.data.stock !== undefined) payload.stock = parsed.data.stock
  if (parsed.data.is_active !== undefined) payload.is_active = parsed.data.is_active

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: updated, error: updateError } = await client
    .from('product_variants')
    .update(payload)
    .eq('id', variantCheck.data)
    .eq('product_id', productId)
    .is('deleted_at', null)
    .select('*')
    .maybeSingle()

  if (updateError) {
    if (updateError.code === '23505') {
      return errorResponse(event, 'SKU varian sudah digunakan oleh varian lain.', null, 409)
    }
    logger.error(
      '[AdminVariants] Gagal memperbarui varian',
      { productId, variantId: variantCheck.data },
      updateError,
    )
    return errorResponse(event, 'Gagal memperbarui varian produk', updateError.message, 500)
  }

  if (!updated) {
    return errorResponse(event, 'Varian produk tidak ditemukan', null, 404)
  }

  return successResponse('Varian produk berhasil diperbarui', updated)
})
