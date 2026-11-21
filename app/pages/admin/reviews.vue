<script setup lang="ts">
import { onMounted } from 'vue'
import { useAdminReviews } from '~/composables/useAdminReviews'
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
  <div class="space-y-6 max-w-7xl mx-auto" data-testid="admin-reviews-page">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-brand-muted text-xs mb-1">
          <NuxtLink to="/admin" class="hover:underline">Admin</NuxtLink>
          <span>/</span>
          <span>Katalog</span>
          <span>/</span>
          <span class="text-brand-ink font-semibold">Ulasan Produk</span>
        </div>
        <h1 class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0 tracking-tight">
          Moderasi Ulasan Produk
        </h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
          Pantau feedback pelanggan terverifikasi, evaluasi rating produk, dan kelola visibilitas
          ulasan.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="loading"
          class="px-4 py-2 rounded-full border border-brand-hair bg-brand-canvas hover:bg-brand-canvas-soft text-brand-ink text-xs font-semibold shadow-whisper inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          @click="fetchReviews"
        >
          <i :class="['pi text-xs', loading ? 'pi-spin pi-spinner' : 'pi-refresh']" />
          <span>Muat Ulang</span>
        </button>
      </div>
    </div>

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
