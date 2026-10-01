<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import type { Order, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'

const { user } = useAuth()
const router = useRouter()

useSeoMeta({
  title: 'Riwayat Pesanan — ShelfStack',
  description: 'Daftar riwayat dan status transaksi pesanan resmi Anda di ShelfStack.',
})

const orders = ref<Order[]>([])
const loading = ref(true)
const errorMsg = ref('')

const fetchOrders = async () => {
  if (!user.value) {
    router.push('/auth/login?redirect=/orders')
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    const res = await $fetch<{ status: string; data: Order[] }>('/api/orders')
    orders.value = res.data || []
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMsg.value = fetchErr.data?.message || 'Gagal memuat riwayat pesanan.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrders()
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
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0">Pesanan Saya</h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
          Pantau status pengiriman dan riwayat pembayaran produk kurasi Anda secara realtime.
        </p>
      </div>

      <UiButton
        variant="secondary"
        size="sm"
        icon="pi-refresh"
        :loading="loading"
        @click="fetchOrders"
      >
        Segarkan
      </UiButton>
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
