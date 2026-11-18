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

  const payload: Database['public']['Tables']['flash_deals']['Update'] = {
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.product_id !== undefined) payload.product_id = parsed.data.product_id
  if (parsed.data.promo_price_cents !== undefined)
    payload.promo_price_cents = parsed.data.promo_price_cents
  if (parsed.data.discount_percentage !== undefined)
    payload.discount_percentage = parsed.data.discount_percentage
  if (parsed.data.quota !== undefined) payload.quota = parsed.data.quota
  if (parsed.data.starts_at !== undefined) payload.starts_at = parsed.data.starts_at
  if (parsed.data.ends_at !== undefined) payload.ends_at = parsed.data.ends_at
  if (parsed.data.is_active !== undefined) payload.is_active = parsed.data.is_active

  const { data: updated, error: updateErr } = await client
    .from('flash_deals')
    .update(payload)
    .eq('id', idCheck.data)
    .select(
      'id, product_id, promo_price_cents, discount_percentage, quota, claimed, starts_at, ends_at, is_active, created_at, updated_at, products(id, name, slug, price, price_cents, stock, image_url)',
    )
    .single()

  if (updateErr) {
    return errorResponse(event, 'Gagal memperbarui kampanye flash sale', updateErr.message, 500)
  }

  return successResponse('Kampanye flash sale berhasil diperbarui', updated)
})
