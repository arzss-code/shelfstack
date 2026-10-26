import { serverSupabaseClient } from '#supabase/server'
import { wishlistSyncSchema } from '../../../shared/schemas/wishlist'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  const body = await readBody(event)
  const parsed = wishlistSyncSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(
      event,
      'Validasi sinkronisasi gagal',
      parsed.error.flatten().fieldErrors,
      400,
    )
  }

  const { productIds } = parsed.data

  if (productIds.length > 0) {
    // Ambil item yang sudah tersimpan untuk menghindari konflik duplikasi
    const { data: existingRows } = await (client as any)
      .from('wishlists')
      .select('product_id')
      .eq('user_id', targetUserId)

    const existingSet = new Set((existingRows || []).map((r: any) => Number(r.product_id)))
    const records = productIds
      .filter((productId) => !existingSet.has(productId))
      .map((productId) => ({
        user_id: targetUserId,
        product_id: productId,
      }))

    if (records.length > 0) {
      const { error: insertError } = await (client as any).from('wishlists').insert(records)

      if (insertError) {
        return errorResponse(event, 'Gagal menyinkronkan wishlist', insertError, 500)
      }
    }
  }

  // Ambil data lengkap hasil sinkronisasi
  const { data, error: fetchError } = await (client as any)
    .from('wishlists')
    .select(
      `
      id,
      product_id,
      created_at,
      product:products (
        id,
        name,
        slug,
        price,
        price_cents,
        image_url,
        stock,
        category_id
      )
    `,
    )
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })

  if (fetchError) {
    return errorResponse(event, 'Gagal memuat wishlist hasil sinkronisasi', fetchError, 500)
  }

  return successResponse('Wishlist berhasil disinkronkan', data || [])
})
