<script setup lang="ts">
import AdminStatCard from '~/features/admin/components/AdminStatCard.vue'
import AdminOperationalSignals from '~/features/admin/components/AdminOperationalSignals.vue'
import AdminRecentOrdersTable from '~/features/admin/components/AdminRecentOrdersTable.vue'
import { formatRupiah } from '~/utils/format'
import type { OrderStatus } from '~/types/order'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Dashboard Analytics - Admin ShelfStack',
  description: 'Ringkasan eksekutif KPI bisnis, pendapatan, dan transaksi toko ShelfStack.',
})

interface AdminStatsResponse {
  revenue: {
    monthly_cents: number
    total_cents: number
  }
  counts: {
    pending_orders: number
    low_stock_products: number
    total_customers: number
  }
  recent_orders: Array<{
    id: string
    user_id: string
    status: OrderStatus
    total_cents: number
    created_at: string
    address?: {
      name?: string
      city?: string
    }
  }>
}

const loading = ref(true)
const refreshing = ref(false)
const stats = ref<AdminStatsResponse | null>(null)
const errorMessage = ref('')

let pollTimer: ReturnType<typeof setInterval> | null = null

const fetchStats = async (isManual = false) => {
  if (isManual) {
    refreshing.value = true
  } else if (!stats.value) {
    loading.value = true
  }
  errorMessage.value = ''

  try {
    const res = await $fetch<{ status: string; data: AdminStatsResponse }>('/api/admin/stats')
    stats.value = res.data
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMessage.value = fetchErr.data?.message || 'Gagal memuat ringkasan analitik admin.'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => {
  fetchStats()
  pollTimer = setInterval(() => {
    fetchStats()
  }, 30000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <div class="space-y-8 pb-16">
    <!-- Header Page -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0">
          Dashboard Eksekutif
        </h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
          Pantau omzet bulanan, volume order tertunda, dan kesehatan stok inventaris secara
          realtime.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <UiButton
          variant="secondary"
          size="sm"
          icon="pi-refresh"
          :loading="refreshing"
          @click="fetchStats(true)"
        >
          Perbarui Data
        </UiButton>
        <UiButton variant="primary" size="sm" icon="pi-shopping-bag" to="/admin/orders">
          Kelola Pesanan
        </UiButton>
      </div>
    </div>

    <!-- Error Alert -->
    <UiAlert v-if="errorMessage" tone="danger">
      {{ errorMessage }}
    </UiAlert>

    <!-- 4 KPI Metrics Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminStatCard
        title="Revenue Bulan Ini"
        :value="stats ? formatRupiah(stats.revenue.monthly_cents / 100) : 'Rp 0'"
        subtitle="Dari pesanan lunas &amp; selesai"
        icon="pi-wallet"
        color="success"
        :loading="loading"
      />

      <AdminStatCard
        title="Pesanan Pending"
        :value="stats ? String(stats.counts.pending_orders) : '0'"
        subtitle="Membutuhkan pembayaran/tindakan"
        icon="pi-clock"
        color="warning"
        to="/admin/orders?status=pending"
        :loading="loading"
      />

      <AdminStatCard
        title="Stok Kritis (< 5)"
        :value="stats ? String(stats.counts.low_stock_products) : '0'"
        subtitle="Varian produk perlu restock"
        icon="pi-exclamation-triangle"
        color="danger"
        to="/admin/products"
        :loading="loading"
      />

      <AdminStatCard
        title="Total Pelanggan"
        :value="stats ? String(stats.counts.total_customers) : '0'"
        subtitle="Akun pembeli terdaftar"
        icon="pi-users"
        color="info"
        :loading="loading"
      />
    </div>

    <!-- Operational Signals & System Telemetry Section -->
    <AdminOperationalSignals />

    <!-- Recent Transactions Table Section -->
    <AdminRecentOrdersTable :orders="stats?.recent_orders || []" :loading="loading" />
  </div>
</template>
