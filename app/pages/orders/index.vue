<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import type { Database } from '~/types/database.types'
import type { Order, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import { useToast } from 'primevue/usetoast'
import type { RealtimeChannel } from '@supabase/supabase-js'

const { user } = useAuth()
const router = useRouter()
const supabase = useSupabaseClient<Database>()
const toast = useToast()

useSeoMeta({
  title: 'Riwayat Pesanan — ShelfStack',
  description: 'Daftar riwayat dan status transaksi pesanan resmi Anda di ShelfStack.',
})

const orders = ref<Order[]>([])
const loading = ref(true)
const isSyncingPending = ref(false)
const errorMsg = ref('')

let channel: RealtimeChannel | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null

const startPendingPolling = () => {
  if (pollInterval || !import.meta.client) return
  pollInterval = setInterval(async () => {
    const hasPending = orders.value.some((o) => o.status === 'pending')
    if (!hasPending) {
      stopPendingPolling()
      return
    }
    if (document.visibilityState === 'visible') {
      await syncPendingOrders()
    }
  }, 4000)
}

const stopPendingPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

const syncPendingOrders = async () => {
  if (isSyncingPending.value) return
  const pendingOrders = orders.value.filter((o) => o.status === 'pending')
  if (pendingOrders.length === 0) {
    stopPendingPolling()
    return
  }

  isSyncingPending.value = true
  try {
    await Promise.all(
      pendingOrders.map(async (pendingOrder) => {
        try {
          const res = await $fetch<{
            status: string
            data: {
              status: OrderStatus
              is_paid: boolean
              transaction_status?: string
              payment_type?: string
            }
          }>(`/api/orders/${pendingOrder.id}/check-payment-status`, {
            method: 'POST',
          })

          if (res.data?.is_paid) {
            const idx = orders.value.findIndex((o) => o.id === pendingOrder.id)
            if (idx !== -1) {
              orders.value[idx] = {
                ...orders.value[idx],
                status: res.data.status,
                payment_type: res.data.payment_type || orders.value[idx].payment_type,
                paid_at: new Date().toISOString(),
              }

              toast.add({
                severity: 'success',
                summary: 'Pembayaran Diterima!',
                detail: `Pesanan #${pendingOrder.id.slice(0, 8)} otomatis terkonfirmasi Lunas.`,
                life: 5000,
              })
            }
          }
        } catch {
          // Background sync failures are gracefully ignored to prevent disruption
        }
      }),
    )
  } finally {
    isSyncingPending.value = false
    if (!orders.value.some((o) => o.status === 'pending')) {
      stopPendingPolling()
    }
  }
}

const handleVisibilityOrFocusChange = () => {
  if (document.visibilityState === 'visible' && orders.value.some((o) => o.status === 'pending')) {
    syncPendingOrders()
  }
}

const fetchOrders = async (silent = false) => {
  if (!user.value) {
    router.push('/auth/login?redirect=/orders')
    return
  }

  if (!silent) {
    loading.value = true
  }
  errorMsg.value = ''

  try {
    const res = await $fetch<{ status: string; data: Order[] }>('/api/orders')
    orders.value = res.data || []

    if (orders.value.some((o) => o.status === 'pending')) {
      startPendingPolling()
      syncPendingOrders()
    } else {
      stopPendingPolling()
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMsg.value = fetchErr.data?.message || 'Gagal memuat riwayat pesanan.'
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

const setupRealtimeSubscription = () => {
  if (!user.value || !import.meta.client) return

  channel = supabase
    .channel(`orders-user-${user.value.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.value.id}`,
      },
      (payload) => {
        if (payload.new) {
          const updated = payload.new as Record<string, unknown>
          const idx = orders.value.findIndex((o) => o.id === updated.id)
          if (idx !== -1) {
            const prevStatus = orders.value[idx].status
            const nextStatus = updated.status as OrderStatus

            orders.value[idx] = {
              ...orders.value[idx],
              status: nextStatus,
              payment_type: (updated.payment_type as string) || orders.value[idx].payment_type,
              paid_at: (updated.paid_at as string) || orders.value[idx].paid_at,
            }

            if (prevStatus === 'pending' && nextStatus === 'paid') {
              toast.add({
                severity: 'success',
                summary: 'Status Terkini Realtime',
                detail: `Pesanan #${orders.value[idx].id.slice(0, 8)} berhasil terkonfirmasi Lunas.`,
                life: 5000,
              })
            }

            if (!orders.value.some((o) => o.status === 'pending')) {
              stopPendingPolling()
            }
          }
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.value.id}`,
      },
      () => {
        fetchOrders(true)
      },
    )
    .subscribe()
}

onMounted(async () => {
  await fetchOrders()
  setupRealtimeSubscription()

  if (import.meta.client) {
    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange)
    window.addEventListener('focus', handleVisibilityOrFocusChange)
  }
})

onUnmounted(() => {
  stopPendingPolling()
  if (channel) {
    supabase.removeChannel(channel)
  }
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange)
    window.removeEventListener('focus', handleVisibilityOrFocusChange)
  }
})

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'paid':
      return { variant: 'success' as const, label: 'Lunas' }
    case 'shipped':
      return { variant: 'info' as const, label: 'Dikirim' }
    case 'completed':
      return { variant: 'success' as const, label: 'Selesai' }
    case 'cancelled':
      return { variant: 'danger' as const, label: 'Dibatalkan' }
    case 'pending':
    default:
      return { variant: 'warning' as const, label: 'Menunggu Pembayaran' }
  }
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 border-b border-brand-hairsoft overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Riwayat Pesanan</span>
    </nav>

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0">Pesanan Saya</h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
          Pantau status pengiriman dan riwayat pembayaran produk kurasi Anda secara realtime.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div
          v-if="orders.some((o) => o.status === 'pending')"
          class="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200 text-xs font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Sinkronisasi Otomatis Aktif</span>
        </div>
        <div
          v-else-if="orders.length > 0"
          class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 text-xs font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Realtime Aktif</span>
        </div>

        <UiButton
          variant="secondary"
          size="sm"
          icon="pi-refresh"
          :loading="loading || isSyncingPending"
          @click="() => fetchOrders(false)"
        >
          Segarkan
        </UiButton>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMsg"
      class="p-4 bg-red-50 border border-red-200 rounded-card flex items-center justify-between text-red-700 text-xs"
    >
      <span>{{ errorMsg }}</span>
      <UiButton variant="ghost" size="sm" @click="fetchOrders">Coba Lagi</UiButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div v-for="i in 3" :key="i" class="h-28 bg-brand-field rounded-card" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="orders.length === 0"
      class="text-center py-16 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card max-w-lg mx-auto space-y-4"
    >
      <div
        class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mx-auto text-brand-muted shadow-whisper"
      >
        <i class="pi pi-inbox text-2xl text-brand-muted" />
      </div>
      <div>
        <h2 class="font-display text-base font-bold text-brand-ink m-0">
          Belum Ada Riwayat Pesanan
        </h2>
        <p class="font-body text-xs text-brand-muted m-0 mt-1">
          Anda belum pernah melakukan pemesanan. Kunjungi katalog kami dan pilih koleksi produk
          terbaik.
        </p>
      </div>
      <UiButton to="/katalog" variant="primary" size="sm" icon="pi-arrow-right" icon-pos="right">
        Mulai Belanja
      </UiButton>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <article
        v-for="order in orders"
        :key="order.id"
        class="bg-white border border-brand-hair rounded-card p-5 sm:p-6 shadow-whisper hover:border-brand-ink/30 transition-all cursor-pointer space-y-4"
        @click="router.push(`/orders/${order.id}`)"
      >
        <!-- Top Metadata Row -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-brand-hairsoft"
        >
          <div class="flex items-center gap-3">
            <span class="font-display font-bold text-xs sm:text-sm text-brand-ink tracking-tight">
              Order #{{ order.id.slice(0, 8) }}
            </span>
            <span class="text-brand-faint">·</span>
            <span class="text-[11px] text-brand-muted">
              {{ formatDate(order.created_at) }}
            </span>
          </div>

          <UiBadge
            :variant="getStatusBadge(order.status).variant"
            :label="getStatusBadge(order.status).label"
          />
        </div>

        <!-- Middle Summary Row -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1 text-xs">
            <p class="text-brand-muted m-0">
              Penerima:
              <strong class="text-brand-ink">{{
                (order.address as any)?.name || 'Pelanggan'
              }}</strong>
            </p>
            <p class="text-[11px] text-brand-muted m-0 truncate max-w-md">
              {{ (order.address as any)?.street }}, {{ (order.address as any)?.city }}
            </p>
          </div>

          <div
            class="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-hairsoft"
          >
            <div class="text-left sm:text-right">
              <span class="text-[11px] text-brand-muted block">Total Belanja</span>
              <span class="font-display text-base font-bold text-brand-ink tabular-nums">
                {{ formatRupiah(order.total_cents / 100) }}
              </span>
            </div>

            <UiButton
              :to="`/orders/${order.id}`"
              variant="secondary"
              size="sm"
              icon="pi-chevron-right"
              icon-pos="right"
              @click.stop
            >
              Detail
            </UiButton>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
