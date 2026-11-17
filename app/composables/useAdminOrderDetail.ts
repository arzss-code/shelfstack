import { ref, computed, onMounted } from 'vue'
import type { Order, OrderStatus } from '~/types/order'
import { getAvailableAdminTransitions } from '~~/shared/constants/order-transitions'
import {
  supportedCouriers,
  type CourierCode,
  type ShippingCheckpoint,
} from '~~/shared/schemas/shipping'
import { useUiToast } from '~/composables/useUiToast'

export function useAdminOrderDetail(orderId: string) {
  const toast = useUiToast()

  const order = ref<Order | null>(null)
  const loading = ref(true)
  const updating = ref(false)
  const errorMessage = ref('')

  const isConfirmModalOpen = ref(false)
  const targetStatus = ref<OrderStatus | null>(null)
  const updateReason = ref('')

  const selectedCourierCode = ref<CourierCode>('jne')
  const trackingNumberInput = ref('')
  const adminCheckpoints = ref<ShippingCheckpoint[]>([])

  const courierOptions = supportedCouriers.map((c) => ({
    label: c.name,
    value: c.code,
  }))

  const selectedCourierName = computed(() => {
    return (
      supportedCouriers.find((c) => c.code === selectedCourierCode.value)?.name || 'JNE Express'
    )
  })

  const handleAutoGenerateTracking = () => {
    const prefix =
      {
        jne: 'SS-JNE',
        sicepat: 'SS-SCP',
        jnt: 'SS-JNT',
        anteraja: 'SS-ANTR',
        pos: 'SS-POS',
      }[selectedCourierCode.value] || 'SS-LOG'

    const timestampPart = Date.now().toString().slice(-6)
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString()
    trackingNumberInput.value = `${prefix}-${timestampPart}${randomPart}`
  }

  const fetchAdminTracking = async () => {
    if (!order.value?.tracking_number) {
      adminCheckpoints.value = []
      return
    }
    try {
      const res = await $fetch<{ success: boolean; data: { checkpoints: ShippingCheckpoint[] } }>(
        `/api/orders/${orderId}/tracking`,
      )
      if (res?.data?.checkpoints) {
        adminCheckpoints.value = res.data.checkpoints
      }
    } catch {
      adminCheckpoints.value = []
    }
  }

  const fetchOrderDetail = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
      const res = await $fetch<{ status: string; data: Order }>(`/api/orders/${orderId}`)
      order.value = res.data
      await fetchAdminTracking()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      errorMessage.value = fetchErr.data?.message || 'Gagal memuat detail pesanan.'
    } finally {
      loading.value = false
    }
  }

  const availableTransitions = computed<OrderStatus[]>(() => {
    if (!order.value) return []
    return getAvailableAdminTransitions(order.value.status)
  })

  const openTransitionModal = (status: OrderStatus) => {
    targetStatus.value = status
    updateReason.value = ''
    if (status === 'shipped') {
      selectedCourierCode.value = (order.value?.courier_code as CourierCode) || 'jne'
      trackingNumberInput.value = order.value?.tracking_number || ''
      if (!trackingNumberInput.value) {
        handleAutoGenerateTracking()
      }
    }
    isConfirmModalOpen.value = true
  }

  const confirmStatusChange = async () => {
    if (!targetStatus.value) return

    updating.value = true
    try {
      if (targetStatus.value === 'refunded') {
        await $fetch(`/api/orders/${orderId}/refund`, {
          method: 'POST',
          body: {
            reason: updateReason.value || undefined,
          },
        })
      } else {
        await $fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          body: {
            status: targetStatus.value,
            reason: updateReason.value || undefined,
            courier_code: targetStatus.value === 'shipped' ? selectedCourierCode.value : undefined,
            courier_name: targetStatus.value === 'shipped' ? selectedCourierName.value : undefined,
            tracking_number:
              targetStatus.value === 'shipped' ? trackingNumberInput.value.trim() : undefined,
          },
        })
      }

      toast.show({
        title: 'Status Diperbarui',
        message: `Status pesanan berhasil diubah menjadi ${targetStatus.value}.`,
        tone: 'success',
      })

      isConfirmModalOpen.value = false
      await fetchOrderDetail()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.show({
        title: 'Gagal Memperbarui',
        message: fetchErr.data?.message || 'Terjadi kesalahan sistem saat memperbarui status.',
        tone: 'error',
      })
    } finally {
      updating.value = false
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
      case 'refunded':
        return { variant: 'danger' as const, label: 'Dikembalikan (Refund)' }
      case 'pending':
      default:
        return { variant: 'warning' as const, label: 'Menunggu' }
    }
  }

  const getTransitionLabel = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
        return 'Tandai Lunas'
      case 'shipped':
        return 'Kirim Pesanan'
      case 'completed':
        return 'Selesaikan Pesanan'
      case 'cancelled':
        return 'Batalkan Pesanan'
      case 'refunded':
        return 'Refund Pesanan'
      default:
        return status
    }
  }

  const getTransitionBtnVariant = (status: OrderStatus) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'primary' as const
      case 'shipped':
        return 'accent' as const
      case 'cancelled':
      case 'refunded':
        return 'secondary' as const
      default:
        return 'secondary' as const
    }
  }

  const confirmVariant = computed(() => {
    if (targetStatus.value === 'cancelled' || targetStatus.value === 'refunded') {
      return 'danger' as const
    }
    if (targetStatus.value === 'shipped') {
      return 'accent' as const
    }
    return 'primary' as const
  })

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d)
    } catch {
      return dateStr
    }
  }

  const simulatingTracking = ref(false)
  const handleSimulateTracking = async () => {
    if (simulatingTracking.value) return
    simulatingTracking.value = true
    try {
      const res = await $fetch<{ message: string }>(
        `/api/admin/orders/${orderId}/simulate-tracking`,
        { method: 'POST', body: { mode: 'all' } },
      )
      toast.show({ title: 'Simulasi Berhasil', message: res.message, tone: 'success' })
      await fetchOrderDetail()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      toast.show({
        title: 'Gagal Simulasi',
        message: fetchErr.data?.message || 'Gagal memproses simulasi perjalanan kurir.',
        tone: 'error',
      })
    } finally {
      simulatingTracking.value = false
    }
  }

  onMounted(() => {
    fetchOrderDetail()
  })

  return {
    order,
    loading,
    updating,
    simulatingTracking,
    handleSimulateTracking,
    errorMessage,
    isConfirmModalOpen,
    targetStatus,
    updateReason,
    selectedCourierCode,
    trackingNumberInput,
    adminCheckpoints,
    courierOptions,
    selectedCourierName,
    availableTransitions,
    confirmVariant,
    handleAutoGenerateTracking,
    fetchOrderDetail,
    openTransitionModal,
    confirmStatusChange,
    getStatusBadge,
    getTransitionLabel,
    getTransitionBtnVariant,
    formatDate,
  }
}
