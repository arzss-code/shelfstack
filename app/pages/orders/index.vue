<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'
import type { Database } from '~/types/database.types'
import type { Order, OrderStatus } from '~/types/order'
import OrderCard from '~/features/orders/components/OrderCard.vue'
import ReviewFormModal from '~/components/product/ReviewFormModal.vue'
import type { UiTabItem } from '~/components/ui/UiTabs.vue'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import type { RealtimeChannel } from '@supabase/supabase-js'

const { user } = useAuth()
const router = useRouter()
const supabase = useSupabaseClient<Database>()
const toast = useUiToast()
const config = useRuntimeConfig()
const { pay: openSnapModal } = useMidtransSnap()

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Riwayat Pesanan - ShelfStack',
  description: 'Daftar riwayat dan status transaksi pesanan resmi Anda di ShelfStack.',
})

// Pagination & Infinite Loading configuration
const BATCH_SIZE = 5
const orders = ref<Order[]>([])
const loading = ref(true)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const isSyncingPending = ref(false)
const errorMsg = ref('')

const activeTab = ref<string>('all')
const searchQuery = ref('')
const payingOrderId = ref<string | null>(null)

// Review Modal & Item Picker States
const isReviewModalOpen = ref(false)
const isItemPickerOpen = ref(false)
const selectedReviewOrder = ref<Order | null>(null)
const selectedReviewProduct = ref<{ id: number | string; name: string } | null>(null)

const handleOpenReview = (order: Order) => {
  selectedReviewOrder.value = order
  if (!order.items || order.items.length === 0) {
    router.push(`/orders/${order.id}`)
    return
  }

  if (order.items.length === 1 && order.items[0]) {
    const item = order.items[0]
    selectedReviewProduct.value = {
      id: item.product_id,
      name: item.product?.name || `Produk #${item.product_id}`,
    }
    isReviewModalOpen.value = true
  } else {
    isItemPickerOpen.value = true
  }
}

const selectItemToReview = (item: {
  product_id: number | string
  product?: { name?: string } | null
}) => {
  isItemPickerOpen.value = false
  selectedReviewProduct.value = {
    id: item.product_id,
    name: item.product?.name || `Produk #${item.product_id}`,
  }
  isReviewModalOpen.value = true
}

const handleReviewSuccess = () => {
  toast.show({
    severity: 'success',
    summary: 'Ulasan Terkirim',
    message: 'Terima kasih atas ulasan produk Anda.',
  })
}

interface OrderStatusCounts {
  all: number
  pending: number
  paid: number
  shipped: number
  completed: number
  cancelled: number
  [key: string]: number
}

const statusCounts = ref<OrderStatusCounts>({
  all: 0,
  pending: 0,
  paid: 0,
  shipped: 0,
  completed: 0,
  cancelled: 0,
})

const sentinelEl = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null
let channel: RealtimeChannel | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null

interface OrdersApiPayload {
  orders: Order[]
  counts: OrderStatusCounts
  has_more: boolean
}

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
            const current = orders.value[idx]
            if (idx !== -1 && current) {
              orders.value[idx] = {
                ...current,
                status: res.data.status,
                payment_type: res.data.payment_type || current.payment_type,
                paid_at: new Date().toISOString(),
              }

              // Update cached count
              if (statusCounts.value.pending && statusCounts.value.pending > 0) {
                statusCounts.value.pending -= 1
              }
              statusCounts.value.paid = (statusCounts.value.paid || 0) + 1

              toast.add({
                severity: 'success',
                summary: 'Pembayaran Diterima',
                detail: `Pesanan #${pendingOrder.id.slice(0, 8).toUpperCase()} terkonfirmasi dan sedang diproses.`,
                life: 5000,
              })
            }
          }
        } catch {
          // Background sync failures are gracefully ignored
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

// Fetch Initial Orders (Page 1)
const fetchInitialOrders = async (silent = false) => {
  if (!user.value) {
    router.push('/auth/login?redirect=/orders')
    return
  }

  if (!silent) {
    loading.value = true
  }
  errorMsg.value = ''

  try {
    const params: Record<string, string | number> = {
      from: 0,
      to: BATCH_SIZE - 1,
    }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }

    const res = await $fetch<{
      status: string
      data: OrdersApiPayload | Order[]
    }>('/api/orders', { params })

    let incomingOrders: Order[] = []
    if (Array.isArray(res.data)) {
      incomingOrders = res.data
      hasMore.value = incomingOrders.length >= BATCH_SIZE
    } else if (res.data) {
      incomingOrders = res.data.orders || []
      hasMore.value = res.data.has_more ?? incomingOrders.length >= BATCH_SIZE
      if (res.data.counts) {
        statusCounts.value = res.data.counts
      }
    }

    orders.value = incomingOrders

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

// Lazy Load More Orders on Scroll (Infinite Scroll)
const loadMoreOrders = async () => {
  if (isLoadingMore.value || !hasMore.value || loading.value) return

  isLoadingMore.value = true
  try {
    const currentCount = orders.value.length
    const params: Record<string, string | number> = {
      from: currentCount,
      to: currentCount + BATCH_SIZE - 1,
    }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }

    const res = await $fetch<{
      status: string
      data: OrdersApiPayload | Order[]
    }>('/api/orders', { params })

    let nextBatch: Order[] = []
    if (Array.isArray(res.data)) {
      nextBatch = res.data
      hasMore.value = nextBatch.length >= BATCH_SIZE
    } else if (res.data) {
      nextBatch = res.data.orders || []
      hasMore.value = res.data.has_more ?? nextBatch.length >= BATCH_SIZE
      if (res.data.counts) {
        statusCounts.value = res.data.counts
      }
    }

    if (nextBatch.length > 0) {
      const existingIds = new Set(orders.value.map((o) => o.id))
      const uniqueNewOrders = nextBatch.filter((o) => !existingIds.has(o.id))
      orders.value.push(...uniqueNewOrders)
    } else {
      hasMore.value = false
    }
  } catch {
    // Fail silently on lazy-load scroll to avoid disruptive error alerts
  } finally {
    isLoadingMore.value = false
  }
}

const setupIntersectionObserver = () => {
  if (!import.meta.client || !('IntersectionObserver' in window)) return

  if (observer) {
    observer.disconnect()
  }

  observer = new IntersectionObserver(
    (entries) => {
      const firstEntry = entries[0]
      if (
        firstEntry &&
        firstEntry.isIntersecting &&
        hasMore.value &&
        !isLoadingMore.value &&
        !loading.value
      ) {
        loadMoreOrders()
      }
    },
    { rootMargin: '200px' },
  )

  if (sentinelEl.value) {
    observer.observe(sentinelEl.value)
  }
}

// Watch Active Tab to reload Page 1 for selected status
watch(activeTab, async () => {
  orders.value = []
  hasMore.value = true
  await fetchInitialOrders()
  nextTick(() => {
    if (sentinelEl.value && observer) {
      observer.observe(sentinelEl.value)
    }
  })
})

// Direct Payment Trigger (Snap Modal)
const handlePayNow = async (orderToPay: Order) => {
  if (payingOrderId.value) return

  if (!config.public.enableMidtransSandbox) {
    toast.add({
      severity: 'warn',
      summary: 'Sandbox Nonaktif',
      detail: 'Fitur pembayaran Midtrans Sandbox saat ini dinonaktifkan.',
      life: 4000,
    })
    return
  }

  payingOrderId.value = orderToPay.id

  try {
    const res = await $fetch<{
      status: string
      data: { token: string; redirect_url?: string }
    }>(`/api/orders/${orderToPay.id}/payment-token`, {
      method: 'POST',
    })

    const snapToken = res.data.token

    openSnapModal(snapToken, {
      onSuccess: () => {
        toast.add({
          severity: 'success',
          summary: 'Pembayaran Diterima',
          detail: 'Memverifikasi status pembayaran dengan payment gateway...',
          life: 4000,
        })
        syncPendingOrders()
      },
      onPending: () => {
        toast.add({
          severity: 'info',
          summary: 'Menunggu Pembayaran',
          detail: 'Instruksi pembayaran telah aktif. Silakan selesaikan transaksi Anda.',
          life: 5000,
        })
        startPendingPolling()
      },
      onError: () => {
        toast.add({
          severity: 'error',
          summary: 'Pembayaran Gagal',
          detail: 'Terjadi kendala saat memproses pembayaran Sandbox.',
          life: 4000,
        })
      },
      onClose: () => {
        syncPendingOrders()
      },
    })
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    toast.add({
      severity: 'error',
      summary: 'Gagal Membuka Pembayaran',
      detail:
        fetchErr.data?.message ||
        'Layanan pembayaran sedang mengalami kendala. Silakan coba kembali sesaat lagi.',
      life: 5000,
    })
  } finally {
    payingOrderId.value = null
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
            const current = orders.value[idx]
            if (!current) return
            const prevStatus = current.status
            const nextStatus = updated.status as OrderStatus

            orders.value[idx] = {
              ...current,
              status: nextStatus,
              payment_type: (updated.payment_type as string) || current.payment_type,
              paid_at: (updated.paid_at as string) || current.paid_at,
            }

            if (prevStatus === 'pending' && nextStatus === 'paid') {
              toast.add({
                severity: 'success',
                summary: 'Status Diperbarui',
                detail: `Pesanan #${current.id.slice(0, 8).toUpperCase()} terkonfirmasi dan sedang diproses.`,
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
        fetchInitialOrders(true)
      },
    )
    .subscribe()
}

onMounted(async () => {
  await fetchInitialOrders()
  setupIntersectionObserver()
  setupRealtimeSubscription()

  if (import.meta.client) {
    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange)
    window.addEventListener('focus', handleVisibilityOrFocusChange)
  }
})

onUnmounted(() => {
  stopPendingPolling()
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (channel) {
    supabase.removeChannel(channel)
  }
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange)
    window.removeEventListener('focus', handleVisibilityOrFocusChange)
  }
})

// Tab Definitions with Live Counts from Database
const tabItems = computed<UiTabItem[]>(() => {
  const countPending = statusCounts.value.pending || 0
  const countPaid = statusCounts.value.paid || 0
  const countShipped = statusCounts.value.shipped || 0
  const countCompleted = statusCounts.value.completed || 0
  const countCancelled = statusCounts.value.cancelled || 0
  const countAll = statusCounts.value.all || 0

  return [
    { value: 'all', label: 'Semua', count: countAll },
    {
      value: 'pending',
      label: 'Belum Bayar',
      count: countPending,
      countTone: countPending > 0 ? 'danger' : 'neutral',
    },
    { value: 'paid', label: 'Diproses', count: countPaid },
    { value: 'shipped', label: 'Dikirim', count: countShipped },
    { value: 'completed', label: 'Selesai', count: countCompleted },
    { value: 'cancelled', label: 'Dibatalkan', count: countCancelled },
  ]
})

// Client search query filter on loaded orders
const filteredOrders = computed(() => {
  let result = orders.value

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((o) => {
      const matchId = o.id.toLowerCase().includes(query)
      const matchAddress =
        o.address?.name?.toLowerCase().includes(query) ||
        o.address?.city?.toLowerCase().includes(query)
      const matchItems = o.items?.some((item) => item.product?.name?.toLowerCase().includes(query))
      return matchId || matchAddress || matchItems
    })
  }

  return result
})

const resetFilters = () => {
  searchQuery.value = ''
  activeTab.value = 'all'
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Pesanan Saya</span>
    </nav>

    <!-- Full-Width Controls: Filter Tabs & Search Bar -->
    <div v-if="statusCounts.all > 0 || orders.length > 0 || loading" class="w-full space-y-4">
      <!-- Full-Width Tabs Filter -->
      <div class="w-full">
        <UiTabs
          v-model="activeTab"
          :items="tabItems"
          full-width
          aria-label="Filter status pesanan"
        />
      </div>

      <!-- Full-Width Search Field -->
      <div class="w-full flex items-center gap-2">
        <div class="relative w-full">
          <UiInput
            v-model="searchQuery"
            placeholder="Cari berdasarkan No. Pesanan atau nama produk..."
            left-icon="pi-search"
            size="sm"
            class="w-full"
          />
        </div>
        <UiButton
          v-if="searchQuery"
          variant="ghost"
          size="sm"
          icon="pi-times"
          @click="searchQuery = ''"
        >
          Hapus
        </UiButton>
      </div>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMsg"
      class="p-4 bg-red-50 border border-red-200 rounded-card flex items-center justify-between text-red-700 text-xs"
    >
      <span>{{ errorMsg }}</span>
      <UiButton variant="ghost" size="sm" @click="() => fetchInitialOrders()">Coba Lagi</UiButton>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div v-for="i in 3" :key="i" class="h-36 bg-brand-field rounded-card" />
    </div>

    <!-- Empty State: Belum pernah ada pesanan sama sekali -->
    <div
      v-else-if="statusCounts.all === 0 && orders.length === 0"
      class="text-center py-16 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card max-w-lg mx-auto space-y-4"
    >
      <div
        class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mx-auto text-brand-muted shadow-whisper"
      >
        <i class="pi pi-inbox text-2xl text-brand-muted" aria-hidden="true" />
      </div>
      <div>
        <h2 class="font-display text-base font-bold text-brand-ink m-0">
          Belum Ada Riwayat Pesanan
        </h2>
        <p class="font-body text-xs text-brand-muted m-0 mt-1">
          Anda belum pernah melakukan pemesanan. Jelajahi katalog dan temukan produk pilihan Anda.
        </p>
      </div>
      <UiButton to="/katalog" variant="primary" size="sm" icon="pi-arrow-right" icon-pos="right">
        Mulai Belanja
      </UiButton>
    </div>

    <!-- Empty State: Filter / Search tidak menemukan hasil -->
    <div
      v-else-if="filteredOrders.length === 0"
      class="text-center py-12 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card max-w-md mx-auto space-y-3"
    >
      <div
        class="w-12 h-12 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mx-auto text-brand-muted shadow-whisper"
      >
        <i class="pi pi-search text-xl text-brand-muted" aria-hidden="true" />
      </div>
      <div>
        <h2 class="font-display text-sm font-bold text-brand-ink m-0">
          Tidak Ada Pesanan Ditemukan
        </h2>
        <p class="font-body text-xs text-brand-muted m-0 mt-1">
          Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian Anda.
        </p>
      </div>
      <UiButton variant="secondary" size="sm" icon="pi-filter-slash" @click="resetFilters">
        Reset Filter
      </UiButton>
    </div>

    <!-- Orders List with Lazy/Infinite Scroll Sentinel -->
    <div v-else class="space-y-4">
      <OrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
        :is-paying="payingOrderId === order.id"
        @select="router.push(`/orders/${$event.id}`)"
        @pay="handlePayNow"
        @review="handleOpenReview"
      />

      <!-- Infinite Scroll Trigger Sentinel -->
      <div ref="sentinelEl" class="h-10 w-full flex items-center justify-center">
        <!-- Skeleton when fetching next batch -->
        <div v-if="isLoadingMore" class="w-full space-y-3 animate-pulse pt-2">
          <div class="h-28 bg-brand-field rounded-card" />
        </div>
      </div>

      <!-- End of List Indicator -->
      <p
        v-if="!hasMore && orders.length >= BATCH_SIZE"
        class="text-xs text-brand-faint text-center py-4 m-0"
      >
        Semua pesanan telah ditampilkan
      </p>
    </div>

    <!-- Modal Pemilihan Produk untuk Diulas (jika pesanan memiliki > 1 item) -->
    <UiModal
      v-model:visible="isItemPickerOpen"
      title="Pilih Produk untuk Diulas"
      description="Pilih salah satu produk dari pesanan ini yang ingin Anda berikan ulasan."
      size="md"
    >
      <div v-if="selectedReviewOrder?.items" class="space-y-3 pt-2">
        <div
          v-for="item in selectedReviewOrder.items"
          :key="item.id"
          class="flex items-center justify-between gap-3 p-3 rounded-card border border-brand-hair hover:border-brand-ink transition-colors bg-brand-canvas"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-12 h-12 rounded-media bg-brand-canvas-soft border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center"
            >
              <img
                v-if="item.product?.image_url"
                :src="item.product.image_url"
                :alt="item.product.name"
                class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-box text-brand-faint text-lg" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-xs sm:text-sm text-brand-ink m-0 truncate">
                {{ item.product?.name || `Produk #${item.product_id}` }}
              </p>
              <p class="text-[11px] text-brand-muted m-0 mt-0.5">{{ item.qty }} barang</p>
            </div>
          </div>
          <UiButton variant="outline" size="sm" icon="pi-pencil" @click="selectItemToReview(item)">
            Ulas
          </UiButton>
        </div>
      </div>
    </UiModal>

    <!-- Modal Tulis Ulasan Produk -->
    <ReviewFormModal
      v-if="selectedReviewProduct && selectedReviewOrder"
      v-model="isReviewModalOpen"
      :product-id="selectedReviewProduct.id"
      :product-name="selectedReviewProduct.name"
      :order-id="selectedReviewOrder.id"
      @success="handleReviewSuccess"
    />
  </div>
</template>
