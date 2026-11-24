import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { wishlistMutationSchema } from '../../../shared/schemas/wishlist'
import { requireUser } from '../../utils/auth'
import { errorResponse, successResponse } from '../../utils/response'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const client = await serverSupabaseClient<Database>(event)

  // Autentikasi wajib untuk seluruh operasi wishlist berbasis database
  const { user, profile } = await requireUser(event)
  const targetUserId = user.id || profile.user_id

  if (method === 'GET') {
    const { data, error } = await client
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
          category_id,
          rating,
          review_count,
          sold_count,
          categories (
            name
          )
        )
      `,
      )
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) {
      return errorResponse(event, 'Gagal memuat wishlist', error, 500)
    }

    return successResponse('Wishlist berhasil dimuat', data || [])
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const parsed = wishlistMutationSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse(event, 'Validasi produk gagal', parsed.error.flatten().fieldErrors, 400)
    }

    const productId = parsed.data.productId

    // 1. Verifikasi produk ada dan belum dihapus
    const { data: productRow, error: productError } = await client
      .from('products')
      .select('id')
      .eq('id', productId)
      .is('deleted_at', null)
      .maybeSingle()

    if (productError || !productRow) {
      return errorResponse(event, 'Produk tidak ditemukan atau sudah dihapus', null, 404)
    }

    // 2. Periksa apakah item sudah tersimpan sebelumnya
    const { data: existing } = await client
      .from('wishlists')
      .select('id, product_id, created_at')
      .eq('user_id', targetUserId)
      .eq('product_id', productId)
      .maybeSingle()

    if (existing) {
      return successResponse('Produk berhasil disimpan ke wishlist', existing)
    }

    // 3. Gunakan upsert agar idempoten terhadap double click / race condition
    const { data, error } = await client
      .from('wishlists')
      .upsert(
        {
          user_id: targetUserId,
          product_id: productId,
        },
        { onConflict: 'user_id,product_id', ignoreDuplicates: true },
      )
      .select()
      .maybeSingle()

    if (error) {
      return errorResponse(event, 'Gagal menyimpan ke wishlist', error, 500)
    }

    return successResponse('Produk berhasil disimpan ke wishlist', data || existing)
  }

  if (method === 'DELETE') {
    let productId: number | undefined

    const query = getQuery(event)
    if (query.productId) {
      productId = Number(query.productId)
    } else {
      const body = await readBody(event).catch(() => null)
      if (body?.productId) {
        productId = Number(body.productId)
      }
    }

    const parsed = wishlistMutationSchema.safeParse({ productId })
    if (!parsed.success) {
      return errorResponse(event, 'ID produk tidak valid', parsed.error.flatten().fieldErrors, 400)
    }

    const { error } = await client
      .from('wishlists')
      .delete()
      .eq('user_id', targetUserId)
      .eq('product_id', parsed.data.productId)

    if (error) {
      return errorResponse(event, 'Gagal menghapus produk dari wishlist', error, 500)
    }

    return successResponse('Produk berhasil dihapus dari wishlist', {
      productId: parsed.data.productId,
    })
  }

  return errorResponse(event, 'Metode HTTP tidak didukung', null, 405)
})
