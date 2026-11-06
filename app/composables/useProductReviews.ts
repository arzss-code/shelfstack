import { computed, onMounted, ref } from 'vue'
import { useUiConfirm } from '~/composables/useUiConfirm'
import { useUiToast } from '~/composables/useUiToast'
import type {
  ProductReview,
  ProductReviewsResponse,
  ProductReviewsSummary,
  ReviewEligibility,
} from '~/types/review'

export function useProductReviews(getProductId: () => number | string) {
  const toast = useUiToast()
  const confirm = useUiConfirm()
  const user = useSupabaseUser()

  const reviews = ref<ProductReview[]>([])
  const summary = ref<ProductReviewsSummary>({
    average_rating: 0,
    total_reviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  })
  const eligibility = ref<ReviewEligibility>({ eligible: false })

  const selectedStar = ref<number | null>(null)
  const selectedSort = ref<'newest' | 'highest' | 'lowest'>('newest')
  const isLoading = ref(true)
  const isLoadingMore = ref(false)
  const page = ref(1)
  const hasMore = ref(false)
  const isModalOpen = ref(false)
  const isAuthenticated = computed(() => Boolean(user?.value))

  const fetchSummary = async () => {
    try {
      const res = await $fetch<{
        success?: boolean
        data?: { summary?: ProductReviewsSummary }
        summary?: ProductReviewsSummary
      }>(`/api/products/${getProductId()}/reviews?limit=1`)
      const rawSummary = res?.data?.summary || res?.summary
      if (rawSummary) {
        summary.value = {
          average_rating: Number(rawSummary.average_rating) || 0,
          total_reviews: Number(rawSummary.total_reviews) || 0,
          distribution: rawSummary.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        }
      }
    } catch {
      // Summary fallback handled gracefully
    }
  }

  const fetchReviews = async (isAppend = false) => {
    if (isAppend) {
      isLoadingMore.value = true
    } else {
      isLoading.value = true
    }

    try {
      const params: Record<string, string | number> = {
        page: page.value,
        limit: 6,
        sort: selectedSort.value,
      }
      if (selectedStar.value) {
        params.star = selectedStar.value
      }

      const res = await $fetch<
        ProductReviewsResponse | { success: boolean; data: ProductReviewsResponse }
      >(`/api/products/${getProductId()}/reviews`, { params })

      const payload = 'data' in res && res.data ? res.data : (res as ProductReviewsResponse)
      const fetchedReviews = payload.reviews || []

      if (isAppend) {
        reviews.value = [...reviews.value, ...fetchedReviews]
      } else {
        reviews.value = fetchedReviews
      }

      if (payload.summary && !selectedStar.value) {
        summary.value = {
          average_rating: Number(payload.summary.average_rating) || 0,
          total_reviews: Number(payload.summary.total_reviews) || 0,
          distribution: payload.summary.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        }
      }

      const totalInFilter = payload.pagination?.total ?? fetchedReviews.length
      hasMore.value = reviews.value.length < totalInFilter
    } catch {
      if (!isAppend) {
        reviews.value = []
      }
    } finally {
      isLoading.value = false
      isLoadingMore.value = false
    }
  }

  const checkEligibility = async () => {
    if (!isAuthenticated.value) {
      eligibility.value = { eligible: false, reason: 'not_authenticated' }
      return
    }

    try {
      const res = await $fetch<{ success?: boolean; data?: ReviewEligibility } | ReviewEligibility>(
        `/api/products/${getProductId()}/reviews/eligibility`,
      )
      const data = 'data' in res && res.data ? res.data : (res as ReviewEligibility)
      eligibility.value = {
        eligible: Boolean(data?.eligible),
        reason: data?.reason,
        existing_review: data?.existing_review || null,
        order_id: data?.order_id || null,
      }
    } catch {
      eligibility.value = { eligible: false }
    }
  }

  const refreshAll = async () => {
    page.value = 1
    await Promise.all([fetchReviews(), checkEligibility(), fetchSummary()])
  }

  onMounted(() => {
    refreshAll()
  })

  const handleSelectStar = (star: number | null) => {
    selectedStar.value = selectedStar.value === star ? null : star
    page.value = 1
    fetchReviews()
  }

  const handleSortChange = (sort: 'newest' | 'highest' | 'lowest') => {
    selectedSort.value = sort
    page.value = 1
    fetchReviews()
  }

  const handleLoadMore = () => {
    page.value++
    fetchReviews(true)
  }

  const openCreateModal = () => {
    isModalOpen.value = true
  }

  const handleDeleteReview = () => {
    if (!eligibility.value.existing_review?.id) return

    confirm.require({
      header: 'Hapus Ulasan',
      message: 'Apakah Anda yakin ingin menghapus ulasan untuk produk ini?',
      tone: 'danger',
      acceptLabel: 'Hapus',
      rejectLabel: 'Batal',
      accept: async () => {
        try {
          await $fetch(
            `/api/products/${getProductId()}/reviews/${eligibility.value.existing_review?.id}`,
            {
              method: 'DELETE',
            },
          )
          toast.show({
            severity: 'success',
            summary: 'Ulasan Dihapus',
            message: 'Ulasan Anda berhasil dihapus.',
          })
          await refreshAll()
        } catch (err: unknown) {
          const errorData = err as { data?: { message?: string }; message?: string }
          toast.show({
            severity: 'error',
            summary: 'Gagal Menghapus',
            message: errorData?.data?.message || errorData?.message || 'Gagal menghapus ulasan.',
          })
        }
      },
    })
  }

  return {
    reviews,
    summary,
    eligibility,
    selectedStar,
    selectedSort,
    isLoading,
    isLoadingMore,
    hasMore,
    isModalOpen,
    isAuthenticated,
    refreshAll,
    handleSelectStar,
    handleSortChange,
    handleLoadMore,
    openCreateModal,
    handleDeleteReview,
  }
}
