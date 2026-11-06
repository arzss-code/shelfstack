<script setup lang="ts">
import AdminCouponMetrics from '~/components/admin/coupons/AdminCouponMetrics.vue'
import AdminCouponTable from '~/components/admin/coupons/AdminCouponTable.vue'
import AdminCouponModal from '~/components/admin/coupons/AdminCouponModal.vue'
import AdminCouponUsagesModal from '~/components/admin/coupons/AdminCouponUsagesModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Kelola Voucher - ShelfStack Admin',
  description:
    'Kelola kode kupon diskon, voucher koin loyalitas, dan pantau riwayat audit pemakaian promo.',
})

const {
  coupons,
  metrics,
  loading,
  searchQuery,
  statusFilter,
  typeFilter,
  isModalOpen,
  isEditing,
  selectedCoupon,
  submitting,
  modalError,
  isUsagesModalOpen,
  usagesCoupon,
  statusOptions,
  typeOptions,
  fetchCoupons,
  openCreateModal,
  openEditModal,
  openUsagesModal,
  handleModalSubmit,
  toggleCouponStatus,
  confirmDelete,
} = useAdminCoupons()
</script>

<template>
  <div class="admin-coupons-page space-y-6">
    <!-- Header Section -->
    <div
      class="flex flex-col justify-between gap-4 border-b border-brand-hair pb-4 sm:flex-row sm:items-center"
    >
      <div>
        <div class="mb-1 flex items-center gap-2 text-xs text-brand-muted">
          <NuxtLink to="/admin" class="no-underline hover:text-brand-ink"> Dashboard </NuxtLink>
          <span class="text-brand-faint">/</span>
          <span class="font-semibold text-brand-ink">Kelola Voucher</span>
        </div>
        <h1 class="font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
          Kelola Voucher Promo
        </h1>
        <p class="mt-0.5 text-xs text-brand-muted sm:text-sm">
          Atur kode promo belanja, voucher penukaran koin loyalitas, dan pantau riwayat audit kuota.
        </p>
      </div>

      <UiButton variant="primary" size="sm" icon="pi-plus" @click="openCreateModal">
        Buat Voucher Baru
      </UiButton>
    </div>

    <!-- Executive Metrics Bento Grid -->
    <AdminCouponMetrics :metrics="metrics" />

    <!-- Filter & Search Bar -->
    <div
      class="relative z-20 flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-brand-hair bg-white p-3 shadow-whisper sm:flex-row sm:items-center"
    >
      <div class="w-full sm:w-72">
        <UiInput
          v-model="searchQuery"
          size="sm"
          placeholder="Cari kode atau nama voucher..."
          left-icon="pi-search"
          @input="fetchCoupons"
        />
      </div>

      <div class="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:flex-nowrap">
        <div class="w-full sm:w-36">
          <UiSelect
            v-model="statusFilter"
            size="sm"
            block
            :options="statusOptions"
            @change="fetchCoupons"
          />
        </div>

        <div class="w-full sm:w-44">
          <UiSelect
            v-model="typeFilter"
            size="sm"
            block
            align="right"
            :options="typeOptions"
            @change="fetchCoupons"
          />
        </div>

        <UiIconButton
          icon="pi-sync"
          label="Segarkan data"
          variant="neutral"
          size="sm"
          :loading="loading"
          @click="fetchCoupons"
        />
      </div>
    </div>

    <!-- Data Table Subcomponent -->
    <AdminCouponTable
      :coupons="coupons"
      :loading="loading"
      @toggle-status="toggleCouponStatus"
      @edit="openEditModal"
      @delete="confirmDelete"
      @view-usages="openUsagesModal"
      @create="openCreateModal"
    />

    <!-- Create & Edit Modal Subcomponent -->
    <AdminCouponModal
      v-model:visible="isModalOpen"
      :is-editing="isEditing"
      :coupon="selectedCoupon"
      :submitting="submitting"
      :error="modalError"
      @submit="handleModalSubmit"
      @close="isModalOpen = false"
    />

    <!-- Coupon Usages Detail Modal Subcomponent -->
    <AdminCouponUsagesModal
      v-model:visible="isUsagesModalOpen"
      :coupon="usagesCoupon"
      @close="isUsagesModalOpen = false"
    />
  </div>
</template>
