<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUiConfirm } from '~/composables/useUiConfirm'
import { useUiToast } from '~/composables/useUiToast'
import type {
  ProductReview,
  ProductReviewsResponse,
  ProductReviewsSummary,
  ReviewEligibility,
} from '~/types/review'
import ReviewCard from '~/components/product/ReviewCard.vue'
import ReviewEligibilityCard from '~/components/product/ReviewEligibilityCard.vue'
import ReviewFilterBar from '~/components/product/ReviewFilterBar.vue'
import ReviewFormModal from '~/components/product/ReviewFormModal.vue'
import ReviewRatingSummary from '~/components/product/ReviewRatingSummary.vue'

const props = defineProps<{
  productId: number | string
  productName: string
}>()

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
    }>(`/api/products/${props.productId}/reviews?limit=1`)
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
    >(`/api/products/${props.productId}/reviews`, { params })

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
      `/api/products/${props.productId}/reviews/eligibility`,
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
          `/api/products/${props.productId}/reviews/${eligibility.value.existing_review?.id}`,
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
</script>

<template>
  <section id="reviews" class="scroll-mt-8 space-y-8 pt-10 border-t border-brand-hairsoft">
    <!-- Header with total count -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl font-bold text-brand-ink m-0">Ulasan Pelanggan</h2>
        <p class="font-body text-xs text-brand-muted m-0 mt-1">
          Pengalaman nyata dari pembeli resmi ShelfStack ({{ summary.total_reviews }} ulasan)
        </p>
      </div>

      <UiButton
        v-if="eligibility.eligible && !eligibility.existing_review"
        variant="primary"
        size="sm"
        icon="pi-pencil"
        @click="openCreateModal"
      >
        Tulis Ulasan Produk
      </UiButton>
    </div>

    <!-- Rating Summary Bento Card -->
    <ReviewRatingSummary
      :summary="summary"
      :selected-star="selectedStar"
      @select-star="handleSelectStar"
    />

    <!-- Review Submission CTA / User Status Box -->
    <ReviewEligibilityCard
      :eligibility="eligibility"
      :is-authenticated="isAuthenticated"
      @create="openCreateModal"
      @delete="handleDeleteReview"
    />

    <!-- Filter & Sort Bar -->
    <ReviewFilterBar
      :selected-star="selectedStar"
      :selected-sort="selectedSort"
      @select-star="handleSelectStar"
      @change-sort="handleSortChange"
    />

    <!-- Loading Skeleton View -->
    <div v-if="isLoading" class="space-y-4">
      <UiCard v-for="i in 3" :key="i" :padded="true" class="bg-white border-brand-hair">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <UiSkeleton shape="pill" width="w-8" height="h-8" />
              <UiSkeleton width="w-28" height="h-4" />
            </div>
            <UiSkeleton width="w-20" height="h-3" />
          </div>
          <UiSkeleton width="w-24" height="h-3" />
          <UiSkeleton width="w-full" height="h-12" />
        </div>
      </UiCard>
    </div>

    <!-- Empty State View -->
    <UiEmptyState
      v-else-if="reviews.length === 0"
      icon="pi-comments"
      title="Belum Ada Ulasan"
      :description="
        selectedStar
          ? `Belum ada ulasan dengan rating ${selectedStar} bintang untuk produk ini.`
          : 'Jadilah yang pertama memberikan ulasan untuk produk ini.'
      "
      :action-label="selectedStar ? 'Reset Filter' : ''"
      @action="handleSelectStar(null)"
    />

    <!-- Review Cards List -->
    <div v-else class="space-y-4">
      <ReviewCard v-for="rev in reviews" :key="rev.id" :review="rev" />

      <!-- Pagination / Load More Button -->
      <div v-if="hasMore" class="flex justify-center pt-4">
        <UiButton
          variant="outline"
          size="sm"
          :loading="isLoadingMore"
          :disabled="isLoadingMore"
          @click="handleLoadMore"
        >
          Muat Lebih Banyak Ulasan
        </UiButton>
      </div>
    </div>

    <!-- Review Form Modal -->
    <ReviewFormModal
      v-model="isModalOpen"
      :product-id="productId"
      :product-name="productName"
      :order-id="eligibility.order_id || eligibility.existing_review?.order_id || ''"
      :existing-review="eligibility.existing_review"
      @success="refreshAll"
    />
  </section>
</template>
