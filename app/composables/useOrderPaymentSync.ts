import { ref } from 'vue'
import { useMidtransSnap } from '~/composables/useMidtransSnap'
import { useUiToast } from '~/composables/useUiToast'

export interface PaymentSyncCallbacks {
  onSuccess?: () => void
  onPending?: () => void
  onError?: () => void
  onClose?: () => void
}

export function useOrderPaymentSync() {
  const { pay: openSnapModal } = useMidtransSnap()
  const toast = useUiToast()
  const router = useRouter()
  const isPaying = ref(false)
  const isCheckingStatus = ref(false)

  const launchSnapPayment = async (orderId: string, callbacks?: PaymentSyncCallbacks) => {
    if (isPaying.value) return
    isPaying.value = true

    try {
      const res = await $fetch<{ status: string; data: { token: string; snap_token?: string } }>(
        `/api/orders/${orderId}/payment-token`,
        { method: 'POST' },
      ).catch(async () => {
        // Fallback ke endpoint /pay jika payment-token route berbeda
        return await $fetch<{ status: string; data: { snap_token: string; token?: string } }>(
          `/api/orders/${orderId}/pay`,
          { method: 'POST' },
        )
      })

      const snapToken = res.data.token || res.data.snap_token
      if (!snapToken) {
        throw new Error('Sesi token pembayaran tidak ditemukan.')
      }

      openSnapModal(snapToken, {
        onSuccess: () => {
          toast.add({
            severity: 'success',
            summary: 'Pembayaran Berhasil',
            detail: 'Terima kasih, pembayaran Anda telah berhasil diverifikasi!',
            life: 5000,
          })
          callbacks?.onSuccess?.()
        },
        onPending: () => {
          toast.add({
            severity: 'info',
            summary: 'Menunggu Pembayaran',
            detail: 'Silakan selesaikan pembayaran sesuai petunjuk metode yang dipilih.',
            life: 5000,
          })
          callbacks?.onPending?.()
        },
        onError: () => {
          toast.add({
            severity: 'error',
            summary: 'Pembayaran Gagal',
            detail: 'Transaksi pembayaran gagal diproses. Anda dapat mencobanya kembali.',
            life: 5000,
          })
          callbacks?.onError?.()
        },
        onClose: () => {
          callbacks?.onClose?.()
        },
      })
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      toast.add({
        severity: 'warn',
        summary: 'Perhatian Pembayaran',
        detail:
          fetchErr.data?.message ||
          fetchErr.message ||
          'Layanan pembayaran sedang mengalami kendala. Mengalihkan...',
        life: 5000,
      })
      callbacks?.onClose?.()
    } finally {
      isPaying.value = false
    }
  }

  const checkOrderPaymentStatus = async (orderId: string) => {
    if (isCheckingStatus.value) return null
    isCheckingStatus.value = true
    try {
      const res = await $fetch<{
        status: string
        data: {
          status: string
          is_paid: boolean
          transaction_status?: string
          payment_type?: string
        }
      }>(`/api/orders/${orderId}/check-payment-status`, {
        method: 'POST',
      })
      return res.data
    } catch {
      return null
    } finally {
      isCheckingStatus.value = false
    }
  }

  return {
    isPaying,
    isCheckingStatus,
    launchSnapPayment,
    checkOrderPaymentStatus,
  }
}
