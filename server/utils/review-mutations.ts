import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import {
  calculateReviewStats,
  formatReviewerName,
  type ProductReviewItem,
  type ReviewInput,
} from '../../shared/schemas/review'

/**
 * Sinkronisasi pembaruan rating rata-rata dan total ulasan pada tabel products
 */
export async function syncProductRatingStats(
  client: SupabaseClient<Database>,
  productId: number,
): Promise<void> {
  const { data: reviews } = await client
    .from('product_reviews')
    .select('rating')
    .eq('product_id', productId)
    .is('deleted_at', null)

  const ratings = (reviews || []).map((r) => r.rating)
  const stats = calculateReviewStats(ratings)

  await client
    .from('products')
    .update({
      rating: stats.average_rating,
      review_count: stats.total_reviews,
    })
    .eq('id', productId)
}

/**
 * Menyimpan ulasan baru atau memperbarui ulasan yang telah dibuat sebelumnya.
 * Memvalidasi kepemilikan pesanan dan status 'completed'.
 */
export async function submitProductReview(
  client: SupabaseClient<Database>,
  params: {
    productId: number
    userId: string
    input: ReviewInput
  },
): Promise<ProductReviewItem> {
  const { productId, userId, input } = params

  // 1. Verifikasi pesanan: harus berstatus 'completed', dimiliki oleh user, dan memuat produk ini
  const { data: orderData, error: orderError } = await client
    .from('orders')
    .select('id, status, user_id, order_items(id, product_id)')
    .eq('id', input.order_id)
    .maybeSingle()

  if (orderError || !orderData) {
    throw new Error('Pesanan tidak ditemukan.')
  }

  if (orderData.user_id !== userId) {
    throw new Error('Anda tidak memiliki akses ke pesanan ini.')
  }

  if (orderData.status !== 'completed') {
    throw new Error('Ulasan hanya dapat diberikan untuk pesanan yang telah selesai.')
  }

  const items =
    (orderData.order_items as unknown as Array<{ id: string; product_id: number }>) || []
  const matchedItem = items.find((item) => Number(item.product_id) === productId)

  if (!matchedItem) {
    throw new Error('Produk tidak ditemukan dalam rincian pesanan ini.')
  }

  const orderItemId = input.order_item_id || matchedItem.id

  // 2. Periksa apakah sudah ada ulasan (baik aktif maupun soft-deleted)
  const { data: existingReview } = await client
    .from('product_reviews')
    .select('id, deleted_at')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .eq('order_id', input.order_id)
    .maybeSingle()

  let savedReviewId: string
  const now = new Date().toISOString()

  if (existingReview) {
    // Perbarui ulasan yang ada (pulihkan jika soft-deleted)
    const { data: updated, error: updateError } = await client
      .from('product_reviews')
      .update({
        rating: input.rating,
        review_text: input.review_text,
        order_item_id: orderItemId,
        updated_at: now,
        deleted_at: null,
      })
      .eq('id', existingReview.id)
      .select(
        'id, product_id, user_id, order_id, order_item_id, rating, review_text, created_at, updated_at',
      )
      .single()

    if (updateError || !updated) {
      throw updateError || new Error('Gagal memperbarui ulasan.')
    }
    savedReviewId = updated.id
  } else {
    // Buat ulasan baru
    const { data: inserted, error: insertError } = await client
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: userId,
        order_id: input.order_id,
        order_item_id: orderItemId,
        rating: input.rating,
        review_text: input.review_text,
        created_at: now,
        updated_at: now,
      })
      .select(
        'id, product_id, user_id, order_id, order_item_id, rating, review_text, created_at, updated_at',
      )
      .single()

    if (insertError || !inserted) {
      throw insertError || new Error('Gagal menyimpan ulasan.')
    }
    savedReviewId = inserted.id
  }

  // 3. Sinkronisasikan rating pada tabel products
  await syncProductRatingStats(client, productId)

  // 4. Ambil profil user untuk reviewer_name
  const { data: profile } = await client
    .from('profiles')
    .select('full_name')
    .eq('user_id', userId)
    .maybeSingle()

  return {
    id: savedReviewId,
    product_id: productId,
    user_id: userId,
    order_id: input.order_id,
    order_item_id: orderItemId,
    rating: input.rating,
    review_text: input.review_text,
    created_at: now,
    updated_at: now,
    reviewer_name: formatReviewerName(profile?.full_name),
  }
}

/**
 * Menghapus ulasan secara soft delete (mengisi kolom deleted_at).
 * Hanya pemilik ulasan atau admin yang berhak melakukan operasi ini.
 */
export async function deleteProductReview(
  client: SupabaseClient<Database>,
  params: {
    reviewId: string
    userId: string
    isAdmin: boolean
  },
): Promise<{ id: string }> {
  const { reviewId, userId, isAdmin } = params

  const { data: review, error: fetchError } = await client
    .from('product_reviews')
    .select('id, product_id, user_id, deleted_at')
    .eq('id', reviewId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError || !review) {
    throw new Error('Ulasan tidak ditemukan.')
  }

  if (review.user_id !== userId && !isAdmin) {
    throw new Error('Anda tidak memiliki wewenang untuk menghapus ulasan ini.')
  }

  const { error: deleteError } = await client
    .from('product_reviews')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', reviewId)

  if (deleteError) {
    throw deleteError
  }

  // Sinkronisasikan rating setelah ulasan dihapus
  await syncProductRatingStats(client, review.product_id)

  return { id: reviewId }
}
