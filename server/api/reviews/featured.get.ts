import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { formatReviewerName } from '../../../shared/schemas/review'
import { errorResponse, successResponse } from '../../utils/response'

export interface FeaturedReviewItem {
  id: string
  product_id: number
  product_name: string
  product_slug: string | null
  product_image_url: string | null
  rating: number
  review_text: string
  reviewer_name: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

  try {
    // 1. Ambil ulasan produk berating tinggi (>= 4) yang aktif (deleted_at IS NULL)
    const { data: reviewsData, error: reviewsError } = await client
      .from('product_reviews')
      .select('id, product_id, user_id, rating, review_text, created_at')
      .is('deleted_at', null)
      .gte('rating', 4)
      .order('rating', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6)

    if (reviewsError) {
      throw reviewsError
    }

    if (!reviewsData || reviewsData.length === 0) {
      return successResponse('Ulasan unggulan kosong.', [])
    }

    // 2. Ambil metadata produk terkait
    const productIds = Array.from(new Set(reviewsData.map((r) => r.product_id)))
    const { data: products } = await client
      .from('products')
      .select('id, name, slug, image_url')
      .in('id', productIds)
      .is('deleted_at', null)

    const productMap = new Map<
      number,
      { name: string; slug: string | null; image_url: string | null }
    >()
    if (products) {
      for (const p of products) {
        productMap.set(p.id, {
          name: p.name,
          slug: p.slug ?? null,
          image_url: p.image_url ?? null,
        })
      }
    }

    // 3. Ambil data profil reviewer untuk memformat nama penilai secara bersih
    const userIds = Array.from(new Set(reviewsData.map((r) => r.user_id)))
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

    const featuredReviews: FeaturedReviewItem[] = reviewsData.map((item) => {
      const product = productMap.get(item.product_id)
      return {
        id: item.id,
        product_id: item.product_id,
        product_name: product?.name || 'Produk ShelfStack',
        product_slug: product?.slug || null,
        product_image_url: product?.image_url || null,
        rating: item.rating,
        review_text: item.review_text,
        reviewer_name: nameMap.get(item.user_id) || formatReviewerName(null, null),
        created_at: item.created_at,
      }
    })

    return successResponse('Ulasan unggulan berhasil dimuat.', featuredReviews)
  } catch (error) {
    return errorResponse(event, 'Gagal memuat ulasan unggulan.', error, 500)
  }
})
