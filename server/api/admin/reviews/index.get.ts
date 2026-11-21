import { defineEventHandler, getQuery } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import {
  adminReviewQuerySchema,
  formatReviewerName,
  type AdminReviewItem,
} from '../../../../shared/schemas/review'
import { requireAdmin } from '../../../utils/auth'
import { errorResponse, successResponse } from '../../../utils/response'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rawQuery = getQuery(event)
  const parsed = adminReviewQuerySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return errorResponse(event, 'Parameter query ulasan tidak valid', parsed.error.flatten(), 400)
  }

  const { page, limit, rating, status, q } = parsed.data
  const from = (page - 1) * limit
  const to = from + limit - 1

  const client = serverSupabaseServiceRole<Database>(event)

  let dbQuery = client
    .from('product_reviews')
    .select(
      'id, product_id, user_id, order_id, order_item_id, rating, review_text, created_at, updated_at, deleted_at, products(id, name, image_url), profiles(id, full_name, email)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (status === 'active') {
    dbQuery = dbQuery.is('deleted_at', null)
  } else if (status === 'hidden') {
    dbQuery = dbQuery.not('deleted_at', 'is', null)
  }

  if (rating) {
    dbQuery = dbQuery.eq('rating', rating)
  }

  if (q) {
    const safeTerm = q.replace(/[,()%_\\]/g, ' ').trim()
    if (safeTerm) {
      dbQuery = dbQuery.ilike('review_text', `%${safeTerm}%`)
    }
  }

  const { data, count, error } = await dbQuery.range(from, to)

  if (error) {
    return errorResponse(event, 'Gagal memuat daftar ulasan', error.message, 500)
  }

  const { data: allReviews } = await client.from('product_reviews').select('rating, deleted_at')

  const totalReviews = allReviews?.length || 0
  const activeReviews = allReviews?.filter((r) => !r.deleted_at).length || 0
  const hiddenReviews = allReviews?.filter((r) => r.deleted_at).length || 0
  const fiveStarReviews = allReviews?.filter((r) => !r.deleted_at && r.rating === 5).length || 0
  const attentionReviews = allReviews?.filter((r) => !r.deleted_at && r.rating <= 3).length || 0

  const activeRatings = allReviews?.filter((r) => !r.deleted_at).map((r) => r.rating) || []
  const avgRating =
    activeRatings.length > 0
      ? Number((activeRatings.reduce((a, b) => a + b, 0) / activeRatings.length).toFixed(2))
      : 5.0

  type RawReviewRow = {
    id: string
    product_id: number
    user_id: string
    order_id: string
    order_item_id: string | null
    rating: number
    review_text: string
    created_at: string
    updated_at: string
    deleted_at: string | null
    products: { id: number; name: string; image_url: string | null } | null
    profiles: { id: string; full_name: string | null; email: string | null } | null
  }

  const items: AdminReviewItem[] = ((data as unknown as RawReviewRow[]) || []).map((row) => ({
    id: row.id,
    product_id: row.product_id,
    user_id: row.user_id,
    order_id: row.order_id,
    order_item_id: row.order_item_id,
    rating: row.rating,
    review_text: row.review_text,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    product_name: row.products?.name || `Produk #${row.product_id}`,
    product_image_url: row.products?.image_url || null,
    reviewer_email: row.profiles?.email || null,
    reviewer_name: formatReviewerName(row.profiles?.full_name, row.profiles?.email),
  }))

  const totalCount = count ?? (data?.length || 0)
  const totalPages = Math.ceil(totalCount / limit) || 1

  return successResponse('Daftar ulasan produk berhasil dimuat', {
    items,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
    },
    metrics: {
      total: totalReviews,
      active: activeReviews,
      hidden: hiddenReviews,
      fiveStar: fiveStarReviews,
      attention: attentionReviews,
      averageRating: avgRating,
    },
  })
})
