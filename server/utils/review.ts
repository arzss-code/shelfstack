import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'
import {
  calculateReviewStats,
  formatReviewerName,
  type ProductReviewItem,
  type ReviewDistribution,
  type ReviewEligibilityResponse,
  type ReviewInput,
  type ReviewQuery,
  type ReviewStats,
} from '../../shared/schemas/review'

export { calculateReviewStats }
export type ProductReviewRow = Database['public']['Tables']['product_reviews']['Row']

/**
 * Menyelesaikan identifier produk (baik berupa ID numerik atau slug) menjadi ID numerik produk.
 */
export async function resolveProductId(
  client: SupabaseClient<Database>,
  identifier: string,
): Promise<number | null> {
  const trimmed = identifier.trim()
  if (!trimmed) return null

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed)
  }

  const { data: product } = await client
    .from('products')
    .select('id')
    .eq('slug', trimmed)
    .is('deleted_at', null)
    .maybeSingle()

  return product?.id ?? null
}

/**
 * Mengambil daftar ulasan produk aktif dengan paginasi, filter rating, opsi pengurutan,
 * dan nama penilai yang disanitasi/dimaskir secara elegan.
 */
export async function getProductReviews(
  client: SupabaseClient<Database>,
  productId: number,
  query: ReviewQuery,
): Promise<{
  reviews: ProductReviewItem[]
  stats: ReviewStats
  pagination: {
    page: number
    limit: number
    total_items: number
    total_pages: number
  }
}> {
  // 1. Ambil seluruh rating aktif untuk menghitung statistik agregat secara akurat
  const { data: allActiveReviews } = await client
    .from('product_reviews')
    .select('rating')
    .eq('product_id', productId)
    .is('deleted_at', null)

  const ratings = (allActiveReviews || []).map((row) => row.rating)
  const stats = calculateReviewStats(ratings)

  // 2. Bangun query untuk daftar ulasan terpaginasi
  let dbQuery = client
    .from('product_reviews')
    .select(
      'id, product_id, user_id, order_id, order_item_id, rating, review_text, created_at, updated_at',
      { count: 'exact' },
    )
    .eq('product_id', productId)
    .is('deleted_at', null)

  if (query.rating) {
    dbQuery = dbQuery.eq('rating', query.rating)
  }

  if (query.sort === 'highest') {
    dbQuery = dbQuery
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
  } else if (query.sort === 'lowest') {
    dbQuery = dbQuery.order('rating', { ascending: true }).order('created_at', { ascending: false })
  } else {
    // Default 'newest'
    dbQuery = dbQuery.order('created_at', { ascending: false })
  }

  const offset = (query.page - 1) * query.limit
  const { data: reviewsData, count, error } = await dbQuery.range(offset, offset + query.limit - 1)

  if (error) {
    throw error
  }

  const items = reviewsData || []
  const totalItems = count ?? items.length
  const totalPages = Math.ceil(totalItems / query.limit) || 1

  // 3. Ambil data profil reviewer untuk memformat nama penilai secara bersih
  const userIds = Array.from(new Set(items.map((item) => item.user_id)))
  const nameMap = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: profiles } = await client
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds)

    if (profiles) {
      for (const profile of profiles) {
        if (profile.user_id) {
          nameMap.set(profile.user_id, formatReviewerName(profile.full_name))
        }
      }
    }
  }

  const reviews: ProductReviewItem[] = items.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    user_id: item.user_id,
    order_id: item.order_id,
    order_item_id: item.order_item_id,
    rating: item.rating,
    review_text: item.review_text,
    created_at: item.created_at,
    updated_at: item.updated_at,
    reviewer_name: nameMap.get(item.user_id) || formatReviewerName(null, null),
  }))

  return {
    reviews,
    stats,
    pagination: {
      page: query.page,
      limit: query.limit,
      total_items: totalItems,
      total_pages: totalPages,
    },
  }
}

/**
 * Memeriksa kelayakan pengguna untuk memberikan ulasan pada suatu produk:
 * - Wajib memiliki pesanan dengan status 'completed' yang memuat produk terkait.
 * - Memeriksa apakah pengguna telah mengirim ulasan sebelumnya.
 */
export async function checkReviewEligibility(
  client: SupabaseClient<Database>,
  productId: number,
  userId: string,
): Promise<ReviewEligibilityResponse> {
  // 1. Cek apakah ada ulasan aktif yang sudah dibuat oleh user untuk produk ini
  const { data: existingReviewData } = await client
    .from('product_reviews')
    .select(
      'id, product_id, user_id, order_id, order_item_id, rating, review_text, created_at, updated_at',
    )
    .eq('product_id', productId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (existingReviewData) {
    // Ambil profil nama penilai
    const { data: profile } = await client
      .from('profiles')
      .select('full_name')
      .eq('user_id', userId)
      .maybeSingle()

    const formattedReview: ProductReviewItem = {
      id: existingReviewData.id,
      product_id: existingReviewData.product_id,
      user_id: existingReviewData.user_id,
      order_id: existingReviewData.order_id,
      order_item_id: existingReviewData.order_item_id,
      rating: existingReviewData.rating,
      review_text: existingReviewData.review_text,
      created_at: existingReviewData.created_at,
      updated_at: existingReviewData.updated_at,
      reviewer_name: formatReviewerName(profile?.full_name),
    }

    return {
      can_review: false,
      existing_review: formattedReview,
      eligible_order_id: null,
    }
  }

  // 2. Cari pesanan berstatus 'completed' milik user yang memuat produk ini
  const { data: completedOrders } = await client
    .from('orders')
    .select('id, order_items(id, product_id)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (!completedOrders || completedOrders.length === 0) {
    return {
      can_review: false,
      existing_review: null,
      eligible_order_id: null,
    }
  }

  // Temukan order pertama yang memuat productId
  for (const order of completedOrders) {
    const items = (order.order_items as unknown as Array<{ id: string; product_id: number }>) || []
    const matchingItem = items.find((item) => Number(item.product_id) === productId)
    if (matchingItem) {
      return {
        can_review: true,
        existing_review: null,
        eligible_order_id: order.id,
      }
    }
  }

  return {
    can_review: false,
    existing_review: null,
    eligible_order_id: null,
  }
}

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
