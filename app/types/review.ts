export interface ProductReview {
  id: string
  product_id: number | string
  order_id: string
  user_id?: string
  user_name?: string
  reviewer_name?: string
  user_email?: string
  rating: number
  review_text: string
  created_at: string
  updated_at?: string
}

export interface ReviewRatingDistribution {
  star: number
  count: number
  percentage: number
}

export interface ProductReviewsSummary {
  average_rating: number
  total_reviews: number
  distribution: Record<number, number>
}

export interface ReviewEligibility {
  eligible: boolean
  reason?: 'not_authenticated' | 'no_completed_order' | 'already_reviewed' | string
  existing_review?: ProductReview | null
  order_id?: string | null
}

export interface ProductReviewsResponse {
  success?: boolean
  reviews: ProductReview[]
  summary: ProductReviewsSummary
  pagination?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}
