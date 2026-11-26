<script setup lang="ts">
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
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
  resetDateFilters,
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
        <label for="admin-orders-search" class="sr-only">Cari ID atau nama pelanggan</label>
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

        <div
          class="flex h-9 w-full items-center gap-2 rounded-full border border-brand-hair bg-brand-canvas px-3.5 transition-colors hover:border-brand-faint focus-within:border-brand-ink focus-within:ring-1 focus-within:ring-inset focus-within:ring-brand-ink sm:w-auto"
        >
          <label
            for="admin-orders-from"
            class="shrink-0 text-[11px] font-semibold text-brand-muted"
          >
            Dari
          </label>
          <input
            id="admin-orders-from"
            v-model="fromDate"
            type="date"
            aria-label="Tanggal mulai pesanan"
            title="Pilih tanggal awal periode pesanan"
            class="min-w-0 flex-1 bg-transparent text-xs text-brand-ink focus:outline-none focus-visible:outline-none"
          />
        </div>

        <div
          class="flex h-9 w-full items-center gap-2 rounded-full border border-brand-hair bg-brand-canvas px-3.5 transition-colors hover:border-brand-faint focus-within:border-brand-ink focus-within:ring-1 focus-within:ring-inset focus-within:ring-brand-ink sm:w-auto"
        >
          <label for="admin-orders-to" class="shrink-0 text-[11px] font-semibold text-brand-muted">
            Sampai
          </label>
          <input
            id="admin-orders-to"
            v-model="toDate"
            type="date"
            aria-label="Tanggal akhir pesanan"
            title="Pilih tanggal akhir periode pesanan"
            class="min-w-0 flex-1 bg-transparent text-xs text-brand-ink focus:outline-none focus-visible:outline-none"
          />
        </div>

        <UiButton variant="secondary" size="sm" type="submit">Cari</UiButton>
        <UiButton
          v-if="fromDate || toDate"
          variant="ghost"
          size="sm"
          type="button"
          @click="resetDateFilters"
        >
          Reset Tanggal
        </UiButton>
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
