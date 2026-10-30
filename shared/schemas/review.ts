import { z } from 'zod'

export const reviewInputSchema = z.object({
  rating: z
    .number()
    .int('Rating harus berupa bilangan bulat.')
    .min(1, 'Rating minimal bernilai 1.')
    .max(5, 'Rating maksimal bernilai 5.'),
  review_text: z
    .string()
    .trim()
    .min(10, 'Ulasan minimal 10 karakter.')
    .max(1000, 'Ulasan maksimal 1000 karakter.'),
  order_id: z.string().uuid('ID pesanan tidak valid.'),
  order_item_id: z.string().uuid('ID item pesanan tidak valid.').optional().nullable(),
})

export type ReviewInput = z.infer<typeof reviewInputSchema>

export const reviewSortSchema = z.enum(['newest', 'highest', 'lowest'])
export type ReviewSortOption = z.infer<typeof reviewSortSchema>

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  sort: reviewSortSchema.default('newest'),
})

export type ReviewQuery = z.infer<typeof reviewQuerySchema>

/**
 * Format nama penilai secara bersih dan minimal:
 * - Mengambil nama depan dan inisial nama belakang (contoh: 'Budi Santoso' -> 'Budi S.')
 * - Menjaga privasi tanpa badge atau lencana berlebihan
 * - Fallback email: 'user@example.com' -> 'u***@example.com'
 * - Fallback default: 'Pengguna'
 */
export function formatReviewerName(fullName?: string | null, email?: string | null): string {
  const trimmedName = fullName?.trim()
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/).filter(Boolean)
    if (parts.length === 1 && parts[0]) {
      return parts[0]
    }
    if (parts.length > 1) {
      const firstName = parts[0]
      const lastPart = parts[parts.length - 1]
      if (firstName && lastPart) {
        const cleanLastChar = lastPart.replace(/[^a-zA-Z0-9]/g, '')
        const lastChar = cleanLastChar[0] || lastPart[0]
        const lastInitial = lastChar ? lastChar.toUpperCase() : ''
        if (lastInitial) {
          return `${firstName} ${lastInitial}.`
        }
        return firstName
      }
    }
  }

  const trimmedEmail = email?.trim()
  if (trimmedEmail && trimmedEmail.includes('@')) {
    const atIndex = trimmedEmail.indexOf('@')
    const username = trimmedEmail.slice(0, atIndex)
    const domain = trimmedEmail.slice(atIndex + 1)
    if (username.length > 0 && domain.length > 0) {
      return `${username[0]}***@${domain}`
    }
  }

  return 'Pengguna'
}

export interface ProductReviewItem {
  id: string
  product_id: number
  user_id: string
  order_id: string
  order_item_id: string | null
  rating: number
  review_text: string
  created_at: string
  updated_at: string
  reviewer_name: string
}

export interface ReviewDistribution {
  1: number
  2: number
  3: number
  4: number
  5: number
}

export interface ReviewStats {
  average_rating: number
  total_reviews: number
  distribution: ReviewDistribution
}

export interface ReviewEligibilityResponse {
  can_review: boolean
  existing_review: ProductReviewItem | null
  eligible_order_id: string | null
}

/**
 * Menghitung agregat statistik ulasan (rata-rata, total ulasan, dan sebaran bintang 1-5).
 */
export function calculateReviewStats(ratings: number[]): ReviewStats {
  const distribution: ReviewDistribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }

  if (ratings.length === 0) {
    return {
      average_rating: 5.0,
      total_reviews: 0,
      distribution,
    }
  }

  let sum = 0
  for (const rating of ratings) {
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof ReviewDistribution] += 1
      sum += rating
    }
  }

  const average_rating = Number((sum / ratings.length).toFixed(2))

  return {
    average_rating,
    total_reviews: ratings.length,
    distribution,
  }
}
