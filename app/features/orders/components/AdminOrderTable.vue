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

const sortIconClass = (key: string) => {
  if (props.sortKey !== key || !props.sortDirection) return 'pi pi-sort'
  return props.sortDirection === 'desc' ? 'pi pi-sort-down' : 'pi pi-sort-up'
}

const handleSortClick = (key: string) => {
  if (props.sortKey !== key || !props.sortDirection) {
    emit('sortChange', { key, direction: 'desc' })
  } else if (props.sortDirection === 'desc') {
    emit('sortChange', { key, direction: 'asc' })
  } else {
    emit('sortChange', { key: null, direction: null })
  }
}

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
    <div v-if="loading" class="space-y-3 p-6">
      <div v-for="i in 5" :key="i" class="h-12 w-full animate-pulse rounded-xl bg-brand-hairsoft" />
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="py-16 text-center">
      <i class="pi pi-inbox text-3xl text-brand-muted mb-2 block" />
      <p class="text-xs text-brand-muted m-0">Tidak ada pesanan ditemukan.</p>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr
            class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
          >
            <th class="py-3 px-4 font-semibold">
              <button
                type="button"
                class="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-[11px] hover:text-brand-ink transition-colors"
                aria-label="Urutkan berdasarkan ID pesanan"
                @click="handleSortClick('id')"
              >
                <span>ID Pesanan</span>
                <i :class="sortIconClass('id')" class="text-[10px] text-brand-muted" />
              </button>
            </th>
            <th class="py-3 px-4 font-semibold">
              <button
                type="button"
                class="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-[11px] hover:text-brand-ink transition-colors"
                aria-label="Urutkan berdasarkan pelanggan"
                @click="handleSortClick('name')"
              >
                <span>Pelanggan</span>
                <i :class="sortIconClass('name')" class="text-[10px] text-brand-muted" />
              </button>
            </th>
            <th class="py-3 px-4 font-semibold">
              <button
                type="button"
                class="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-[11px] hover:text-brand-ink transition-colors"
                aria-label="Urutkan berdasarkan tanggal"
                @click="handleSortClick('created_at')"
              >
                <span>Tanggal</span>
                <i :class="sortIconClass('created_at')" class="text-[10px] text-brand-muted" />
              </button>
            </th>
            <th class="py-3 px-4 font-semibold text-center">Item</th>
            <th class="py-3 px-4 font-semibold">Status</th>
            <th class="py-3 px-4 font-semibold text-right">
              <button
                type="button"
                class="inline-flex items-center justify-end gap-1 font-semibold uppercase tracking-wider text-[11px] hover:text-brand-ink transition-colors w-full text-right"
                aria-label="Urutkan berdasarkan total"
                @click="handleSortClick('total')"
              >
                <span>Total</span>
                <i :class="sortIconClass('total')" class="text-[10px] text-brand-muted" />
              </button>
            </th>
            <th class="py-3 px-4 font-semibold text-center">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft">
          <tr
            v-for="order in orders"
            :key="order.id"
            class="hover:bg-brand-canvas transition-colors"
          >
            <td class="py-3.5 px-4 font-mono font-medium text-brand-ink">
              #{{ order.id.slice(0, 8) }}
            </td>
            <td class="py-3.5 px-4 text-brand-ink">
              <div class="font-medium truncate max-w-[180px]">
                {{ order.address?.name || 'Pelanggan' }}
              </div>
              <div class="text-[10px] text-brand-muted truncate max-w-[180px]">
                {{ order.address?.city || '-' }}
              </div>
            </td>
            <td class="py-3.5 px-4 text-brand-muted whitespace-nowrap">
              {{ formatDate(order.created_at) }}
            </td>
            <td class="py-3.5 px-4 text-center text-brand-muted">
              {{ order.order_items?.length || 0 }} item
            </td>
            <td class="py-3.5 px-4">
              <UiBadge
                :label="getStatusBadge(order.status).label"
                :variant="getStatusBadge(order.status).variant"
              />
            </td>
            <td class="py-3.5 px-4 text-right font-semibold text-brand-ink whitespace-nowrap">
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
        <button
          type="button"
          :disabled="page <= 1"
          class="rounded-full border border-brand-hair px-3 py-1 font-medium disabled:opacity-40 hover:bg-brand-canvas transition-colors"
          @click="emit('prevPage')"
        >
          Sebelumnya
        </button>
        <span>Halaman {{ page }} / {{ totalPages }}</span>
        <button
          type="button"
          :disabled="page >= totalPages"
          class="rounded-full border border-brand-hair px-3 py-1 font-medium disabled:opacity-40 hover:bg-brand-canvas transition-colors"
          @click="emit('nextPage')"
        >
          Berikutnya
        </button>
      </div>
    </div>
  </div>
</template>
