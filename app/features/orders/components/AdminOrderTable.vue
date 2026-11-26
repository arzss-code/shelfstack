<script setup lang="ts">
import type { OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'

export interface AdminOrderRow {
  id: string
  user_id: string
  status: OrderStatus
  total_cents: number
  created_at: string
  address?: {
    name?: string
    phone?: string
    city?: string
  }
  order_items?: Array<{
    id: string
    qty: number
    price_cents: number
  }>
}

/** Seluruh varian warna yang diterima `UiBadge`. */
type StatusBadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface StatusBadge {
  variant: StatusBadgeVariant
  label: string
}

const props = withDefaults(
  defineProps<{
    orders: AdminOrderRow[]
    loading: boolean
    page: number
    pageSize: number
    totalOrders: number
    totalPages: number
    sortKey?: string | null
    sortDirection?: 'desc' | 'asc' | null
  }>(),
  { sortKey: null, sortDirection: null },
)

const emit = defineEmits<{
  prevPage: []
  nextPage: []
  sortChange: [payload: { key: string | null; direction: 'desc' | 'asc' | null }]
}>()

const getAriaSort = (key: string): 'ascending' | 'descending' | 'none' => {
  if (props.sortKey !== key || !props.sortDirection) return 'none'
  return props.sortDirection === 'asc' ? 'ascending' : 'descending'
}

const getStatusBadge = (status: OrderStatus): StatusBadge => {
  switch (status) {
    case 'paid':
      return { variant: 'info', label: 'Lunas' }
    case 'shipped':
      return { variant: 'info', label: 'Dikirim' }
    case 'completed':
      return { variant: 'success', label: 'Selesai' }
    case 'cancelled':
      return { variant: 'danger', label: 'Dibatalkan' }
    case 'pending':
    default:
      return { variant: 'warning', label: 'Menunggu' }
  }
}

const formatDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-brand-hair bg-brand-canvas-soft shadow-whisper"
  >
    <!-- Skeleton Loading -->
    <div v-if="loading" class="space-y-3 p-6" aria-busy="true">
      <UiSkeleton v-for="i in 5" :key="i" height="h-14" />
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="p-6">
      <UiEmptyState
        icon="pi-inbox"
        title="Tidak ada pesanan ditemukan."
        description="Coba ubah filter status, kata kunci pencarian, atau rentang tanggal."
      />
    </div>

    <!-- Data Table -->
    <div
      v-else
      tabindex="0"
      role="region"
      aria-label="Tabel daftar pesanan"
      class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
    >
      <table class="w-full border-collapse text-left text-xs">
        <thead>
          <tr
            class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
          >
            <th scope="col" class="px-4 py-3" :aria-sort="getAriaSort('id')">
              <UiSortHeader
                sort-key="id"
                label="ID pesanan"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                ID Pesanan
              </UiSortHeader>
            </th>
            <th scope="col" class="px-4 py-3" :aria-sort="getAriaSort('name')">
              <UiSortHeader
                sort-key="name"
                label="pelanggan"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                Pelanggan
              </UiSortHeader>
            </th>
            <th scope="col" class="px-4 py-3" :aria-sort="getAriaSort('created_at')">
              <UiSortHeader
                sort-key="created_at"
                label="tanggal"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                Tanggal
              </UiSortHeader>
            </th>
            <th scope="col" class="px-4 py-3 text-center font-semibold">Item</th>
            <th scope="col" class="px-4 py-3 font-semibold">Status</th>
            <th scope="col" class="px-4 py-3 text-right" :aria-sort="getAriaSort('total')">
              <UiSortHeader
                sort-key="total"
                label="total"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                Total
              </UiSortHeader>
            </th>
            <th scope="col" class="px-4 py-3 text-center font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft">
          <tr
            v-for="order in orders"
            :key="order.id"
            class="transition-colors hover:bg-brand-canvas"
          >
            <td class="px-4 py-3.5 font-mono font-medium text-brand-ink">
              #{{ order.id.slice(0, 8) }}
            </td>
            <td class="px-4 py-3.5 text-brand-ink">
              <div class="max-w-[180px] truncate font-medium">
                {{ order.address?.name || 'Pelanggan' }}
              </div>
              <div class="max-w-[180px] truncate text-[10px] text-brand-muted">
                {{ order.address?.city || '-' }}
              </div>
            </td>
            <td class="whitespace-nowrap px-4 py-3.5 text-brand-muted">
              {{ formatDate(order.created_at) }}
            </td>
            <td class="px-4 py-3.5 text-center text-brand-muted">
              {{ order.order_items?.length || 0 }} item
            </td>
            <td class="px-4 py-3.5">
              <UiBadge v-bind="getStatusBadge(order.status)" />
            </td>
            <td
              class="tabular whitespace-nowrap px-4 py-3.5 text-right font-semibold text-brand-ink"
            >
              {{ formatRupiah(order.total_cents / 100) }}
            </td>
            <td class="whitespace-nowrap px-4 py-3.5 text-center">
              <UiButton
                variant="outline"
                size="xs"
                icon="pi-arrow-right"
                icon-pos="right"
                :to="`/admin/orders/${order.id}`"
              >
                Detail
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div
      v-if="orders.length > 0"
      class="flex items-center justify-between border-t border-brand-hair px-4 py-3 text-xs text-brand-muted"
    >
      <span>
        Menampilkan {{ (page - 1) * pageSize + 1 }} -
        {{ Math.min(page * pageSize, totalOrders) }} dari {{ totalOrders }} pesanan
      </span>

      <div class="flex items-center gap-2">
        <UiButton variant="outline" size="xs" :disabled="page <= 1" @click="emit('prevPage')">
          Sebelumnya
        </UiButton>
        <span>Halaman {{ page }} / {{ totalPages }}</span>
        <UiButton
          variant="outline"
          size="xs"
          :disabled="page >= totalPages"
          @click="emit('nextPage')"
        >
          Berikutnya
        </UiButton>
      </div>
    </div>
  </div>
</template>
