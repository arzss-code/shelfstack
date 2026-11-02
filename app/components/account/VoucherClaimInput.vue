<script setup lang="ts">
import { ref } from 'vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiButton from '~/components/ui/UiButton.vue'

const props = withDefaults(
  defineProps<{
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  submit: [code: string]
}>()

const inputCode = ref('')
const inputError = ref('')

const handleClaim = () => {
  inputError.value = ''
  const trimmed = inputCode.value.trim()

  if (!trimmed) {
    inputError.value = 'Silakan masukkan kode voucher terlebih dahulu.'
    return
  }

  if (trimmed.length < 2) {
    inputError.value = 'Kode voucher minimal 2 karakter.'
    return
  }

  emit('submit', trimmed)
  inputCode.value = ''
}
</script>

<template>
  <div class="bg-brand-canvas border border-brand-hair rounded-card p-5 shadow-whisper">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="space-y-1">
        <h2
          class="text-sm sm:text-base font-display font-bold text-brand-ink m-0 flex items-center gap-2"
        >
          <i class="pi pi-ticket text-brand-accent text-sm" />
          <span>Punya Kode Voucher Eksklusif?</span>
        </h2>
        <p class="text-xs text-brand-muted m-0">
          Masukkan kode voucher dari kampanye promo khusus untuk disimpan ke akun Anda.
        </p>
      </div>

      <form
        class="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        @submit.prevent="handleClaim"
      >
        <div class="w-full sm:w-64">
          <UiInput
            v-model="inputCode"
            placeholder="Contoh: HEMAT50K"
            :error="inputError"
            :disabled="loading"
            class="uppercase font-mono text-xs"
          />
        </div>

        <UiButton
          type="submit"
          variant="primary"
          size="sm"
          :loading="loading"
          class="shrink-0 active:scale-95 self-end sm:self-auto"
        >
          Klaim Voucher
        </UiButton>
      </form>
    </div>
  </div>
</template>
