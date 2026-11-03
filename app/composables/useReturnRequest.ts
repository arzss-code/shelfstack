import { ref } from 'vue'
import type {
  CreateReturnRequestInput,
  ReturnRequestItem,
  UpdateReturnTrackingInput,
} from '~~/shared/schemas/return-request'
import { useUiToast } from './useUiToast'

export const useReturnRequest = () => {
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const isUploadingProof = ref(false)
  const error = ref<string | null>(null)
  const ticket = ref<ReturnRequestItem | null>(null)
  const eligibility = ref<{ isEligible: boolean; remainingDays?: number; reason?: string } | null>(
    null,
  )

  const toast = useUiToast()

  const fetchReturnData = async (orderId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{
        status: string
        data: {
          eligibility: { isEligible: boolean; remainingDays?: number; reason?: string }
          return_request: ReturnRequestItem | null
        }
      }>(`/api/orders/${orderId}/return-requests`)

      if (response && response.data) {
        ticket.value = response.data.return_request
        eligibility.value = response.data.eligibility
      }
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      error.value = fetchErr?.data?.message || fetchErr?.message || 'Gagal memuat status retur.'
    } finally {
      isLoading.value = false
    }
  }

  const uploadProofImage = async (file: File): Promise<string | null> => {
    isUploadingProof.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('proof', file)

      const response = await $fetch<{
        status: string
        data: { file_url: string; file_path: string }
      }>('/api/returns/upload', {
        method: 'POST',
        body: formData,
      })

      return response.data?.file_url || null
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      const msg = fetchErr?.data?.message || fetchErr?.message || 'Gagal mengunggah foto bukti.'
      toast.show({
        title: 'Gagal Unggah Bukti',
        message: msg,
        tone: 'error',
      })
      return null
    } finally {
      isUploadingProof.value = false
    }
  }

  const submitReturnRequest = async (
    orderId: string,
    payload: CreateReturnRequestInput,
  ): Promise<boolean> => {
    isSubmitting.value = true
    error.value = null

    try {
      const response = await $fetch<{
        status: string
        message: string
        data: ReturnRequestItem
      }>(`/api/orders/${orderId}/return-requests`, {
        method: 'POST',
        body: payload,
      })

      ticket.value = response.data
      toast.show({
        title: 'Pengajuan Terkirim',
        message: 'Tiket retur dan klaim garansi Anda berhasil diajukan.',
        tone: 'success',
      })
      return true
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      const msg = fetchErr?.data?.message || fetchErr?.message || 'Gagal mengajukan retur.'
      error.value = msg
      toast.show({
        title: 'Pengajuan Gagal',
        message: msg,
        tone: 'error',
      })
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  const submitReturnTracking = async (
    orderId: string,
    payload: UpdateReturnTrackingInput,
  ): Promise<boolean> => {
    isSubmitting.value = true
    error.value = null

    try {
      const response = await $fetch<{
        status: string
        message: string
        data: ReturnRequestItem
      }>(`/api/orders/${orderId}/return-requests/tracking`, {
        method: 'PUT',
        body: payload,
      })

      ticket.value = response.data
      toast.show({
        title: 'Resi Pengembalian Disimpan',
        message: 'Nomor resi pengiriman balik berhasil dicatat.',
        tone: 'success',
      })
      return true
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      const msg =
        fetchErr?.data?.message || fetchErr?.message || 'Gagal menyimpan resi pengembalian.'
      error.value = msg
      toast.show({
        title: 'Gagal Simpan Resi',
        message: msg,
        tone: 'error',
      })
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isLoading,
    isSubmitting,
    isUploadingProof,
    error,
    ticket,
    eligibility,
    fetchReturnData,
    uploadProofImage,
    submitReturnRequest,
    submitReturnTracking,
  }
}
