<script setup lang="ts">
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
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
  hasActiveFilters,
  fetchCoupons,
  resetFilters,
  triggerSearchNow,
  openCreateModal,
  openEditModal,
  openUsagesModal,
  handleModalSubmit,
  toggleCouponStatus,
  confirmDelete,
} = useAdminCoupons()
</script>

<template>
  <div class="admin-coupons-page space-y-5">
    <AdminPageHeader
      title="Voucher Diskon"
      subtitle="Atur kode diskon checkout, voucher koin, dan kuota pemakaian."
    >
      <template #actions>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="loading"
          @click="fetchCoupons"
        >
          Muat Ulang
        </UiButton>
        <UiButton variant="primary" size="sm" icon="pi-plus" @click="openCreateModal">
          Buat Voucher
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- Metrics Grid -->
    <AdminCouponMetrics :metrics="metrics" />

    <!-- Filter & Search Bar -->
    <div
      class="relative z-20 flex flex-col items-stretch justify-between gap-3 rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper sm:flex-row sm:items-center"
    >
      <form class="w-full sm:w-72" @submit.prevent="triggerSearchNow">
        <label for="admin-coupons-search" class="sr-only">Cari kode atau nama voucher</label>
        <UiInput
          id="admin-coupons-search"
          v-model="searchQuery"
          size="sm"
          type="search"
          placeholder="Cari kode atau nama voucher..."
          left-icon="pi-search"
        />
      </form>

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
      </div>
    </div>

    <!-- Data Table Subcomponent -->
    <AdminCouponTable
      :coupons="coupons"
      :loading="loading"
      :has-active-filters="hasActiveFilters"
      @toggle-status="toggleCouponStatus"
      @edit="openEditModal"
      @delete="confirmDelete"
      @view-usages="openUsagesModal"
      @create="openCreateModal"
      @reset-filters="resetFilters"
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
