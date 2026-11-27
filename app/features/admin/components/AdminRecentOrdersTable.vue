<script setup lang="ts">
import type { OrderStatus } from '~/types/order'
import { useClientTableSort } from '~/composables/useClientTableSort'
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

const props = defineProps<{
  orders: RecentOrder[]
  loading?: boolean
}>()

const { sortKey, sortDirection, sortedItems, onSortChange, getAriaSort } = useClientTableSort(
  () => props.orders,
  {
    id: (o) => o.id,
    customer: (o) => o.address?.name || 'Pelanggan Toko',
    created_at: (o) => new Date(o.created_at).getTime() || 0,
    status: (o) => o.status,
    total_cents: (o) => o.total_cents,
  },
)

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
  <div class="rounded-card border border-brand-hair bg-brand-canvas p-5 shadow-whisper">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Transaksi Terbaru</h2>
        <p class="font-body text-xs text-brand-muted m-0 mt-0.5">
          8 pesanan terakhir yang masuk ke toko.
        </p>
      </div>

      <NuxtLink
        to="/admin/orders"
        class="text-xs font-semibold text-brand-accent-text no-underline hover:underline flex items-center gap-1.5"
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
    <div
      v-else
      tabindex="0"
      role="region"
      aria-label="Tabel transaksi terbaru"
      class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
    >
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr
            class="border-b border-brand-hair bg-brand-canvas-soft text-brand-muted uppercase tracking-wider text-[11px]"
          >
            <th scope="col" class="py-2.5 px-3.5" :aria-sort="getAriaSort('id')">
              <UiSortHeader
                sort-key="id"
                label="ID pesanan"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="onSortChange"
              >
                ID Pesanan
              </UiSortHeader>
            </th>
            <th scope="col" class="py-2.5 px-3.5" :aria-sort="getAriaSort('customer')">
              <UiSortHeader
                sort-key="customer"
                label="pelanggan"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="onSortChange"
              >
                Pelanggan
              </UiSortHeader>
            </th>
            <th scope="col" class="py-2.5 px-3.5" :aria-sort="getAriaSort('created_at')">
              <UiSortHeader
                sort-key="created_at"
                label="tanggal"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="onSortChange"
              >
                Tanggal
              </UiSortHeader>
            </th>
            <th scope="col" class="py-2.5 px-3.5" :aria-sort="getAriaSort('status')">
              <UiSortHeader
                sort-key="status"
                label="status"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="onSortChange"
              >
                Status
              </UiSortHeader>
            </th>
            <th
              scope="col"
              class="py-2.5 px-3.5 text-right"
              :aria-sort="getAriaSort('total_cents')"
            >
              <UiSortHeader
                sort-key="total_cents"
                label="total"
                align="right"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="onSortChange"
              >
                Total
              </UiSortHeader>
            </th>
            <th scope="col" class="py-2.5 px-3.5 font-semibold text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft">
          <tr
            v-for="order in sortedItems"
            :key="order.id"
            class="hover:bg-brand-canvas-soft/60 transition-colors"
          >
            <td class="py-2.5 px-3.5 font-mono font-medium tabular-nums text-brand-ink">
              #{{ order.id.slice(0, 8) }}
            </td>
            <td class="py-2.5 px-3.5 text-brand-ink">
              <div class="font-medium truncate max-w-[180px]">
                {{ order.address?.name || 'Pelanggan Toko' }}
              </div>
              <div class="text-[10px] text-brand-muted truncate max-w-[180px]">
                {{ order.address?.city || '-' }}
              </div>
            </td>
            <td class="py-2.5 px-3.5 text-brand-muted whitespace-nowrap">
              {{ formatDate(order.created_at) }}
            </td>
            <td class="py-2.5 px-3.5">
              <UiBadge
                :label="getStatusBadge(order.status).label"
                :variant="getStatusBadge(order.status).variant"
              />
            </td>
            <td
              class="py-2.5 px-3.5 text-right font-semibold text-brand-ink whitespace-nowrap tabular-nums"
            >
              {{ formatRupiah(order.total_cents / 100) }}
            </td>
            <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
              <NuxtLink
                :to="`/admin/orders/${order.id}`"
                class="inline-flex items-center gap-1 rounded-full bg-brand-canvas px-3 py-1 text-xs font-semibold text-brand-ink no-underline border border-brand-hair hover:bg-brand-field"
              >
                <span>Detail</span>
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
