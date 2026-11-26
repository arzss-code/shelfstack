<script setup lang="ts">
import { onMounted } from 'vue'
import { useAdminReviews } from '~/composables/useAdminReviews'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminReviewsMetricCards from '~/components/admin/reviews/AdminReviewsMetricCards.vue'
import AdminReviewsFilterBar from '~/components/admin/reviews/AdminReviewsFilterBar.vue'
import AdminReviewsTable from '~/components/admin/reviews/AdminReviewsTable.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Moderasi Ulasan Produk - Admin ShelfStack',
  description:
    'Panel moderasi dan pemantauan ulasan pembeli terverifikasi pada katalog produk ShelfStack.',
})

const {
  reviews,
  loading,
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
} = useAdminReviews()

onMounted(() => {
  fetchReviews()
})
</script>

<template>
  <div class="space-y-5" data-testid="admin-reviews-page">
    <AdminPageHeader
      title="Ulasan Produk"
      subtitle="Pantau rating pembeli dan kelola tampilan ulasan di toko."
    >
      <template #actions>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="loading"
          @click="fetchReviews"
        >
          Muat Ulang
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- KPI Metric Cards -->
    <AdminReviewsMetricCards :metrics="metrics" :loading="loading" />

    <!-- Filter Bar -->
    <AdminReviewsFilterBar
      :metrics="metrics"
      :active-status="statusFilter"
      :active-rating="ratingFilter"
      :search-query="searchQuery"
      @update:status="setStatus"
      @update:rating="setRating"
      @update:search="setSearch"
    />

    <!-- Reviews Table -->
    <AdminReviewsTable
      :reviews="reviews"
      :loading="loading"
      :mutating-id="mutatingId"
      :pagination="pagination"
      @toggle-status="toggleReviewStatus"
      @page-change="setPage"
    />
  </div>
</template>
