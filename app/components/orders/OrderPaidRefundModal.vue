<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const visible = defineModel<boolean>('visible', { default: false })

const props = defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: [reason: string]
}>()

const reason = ref('')
const localError = ref('')

const charCount = computed(() => reason.value.trim().length)

watch(visible, (open) => {
  if (open) {
    reason.value = ''
    localError.value = ''
  }
})

function handleSubmit() {
  const trimmed = reason.value.trim()
  if (trimmed.length < 5) {
    localError.value = 'Mohon tulis alasan pembatalan minimal 5 karakter.'
    return
  }
  localError.value = ''
  emit('confirm', trimmed)
}
</script>

<template>
  <UiModal
    v-model:visible="visible"
    size="sm"
    title="Ajukan Pembatalan & Refund"
    description="Pengajuan ini mengunci pesanan agar tidak dikirim sementara Admin meninjau pengembalian dana Midtrans dan koin Anda."
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <UiTextarea
        v-model="reason"
        label="Alasan Pembatalan"
        placeholder="Contoh: Salah pilih ukuran/alamat tujuan sebelum paket dikirim"
        :rows="3"
        :maxlength="300"
        :error="localError"
      />
      <div class="flex items-center justify-between text-xs text-brand-muted">
        <span>Minimal 5 karakter</span>
        <span class="tabular-nums">{{ charCount }} / 300</span>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <UiButton type="button" variant="secondary" @click="visible = false">Batal</UiButton>
        <UiButton type="submit" variant="primary" :loading="props.loading">
          Kirim Pengajuan Refund
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>
