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
  <div class="admin-coupons-page space-y-5">
    <AdminPageHeader
      title="Kelola Voucher Promo"
      subtitle="Atur kode kupon diskon, voucher penukaran koin, dan batas pemakaian."
      :breadcrumbs="[{ label: 'Dashboard', to: '/admin' }, { label: 'Kelola Voucher' }]"
    >
      <template #actions>
        <UiButton variant="primary" size="sm" icon="pi-plus" @click="openCreateModal">
          Buat Voucher Baru
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- Executive Metrics Bento Grid -->
    <AdminCouponMetrics :metrics="metrics" />

    <!-- Filter & Search Bar -->
    <div
      class="relative z-20 flex flex-col items-stretch justify-between gap-3 rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper sm:flex-row sm:items-center"
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
