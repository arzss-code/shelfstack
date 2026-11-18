import { ref } from 'vue'
import { useUiToast } from '~/composables/useUiToast'

export interface PaidRefundRequestState {
  id: string
  order_id: string
  status: 'pending' | 'succeeded' | 'failed'
  amount_cents: number
  reason: string
  created_at: string
  updated_at: string
}

export function usePaidOrderRefundRequest() {
  const toast = useUiToast()
  const refundRequest = ref<PaidRefundRequestState | null>(null)
  const isSubmittingRefund = ref(false)
  const isModalOpen = ref(false)

  async function fetchRefundRequest(orderId: string) {
    if (!orderId) return
    try {
      const res = await $fetch<{ data: PaidRefundRequestState | null }>(
        `/api/orders/${orderId}/request-refund`,
      )
      refundRequest.value = res.data || null
    } catch {
      refundRequest.value = null
    }
  }

  async function submitRefundRequest(orderId: string, reason: string): Promise<boolean> {
    if (!orderId || isSubmittingRefund.value) return false
    isSubmittingRefund.value = true
    try {
      const res = await $fetch<{ data: PaidRefundRequestState }>(
        `/api/orders/${orderId}/request-refund`,
        {
          method: 'POST',
          body: { reason: reason.trim() },
        },
      )
      refundRequest.value = res.data
      isModalOpen.value = false
      toast.show({
        title: 'Pengajuan Diterima',
        message: 'Permintaan pembatalan & refund Anda sedang ditinjau Admin.',
        tone: 'success',
      })
      return true
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      toast.show({
        title: 'Gagal Mengajukan Pembatalan',
        message: e.data?.message || e.message || 'Terjadi kesalahan saat mengirim pengajuan.',
        tone: 'error',
      })
      return false
    } finally {
      isSubmittingRefund.value = false
    }
  }

  return {
    refundRequest,
    isSubmittingRefund,
    isModalOpen,
    fetchRefundRequest,
    submitRefundRequest,
  }
}
