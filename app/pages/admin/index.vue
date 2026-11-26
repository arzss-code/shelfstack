<script setup lang="ts">
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminStatCard from '~/features/admin/components/AdminStatCard.vue'
import AdminSalesChart from '~/components/admin/AdminSalesChart.vue'
import AdminRecentOrdersTable from '~/features/admin/components/AdminRecentOrdersTable.vue'
import { formatRupiah } from '~/utils/format'
import type { OrderStatus } from '~/types/order'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Ringkasan Toko - Admin ShelfStack',
  description: 'Ringkasan omzet bulanan, pesanan aktif, dan ketersediaan stok ShelfStack.',
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
  <div class="space-y-5">
    <AdminPageHeader
      title="Ringkasan Toko"
      subtitle="Omzet bulanan, pesanan aktif, dan ketersediaan stok produk."
    >
      <template #actions>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="refreshing"
          @click="fetchStats(true)"
        >
          Muat Ulang
        </UiButton>
        <UiButton variant="primary" size="sm" icon="pi-shopping-bag" to="/admin/orders">
          Kelola Pesanan
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- Error Alert -->
    <UiAlert v-if="errorMessage" tone="danger">
      {{ errorMessage }}
    </UiAlert>

    <!-- 4 KPI Metrics Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <AdminStatCard
        title="Omzet Bulan Ini"
        :value="stats ? formatRupiah(stats.revenue.monthly_cents / 100) : 'Rp 0'"
        subtitle="Dari pesanan lunas dan selesai"
        icon="pi-wallet"
        color="success"
        :loading="loading"
      />

      <AdminStatCard
        title="Pesanan Menunggu"
        :value="stats ? String(stats.counts.pending_orders) : '0'"
        subtitle="Menunggu bayar atau konfirmasi"
        icon="pi-clock"
        color="warning"
        to="/admin/orders?status=pending"
        :loading="loading"
      />

      <AdminStatCard
        title="Stok Menipis"
        :value="stats ? String(stats.counts.low_stock_products) : '0'"
        subtitle="Produk dengan stok di bawah 5 unit"
        icon="pi-exclamation-triangle"
        color="danger"
        to="/admin/products"
        :loading="loading"
      />

      <AdminStatCard
        title="Pelanggan Terdaftar"
        :value="stats ? String(stats.counts.total_customers) : '0'"
        subtitle="Akun pembeli aktif"
        icon="pi-users"
        color="info"
        :loading="loading"
      />
    </div>

    <!-- Sales & Revenue Trend Chart (Pure SVG) -->
    <AdminSalesChart />

    <!-- Recent Transactions Table Section -->
    <AdminRecentOrdersTable :orders="stats?.recent_orders || []" :loading="loading" />
  </div>
</template>
