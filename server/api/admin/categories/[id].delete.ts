import { defineEventHandler, getRouterParam } from 'h3'
import { z } from 'zod'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

const uuidSchema = z.string().uuid('ID kategori tidak valid')

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const idCheck = uuidSchema.safeParse(getRouterParam(event, 'id') || '')
  if (!idCheck.success) {
    return errorResponse(event, idCheck.error.issues[0]?.message || 'ID tidak valid', null, 400)
  }

  const client = serverSupabaseServiceRole<Database>(event)

  // Tolak penghapusan jika masih ada produk aktif yang memakai kategori ini
  const { count: activeProductsCount, error: countError } = await client
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', idCheck.data)
    .is('deleted_at', null)

  if (countError) {
    return errorResponse(event, 'Gagal memeriksa ketergantungan produk', countError.message, 500)
  }

  if ((activeProductsCount ?? 0) > 0) {
    return errorResponse(
      event,
      'Kategori masih memiliki produk aktif. Pindahkan produk terlebih dahulu.',
      { activeProductsCount },
      409,
    )
  }

  const nowIso = new Date().toISOString()
  const { data: deleted, error: deleteError } = await client
    .from('categories')
    .update({
      deleted_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', idCheck.data)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle()

  if (deleteError) {
    return errorResponse(event, 'Gagal mengarsipkan kategori', deleteError.message, 500)
  }

  if (!deleted) {
    return errorResponse(event, 'Kategori tidak ditemukan atau sudah dihapus', null, 404)
  }

  return successResponse('Kategori berhasil diarsipkan', { id: deleted.id })
})
