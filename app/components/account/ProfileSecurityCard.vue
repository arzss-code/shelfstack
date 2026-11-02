<script setup lang="ts">
import { ref, computed } from 'vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiAlert from '~/components/ui/UiAlert.vue'

const props = defineProps<{
  loading: boolean
  error: string
  success: boolean
}>()

const emit = defineEmits<{
  save: [newPassword: string, confirmPassword: string]
}>()

const newPassword = ref('')
const confirmPassword = ref('')

const isPasswordLengthValid = computed(() => newPassword.value.length >= 8)
const isPasswordMatch = computed(
  () => confirmPassword.value.length > 0 && newPassword.value === confirmPassword.value,
)

const handleSave = () => {
  emit('save', newPassword.value, confirmPassword.value)
}

const clearInputs = () => {
  newPassword.value = ''
  confirmPassword.value = ''
}

defineExpose({
  clearInputs,
})
</script>

<template>
  <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper">
    <div class="flex items-center gap-2 mb-1">
      <i class="pi pi-lock text-brand-muted text-sm" />
      <h2 class="text-base font-display font-bold text-brand-ink m-0">Keamanan &amp; Kata Sandi</h2>
    </div>
    <p class="text-xs text-brand-muted mb-4">
      Pastikan kata sandi Anda kuat untuk melindungi akun dan riwayat transaksi belanja Anda.
    </p>

    <UiAlert v-if="success" variant="success" class="mb-4">
      Kata sandi berhasil diperbarui.
    </UiAlert>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
      <UiInput
        v-model="newPassword"
        label="Kata Sandi Baru"
        type="password"
        placeholder="Minimal 8 karakter"
        show-password-toggle
        :error="error"
        :disabled="loading"
      />
      <UiInput
        v-model="confirmPassword"
        label="Konfirmasi Kata Sandi Baru"
        type="password"
        placeholder="Ulangi kata sandi baru"
        show-password-toggle
        :disabled="loading"
      />
    </div>

    <!-- Live Checklist (Shopee pattern) -->
    <div
      v-if="newPassword || confirmPassword"
      class="mt-3.5 p-3 rounded-field bg-brand-canvas-soft border border-brand-hair flex items-center gap-4 text-xs max-w-2xl"
    >
      <div
        class="flex items-center gap-1.5"
        :class="isPasswordLengthValid ? 'text-emerald-700' : 'text-brand-muted'"
      >
        <i
          :class="
            isPasswordLengthValid
              ? 'pi pi-check-circle text-emerald-600'
              : 'pi pi-circle text-brand-faint'
          "
          class="text-xs"
        />
        <span>Minimal 8 karakter</span>
      </div>
      <div
        class="flex items-center gap-1.5"
        :class="isPasswordMatch ? 'text-emerald-700' : 'text-brand-muted'"
      >
        <i
          :class="
            isPasswordMatch
              ? 'pi pi-check-circle text-emerald-600'
              : 'pi pi-circle text-brand-faint'
          "
          class="text-xs"
        />
        <span>Konfirmasi cocok</span>
      </div>
    </div>

    <div class="pt-5 mt-6 border-t border-brand-hair flex justify-end">
      <UiButton
        variant="primary"
        size="sm"
        :loading="loading"
        :disabled="!isPasswordLengthValid || !isPasswordMatch || loading"
        class="active:scale-95"
        @click="handleSave"
      >
        Simpan Kata Sandi
      </UiButton>
    </div>
  </div>
</template>
