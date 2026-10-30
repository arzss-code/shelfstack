import { describe, expect, it, vi } from 'vitest'
import {
  checkReviewEligibility,
  deleteProductReview,
  getProductReviews,
  submitProductReview,
  syncProductRatingStats,
} from '../../server/utils/review'
import type { ReviewQuery } from '../../shared/schemas/review'

describe('Product Reviews API & Server Utilities Unit Tests', () => {
  const mockProductId = 42
  const mockUserId = 'e4b95f20-9477-4402-9993-9c8e2f89d001'
  const mockOrderId = 'a1234567-e89b-12d3-a456-426614174000'
  const mockOrderItemId = 'b1234567-e89b-12d3-a456-426614174001'

  describe('getProductReviews', () => {
    it('mengambil ulasan aktif, memformat nama reviewer, dan menghitung statistik rating', async () => {
      const mockReviewsData = [
        {
          id: 'rev-1',
          product_id: mockProductId,
          user_id: mockUserId,
          order_id: mockOrderId,
          order_item_id: mockOrderItemId,
          rating: 5,
          review_text: 'Kualitas barang luar biasa, finishing sangat halus.',
          created_at: '2026-10-28T10:00:00.000Z',
          updated_at: '2026-10-28T10:00:00.000Z',
        },
        {
          id: 'rev-2',
          product_id: mockProductId,
          user_id: 'user-2-uuid',
          order_id: 'order-2-uuid',
          order_item_id: 'item-2-uuid',
          rating: 4,
          review_text: 'Pengiriman agak terlambat sedikit tapi produk sangat baik.',
          created_at: '2026-10-27T08:00:00.000Z',
          updated_at: '2026-10-27T08:00:00.000Z',
        },
      ]

      const mockProfilesData = [
        { user_id: mockUserId, full_name: 'Budi Santoso' },
        { user_id: 'user-2-uuid', full_name: 'Atsiila Aisyah' },
      ]

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'product_reviews') {
            return {
              select: vi.fn((fields: string) => {
                if (fields === 'rating') {
                  // Query untuk allActiveReviews
                  return {
                    eq: vi.fn().mockReturnValue({
                      is: vi.fn().mockResolvedValue({
                        data: [{ rating: 5 }, { rating: 4 }],
                      }),
                    }),
                  }
                }
                // Query ulasan terpaginasi
                return {
                  eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        range: vi.fn().mockResolvedValue({
                          data: mockReviewsData,
                          count: 2,
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }
              }),
            }
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: mockProfilesData,
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const query: ReviewQuery = {
        page: 1,
        limit: 10,
        sort: 'newest',
      }

      const result = await getProductReviews(mockClient, mockProductId, query)

      expect(result.reviews).toHaveLength(2)
      expect(result.reviews[0].reviewer_name).toBe('Budi S.')
      expect(result.reviews[1].reviewer_name).toBe('Atsiila A.')
      expect(result.stats.total_reviews).toBe(2)
      expect(result.stats.average_rating).toBe(4.5)
      expect(result.stats.distribution[5]).toBe(1)
      expect(result.stats.distribution[4]).toBe(1)

      // Verifikasi prinsip anti-slop: tidak menyertakan lencana verifikasi murahan
      expect((result.reviews[0] as any).is_verified).toBeUndefined()
      expect((result.reviews[0] as any).badge).toBeUndefined()
    })
  })

  describe('checkReviewEligibility', () => {
    it('mengembalikan can_review = false jika pengguna sudah pernah mengirim ulasan', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'product_reviews') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: {
                            id: 'rev-existing',
                            product_id: mockProductId,
                            user_id: mockUserId,
                            order_id: mockOrderId,
                            order_item_id: mockOrderItemId,
                            rating: 5,
                            review_text: 'Ulasan saya sebelumnya.',
                            created_at: '2026-10-25T00:00:00Z',
                            updated_at: '2026-10-25T00:00:00Z',
                          },
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { full_name: 'Budi Santoso' },
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const eligibility = await checkReviewEligibility(mockClient, mockProductId, mockUserId)

      expect(eligibility.can_review).toBe(false)
      expect(eligibility.existing_review).toBeDefined()
      expect(eligibility.existing_review?.reviewer_name).toBe('Budi S.')
      expect(eligibility.eligible_order_id).toBeNull()
    })

    it('mengembalikan can_review = true dengan eligible_order_id jika memiliki pesanan completed', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'product_reviews') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: mockOrderId,
                          order_items: [{ id: mockOrderItemId, product_id: mockProductId }],
                        },
                      ],
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const eligibility = await checkReviewEligibility(mockClient, mockProductId, mockUserId)

      expect(eligibility.can_review).toBe(true)
      expect(eligibility.existing_review).toBeNull()
      expect(eligibility.eligible_order_id).toBe(mockOrderId)
    })

    it('mengembalikan can_review = false jika tidak ada pesanan completed yang memuat produk', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'product_reviews') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                      }),
                    }),
                  }),
                }),
              }),
            }
          }
          if (table === 'orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [],
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const eligibility = await checkReviewEligibility(mockClient, mockProductId, mockUserId)

      expect(eligibility.can_review).toBe(false)
      expect(eligibility.eligible_order_id).toBeNull()
    })
  })

  describe('submitProductReview', () => {
    it('menolak pengiriman ulasan jika pesanan belum berstatus completed', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: mockOrderId,
                      user_id: mockUserId,
                      status: 'shipped', // Belum completed
                      order_items: [{ id: mockOrderItemId, product_id: mockProductId }],
                    },
                    error: null,
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      await expect(
        submitProductReview(mockClient, {
          productId: mockProductId,
          userId: mockUserId,
          input: {
            rating: 5,
            review_text: 'Produk sudah sampai dengan aman dan cepat.',
            order_id: mockOrderId,
          },
        }),
      ).rejects.toThrow('Ulasan hanya dapat diberikan untuk pesanan yang telah selesai.')
    })

    it('menolak ulasan jika pesanan bukan milik pengguna yang login', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: mockOrderId,
                      user_id: 'other-user-uuid',
                      status: 'completed',
                      order_items: [{ id: mockOrderItemId, product_id: mockProductId }],
                    },
                    error: null,
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      await expect(
        submitProductReview(mockClient, {
          productId: mockProductId,
          userId: mockUserId,
          input: {
            rating: 5,
            review_text: 'Produk sudah sampai dengan aman dan cepat.',
            order_id: mockOrderId,
          },
        }),
      ).rejects.toThrow('Anda tidak memiliki akses ke pesanan ini.')
    })

    it('menyimpan ulasan baru dan memperbarui agregat rating produk', async () => {
      const mockInsertedReview = {
        id: 'rev-new-id',
        product_id: mockProductId,
        user_id: mockUserId,
        order_id: mockOrderId,
        order_item_id: mockOrderItemId,
        rating: 5,
        review_text: 'Barang asli dan bekerja dengan sangat baik.',
        created_at: '2026-10-30T10:00:00Z',
        updated_at: '2026-10-30T10:00:00Z',
      }

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'orders') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: mockOrderId,
                      user_id: mockUserId,
                      status: 'completed',
                      order_items: [{ id: mockOrderItemId, product_id: mockProductId }],
                    },
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'product_reviews') {
            return {
              select: vi.fn((fields: string) => {
                if (fields === 'rating') {
                  return {
                    eq: vi.fn().mockReturnValue({
                      is: vi.fn().mockResolvedValue({ data: [{ rating: 5 }] }),
                    }),
                  }
                }
                return {
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      eq: vi.fn().mockReturnValue({
                        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                      }),
                    }),
                  }),
                }
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockInsertedReview,
                    error: null,
                  }),
                }),
              }),
            }
          }
          if (table === 'products') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { full_name: 'Budi Santoso' },
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      const result = await submitProductReview(mockClient, {
        productId: mockProductId,
        userId: mockUserId,
        input: {
          rating: 5,
          review_text: 'Barang asli dan bekerja dengan sangat baik.',
          order_id: mockOrderId,
        },
      })

      expect(result.id).toBe('rev-new-id')
      expect(result.rating).toBe(5)
      expect(result.reviewer_name).toBe('Budi S.')
    })
  })

  describe('deleteProductReview', () => {
    it('memungkinkan pemilik ulasan melakukan soft-delete', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'product_reviews') {
            return {
              select: vi.fn((fields: string) => {
                if (fields === 'rating') {
                  return {
                    eq: vi.fn().mockReturnValue({
                      is: vi.fn().mockResolvedValue({ data: [] }),
                    }),
                  }
                }
                return {
                  eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: 'rev-to-delete',
                          product_id: mockProductId,
                          user_id: mockUserId,
                          deleted_at: null,
                        },
                        error: null,
                      }),
                    }),
                  }),
                }
              }),
              update: mockUpdate,
            }
          }
          if (table === 'products') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }
          }
          return {}
        }),
      } as any

      const res = await deleteProductReview(mockClient, {
        reviewId: 'rev-to-delete',
        userId: mockUserId,
        isAdmin: false,
      })

      expect(res.id).toBe('rev-to-delete')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        }),
      )
    })

    it('memungkinkan admin melakukan soft-delete ulasan pengguna lain', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'product_reviews') {
            return {
              select: vi.fn((fields: string) => {
                if (fields === 'rating') {
                  return {
                    eq: vi.fn().mockReturnValue({
                      is: vi.fn().mockResolvedValue({ data: [] }),
                    }),
                  }
                }
                return {
                  eq: vi.fn().mockReturnValue({
                    is: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: {
                          id: 'rev-other-user',
                          product_id: mockProductId,
                          user_id: 'other-user-id',
                          deleted_at: null,
                        },
                        error: null,
                      }),
                    }),
                  }),
                }
              }),
              update: mockUpdate,
            }
          }
          if (table === 'products') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }
          }
          return {}
        }),
      } as any

      const res = await deleteProductReview(mockClient, {
        reviewId: 'rev-other-user',
        userId: 'admin-uuid',
        isAdmin: true,
      })

      expect(res.id).toBe('rev-other-user')
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('menolak penghapusan oleh pengguna lain yang bukan pemilik dan bukan admin', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'product_reviews') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: 'rev-alice',
                        product_id: mockProductId,
                        user_id: 'alice-id',
                        deleted_at: null,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }
          }
          return {}
        }),
      } as any

      await expect(
        deleteProductReview(mockClient, {
          reviewId: 'rev-alice',
          userId: 'bob-id',
          isAdmin: false,
        }),
      ).rejects.toThrow('Anda tidak memiliki wewenang untuk menghapus ulasan ini.')
    })
  })

  describe('syncProductRatingStats', () => {
    it('memperbarui tabel products dengan rating rata-rata dan total ulasan', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'product_reviews') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  is: vi.fn().mockResolvedValue({
                    data: [{ rating: 5 }, { rating: 3 }],
                  }),
                }),
              }),
            }
          }
          if (table === 'products') {
            return {
              update: mockUpdate,
            }
          }
          return {}
        }),
      } as any

      await syncProductRatingStats(mockClient, mockProductId)

      expect(mockUpdate).toHaveBeenCalledWith({
        rating: 4.0,
        review_count: 2,
      })
    })
  })
})
