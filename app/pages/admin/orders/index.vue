<script setup lang="ts">
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
  statusTabs,
  totalPages,
  fetchOrders,
  onStatusChange,
  onSearch,
  onSortChange,
  handleExportCsv,
  prevPage,
  nextPage,
} = useAdminOrdersList()
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0">
            Kelola Pesanan
          </h1>
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-brand-success-edge bg-brand-success-tint px-2.5 py-0.5 text-[11px] font-medium text-brand-success-text"
          >
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-success" />
            Live Realtime
          </span>
        </div>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
          Pantau seluruh pesanan, verifikasi pembayaran, dan jalankan pembaruan logistik secara
          langsung.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-download"
          :loading="exporting"
          @click="handleExportCsv"
        >
          Ekspor CSV
        </UiButton>

        <UiButton
          variant="secondary"
          size="sm"
          icon="pi-refresh"
          :loading="loading"
          @click="fetchOrders"
        >
          Perbarui
        </UiButton>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="flex flex-col gap-3 rounded-2xl border border-brand-hair bg-brand-canvas-soft p-4">
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
