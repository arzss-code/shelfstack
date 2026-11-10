import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { wishlistSyncSchema } from '../../../shared/schemas/wishlist'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

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
    // 1. Ambil daftar product ID unik bernilai positif
    const uniqueProductIds = [...new Set(productIds.map(Number))].filter(
      (id) => Number.isInteger(id) && id > 0,
    )

    if (uniqueProductIds.length > 0) {
      // 2. Verifikasi produk yang benar-benar ada di tabel products (dan belum soft delete)
      //    Pencegahan error foreign key constraint (23503) dari ID usang di localStorage
      const { data: validProducts } = await client
        .from('products')
        .select('id')
        .in('id', uniqueProductIds)
        .is('deleted_at', null)

      const validProductIdSet = new Set((validProducts || []).map((p) => Number(p.id)))
      const sanitizedProductIds = uniqueProductIds.filter((id) => validProductIdSet.has(id))

      if (sanitizedProductIds.length > 0) {
        const records = sanitizedProductIds.map((productId) => ({
          user_id: targetUserId,
          product_id: productId,
        }))

        // 3. Gunakan upsert dengan ignoreDuplicates agar idempoten dan bebas race condition
        const { error: insertError } = await client
          .from('wishlists')
          .upsert(records, { onConflict: 'user_id,product_id', ignoreDuplicates: true })

        if (insertError) {
          logger.error(
            'Gagal menyinkronkan batch wishlist',
            {
              targetUserId,
              count: records.length,
            },
            insertError,
          )
          return errorResponse(event, 'Gagal menyinkronkan wishlist', insertError, 500)
        }
      }
    }
  }

  // Ambil data lengkap hasil sinkronisasi
  const { data, error: fetchError } = await client
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
