import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useCartStore } from '~/features/cart/stores/cart'
import { useOrderPaymentSync } from '~/composables/useOrderPaymentSync'
import { useOrderPolling } from '~/composables/useOrderPolling'
import { useOrderTracking } from '~/composables/useOrderTracking'
import { useUiToast } from '~/composables/useUiToast'
import { acquireRealtimeChannel, teardownRealtimeChannel } from '~/utils/supabase-realtime'
import {
  computeOrderDetailSteps,
  formatOrderDate,
  formatShippingServiceLabel,
  getOrderStatusBadge,
  getPaymentStatusBadge,
  getTimelineSegmentColor,
  syncOrderPaymentStatus,
  type OrderStep,
} from '~/utils/order-presentation'
import type { Database } from '~/types/database.types'
import type { Order, OrderStatus } from '~/types/order'

export function useOrderDetail(orderId: string) {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = useSupabaseClient<Database>()
  const toast = useUiToast()
  const cartStore = useCartStore()
  const { launchSnapPayment } = useOrderPaymentSync()

  const order = ref<Order | null>(null)
  const loading = ref(true)
  const isPaying = ref(false)
  const isCancelling = ref(false)
  const isManualChecking = ref(false)
  const isConfirmingDelivery = ref(false)
  const errorMsg = ref('')

  let channel: RealtimeChannel | null = null
  const tracking = useOrderTracking(orderId, order)

  const formatShippingServiceName = (service?: string | null) => formatShippingServiceLabel(service)

  const handleCheckPaymentStatus = async (silent = false) => {
    if (!order.value) return
    if (!silent) isManualChecking.value = true
    try {
      const res = await syncOrderPaymentStatus(orderId)
      if (res) {
        const wasPending = order.value.status === 'pending'
        order.value.status = res.status
        if (res.payment_type) order.value.payment_type = res.payment_type
        if (res.is_paid) {
          order.value.paid_at = new Date().toISOString()
          stopPolling()
          if (!silent || wasPending) {
            toast.show({
              title: 'Pembayaran Dikonfirmasi',
              message: 'Transaksi berhasil diverifikasi. Pesanan sedang diproses.',
              tone: 'success',
            })
          }
        } else if (res.status === 'cancelled') {
          stopPolling()
          if (!silent || wasPending) {
            toast.show({
              title: 'Waktu Pembayaran Habis',
              message: 'Batas waktu pembayaran telah berakhir. Pesanan dibatalkan otomatis.',
              tone: 'warn',
            })
          }
        } else if (!silent) {
          toast.show({
            title: 'Status Terkini',
            message: 'Pembayaran belum terverifikasi atau transaksi masih pending.',
            tone: 'info',
          })
        }
      } else if (!silent) {
        toast.show({
          title: 'Kendala Sinkronisasi',
          message: 'Gagal memeriksa status ke payment gateway.',
          tone: 'warn',
        })
      }
    } finally {
      if (!silent) isManualChecking.value = false
    }
  }

  const { startPolling, stopPolling, setupVisibilityListeners, teardownVisibilityListeners } =
    useOrderPolling(async () => {
      if (order.value?.status === 'pending') await handleCheckPaymentStatus(true)
      else stopPolling()
    }, 3500)

  const fetchOrderDetail = async (silent = false) => {
    if (!user.value) {
      router.push(`/auth/login?redirect=/orders/${orderId}`)
      return
    }
    if (!silent) loading.value = true
    errorMsg.value = ''
    try {
      const res = await $fetch<{ status: string; data: Order }>(`/api/orders/${orderId}`)
      order.value = res.data
      await tracking.fetchCustomerTracking()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      errorMsg.value = fetchErr.data?.message || 'Pesanan tidak ditemukan atau akses ditolak.'
    } finally {
      if (!silent) loading.value = false
    }
  }

  const handlePaymentExpired = async () => {
    if (!order.value || order.value.status !== 'pending') return
    order.value.status = 'cancelled'
    stopPolling()
    await handleCheckPaymentStatus(true)
  }

  const handlePayNow = async () => {
    if (!order.value || isPaying.value) return
    isPaying.value = true
    try {
      await launchSnapPayment(orderId, {
        onSuccess: () => handleCheckPaymentStatus(true),
        onPending: () => startPolling(),
        onClose: () => {
          startPolling()
          handleCheckPaymentStatus(true)
        },
      })
    } finally {
      isPaying.value = false
    }
  }

  const notifyError = (title: string, err: unknown, fallback: string) => {
    const fetchErr = err as { data?: { message?: string } }
    toast.show({ title, message: fetchErr.data?.message || fallback, tone: 'error' })
  }

  const handleCancelOrder = async (reason: string) => {
    if (!order.value || isCancelling.value) return false
    isCancelling.value = true
    try {
      await $fetch(`/api/orders/${orderId}/cancel`, { method: 'POST', body: { reason } })
      stopPolling()
      toast.show({
        title: 'Pesanan Dibatalkan',
        message: 'Pesanan berhasil dibatalkan dan stok dikembalikan.',
        tone: 'success',
      })
      await fetchOrderDetail()
      return true
    } catch (err: unknown) {
      notifyError('Gagal Membatalkan', err, 'Gagal membatalkan pesanan.')
      return false
    } finally {
      isCancelling.value = false
    }
  }

  const handleReorder = () => {
    if (!order.value?.items?.length) return
    for (const item of order.value.items) {
      cartStore.addItem({
        productId: item.product_id,
        name: item.product?.name || `Produk #${item.product_id}`,
        price: item.price_cents / 100,
        priceCents: item.price_cents,
        imageUrl: item.product?.image_url ?? null,
        quantity: item.qty,
        stock: 99,
        openCartDrawer: false,
      })
    }
    toast.show({
      title: 'Produk Ditambahkan',
      message: 'Item pesanan telah dimasukkan ke keranjang belanja.',
      tone: 'success',
    })
    router.push('/cart')
  }

  const handleConfirmDelivery = async () => {
    if (!order.value || isConfirmingDelivery.value) return false
    isConfirmingDelivery.value = true
    try {
      await $fetch(`/api/orders/${orderId}/confirm-delivery`, { method: 'POST' })
      order.value.status = 'completed'
      toast.show({
        title: 'Pesanan Selesai',
        message: 'Konfirmasi penerimaan berhasil. Koin loyalitas telah dicairkan.',
        tone: 'success',
      })
      await fetchOrderDetail(true)
      return true
    } catch (err: unknown) {
      notifyError('Gagal Konfirmasi', err, 'Gagal mengonfirmasi pesanan.')
      return false
    } finally {
      isConfirmingDelivery.value = false
    }
  }

  const getSegmentColor = (idx: number) => getTimelineSegmentColor(idx, order.value?.status)
  const orderSteps = computed<OrderStep[]>(() =>
    order.value ? computeOrderDetailSteps(order.value) : [],
  )

  const teardownRealtimeSubscription = () => {
    if (channel) {
      teardownRealtimeChannel(supabase, channel)
      channel = null
    }
  }

  const setupRealtimeSubscription = () => {
    if (!order.value || !import.meta.client) return
    teardownRealtimeSubscription()
    channel = acquireRealtimeChannel(supabase, `order-realtime-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (payload.new && order.value) {
            const updated = payload.new as Record<string, unknown>
            const prevStatus = order.value.status
            const nextStatus = updated.status as OrderStatus
            Object.assign(order.value, {
              status: nextStatus,
              payment_type: (updated.payment_type as string) || order.value.payment_type,
              paid_at: (updated.paid_at as string) || order.value.paid_at,
              tracking_number: (updated.tracking_number as string) || order.value.tracking_number,
              courier_name: (updated.courier_name as string) || order.value.courier_name,
              courier_code: (updated.courier_code as string) || order.value.courier_code,
            })
            if (nextStatus !== 'pending') stopPolling()
            tracking.fetchCustomerTracking()
            if (prevStatus === 'pending' && nextStatus === 'paid') {
              toast.show({
                title: 'Status Diperbarui',
                message: `Pesanan #${order.value.id.slice(0, 8).toUpperCase()} telah lunas dan sedang diproses.`,
                tone: 'success',
              })
            }
          }
        },
      )
      .subscribe()
  }

  onMounted(async () => {
    await fetchOrderDetail()
    if (order.value?.status === 'pending') {
      handleCheckPaymentStatus(true)
      startPolling()
    }
    setupRealtimeSubscription()
    setupVisibilityListeners()
  })

  onUnmounted(() => {
    teardownVisibilityListeners()
    teardownRealtimeSubscription()
  })

  return {
    order,
    loading,
    errorMsg,
    isPaying,
    isCancelling,
    isManualChecking,
    isConfirmingDelivery,
    ...tracking,
    orderSteps,
    formatDate: formatOrderDate,
    formatShippingServiceName,
    getSegmentColor,
    getStatusBadge: getOrderStatusBadge,
    getPaymentStatusBadge,
    fetchOrderDetail,
    handlePayNow,
    handleCheckPaymentStatus,
    handlePaymentExpired,
    handleCancelOrder,
    handleConfirmDelivery,
    handleReorder,
  }
}
