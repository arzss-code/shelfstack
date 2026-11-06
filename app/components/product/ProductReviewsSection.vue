<script setup lang="ts">
import { useProductReviews } from '~/composables/useProductReviews'
import ReviewCard from '~/components/product/ReviewCard.vue'
import ReviewEligibilityCard from '~/components/product/ReviewEligibilityCard.vue'
import ReviewFilterBar from '~/components/product/ReviewFilterBar.vue'
import ReviewFormModal from '~/components/product/ReviewFormModal.vue'
import ReviewRatingSummary from '~/components/product/ReviewRatingSummary.vue'

const props = defineProps<{
  productId: number | string
  productName: string
}>()

const {
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
} = useProductReviews(() => props.productId)
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
