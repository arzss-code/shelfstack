<script setup lang="ts">
import type { OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'

interface RecentOrder {
  id: string
  user_id: string
  status: OrderStatus
  total_cents: number
  created_at: string
  address?: {
    name?: string
    city?: string
  }
}

defineProps<{
  orders: RecentOrder[]
  loading?: boolean
}>()

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
      <div v-for="i in 4" :key="i" class="h-12 w-full animate-pulse rounded-xl bg-brand-hairsoft" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!orders || orders.length === 0" class="py-12 text-center">
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
            v-for="order in orders"
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
</template>
