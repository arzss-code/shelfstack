<script setup lang="ts">
import { ref, computed } from 'vue'
import UiModal from '~/components/ui/UiModal.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiTextarea from '~/components/ui/UiTextarea.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import { useReturnRequest } from '~/composables/useReturnRequest'
import type {
  ReturnReasonType,
  ReturnSolutionType,
  ReturnRequestItem,
} from '~~/shared/schemas/return-request'
import { RETURN_REASON_LABELS } from '~~/server/utils/return-request'

interface Props {
  modelValue: boolean
  orderId: string
  orderNumber?: string
  remainingDays?: number
}

const props = withDefaults(defineProps<Props>(), {
  orderNumber: '',
  remainingDays: 7,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: [ticket: ReturnRequestItem]
}>()

const { isSubmitting, isUploadingProof, uploadProofImage, submitReturnRequest } = useReturnRequest()

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

  const success = await submitReturnRequest(props.orderId, {
    reason_type: reasonType.value,
    solution_type: solutionType.value,
    customer_notes: customerNotes.value.trim(),
    proof_image_urls: proofImageUrls.value,
    unboxing_video_url: unboxingVideoUrl.value.trim() || undefined,
  })

  if (success) {
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <UiModal
    :model-value="modelValue"
    title="Ajukan Komplain & Retur Produk"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="space-y-5 py-1 text-xs">
      <!-- Info Banner Garansi 7 Hari -->
      <div
        class="flex items-start gap-3 rounded-card border border-brand-hair bg-brand-canvas-soft p-3.5"
      >
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-accent-tint text-brand-accent text-sm"
        >
          <i class="pi pi-shield" />
        </span>
        <div class="min-w-0 flex-1 leading-5 text-brand-muted">
          <p class="m-0 font-bold text-brand-ink">Jaminan Retur 7 Hari Resmi ShelfStack</p>
          <p class="m-0 mt-0.5">
            Pesanan
            <span class="font-semibold text-brand-ink">{{
              orderNumber || orderId.slice(0, 8)
            }}</span>
            memiliki sisa masa garansi
            <span class="font-bold text-brand-ink">{{ remainingDays }} hari</span> untuk pengajuan
            kendala produk.
          </p>
        </div>
      </div>

      <!-- Error Alert -->
      <UiAlert v-if="formError" tone="danger">
        {{ formError }}
      </UiAlert>

      <!-- 1. Pilihan Opsi Resolusi (Refund vs Tukar) -->
      <div>
        <label class="block font-bold text-brand-ink mb-2">
          Pilihan Opsi Solusi Klaim <span class="text-brand-danger">*</span>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            class="flex items-start gap-3 rounded-card border p-3.5 text-left transition-all cursor-pointer min-h-[44px]"
            :class="
              solutionType === 'refund'
                ? 'border-brand-ink bg-brand-canvas shadow-whisper ring-1 ring-brand-ink'
                : 'border-brand-hair bg-brand-canvas hover:border-brand-hairsoft'
            "
            @click="solutionType = 'refund'"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-canvas-soft text-brand-ink text-sm"
            >
              <i class="pi pi-wallet" />
            </span>
            <div class="min-w-0 flex-1">
              <span class="block font-bold text-brand-ink text-xs">Pengembalian Dana Penuh</span>
              <span class="block mt-0.5 text-[11px] text-brand-muted leading-relaxed">
                Pengembalian saldo 100% via metode pembayaran awal pasca verifikasi fisik.
              </span>
            </div>
          </button>

          <button
            type="button"
            class="flex items-start gap-3 rounded-card border p-3.5 text-left transition-all cursor-pointer min-h-[44px]"
            :class="
              solutionType === 'replacement'
                ? 'border-brand-ink bg-brand-canvas shadow-whisper ring-1 ring-brand-ink'
                : 'border-brand-hair bg-brand-canvas hover:border-brand-hairsoft'
            "
            @click="solutionType = 'replacement'"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-canvas-soft text-brand-ink text-sm"
            >
              <i class="pi pi-replay" />
            </span>
            <div class="min-w-0 flex-1">
              <span class="block font-bold text-brand-ink text-xs">Penukaran Unit Baru</span>
              <span class="block mt-0.5 text-[11px] text-brand-muted leading-relaxed">
                Unit pengganti baru dikirim langsung ke alamat Anda bebas ongkos kirim.
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- 2. Pilihan Alasan Kendala -->
      <div>
        <label for="return-reason" class="block font-bold text-brand-ink mb-1.5">
          Alasan Pengajuan <span class="text-brand-danger">*</span>
        </label>
        <UiSelect id="return-reason" v-model="reasonType" :options="reasonOptions" />
      </div>

      <!-- 3. Rincian Deskripsi Kendala -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label for="return-notes" class="font-bold text-brand-ink">
            Jelaskan Kendala Produk <span class="text-brand-danger">*</span>
          </label>
          <span
            class="text-[11px]"
            :class="customerNotes.trim().length >= 20 ? 'text-brand-muted' : 'text-brand-danger'"
          >
            {{ customerNotes.trim().length }}/1000 (min. 20 karakter)
          </span>
        </div>
        <UiTextarea
          id="return-notes"
          v-model="customerNotes"
          :rows="3"
          placeholder="Jelaskan secara spesifik cacat fisik, malfungsi fungsi, atau ketidaksesuaian barang yang Anda terima..."
        />
      </div>

      <!-- 4. Lampiran Foto Bukti -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="font-bold text-brand-ink">
            Foto Bukti Kondisi Barang <span class="text-brand-danger">*</span>
          </label>
          <span class="text-[11px] text-brand-muted"
            >{{ proofImageUrls.length }}/3 foto (Maks. 5MB)</span
          >
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <div
            v-for="(url, idx) in proofImageUrls"
            :key="idx"
            class="relative h-20 w-20 shrink-0 overflow-hidden rounded-field border border-brand-hair bg-brand-canvas-soft group"
          >
            <img :src="url" alt="Foto Bukti" class="h-full w-full object-cover" />
            <button
              type="button"
              class="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-ink/80 text-white hover:bg-brand-danger transition-colors cursor-pointer"
              aria-label="Hapus foto bukti"
              @click="removeProofImage(idx)"
            >
              <i class="pi pi-times text-[10px]" />
            </button>
          </div>

          <button
            v-if="proofImageUrls.length < 3"
            type="button"
            class="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-field border border-dashed border-brand-hair bg-brand-canvas text-brand-muted hover:border-brand-ink hover:text-brand-ink transition-all cursor-pointer min-h-[44px]"
            :disabled="isUploadingProof"
            @click="triggerFileSelect"
          >
            <i
              class="pi"
              :class="isUploadingProof ? 'pi-spin pi-spinner' : 'pi-camera text-base'"
            />
            <span class="text-[10px] font-medium">{{
              isUploadingProof ? 'Unggah...' : 'Tambah'
            }}</span>
          </button>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="handleFileSelected"
          />
        </div>
      </div>

      <!-- 5. Link Video Unboxing (Opsional) -->
      <div>
        <label for="return-video" class="block font-bold text-brand-ink mb-1.5">
          Tautan Video Unboxing <span class="font-normal text-brand-muted">(Opsional)</span>
        </label>
        <UiInput
          id="return-video"
          v-model="unboxingVideoUrl"
          type="url"
          placeholder="https://drive.google.com/... atau tautan video lainnya"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 pt-2">
        <UiButton
          variant="ghost"
          :disabled="isSubmitting"
          @click="emit('update:modelValue', false)"
        >
          Batal
        </UiButton>
        <UiButton
          variant="primary"
          :loading="isSubmitting"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          Kirim Pengajuan Retur
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
