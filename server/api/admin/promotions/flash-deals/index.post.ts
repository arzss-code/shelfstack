import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminFlashDealCreateSchema } from '../../../../../shared/schemas/flash-deals'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'
import { logger } from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = adminFlashDealCreateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Data kampanye flash sale tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const {
    product_id,
    promo_price_cents,
    discount_percentage,
    quota,
    starts_at,
    ends_at,
    is_active,
  } = parsed.data

  const { data: product, error: prodErr } = await client
    .from('products')
    .select('id, name, price, price_cents, stock')
    .eq('id', product_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (prodErr || !product) {
    return errorResponse(event, 'Produk target flash sale tidak ditemukan', null, 404)
  }

  const originalPriceCents = product.price_cents || Math.round(Number(product.price || 0) * 100)
  if (promo_price_cents >= originalPriceCents) {
    return errorResponse(
      event,
      'Harga promo harus lebih rendah dari harga normal produk',
      null,
      422,
    )
  }

  const { data: created, error: insertError } = await client
    .from('flash_deals')
    .insert({
      product_id,
      promo_price_cents,
      discount_percentage,
      quota,
      starts_at,
      ends_at,
      is_active,
    })
    .select(
      'id, product_id, promo_price_cents, discount_percentage, quota, claimed, starts_at, ends_at, is_active, created_at, products(id, name, slug, price, price_cents, stock, image_url)',
    )
    .single()

  if (insertError) {
    logger.error('[AdminFlashDeals] Gagal membuat kampanye', { product_id }, insertError)
    return errorResponse(event, 'Gagal menyimpan kampanye flash sale', insertError.message, 500)
  }

  setResponseStatus(event, 201)
  return successResponse('Kampanye flash sale berhasil dibuat', created)
})
