import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import { useUiToast } from '~/composables/useUiToast'
import type { Database } from '~/types/database.types'
import type { Order, OrderStatus } from '~/types/order'
import type { UiTabItem } from '~/components/ui/UiTabs.vue'
import type { RealtimeChannel } from '@supabase/supabase-js'

const BATCH_SIZE = 5

interface OrderStatusCounts {
  all: number
  pending: number
  paid: number
  shipped: number
  completed: number
  cancelled: number
  [key: string]: number
}

interface OrdersApiPayload {
  orders: Order[]
  counts: OrderStatusCounts
  has_more: boolean
}

export function useOrdersList() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = useSupabaseClient<Database>()
  const toast = useUiToast()
  const config = useRuntimeConfig()
  const { pay: openSnapModal } = useMidtransSnap()

  const orders = ref<Order[]>([])
  const loading = ref(true)
  const isLoadingMore = ref(false)
  const hasMore = ref(true)
  const isSyncingPending = ref(false)
  const errorMsg = ref('')
  const activeTab = ref<string>('all')
  const searchQuery = ref('')
  const payingOrderId = ref<string | null>(null)

  let channel: RealtimeChannel | null = null
  let pollInterval: ReturnType<typeof setInterval> | null = null

  const statusCounts = ref<OrderStatusCounts>({
    all: 0,
    pending: 0,
    paid: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
  })

  // --- Tab definitions ---

  const tabItems = computed<UiTabItem[]>(() => {
    const countPending = statusCounts.value.pending || 0
    return [
      { value: 'all', label: 'Semua', count: statusCounts.value.all || 0 },
      {
        value: 'pending',
        label: 'Belum Bayar',
        count: countPending,
        countTone: countPending > 0 ? 'danger' : 'neutral',
      },
      { value: 'paid', label: 'Diproses', count: statusCounts.value.paid || 0 },
      { value: 'shipped', label: 'Dikirim', count: statusCounts.value.shipped || 0 },
      { value: 'completed', label: 'Selesai', count: statusCounts.value.completed || 0 },
      { value: 'cancelled', label: 'Dibatalkan', count: statusCounts.value.cancelled || 0 },
    ]
  })

  // --- Client-side search filter ---

  const filteredOrders = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return orders.value
    return orders.value.filter((o) => {
      const matchId = o.id.toLowerCase().includes(query)
      const matchAddress =
        o.address?.name?.toLowerCase().includes(query) ||
        o.address?.city?.toLowerCase().includes(query)
      const matchItems = o.items?.some((item) => item.product?.name?.toLowerCase().includes(query))
      return matchId || matchAddress || matchItems
    })
  })

  // --- Polling helpers for pending orders ---

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
            }>(`/api/orders/${pendingOrder.id}/check-payment-status`, { method: 'POST' })

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
                if (statusCounts.value.pending && statusCounts.value.pending > 0) {
                  statusCounts.value.pending -= 1
                }
                statusCounts.value.paid = (statusCounts.value.paid || 0) + 1
                toast.show({
                  title: 'Pembayaran Diterima',
                  message: `Pesanan #${pendingOrder.id.slice(0, 8).toUpperCase()} terkonfirmasi dan sedang diproses.`,
                  tone: 'success',
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

  const handleVisibilityOrFocusChange = () => {
    if (
      document.visibilityState === 'visible' &&
      orders.value.some((o) => o.status === 'pending')
    ) {
      syncPendingOrders()
    }
  }

  // --- Fetch orders ---

  const fetchInitialOrders = async (silent = false) => {
    if (!user.value) {
      router.push('/auth/login?redirect=/orders')
      return
    }
    if (!silent) loading.value = true
    errorMsg.value = ''

    try {
      const params: Record<string, string | number> = { from: 0, to: BATCH_SIZE - 1 }
      if (activeTab.value !== 'all') params.status = activeTab.value

      const res = await $fetch<{ status: string; data: OrdersApiPayload | Order[] }>(
        '/api/orders',
        {
          params,
        },
      )

      let incomingOrders: Order[] = []
      if (Array.isArray(res.data)) {
        incomingOrders = res.data
        hasMore.value = incomingOrders.length >= BATCH_SIZE
      } else if (res.data) {
        incomingOrders = res.data.orders || []
        hasMore.value = res.data.has_more ?? incomingOrders.length >= BATCH_SIZE
        if (res.data.counts) statusCounts.value = res.data.counts
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
      if (!silent) loading.value = false
    }
  }

  const loadMoreOrders = async () => {
    if (isLoadingMore.value || !hasMore.value || loading.value) return
    isLoadingMore.value = true
    try {
      const currentCount = orders.value.length
      const params: Record<string, string | number> = {
        from: currentCount,
        to: currentCount + BATCH_SIZE - 1,
      }
      if (activeTab.value !== 'all') params.status = activeTab.value

      const res = await $fetch<{ status: string; data: OrdersApiPayload | Order[] }>(
        '/api/orders',
        {
          params,
        },
      )

      let nextBatch: Order[] = []
      if (Array.isArray(res.data)) {
        nextBatch = res.data
        hasMore.value = nextBatch.length >= BATCH_SIZE
      } else if (res.data) {
        nextBatch = res.data.orders || []
        hasMore.value = res.data.has_more ?? nextBatch.length >= BATCH_SIZE
        if (res.data.counts) statusCounts.value = res.data.counts
      }

      if (nextBatch.length > 0) {
        const existingIds = new Set(orders.value.map((o) => o.id))
        orders.value.push(...nextBatch.filter((o) => !existingIds.has(o.id)))
      } else {
        hasMore.value = false
      }
    } catch {
      // Fail silently on lazy-load scroll to avoid disruptive error alerts
    } finally {
      isLoadingMore.value = false
    }
  }

  // --- Pay ---

  const handlePayNow = async (orderToPay: Order) => {
    if (payingOrderId.value) return

    if (!config.public.enableMidtransSandbox) {
      toast.show({
        title: 'Sandbox Nonaktif',
        message: 'Fitur pembayaran Midtrans Sandbox saat ini dinonaktifkan.',
        tone: 'warn',
      })
      return
    }

    payingOrderId.value = orderToPay.id
    try {
      const res = await $fetch<{ status: string; data: { token: string; redirect_url?: string } }>(
        `/api/orders/${orderToPay.id}/payment-token`,
        { method: 'POST' },
      )
      openSnapModal(res.data.token, {
        onSuccess: () => {
          toast.show({
            title: 'Pembayaran Diterima',
            message: 'Memverifikasi status pembayaran dengan payment gateway...',
            tone: 'success',
          })
          syncPendingOrders()
        },
        onPending: () => {
          toast.show({
            title: 'Menunggu Pembayaran',
            message: 'Instruksi pembayaran telah aktif. Silakan selesaikan transaksi Anda.',
            tone: 'info',
          })
          startPendingPolling()
        },
        onError: () => {
          toast.show({
            title: 'Pembayaran Gagal',
            message: 'Terjadi kendala saat memproses pembayaran Sandbox.',
            tone: 'error',
          })
        },
        onClose: () => {
          syncPendingOrders()
        },
      })
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.show({
        title: 'Gagal Membuka Pembayaran',
        message:
          fetchErr.data?.message ||
          'Layanan pembayaran sedang mengalami kendala. Silakan coba kembali sesaat lagi.',
        tone: 'error',
      })
    } finally {
      payingOrderId.value = null
    }
  }

  // --- Realtime subscription ---

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
          if (!payload.new) return
          const updated = payload.new as Record<string, unknown>
          const idx = orders.value.findIndex((o) => o.id === updated.id)
          if (idx === -1) return
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
            toast.show({
              title: 'Status Diperbarui',
              message: `Pesanan #${current.id.slice(0, 8).toUpperCase()} terkonfirmasi dan sedang diproses.`,
              tone: 'success',
            })
          }
          if (!orders.value.some((o) => o.status === 'pending')) stopPendingPolling()
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
        () => fetchInitialOrders(true),
      )
      .subscribe()
  }

  // --- Infinite scroll sentinel ---

  const sentinelEl = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  const setupIntersectionObserver = () => {
    if (!import.meta.client || !('IntersectionObserver' in window)) return
    if (observer) observer.disconnect()
    observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (firstEntry?.isIntersecting && hasMore.value && !isLoadingMore.value && !loading.value) {
          loadMoreOrders()
        }
      },
      { rootMargin: '200px' },
    )
    if (sentinelEl.value) observer.observe(sentinelEl.value)
  }

  watch(activeTab, async () => {
    orders.value = []
    hasMore.value = true
    await fetchInitialOrders()
    nextTick(() => {
      if (sentinelEl.value && observer) observer.observe(sentinelEl.value)
    })
  })

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
    if (channel) supabase.removeChannel(channel)
    if (import.meta.client) {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange)
      window.removeEventListener('focus', handleVisibilityOrFocusChange)
    }
  })

  const resetFilters = () => {
    searchQuery.value = ''
    activeTab.value = 'all'
  }

  return {
    BATCH_SIZE,
    orders,
    loading,
    isLoadingMore,
    hasMore,
    errorMsg,
    activeTab,
    searchQuery,
    payingOrderId,
    statusCounts,
    tabItems,
    filteredOrders,
    sentinelEl,
    fetchInitialOrders,
    handlePayNow,
    resetFilters,
    syncPendingOrders,
    setupIntersectionObserver,
  }
}
