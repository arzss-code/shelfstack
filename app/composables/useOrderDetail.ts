import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/features/auth/composables/useAuth'
import type { Database } from '~/types/database.types'
import type { Order, OrderStatus } from '~/types/order'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useCartStore } from '~/features/cart/stores/cart'
import type { ShippingCheckpoint } from '~~/shared/schemas/shipping'
import { useUiToast } from '~/composables/useUiToast'

export interface OrderStep {
  title: string
  description: string
  timestamp?: string
  isCompleted: boolean
  isActive: boolean
}

export function useOrderDetail(orderId: string) {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = useSupabaseClient<Database>()
  const toast = useUiToast()
  const config = useRuntimeConfig()
  const cartStore = useCartStore()
  const { pay: openSnapModal } = useMidtransSnap()

  const order = ref<Order | null>(null)
  const loading = ref(true)
  const isPaying = ref(false)
  const isCancelling = ref(false)
  const isManualChecking = ref(false)
  const errorMsg = ref('')
  const customerCheckpoints = ref<ShippingCheckpoint[]>([])
  const copiedHeaderResi = ref(false)

  let channel: RealtimeChannel | null = null
  let pollInterval: ReturnType<typeof setInterval> | null = null

  const copyHeaderResi = async (resi?: string | null) => {
    if (!resi || !import.meta.client) return
    try {
      await navigator.clipboard.writeText(resi)
      copiedHeaderResi.value = true
      setTimeout(() => {
        copiedHeaderResi.value = false
      }, 2000)
    } catch {
      // clipboard fallback
    }
  }

  const formatShippingServiceName = (service?: string | null) => {
    if (!service) return 'Reguler'
    switch (service.toLowerCase()) {
      case 'express':
        return 'Kilat / Next Day'
      case 'instant':
        return 'Instan / Sameday'
      case 'cargo':
        return 'Kargo'
      case 'reguler':
      default:
        return 'Reguler'
    }
  }

  const fetchCustomerTracking = async () => {
    if (!order.value?.tracking_number) {
      customerCheckpoints.value = []
      return
    }
    try {
      const res = await $fetch<{ success: boolean; data: { checkpoints: ShippingCheckpoint[] } }>(
        `/api/orders/${orderId}/tracking`,
      )
      if (res?.data?.checkpoints) {
        customerCheckpoints.value = res.data.checkpoints
      }
    } catch {
      customerCheckpoints.value = []
    }
  }

  const activeCheckpoints = computed(() => {
    if (customerCheckpoints.value.length > 0) {
      return customerCheckpoints.value
    }
    return order.value?.checkpoints || []
  })

  const activeLatestCheckpoint = computed(() => {
    if (activeCheckpoints.value.length === 0) return null
    return [...activeCheckpoints.value].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]
  })

  const activeLatestCheckpointLocation = computed(() => {
    if (activeLatestCheckpoint.value?.location) {
      return activeLatestCheckpoint.value.location
    }
    if (order.value?.status === 'completed') {
      const city = order.value.address?.city
      return city ? `Diterima di ${city}` : 'Telah Diterima'
    }
    if (order.value?.status === 'shipped') {
      const city = order.value.address?.city
      return city ? `Menuju ${city}` : 'Dalam Pengiriman'
    }
    return 'Gudang Pengiriman ShelfStack'
  })

  const activeLatestCheckpointTitle = computed(() => {
    return activeLatestCheckpoint.value?.title || ''
  })

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  const handleCheckPaymentStatus = async (silent = false) => {
    if (!order.value) return
    if (!silent) isManualChecking.value = true

    try {
      const res = await $fetch<{
        status: string
        data: {
          status: OrderStatus
          is_paid: boolean
          transaction_status?: string
          payment_type?: string
        }
      }>(`/api/orders/${orderId}/check-payment-status`, {
        method: 'POST',
      })

      if (res.data) {
        const nextStatus = res.data.status
        const wasPending = order.value.status === 'pending'
        order.value.status = nextStatus
        if (res.data.payment_type) {
          order.value.payment_type = res.data.payment_type
        }

        if (res.data.is_paid) {
          order.value.paid_at = new Date().toISOString()
          stopPolling()
          if (!silent || wasPending) {
            toast.show({
              title: 'Pembayaran Dikonfirmasi',
              message: 'Transaksi berhasil diverifikasi. Pesanan sedang diproses.',
              tone: 'success',
            })
          }
        } else if (!silent) {
          toast.show({
            title: 'Status Terkini',
            message: 'Pembayaran belum terverifikasi atau transaksi masih pending.',
            tone: 'info',
          })
        }
      }
    } catch {
      if (!silent) {
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

  const startPolling = () => {
    if (pollInterval || !import.meta.client) return
    pollInterval = setInterval(async () => {
      if (!order.value || order.value.status !== 'pending') {
        stopPolling()
        return
      }
      if (document.visibilityState === 'visible') {
        await handleCheckPaymentStatus(true)
      }
    }, 3500)
  }

  const handleVisibilityOrFocusChange = () => {
    if (document.visibilityState === 'visible' && order.value?.status === 'pending') {
      handleCheckPaymentStatus(true)
    }
  }

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
      await fetchCustomerTracking()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      errorMsg.value = fetchErr.data?.message || 'Pesanan tidak ditemukan atau akses ditolak.'
    } finally {
      if (!silent) loading.value = false
    }
  }

  const handlePayNow = async () => {
    if (!order.value || isPaying.value) return

    if (!config.public.enableMidtransSandbox) {
      toast.show({
        title: 'Sandbox Nonaktif',
        message: 'Fitur pembayaran Midtrans Sandbox saat ini dinonaktifkan.',
        tone: 'warn',
      })
      return
    }

    isPaying.value = true
    try {
      const res = await $fetch<{ status: string; data: { token: string; redirect_url?: string } }>(
        `/api/orders/${orderId}/payment-token`,
        { method: 'POST' },
      )
      const snapToken = res.data.token

      openSnapModal(snapToken, {
        onSuccess: () => {
          toast.show({
            title: 'Pembayaran Diterima',
            message: 'Memverifikasi status pembayaran dengan gateway...',
            tone: 'success',
          })
          handleCheckPaymentStatus(true)
        },
        onPending: () => {
          toast.show({
            title: 'Menunggu Pembayaran',
            message: 'Instruksi pembayaran telah aktif. Silakan selesaikan transaksi Anda.',
            tone: 'info',
          })
          startPolling()
        },
        onError: () => {
          toast.show({
            title: 'Pembayaran Gagal',
            message: 'Terjadi kendala saat memproses pembayaran Sandbox.',
            tone: 'error',
          })
        },
        onClose: () => {
          startPolling()
          handleCheckPaymentStatus(true)
        },
      })
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.show({
        title: 'Gagal Membuka Pembayaran',
        message:
          fetchErr.data?.message ||
          'Layanan pembayaran sedang mengalami kendala. Silakan coba beberapa saat lagi.',
        tone: 'error',
      })
    } finally {
      isPaying.value = false
    }
  }

  const handleCancelOrder = async (reason: string) => {
    if (!order.value || isCancelling.value) return
    isCancelling.value = true
    try {
      await $fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        body: { reason },
      })
      stopPolling()
      toast.show({
        title: 'Pesanan Dibatalkan',
        message: 'Pesanan berhasil dibatalkan dan persediaan stok telah dikembalikan.',
        tone: 'success',
      })
      await fetchOrderDetail()
      return true
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.show({
        title: 'Gagal Membatalkan',
        message: fetchErr.data?.message || 'Terjadi kesalahan saat membatalkan pesanan.',
        tone: 'error',
      })
      return false
    } finally {
      isCancelling.value = false
    }
  }

  const handleReorder = () => {
    if (!order.value?.items || order.value.items.length === 0) return

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
      message: 'Item dari pesanan ini telah dimasukkan kembali ke keranjang belanja Anda.',
      tone: 'success',
    })

    router.push('/cart')
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return { variant: 'info' as const, label: 'Diproses' }
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

  const getPaymentStatusBadge = (orderData: Order) => {
    if (orderData.status === 'refunded') {
      return { variant: 'default' as const, label: 'Dikembalikan' }
    }
    if (orderData.status === 'cancelled') {
      return { variant: 'default' as const, label: 'Belum Dibayar' }
    }
    if (orderData.paid_at || ['paid', 'shipped', 'completed'].includes(orderData.status)) {
      return { variant: 'success' as const, label: 'Lunas' }
    }
    return { variant: 'warning' as const, label: 'Menunggu Pembayaran' }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return dateStr
    }
  }

  const orderSteps = computed<OrderStep[]>(() => {
    if (!order.value) return []

    const status = order.value.status
    const isPaid = ['paid', 'shipped', 'completed'].includes(status)
    const isShipped = ['shipped', 'completed'].includes(status)
    const isCompleted = status === 'completed'
    const isPending = status === 'pending'

    return [
      {
        title: 'Dipesan',
        description: 'Pesanan resmi dibuat',
        timestamp: formatDate(order.value.created_at),
        isCompleted: true,
        isActive: false,
      },
      {
        title: 'Dibayar',
        description: isPaid ? 'Pembayaran terverifikasi' : 'Menunggu pembayaran',
        timestamp: order.value.paid_at ? formatDate(order.value.paid_at) : undefined,
        isCompleted: isPaid,
        isActive: isPending,
      },
      {
        title: 'Dikirim',
        description: isShipped
          ? 'Pesanan dalam pengiriman'
          : isPaid
            ? 'Sedang disiapkan seller'
            : 'Menunggu diproses',
        isCompleted: isShipped,
        isActive: isPaid && !isShipped,
      },
      {
        title: 'Selesai',
        description: isCompleted ? 'Pesanan telah diterima' : 'Konfirmasi penerimaan',
        isCompleted: isCompleted,
        isActive: isShipped && !isCompleted,
      },
    ]
  })

  const getSegmentColor = (idx: number) => {
    if (!order.value || order.value.status === 'cancelled') {
      return 'bg-brand-hairsoft'
    }
    const status = order.value.status
    if (idx === 0) {
      return 'bg-emerald-600'
    }
    if (idx === 1) {
      return ['paid', 'shipped', 'completed'].includes(status)
        ? 'bg-emerald-600'
        : 'bg-brand-hairsoft'
    }
    if (idx === 2) {
      return ['shipped', 'completed'].includes(status) ? 'bg-emerald-600' : 'bg-brand-hairsoft'
    }
    return 'bg-brand-hairsoft'
  }

  onMounted(async () => {
    await fetchOrderDetail()

    if (order.value?.status === 'pending') {
      handleCheckPaymentStatus(true)
      startPolling()
    }

    if (order.value && import.meta.client) {
      channel = supabase
        .channel(`order-realtime-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload) => {
            if (payload.new && order.value) {
              const updated = payload.new as Record<string, unknown>
              const prevStatus = order.value.status
              const nextStatus = updated.status as OrderStatus

              order.value = {
                ...order.value,
                status: nextStatus,
                payment_type: (updated.payment_type as string) || order.value.payment_type,
                paid_at: (updated.paid_at as string) || order.value.paid_at,
                tracking_number: (updated.tracking_number as string) || order.value.tracking_number,
                courier_name: (updated.courier_name as string) || order.value.courier_name,
                courier_code: (updated.courier_code as string) || order.value.courier_code,
              }

              if (nextStatus !== 'pending') {
                stopPolling()
              }

              fetchCustomerTracking()

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

    if (import.meta.client) {
      document.addEventListener('visibilitychange', handleVisibilityOrFocusChange)
      window.addEventListener('focus', handleVisibilityOrFocusChange)
    }
  })

  onUnmounted(() => {
    stopPolling()
    if (channel) {
      supabase.removeChannel(channel)
    }
    if (import.meta.client) {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange)
      window.removeEventListener('focus', handleVisibilityOrFocusChange)
    }
  })

  return {
    order,
    loading,
    errorMsg,
    isPaying,
    isCancelling,
    isManualChecking,
    copiedHeaderResi,
    customerCheckpoints,
    activeCheckpoints,
    activeLatestCheckpoint,
    activeLatestCheckpointLocation,
    activeLatestCheckpointTitle,
    orderSteps,
    copyHeaderResi,
    formatDate,
    formatShippingServiceName,
    getSegmentColor,
    getStatusBadge,
    getPaymentStatusBadge,
    fetchOrderDetail,
    fetchCustomerTracking,
    handlePayNow,
    handleCheckPaymentStatus,
    handleCancelOrder,
    handleReorder,
  }
}
