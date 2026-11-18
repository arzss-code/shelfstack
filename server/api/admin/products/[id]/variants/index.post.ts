import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminVariantCreateSchema } from '../../../../../../shared/schemas/product-variant'
import { requireAdmin } from '../../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../../utils/response'
import { logger } from '../../../../../utils/logger'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idParam = getRouterParam(event, 'id')
  const productId = Number.parseInt(idParam || '', 10)
  if (Number.isNaN(productId) || productId <= 0) {
    return errorResponse(event, 'ID produk tidak valid', null, 400)
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = adminVariantCreateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Data varian produk tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: product, error: prodErr } = await client
    .from('products')
    .select('id')
    .eq('id', productId)
    .is('deleted_at', null)
    .maybeSingle()

  if (prodErr || !product) {
    return errorResponse(event, 'Produk induk tidak ditemukan', prodErr?.message || null, 404)
  }

  const { sku, name, attributes, price_cents, stock, is_active } = parsed.data
  const { data: created, error: insertError } = await client
    .from('product_variants')
    .insert({
      product_id: productId,
      sku: sku.toUpperCase(),
      name,
      attributes,
      price_cents: price_cents ?? null,
      stock,
      is_active,
    })
    .select('*')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return errorResponse(event, `SKU varian "${sku}" sudah digunakan.`, null, 409)
    }
    logger.error('[AdminVariants] Gagal menambah varian', { productId, sku }, insertError)
    return errorResponse(event, 'Gagal menyimpan varian produk baru', insertError.message, 500)
  }

  try {
    await client.from('activity_logs').insert({
      entity_type: 'product',
      entity_id: productId,
      action: 'UPDATE',
      description: `Menambahkan varian SKU ${created.sku} (${created.name})`,
      new_data: { variant_id: created.id, sku: created.sku, stock: created.stock },
    })
  } catch {
    // Non-fatal audit logging
  }

  setResponseStatus(event, 201)
  return successResponse('Varian produk berhasil ditambahkan', created)
})
