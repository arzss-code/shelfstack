import { describe, expect, it } from 'vitest'
import {
  calculateReviewStats,
  formatReviewerName,
  reviewInputSchema,
  reviewQuerySchema,
} from '../../shared/schemas/review'

describe('formatReviewerName Unit Tests', () => {
  it('memformat nama lengkap menjadi nama depan dan inisial nama belakang', () => {
    expect(formatReviewerName('Budi Santoso')).toBe('Budi S.')
    expect(formatReviewerName('Atsiila Aisyah')).toBe('Atsiila A.')
    expect(formatReviewerName('John Doe')).toBe('John D.')
    expect(formatReviewerName('Muhammad Fadli Rahman')).toBe('Muhammad R.')
  })

  it('mempertahankan nama tunggal tanpa inisial tambahan', () => {
    expect(formatReviewerName('Budi')).toBe('Budi')
    expect(formatReviewerName('Atsiila')).toBe('Atsiila')
  })

  it('menangani nama yang sudah memiliki inisial di akhir', () => {
    expect(formatReviewerName('Budi S.')).toBe('Budi S.')
  })

  it('menggunakan fallback masking email jika nama kosong atau null', () => {
    expect(formatReviewerName(null, 'budi.santoso@example.com')).toBe('b***@example.com')
    expect(formatReviewerName('', 'user@domain.id')).toBe('u***@domain.id')
    expect(formatReviewerName('   ', 'customer123@gmail.com')).toBe('c***@gmail.com')
  })

  it('menggunakan fallback Pengguna jika nama dan email tidak tersedia', () => {
    expect(formatReviewerName(null, null)).toBe('Pengguna')
    expect(formatReviewerName('', '')).toBe('Pengguna')
    expect(formatReviewerName('   ', '   ')).toBe('Pengguna')
    expect(formatReviewerName(undefined, undefined)).toBe('Pengguna')
  })
})

describe('reviewInputSchema Validation Tests', () => {
  const validPayload = {
    rating: 5,
    review_text: 'Produk sangat berkualitas, packing rapi dan pengiriman cepat.',
    order_id: 'e1234567-e89b-12d3-a456-426614174000',
  }

  it('menerima payload ulasan yang valid', () => {
    const result = reviewInputSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rating).toBe(5)
      expect(result.data.order_id).toBe('e1234567-e89b-12d3-a456-426614174000')
    }
  })

  it('menerima ulasan dengan order_item_id opsional yang valid', () => {
    const payloadWithItem = {
      ...validPayload,
      order_item_id: 'f1234567-e89b-12d3-a456-426614174001',
    }
    const result = reviewInputSchema.safeParse(payloadWithItem)
    expect(result.success).toBe(true)
  })

  it('menolak rating di luar batas 1 sampai 5 atau bukan integer', () => {
    expect(reviewInputSchema.safeParse({ ...validPayload, rating: 0 }).success).toBe(false)
    expect(reviewInputSchema.safeParse({ ...validPayload, rating: 6 }).success).toBe(false)
    expect(reviewInputSchema.safeParse({ ...validPayload, rating: 4.5 }).success).toBe(false)
    expect(reviewInputSchema.safeParse({ ...validPayload, rating: -1 }).success).toBe(false)
    expect(reviewInputSchema.safeParse({ ...validPayload, rating: '5' }).success).toBe(false)
  })

  it('menolak ulasan dengan teks kurang dari 10 karakter', () => {
    expect(reviewInputSchema.safeParse({ ...validPayload, review_text: 'Bagus' }).success).toBe(
      false,
    )
    expect(reviewInputSchema.safeParse({ ...validPayload, review_text: '123456789' }).success).toBe(
      false,
    )
    expect(
      reviewInputSchema.safeParse({ ...validPayload, review_text: '   123456789   ' }).success,
    ).toBe(false)
  })

  it('menerima ulasan dengan teks tepat 10 karakter', () => {
    const result = reviewInputSchema.safeParse({
      ...validPayload,
      review_text: 'Sangat oke',
    })
    expect(result.success).toBe(true)
  })

  it('menolak ulasan dengan teks melebihi 1000 karakter', () => {
    const longText = 'A'.repeat(1001)
    expect(reviewInputSchema.safeParse({ ...validPayload, review_text: longText }).success).toBe(
      false,
    )
  })

  it('menolak order_id yang bukan berformat UUID valid', () => {
    expect(
      reviewInputSchema.safeParse({ ...validPayload, order_id: 'bukan-uuid-valid' }).success,
    ).toBe(false)
    expect(reviewInputSchema.safeParse({ ...validPayload, order_id: '' }).success).toBe(false)
  })
})

describe('reviewQuerySchema Validation Tests', () => {
  it('menggunakan nilai default untuk parameter query', () => {
    const parsed = reviewQuerySchema.safeParse({})
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.page).toBe(1)
      expect(parsed.data.limit).toBe(10)
      expect(parsed.data.sort).toBe('newest')
      expect(parsed.data.rating).toBeUndefined()
    }
  })

  it('menerima konfigurasi filter dan opsi pengurutan valid', () => {
    const parsed = reviewQuerySchema.safeParse({
      page: '2',
      limit: '25',
      rating: '4',
      sort: 'highest',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.page).toBe(2)
      expect(parsed.data.limit).toBe(25)
      expect(parsed.data.rating).toBe(4)
      expect(parsed.data.sort).toBe('highest')
    }
  })

  it('menolak opsi sort yang tidak dikenali', () => {
    const parsed = reviewQuerySchema.safeParse({ sort: 'random_order' })
    expect(parsed.success).toBe(false)
  })
})

describe('calculateReviewStats Tests', () => {
  it('mengembalikan nilai default rating 5.0 jika belum ada ulasan', () => {
    const stats = calculateReviewStats([])
    expect(stats.average_rating).toBe(5.0)
    expect(stats.total_reviews).toBe(0)
    expect(stats.distribution[1]).toBe(0)
    expect(stats.distribution[5]).toBe(0)
  })

  it('menghitung rata-rata dan distribusi ulasan secara presisi', () => {
    const ratings = [5, 5, 4, 3, 1]
    const stats = calculateReviewStats(ratings)
    // Sum = 18, count = 5 -> average = 3.6
    expect(stats.average_rating).toBe(3.6)
    expect(stats.total_reviews).toBe(5)
    expect(stats.distribution[5]).toBe(2)
    expect(stats.distribution[4]).toBe(1)
    expect(stats.distribution[3]).toBe(1)
    expect(stats.distribution[2]).toBe(0)
    expect(stats.distribution[1]).toBe(1)
  })
})
