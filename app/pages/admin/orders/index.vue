<script setup lang="ts">
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminExpiryQueueCard from '~/features/orders/components/AdminExpiryQueueCard.vue'
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
  fetchOrders,
  onStatusChange,
  onSearch,
  onSortChange,
  handleExport,
  prevPage,
  nextPage,
} = useAdminOrdersList()
</script>

<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Kelola Pesanan"
      subtitle="Pantau pesanan masuk, verifikasi pembayaran, dan perbarui status pengiriman."
      :breadcrumbs="[{ label: 'Dashboard', to: '/admin' }, { label: 'Kelola Pesanan' }]"
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
          Perbarui
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- BullMQ Order Expiry & DLQ Telemetry -->
    <AdminExpiryQueueCard />

    <!-- Filter & Search Controls -->
    <div
      class="flex flex-col gap-3 rounded-card border border-brand-hair bg-brand-canvas p-3.5 shadow-whisper"
    >
      <!-- Status Tabs -->
      <UiTabs
        :model-value="activeStatus"
        :items="statusTabs"
        aria-label="Filter status pesanan"
        @update:model-value="onStatusChange"
      />

      <!-- Search & Filter Form -->
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="onSearch">
        <label for="admin-orders-search" class="sr-only">Cari ID / Nama</label>
        <div class="w-full sm:w-56">
          <UiInput
            id="admin-orders-search"
            v-model="searchQuery"
            type="search"
            size="sm"
            left-icon="pi-search"
            placeholder="Cari ID / Nama..."
          />
        </div>

        <label for="admin-orders-from" class="sr-only">Tanggal mulai</label>
        <div class="w-full sm:w-36">
          <UiInput
            id="admin-orders-from"
            v-model="fromDate"
            type="date"
            size="sm"
            title="Tanggal mulai"
          />
        </div>

        <span class="hidden text-xs text-brand-muted sm:inline">s.d.</span>

        <label for="admin-orders-to" class="sr-only">Tanggal akhir</label>
        <div class="w-full sm:w-36">
          <UiInput
            id="admin-orders-to"
            v-model="toDate"
            type="date"
            size="sm"
            title="Tanggal akhir"
          />
        </div>

        <UiButton variant="secondary" size="sm" type="submit">Cari</UiButton>
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
      @prev-page="prevPage"
      @next-page="nextPage"
      @sort-change="onSortChange"
    />
  </div>
</template>
