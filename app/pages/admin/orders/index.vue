<script setup lang="ts">
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useToast } from 'primevue/usetoast'
import AdminOrderTable, {
  type AdminOrderRow,
} from '~/features/orders/components/AdminOrderTable.vue'
import type { Database } from '~/types/database.types'
import type { OrderStatus } from '~/types/order'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Kelola Pesanan - Admin ShelfStack',
  description: 'Daftar seluruh transaksi pesanan toko ShelfStack dengan filter status terpadu.',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const supabase = useSupabaseClient<Database>()

const activeStatus = ref<string>((route.query.status as string) || '')
const searchQuery = ref('')
const fromDate = ref('')
const toDate = ref('')
const page = ref(1)
const pageSize = 15
const sortKey = ref<string | null>(null)
const sortDirection = ref<'desc' | 'asc' | null>(null)

const sortParam = computed(() => {
  if (!sortKey.value || !sortDirection.value) return ''
  const col = sortKey.value === 'id' ? 'created_at' : sortKey.value
  return `${col}_${sortDirection.value}`
})

const loading = ref(true)
const orders = ref<AdminOrderRow[]>([])
const totalOrders = ref(0)
const errorMessage = ref('')
let orderChannel: RealtimeChannel | null = null

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
    const params: Record<string, string | number> = { from, to }
    if (activeStatus.value) params.status = activeStatus.value
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (sortParam.value) params.sort = sortParam.value

    const res = await $fetch<{ status: string; data: { orders: AdminOrderRow[]; total: number } }>(
      '/api/admin/orders',
      { params },
    )
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

const onSortChange = (payload: { key: string | null; direction: 'desc' | 'asc' | null }) => {
  sortKey.value = payload.key
  sortDirection.value = payload.direction
  page.value = 1
  fetchOrders()
}

const exporting = ref(false)

const handleExportCsv = async () => {
  exporting.value = true
  try {
    const params: Record<string, string> = {}
    if (activeStatus.value) params.status = activeStatus.value
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (fromDate.value) params.from = fromDate.value
    if (toDate.value) params.to = toDate.value
    if (sortParam.value) params.sort = sortParam.value

    const res = await $fetch<string>('/api/admin/orders/export', { params, responseType: 'text' })
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `laporan-pesanan-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.add({
      severity: 'success',
      summary: 'Ekspor Berhasil',
      detail: 'Laporan CSV pesanan berhasil diunduh.',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Gagal Ekspor',
      detail: 'Gagal mengunduh laporan CSV pesanan.',
      life: 5000,
    })
  } finally {
    exporting.value = false
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

const setupRealtime = () => {
  if (!import.meta.client) return

  orderChannel = supabase
    .channel('admin-orders-stream')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        const newRecord = payload.new as Record<string, unknown>
        const shortId = String(newRecord.id || '').slice(0, 8)
        toast.add({
          severity: 'info',
          summary: 'Pesanan Baru Diterima',
          detail: `Pesanan #${shortId} baru saja masuk. Memperbarui daftar...`,
          life: 5000,
        })
        fetchOrders()
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        const updated = payload.new as Record<string, unknown>
        const targetId = String(updated.id || '')
        const targetIndex = orders.value.findIndex((o) => o.id === targetId)

        if (targetIndex !== -1) {
          const currentOrder = orders.value[targetIndex]
          if (currentOrder) {
            orders.value[targetIndex] = {
              ...currentOrder,
              status: (updated.status as OrderStatus) || currentOrder.status,
              total_cents:
                typeof updated.total_cents === 'number'
                  ? updated.total_cents
                  : currentOrder.total_cents,
            }
          }
          toast.add({
            severity: 'secondary',
            summary: 'Status Diperbarui',
            detail: `Pesanan #${targetId.slice(0, 8)} status kini: ${updated.status}.`,
            life: 4000,
          })
        }
      },
    )
    .subscribe()
}

onMounted(() => {
  fetchOrders()
  setupRealtime()
})

onUnmounted(async () => {
  if (orderChannel) {
    await supabase.removeChannel(orderChannel)
    orderChannel = null
  }
})
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
            class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="onSearch">
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
        <input
          v-model="fromDate"
          type="date"
          aria-label="Tanggal mulai"
          title="Tanggal mulai"
          class="rounded-full border border-brand-hair bg-brand-canvas px-3 py-1.5 text-xs text-brand-ink focus:border-brand-ink focus:outline-none"
        />
        <span class="text-xs text-brand-muted">s.d.</span>
        <input
          v-model="toDate"
          type="date"
          aria-label="Tanggal akhir"
          title="Tanggal akhir"
          class="rounded-full border border-brand-hair bg-brand-canvas px-3 py-1.5 text-xs text-brand-ink focus:border-brand-ink focus:outline-none"
        />
        <UiButton variant="secondary" size="sm" type="submit">Cari</UiButton>
      </form>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-400"
    >
      {{ errorMessage }}
    </div>

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
