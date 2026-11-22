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
  serviceClient?: SupabaseClient<Database>,
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
    const profileClient = serviceClient || client
    const { data: profiles } = await profileClient
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

export * from './review-mutations'
