import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useOrderPaymentSync } from '~/composables/useOrderPaymentSync'
import { useOrderPolling } from '~/composables/useOrderPolling'
import { useUiToast } from '~/composables/useUiToast'
import { acquireRealtimeChannel, teardownRealtimeChannel } from '~/utils/supabase-realtime'
import {
  createOrderTabItems,
  filterOrdersByQuery,
  queryOrdersApi,
  syncOrderPaymentStatus,
  type OrderStatusCounts,
} from '~/utils/order-presentation'
import type { Database } from '~/types/database.types'
import type { Order, OrderStatus } from '~/types/order'
import type { UiTabItem } from '~/components/ui/UiTabs.vue'

const BATCH_SIZE = 5

export function useOrdersList() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = useSupabaseClient<Database>()
  const toast = useUiToast()
  const { launchSnapPayment } = useOrderPaymentSync()

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

  const statusCounts = ref<OrderStatusCounts>({
    all: 0,
    pending: 0,
    paid: 0,
    shipped: 0,
    completed: 0,
    cancelled: 0,
  })

  // --- Tab & Search ---
  const tabItems = computed<UiTabItem[]>(() => createOrderTabItems(statusCounts.value))
  const filteredOrders = computed(() => filterOrdersByQuery(orders.value, searchQuery.value))

  const updateOrderInList = (id: string, patch: Partial<Order>) => {
    const idx = orders.value.findIndex((o) => o.id === id)
    if (idx !== -1 && orders.value[idx]) {
      orders.value[idx] = { ...orders.value[idx], ...patch }
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
          const res = await syncOrderPaymentStatus(pendingOrder.id)
          if (res?.is_paid) {
            updateOrderInList(pendingOrder.id, {
              status: res.status,
              payment_type: res.payment_type || undefined,
              paid_at: new Date().toISOString(),
            })
            if (statusCounts.value.pending) statusCounts.value.pending -= 1
            statusCounts.value.paid = (statusCounts.value.paid || 0) + 1
            toast.show({
              title: 'Pembayaran Diterima',
              message: `Pesanan #${pendingOrder.id.slice(0, 8).toUpperCase()} terkonfirmasi dan sedang diproses.`,
              tone: 'success',
            })
          }
        }),
      )
    } finally {
      isSyncingPending.value = false
      if (!orders.value.some((o) => o.status === 'pending')) stopPendingPolling()
    }
  }

  const polling = useOrderPolling(async () => {
    if (orders.value.some((o) => o.status === 'pending')) await syncPendingOrders()
  })
  const { startPolling: startPendingPolling, stopPolling: stopPendingPolling } = polling

  // --- Fetch orders ---
  const fetchInitialOrders = async (silent = false) => {
    if (!user.value) {
      router.push('/auth/login?redirect=/orders')
      return
    }
    if (!silent) loading.value = true
    errorMsg.value = ''

    try {
      const res = await queryOrdersApi(0, BATCH_SIZE - 1, activeTab.value, BATCH_SIZE)
      orders.value = res.list
      hasMore.value = res.hasMore
      if (res.counts) statusCounts.value = res.counts

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
      const res = await queryOrdersApi(
        currentCount,
        currentCount + BATCH_SIZE - 1,
        activeTab.value,
        BATCH_SIZE,
      )
      if (res.counts) statusCounts.value = res.counts

      if (res.list.length > 0) {
        const existingIds = new Set(orders.value.map((o) => o.id))
        orders.value.push(...res.list.filter((o) => !existingIds.has(o.id)))
        hasMore.value = res.hasMore
      } else {
        hasMore.value = false
      }
    } catch {
      // Fail silently on scroll
    } finally {
      isLoadingMore.value = false
    }
  }

  // --- Pay ---
  const handlePayNow = async (orderToPay: Order) => {
    if (payingOrderId.value) return
    payingOrderId.value = orderToPay.id
    try {
      await launchSnapPayment(orderToPay.id, {
        onSuccess: syncPendingOrders,
        onPending: startPendingPolling,
        onClose: syncPendingOrders,
      })
    } finally {
      payingOrderId.value = null
    }
  }

  // --- Realtime subscription ---
  const teardownRealtimeSubscription = () => {
    if (channel) {
      teardownRealtimeChannel(supabase, channel)
      channel = null
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user.value || !import.meta.client) return
    teardownRealtimeSubscription()
    channel = acquireRealtimeChannel(supabase, `orders-user-${user.value.id}`)
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
          const prev = orders.value.find((o) => o.id === updated.id)
          if (!prev) return
          const prevStatus = prev.status
          const nextStatus = updated.status as OrderStatus
          updateOrderInList(updated.id as string, {
            status: nextStatus,
            payment_type: (updated.payment_type as string) || prev.payment_type,
            paid_at: (updated.paid_at as string) || prev.paid_at,
          })
          if (prevStatus === 'pending' && nextStatus === 'paid') {
            toast.show({
              title: 'Status Diperbarui',
              message: `Pesanan #${prev.id.slice(0, 8).toUpperCase()} terkonfirmasi dan sedang diproses.`,
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
    polling.setupVisibilityListeners()
  })

  onUnmounted(() => {
    polling.teardownVisibilityListeners()
    observer?.disconnect()
    observer = null
    teardownRealtimeSubscription()
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
