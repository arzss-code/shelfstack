<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUiToast } from '~/composables/useUiToast'

export interface ExistingReviewPayload {
  id: string
  rating: number
  review_text: string
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    productId: number | string
    productName: string
    orderId: string
    existingReview?: ExistingReviewPayload | null
  }>(),
  {
    existingReview: null,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const toast = useUiToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const selectedRating = ref(0)
const hoverRating = ref(0)
const reviewText = ref('')
const ratingError = ref('')
const textError = ref('')
const submitError = ref('')
const isSubmitting = ref(false)

const ratingLabels: Record<number, string> = {
  1: 'Sangat Buruk',
  2: 'Kurang Memuaskan',
  3: 'Cukup',
  4: 'Bagus',
  5: 'Sangat Memuaskan!',
}

const activeRating = computed(() => hoverRating.value || selectedRating.value)

const dynamicFeedback = computed(() => {
  if (activeRating.value > 0) {
    return ratingLabels[activeRating.value] || ''
  }
  return 'Pilih rating bintang'
})

const charCount = computed(() => reviewText.value.length)
const isTooShort = computed(() => charCount.value > 0 && charCount.value < 10)

const resetForm = () => {
  if (props.existingReview) {
    selectedRating.value = props.existingReview.rating || 0
    reviewText.value = props.existingReview.review_text || ''
  } else {
    selectedRating.value = 0
    reviewText.value = ''
  }
  hoverRating.value = 0
  ratingError.value = ''
  textError.value = ''
  submitError.value = ''
}

watch(
  () => [props.modelValue, props.existingReview],
  ([open]) => {
    if (open) {
      resetForm()
    }
  },
  { immediate: true },
)

const setRating = (star: number) => {
  selectedRating.value = star
  ratingError.value = ''
}

const validate = (): boolean => {
  ratingError.value = ''
  textError.value = ''
  submitError.value = ''

  let isValid = true
  if (selectedRating.value < 1) {
    ratingError.value = 'Silakan pilih rating bintang terlebih dahulu.'
    isValid = false
  }

  const trimmed = reviewText.value.trim()
  if (!trimmed || trimmed.length < 10) {
    textError.value = 'Ulasan minimal terdiri dari 10 karakter.'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const isEdit = Boolean(props.existingReview?.id)
    const url = isEdit
      ? `/api/products/${props.productId}/reviews/${props.existingReview?.id}`
      : `/api/products/${props.productId}/reviews`
    const method = isEdit ? 'PUT' : 'POST'

    const body = isEdit
      ? {
          rating: selectedRating.value,
          review_text: reviewText.value.trim(),
        }
      : {
          rating: selectedRating.value,
          review_text: reviewText.value.trim(),
          order_id: props.orderId,
        }

    await $fetch(url, {
      method,
      body,
    })

    toast.show({
      severity: 'success',
      tone: 'success',
      summary: 'Ulasan Anda berhasil diterbitkan.',
      message: 'Ulasan Anda berhasil diterbitkan.',
      detail: 'Ulasan Anda berhasil diterbitkan.',
    })

    emit('success')
    isOpen.value = false
    resetForm()
  } catch (err: unknown) {
    const errorData = err as { data?: { message?: string }; message?: string }
    submitError.value =
      errorData?.data?.message || errorData?.message || 'Gagal mengirimkan ulasan produk.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UiModal v-model:visible="isOpen" title="Tulis Ulasan Produk" size="md">
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Product Context Header -->
      <div class="rounded-card border border-brand-hair bg-brand-canvas-soft p-4">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Produk yang Diulas
        </span>
        <h4 class="m-0 mt-0.5 font-display text-sm font-bold text-brand-ink">
          {{ productName }}
        </h4>
        <p v-if="orderId" class="m-0 mt-1 text-xs text-brand-muted">
          Nomor Pesanan: #{{ orderId }}
        </p>
      </div>

      <!-- Rating Picker -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-brand-ink sm:text-sm">
          Rating Produk <span class="text-rose-500">*</span>
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-1" role="radiogroup" aria-label="Rating bintang">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="group rounded p-1 text-2xl transition-transform duration-150 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
              :aria-label="`${star} bintang`"
              @click="setRating(star)"
              @mouseenter="hoverRating = star"
              @mouseleave="hoverRating = 0"
            >
              <i
                :class="[
                  'pi',
                  star <= activeRating
                    ? 'pi-star-fill text-amber-400'
                    : 'pi-star text-stone-300 group-hover:text-amber-200',
                  'transition-colors duration-150',
                ]"
              />
            </button>
          </div>
          <span
            class="text-xs font-semibold transition-colors duration-150"
            :class="activeRating > 0 ? 'text-brand-ink' : 'text-brand-muted'"
          >
            {{ dynamicFeedback }}
          </span>
        </div>
        <p v-if="ratingError" class="m-0 text-[11px] font-medium text-rose-600">
          {{ ratingError }}
        </p>
      </div>

      <!-- Review Text Area -->
      <div class="space-y-1.5">
        <UiTextarea
          v-model="reviewText"
          label="Ulasan Anda"
          placeholder="Ceritakan pengalaman Anda mengenai kualitas material, performa, dan kesesuaian produk ini..."
          :rows="4"
          :maxlength="1000"
          :error="textError"
          :disabled="isSubmitting"
        />

        <!-- Character counter and warning -->
        <div class="flex items-center justify-between text-[11px]">
          <span v-if="isTooShort" class="font-medium text-amber-600">
            Minimal 10 karakter agar ulasan informatif (kurang {{ 10 - charCount }} karakter).
          </span>
          <span v-else class="text-brand-muted"> Tulis ulasan yang jujur dan objektif. </span>
          <span
            class="font-mono tabular-nums"
            :class="charCount > 950 ? 'font-bold text-amber-600' : 'text-brand-muted'"
          >
            {{ charCount }} / 1000 karakter
          </span>
        </div>
      </div>

      <!-- Submit Error Banner -->
      <div
        v-if="submitError"
        class="rounded-field border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-circle shrink-0" />
          <span>{{ submitError }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-brand-hairsoft">
        <UiButton
          type="button"
          variant="ghost"
          size="sm"
          :disabled="isSubmitting"
          @click="isOpen = false"
        >
          Batal
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          size="sm"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          {{ existingReview ? 'Simpan Perubahan' : 'Kirim Ulasan' }}
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>
