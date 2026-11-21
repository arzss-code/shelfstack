import { ref } from 'vue'
import type { AdminReviewItem, AdminReviewStatus } from '../../shared/schemas/review'
import { useUiToast } from './useUiToast'

export interface AdminReviewMetrics {
  total: number
  active: number
  hidden: number
  fiveStar: number
  attention: number
  averageRating: number
}

export function useAdminReviews() {
  const reviews = ref<AdminReviewItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const metrics = ref<AdminReviewMetrics>({
    total: 0,
    active: 0,
    hidden: 0,
    fiveStar: 0,
    attention: 0,
    averageRating: 5.0,
  })

  const pagination = ref({
    page: 1,
    limit: 15,
    totalCount: 0,
    totalPages: 1,
  })

  const ratingFilter = ref<number | undefined>(undefined)
  const statusFilter = ref<AdminReviewStatus>('all')
  const searchQuery = ref('')
  const mutatingId = ref<string | null>(null)

  const toast = useUiToast()

  const fetchReviews = async () => {
    loading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.value.page))
      params.set('limit', String(pagination.value.limit))
      params.set('status', statusFilter.value)

      if (ratingFilter.value) {
        params.set('rating', String(ratingFilter.value))
      }
      if (searchQuery.value.trim()) {
        params.set('q', searchQuery.value.trim())
      }

      const res = await $fetch<{
        success: boolean
        message: string
        data: {
          items: AdminReviewItem[]
          pagination: {
            page: number
            limit: number
            totalCount: number
            totalPages: number
          }
          metrics: AdminReviewMetrics
        }
      }>(`/api/admin/reviews?${params.toString()}`)

      if (res?.data) {
        reviews.value = res.data.items || []
        pagination.value = res.data.pagination || pagination.value
        metrics.value = res.data.metrics || metrics.value
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat ulasan pelanggan'
      error.value = msg
      toast.add({
        severity: 'error',
        summary: 'Gagal Memuat Ulasan',
        detail: msg,
        life: 4000,
      })
    } finally {
      loading.value = false
    }
  }

  const toggleReviewStatus = async (review: AdminReviewItem) => {
    const nextHidden = !review.deleted_at
    mutatingId.value = review.id

    try {
      const res = await $fetch<{
        success: boolean
        message: string
        data: { id: string; deleted_at: string | null }
      }>(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        body: { is_hidden: nextHidden },
      })

      if (res?.success) {
        review.deleted_at = res.data?.deleted_at ?? (nextHidden ? new Date().toISOString() : null)
        toast.add({
          severity: 'success',
          summary: nextHidden ? 'Ulasan Disembunyikan' : 'Ulasan Dipulihkan',
          detail: res.message || 'Status moderasi ulasan berhasil diperbarui',
          life: 3000,
        })
        await fetchReviews()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memoderasi status ulasan'
      toast.add({
        severity: 'error',
        summary: 'Gagal Memoderasi',
        detail: msg,
        life: 4000,
      })
    } finally {
      mutatingId.value = null
    }
  }

  const setPage = (page: number) => {
    pagination.value.page = page
    fetchReviews()
  }

  const setRating = (r?: number) => {
    ratingFilter.value = r
    pagination.value.page = 1
    fetchReviews()
  }

  const setStatus = (s: AdminReviewStatus) => {
    statusFilter.value = s
    pagination.value.page = 1
    fetchReviews()
  }

  const setSearch = (q: string) => {
    searchQuery.value = q
    pagination.value.page = 1
    fetchReviews()
  }

  return {
    reviews,
    loading,
    error,
    metrics,
    pagination,
    ratingFilter,
    statusFilter,
    searchQuery,
    mutatingId,
    fetchReviews,
    toggleReviewStatus,
    setPage,
    setRating,
    setStatus,
    setSearch,
  }
}
