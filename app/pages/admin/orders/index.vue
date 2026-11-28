<script setup lang="ts">
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import UiDateRangePicker from '~/components/ui/UiDateRangePicker.vue'
import AdminOrderExportMenu from '~/features/orders/components/AdminOrderExportMenu.vue'
import AdminOrderTable from '~/features/orders/components/AdminOrderTable.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Kelola Pesanan - Admin ShelfStack',
  description: 'Daftar seluruh transaksi pesanan toko ShelfStack dengan filter status terpadu.',
})

const {
  activeStatus,
  searchQuery,
  fromDate,
  toDate,
  page,
  pageSize,
  sortKey,
  sortDirection,
  loading,
  orders,
  totalOrders,
  errorMessage,
  exporting,
  exportingFormat,
  statusTabs,
  totalPages,
  hasActiveFilters,
  fetchOrders,
  onStatusChange,
  onSearch,
  resetFilters,
  onSortChange,
  handleExport,
  prevPage,
  nextPage,
  setPage,
  setPageSize,
} = useAdminOrdersList()
</script>

<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Kelola Pesanan"
      subtitle="Daftar pesanan masuk, verifikasi pembayaran, dan status pengiriman."
    >
      <template #actions>
        <AdminOrderExportMenu
          :exporting="exporting"
          :active-format="exportingFormat"
          @export="handleExport"
        />

        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="loading"
          @click="fetchOrders"
        >
          Muat Ulang
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- Filter & Search Controls -->
    <div
      class="rounded-card border border-brand-hair bg-brand-canvas p-2.5 sm:p-3 shadow-whisper"
      data-testid="admin-orders-filter-bar"
    >
      <form
        class="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between"
        @submit.prevent="onSearch"
      >
        <UiTabs
          :model-value="activeStatus"
          :items="statusTabs"
          aria-label="Filter status pesanan"
          class="self-start max-w-full"
          @update:model-value="onStatusChange"
        />

        <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
          <label for="admin-orders-search" class="sr-only">Cari ID atau nama pelanggan</label>
          <div class="w-full min-w-[180px] sm:flex-1 xl:w-52 xl:flex-none">
            <UiInput
              id="admin-orders-search"
              v-model="searchQuery"
              type="search"
              size="sm"
              left-icon="pi-search"
              placeholder="Cari ID / Nama..."
            />
          </div>

          <UiDateRangePicker
            v-model:from="fromDate"
            v-model:to="toDate"
            class="flex-1 sm:flex-none"
            @change="onSearch"
          />
        </div>
      </form>
    </div>

    <!-- Error Alert -->
    <UiAlert v-if="errorMessage" tone="danger">
      {{ errorMessage }}
    </UiAlert>

    <!-- Modular Orders Table Component -->
    <AdminOrderTable
      :orders="orders"
      :loading="loading"
      :page="page"
      :page-size="pageSize"
      :total-orders="totalOrders"
      :total-pages="totalPages"
      :sort-key="sortKey"
      :sort-direction="sortDirection"
      :has-active-filters="hasActiveFilters"
      @prev-page="prevPage"
      @next-page="nextPage"
      @page-change="setPage"
      @page-size-change="setPageSize"
      @sort-change="onSortChange"
      @reset-filters="resetFilters"
    />
  </div>
</template>
