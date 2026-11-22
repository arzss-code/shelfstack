import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { adminFlashDealUpdateSchema } from '../../../../../shared/schemas/flash-deals'
import { requireAdmin } from '../../../../utils/auth'
import { errorResponse, successResponse } from '../../../../utils/response'

const uuidSchema = z.string().uuid('ID kampanye flash sale tidak valid')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idCheck = uuidSchema.safeParse(getRouterParam(event, 'id') || '')
  if (!idCheck.success) {
    return errorResponse(event, idCheck.error.issues[0]?.message || 'ID tidak valid', null, 400)
  }

  const rawBody = await readBody(event).catch(() => ({}))
  const parsed = adminFlashDealUpdateSchema.safeParse(rawBody)
  if (!parsed.success) {
    const firstMsg = parsed.error.issues[0]?.message || 'Data pembaruan flash sale tidak valid'
    return errorResponse(event, firstMsg, parsed.error.flatten().fieldErrors, 422)
  }

  const client = serverSupabaseServiceRole<Database>(event)
  const { data: existing, error: fetchErr } = await client
    .from('flash_deals')
    .select('id, product_id, promo_price_cents, starts_at, ends_at')
    .eq('id', idCheck.data)
    .maybeSingle()

  if (fetchErr || !existing) {
    return errorResponse(event, 'Kampanye flash sale tidak ditemukan', null, 404)
  }

  const effectiveStart = parsed.data.starts_at || existing.starts_at
  const effectiveEnd = parsed.data.ends_at || existing.ends_at
  if (new Date(effectiveEnd).getTime() <= new Date(effectiveStart).getTime()) {
    return errorResponse(event, 'Waktu berakhir harus setelah waktu mulai', null, 422)
  }

  const basePayload: Database['public']['Tables']['flash_deals']['Update'] = {}
  if (parsed.data.product_id !== undefined) basePayload.product_id = parsed.data.product_id
  if (parsed.data.promo_price_cents !== undefined)
    basePayload.promo_price_cents = parsed.data.promo_price_cents
  if (parsed.data.discount_percentage !== undefined)
    basePayload.discount_percentage = parsed.data.discount_percentage
  if (parsed.data.quota !== undefined) basePayload.quota = parsed.data.quota
  if (parsed.data.starts_at !== undefined) basePayload.starts_at = parsed.data.starts_at
  if (parsed.data.ends_at !== undefined) basePayload.ends_at = parsed.data.ends_at
  if (parsed.data.is_active !== undefined) basePayload.is_active = parsed.data.is_active

  const selectCols =
    'id, product_id, promo_price_cents, discount_percentage, quota, claimed, starts_at, ends_at, is_active, created_at, products(id, name, slug, price, price_cents, stock, image_url)'

  let { data: updated, error: updateErr } = await client
    .from('flash_deals')
    .update({ ...basePayload, updated_at: new Date().toISOString() })
    .eq('id', idCheck.data)
    .select(selectCols)
    .single()

  if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('updated_at'))) {
    const fallbackRes = await client
      .from('flash_deals')
      .update(basePayload)
      .eq('id', idCheck.data)
      .select(selectCols)
      .single()
    updated = fallbackRes.data
    updateErr = fallbackRes.error
  }

  if (updateErr) {
    return errorResponse(event, 'Gagal memperbarui kampanye flash sale', updateErr.message, 500)
  }

  return successResponse('Kampanye flash sale berhasil diperbarui', updated)
})
