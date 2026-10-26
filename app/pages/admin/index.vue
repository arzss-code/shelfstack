<script setup lang="ts">
import AdminStatCard from '~/features/admin/components/AdminStatCard.vue'
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

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'paid':
      return { variant: 'info' as const, label: 'Lunas' }
    case 'shipped':
      return { variant: 'info' as const, label: 'Dikirim' }
    case 'completed':
      return { variant: 'success' as const, label: 'Selesai' }
    case 'cancelled':
      return { variant: 'danger' as const, label: 'Dibatalkan' }
    case 'pending':
    default:
      return { variant: 'warning' as const, label: 'Menunggu' }
  }
}

const formatDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
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
        subtitle="Dari pesanan lunas & selesai"
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

    <!-- Recent Transactions Section -->
    <div class="rounded-card border border-brand-hair bg-brand-canvas-soft p-6 shadow-whisper">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <h2 class="font-display text-base sm:text-lg font-bold text-brand-ink m-0">
            Transaksi Terbaru
          </h2>
          <p class="font-body text-xs text-brand-muted m-0 mt-0.5">
            8 transaksi pesanan paling mutakhir yang masuk ke sistem.
          </p>
        </div>

        <NuxtLink
          to="/admin/orders"
          class="text-xs font-semibold text-brand-accent no-underline hover:underline flex items-center gap-1.5"
        >
          <span>Lihat Semua Pesanan</span>
          <i class="pi pi-arrow-right text-[10px]" />
        </NuxtLink>
      </div>

      <!-- Loading Placeholder -->
      <div v-if="loading" class="space-y-3 py-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-12 w-full animate-pulse rounded-xl bg-brand-hairsoft"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!stats?.recent_orders || stats.recent_orders.length === 0"
        class="py-12 text-center"
      >
        <i class="pi pi-inbox text-3xl text-brand-muted mb-2 block" />
        <p class="text-xs text-brand-muted m-0">Belum ada transaksi pesanan yang tercatat.</p>
      </div>

      <!-- Orders Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
            >
              <th class="py-3 px-4 font-semibold">ID Pesanan</th>
              <th class="py-3 px-4 font-semibold">Pelanggan</th>
              <th class="py-3 px-4 font-semibold">Tanggal</th>
              <th class="py-3 px-4 font-semibold">Status</th>
              <th class="py-3 px-4 font-semibold text-right">Total</th>
              <th class="py-3 px-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr
              v-for="order in stats.recent_orders"
              :key="order.id"
              class="hover:bg-brand-canvas transition-colors"
            >
              <td class="py-3.5 px-4 font-mono font-medium tabular text-brand-ink">
                #{{ order.id.slice(0, 8) }}
              </td>
              <td class="py-3.5 px-4 text-brand-ink">
                <div class="font-medium truncate max-w-[180px]">
                  {{ order.address?.name || 'Pelanggan Toko' }}
                </div>
                <div class="text-[10px] text-brand-muted truncate max-w-[180px]">
                  {{ order.address?.city || '-' }}
                </div>
              </td>
              <td class="py-3.5 px-4 text-brand-muted whitespace-nowrap">
                {{ formatDate(order.created_at) }}
              </td>
              <td class="py-3.5 px-4">
                <UiBadge
                  :label="getStatusBadge(order.status).label"
                  :variant="getStatusBadge(order.status).variant"
                />
              </td>
              <td
                class="py-3.5 px-4 text-right font-semibold text-brand-ink whitespace-nowrap tabular"
              >
                {{ formatRupiah(order.total_cents / 100) }}
              </td>
              <td class="py-3.5 px-4 text-center whitespace-nowrap">
                <NuxtLink
                  :to="`/admin/orders/${order.id}`"
                  class="inline-flex items-center gap-1.5 rounded-full bg-brand-canvas px-3 py-1 text-xs font-semibold text-brand-ink no-underline border border-brand-hair hover:bg-brand-field"
                >
                  <span>Detail</span>
                  <i class="pi pi-arrow-right text-[9px]" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
