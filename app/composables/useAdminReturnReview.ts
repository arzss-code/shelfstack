import { ref, computed } from 'vue'
import type { ReturnRequestItem, ReturnRequestStatus } from '~~/shared/schemas/return-request'
import { RETURN_STATUS_MAP } from '~~/server/utils/return-request'
import { useUiToast } from '~/composables/useUiToast'

export function useAdminReturnReview(
  getTicket: () => ReturnRequestItem | null,
  callbacks: {
    onReviewed: () => void
    onClose: () => void
  },
) {
  const toast = useUiToast()
  const isSubmitting = ref(false)
  const modalError = ref<string | null>(null)

  const adminNotes = ref('')
  const restockInventory = ref(true)
  const replacementCourier = ref('jne')
  const replacementTrackingNumber = ref('')

  const statusMeta = computed(() => {
    const ticket = getTicket()
    if (!ticket) return null
    return RETURN_STATUS_MAP[ticket.status]
  })

  const handleActionSubmit = async (targetStatus: ReturnRequestStatus) => {
    const ticket = getTicket()
    if (!ticket) return
    modalError.value = null

    if (targetStatus === 'rejected' && !adminNotes.value.trim()) {
      modalError.value = 'Wajib memberikan catatan alasan penolakan untuk pelanggan.'
      return
    }

    isSubmitting.value = true
    try {
      await $fetch(`/api/admin/returns/${ticket.id}/review`, {
        method: 'PUT',
        body: {
          status: targetStatus,
          admin_notes: adminNotes.value.trim() || undefined,
          restock_inventory: restockInventory.value,
          replacement_courier:
            ticket.solution_type === 'replacement' ? replacementCourier.value : undefined,
          replacement_tracking_number:
            ticket.solution_type === 'replacement'
              ? replacementTrackingNumber.value.trim()
              : undefined,
        },
      })

      toast.show({
        title: 'Keputusan Disimpan',
        message: `Status tiket retur berhasil diperbarui menjadi ${RETURN_STATUS_MAP[targetStatus].label}.`,
        tone: 'success',
      })

      callbacks.onReviewed()
      callbacks.onClose()
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string }
      modalError.value =
        fetchErr?.data?.message || fetchErr?.message || 'Gagal menyimpan keputusan retur.'
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    modalError,
    adminNotes,
    restockInventory,
    replacementCourier,
    replacementTrackingNumber,
    statusMeta,
    handleActionSubmit,
  }
}
