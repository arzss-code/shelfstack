<script setup lang="ts">
import type { OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Kelola Pesanan — Admin ShelfStack',
  description: 'Daftar seluruh transaksi pesanan toko ShelfStack dengan filter status terpadu.',
})

interface AdminOrderRow {
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

const route = useRoute()
const router = useRouter()

const activeStatus = ref<string>((route.query.status as string) || '')
const searchQuery = ref('')
const page = ref(1)
const pageSize = 15

const loading = ref(true)
const orders = ref<AdminOrderRow[]>([])
const totalOrders = ref(0)
const errorMessage = ref('')

const statusTabs = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Lunas', value: 'paid' },
  { label: 'Dikirim', value: 'shipped' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Dibatalkan', value: 'cancelled' },
]

const fetchOrders = async () => {
  loading.value = true
  errorMessage.value = ''

  const from = (page.value - 1) * pageSize
  const to = from + pageSize - 1

  try {
    const params: Record<string, string | number> = {
      from,
      to,
    }
    if (activeStatus.value) params.status = activeStatus.value
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

    const res = await $fetch<{
      status: string
      data: { orders: AdminOrderRow[]; total: number }
    }>('/api/admin/orders', { params })

    orders.value = res.data.orders
    totalOrders.value = res.data.total
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMessage.value = fetchErr.data?.message || 'Gagal memuat daftar pesanan admin.'
  } finally {
    loading.value = false
  }
}

const onStatusChange = (val: string) => {
  activeStatus.value = val
  page.value = 1
  router.push({ query: val ? { status: val } : {} })
  fetchOrders()
}

const onSearch = () => {
  page.value = 1
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize) || 1)

const prevPage = () => {
  if (page.value > 1) {
    page.value--
    fetchOrders()
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
    fetchOrders()
  }
}
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0">
          Kelola Pesanan
        </h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
          Pantau seluruh pesanan, verifikasi pembayaran, dan jalankan pembaruan logistik.
        </p>
      </div>

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

    <!-- Filter & Search Controls -->
    <div
      class="flex flex-col gap-4 rounded-2xl border border-brand-hair bg-brand-canvas-soft p-4 md:flex-row md:items-center md:justify-between"
    >
      <!-- Status Tabs -->
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          type="button"
          class="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
          :class="[
            activeStatus === tab.value
              ? 'bg-brand-ink text-brand-onink shadow-whisper'
              : 'text-brand-muted hover:bg-brand-canvas hover:text-brand-ink',
          ]"
          @click="onStatusChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search Input -->
      <form class="flex items-center gap-2" @submit.prevent="onSearch">
        <div class="relative w-full sm:w-64">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted"
          />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari ID / Nama..."
            class="w-full rounded-full border border-brand-hair bg-brand-canvas py-1.5 pl-8 pr-3 text-xs text-brand-ink placeholder:text-brand-muted focus:border-brand-ink focus:outline-none"
          />
        </div>
        <UiButton variant="secondary" size="sm" type="submit">Cari</UiButton>
      </form>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400"
    >
      {{ errorMessage }}
    </div>

    <!-- Orders Table Container -->
    <div
      class="overflow-hidden rounded-2xl border border-brand-hair bg-brand-canvas-soft shadow-whisper"
    >
      <div v-if="loading" class="space-y-3 p-6">
        <div
          v-for="i in 5"
          :key="i"
          class="h-12 w-full animate-pulse rounded-xl bg-brand-hairsoft"
        />
      </div>

      <div v-else-if="orders.length === 0" class="py-16 text-center">
        <i class="pi pi-inbox text-3xl text-brand-muted mb-2 block" />
        <p class="text-xs text-brand-muted m-0">Tidak ada pesanan ditemukan.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
            >
              <th class="py-3 px-4 font-semibold">ID Pesanan</th>
              <th class="py-3 px-4 font-semibold">Pelanggan</th>
              <th class="py-3 px-4 font-semibold">Tanggal</th>
              <th class="py-3 px-4 font-semibold text-center">Item</th>
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
            class="rounded-full border border-brand-hair px-3 py-1 font-medium disabled:opacity-40"
            @click="prevPage"
          >
            Sebelumnya
          </button>
          <span>Halaman {{ page }} / {{ totalPages }}</span>
          <button
            type="button"
            :disabled="page >= totalPages"
            class="rounded-full border border-brand-hair px-3 py-1 font-medium disabled:opacity-40"
            @click="nextPage"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
