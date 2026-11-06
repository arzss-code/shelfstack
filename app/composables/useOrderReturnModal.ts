import { ref, computed } from 'vue'
import { useReturnRequest } from '~/composables/useReturnRequest'
import type { ReturnReasonType, ReturnSolutionType } from '~~/shared/schemas/return-request'
import { RETURN_REASON_LABELS } from '~~/server/utils/return-request'

export function useOrderReturnModal(
  getOrderId: () => string,
  callbacks: {
    onClose: () => void
  },
) {
  const { isSubmitting, isUploadingProof, uploadProofImage, submitReturnRequest } =
    useReturnRequest()

  const reasonType = ref<ReturnReasonType>('defective')
  const solutionType = ref<ReturnSolutionType>('refund')
  const customerNotes = ref('')
  const proofImageUrls = ref<string[]>([])
  const unboxingVideoUrl = ref('')
  const formError = ref<string | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)

  const reasonOptions = computed(() => {
    return (Object.keys(RETURN_REASON_LABELS) as ReturnReasonType[]).map((key) => ({
      label: RETURN_REASON_LABELS[key],
      value: key,
    }))
  })

  const isFormValid = computed(() => {
    return (
      customerNotes.value.trim().length >= 20 &&
      proofImageUrls.value.length >= 1 &&
      !isSubmitting.value &&
      !isUploadingProof.value
    )
  })

  const triggerFileSelect = () => {
    if (proofImageUrls.value.length >= 3 || isUploadingProof.value) return
    fileInputRef.value?.click()
  }

  const handleFileSelected = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    target.value = ''

    formError.value = null
    const uploadedUrl = await uploadProofImage(file)
    if (uploadedUrl) {
      proofImageUrls.value.push(uploadedUrl)
    }
  }

  const removeProofImage = (index: number) => {
    proofImageUrls.value.splice(index, 1)
  }

  const handleSubmit = async () => {
    formError.value = null

    if (customerNotes.value.trim().length < 20) {
      formError.value = 'Penjelasan kendala minimal 20 karakter agar verifikasi valid.'
      return
    }

    if (proofImageUrls.value.length === 0) {
      formError.value = 'Wajib melampirkan minimal 1 foto bukti kondisi produk.'
      return
    }

    const success = await submitReturnRequest(getOrderId(), {
      reason_type: reasonType.value,
      solution_type: solutionType.value,
      customer_notes: customerNotes.value.trim(),
      proof_image_urls: proofImageUrls.value,
      unboxing_video_url: unboxingVideoUrl.value.trim() || undefined,
    })

    if (success) {
      callbacks.onClose()
    }
  }

  return {
    isSubmitting,
    isUploadingProof,
    reasonType,
    solutionType,
    customerNotes,
    proofImageUrls,
    unboxingVideoUrl,
    formError,
    fileInputRef,
    reasonOptions,
    isFormValid,
    triggerFileSelect,
    handleFileSelected,
    removeProofImage,
    handleSubmit,
  }
}
