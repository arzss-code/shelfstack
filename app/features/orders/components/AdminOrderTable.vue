<script setup lang="ts">
import type { OrderStatus } from '~/types/order'
import UiPagination from '~/components/ui/UiPagination.vue'
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
    hasActiveFilters?: boolean
  }>(),
  { sortKey: null, sortDirection: null, hasActiveFilters: false },
)

const emit = defineEmits<{
  prevPage: []
  nextPage: []
  pageChange: [page: number]
  pageSizeChange: [size: number]
  sortChange: [payload: { key: string | null; direction: 'desc' | 'asc' | null }]
  resetFilters: []
}>()

const onOrderPageChange = (nextPage: number) => {
  if (nextPage === props.page - 1) emit('prevPage')
  else if (nextPage === props.page + 1) emit('nextPage')
  emit('pageChange', nextPage)
}

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
  <div class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
    <!-- Skeleton Loading -->
    <div v-if="loading && orders.length === 0" class="space-y-3 p-4" aria-busy="true">
      <UiSkeleton v-for="i in 5" :key="i" height="h-12" />
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="p-6">
      <UiEmptyState
        :icon="hasActiveFilters ? 'pi-search' : 'pi-inbox'"
        title="Tidak ada pesanan ditemukan."
        description="Coba ubah filter status, kata kunci pencarian, atau rentang tanggal."
        :action-label="hasActiveFilters ? 'Reset Filter' : ''"
        @action="emit('resetFilters')"
      />
    </div>

    <!-- Data Table -->
    <div
      v-else
      tabindex="0"
      role="region"
      aria-label="Tabel daftar pesanan"
      :aria-busy="loading ? 'true' : undefined"
      :class="[
        'overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink transition-opacity',
        loading ? 'opacity-60' : '',
      ]"
    >
      <table class="w-full border-collapse text-left text-xs">
        <thead>
          <tr
            class="border-b border-brand-hair bg-brand-canvas-soft text-brand-muted uppercase tracking-wider text-[11px]"
          >
            <th scope="col" class="px-3.5 py-2.5" :aria-sort="getAriaSort('id')">
              <UiSortHeader
                sort-key="id"
                label="ID Pesanan"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                ID Pesanan
              </UiSortHeader>
            </th>
            <th scope="col" class="px-3.5 py-2.5" :aria-sort="getAriaSort('name')">
              <UiSortHeader
                sort-key="name"
                label="Pelanggan"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                Pelanggan
              </UiSortHeader>
            </th>
            <th scope="col" class="px-3.5 py-2.5" :aria-sort="getAriaSort('created_at')">
              <UiSortHeader
                sort-key="created_at"
                label="Tanggal"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                Tanggal
              </UiSortHeader>
            </th>
            <th scope="col" class="px-3.5 py-2.5 text-center" :aria-sort="getAriaSort('items')">
              <UiSortHeader
                sort-key="items"
                label="Item"
                align="center"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                Item
              </UiSortHeader>
            </th>
            <th scope="col" class="px-3.5 py-2.5" :aria-sort="getAriaSort('status')">
              <UiSortHeader
                sort-key="status"
                label="Status"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                Status
              </UiSortHeader>
            </th>
            <th scope="col" class="px-3.5 py-2.5 text-right" :aria-sort="getAriaSort('total')">
              <UiSortHeader
                sort-key="total"
                label="Total"
                align="right"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="(payload) => emit('sortChange', payload)"
              >
                Total
              </UiSortHeader>
            </th>
            <th scope="col" class="px-3.5 py-2.5 text-center font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft">
          <tr
            v-for="order in orders"
            :key="order.id"
            class="transition-colors hover:bg-brand-canvas-soft/60"
          >
            <td class="px-3.5 py-2.5 font-mono font-medium text-brand-ink">
              #{{ order.id.slice(0, 8) }}
            </td>
            <td class="px-3.5 py-2.5 text-brand-ink">
              <div class="max-w-[180px] truncate font-medium">
                {{ order.address?.name || 'Pelanggan' }}
              </div>
              <div class="max-w-[180px] truncate text-[10px] text-brand-muted">
                {{ order.address?.city || '-' }}
              </div>
            </td>
            <td class="whitespace-nowrap px-3.5 py-2.5 text-brand-muted">
              {{ formatDate(order.created_at) }}
            </td>
            <td class="px-3.5 py-2.5 text-center text-brand-muted">
              {{ order.order_items?.length || 0 }} item
            </td>
            <td class="px-3.5 py-2.5">
              <UiBadge v-bind="getStatusBadge(order.status)" />
            </td>
            <td
              class="tabular whitespace-nowrap px-3.5 py-2.5 text-right font-semibold text-brand-ink"
            >
              {{ formatRupiah(order.total_cents / 100) }}
            </td>
            <td class="whitespace-nowrap px-3.5 py-2.5 text-center">
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
    <UiPagination
      v-if="orders.length > 0"
      :model-value="page"
      :total-pages="totalPages"
      :total-count="totalOrders"
      :page-size="pageSize"
      :loading="loading"
      item-name="pesanan"
      compact
      @change="onOrderPageChange"
      @page-size-change="emit('pageSizeChange', $event)"
    />
  </div>
</template>
