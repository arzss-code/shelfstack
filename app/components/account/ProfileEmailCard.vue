<script setup lang="ts">
import { ref } from 'vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiButton from '~/components/ui/UiButton.vue'

defineProps<{
  currentEmail?: string | null
  emailNotice?: string
  emailError?: string
  isUpdatingEmail: boolean
}>()

const emit = defineEmits<{
  updateEmail: [newEmail: string]
}>()

const newEmail = ref('')

const handleUpdate = () => {
  if (newEmail.value.trim()) {
    emit('updateEmail', newEmail.value.trim())
  }
}
</script>

<template>
  <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper">
    <div class="flex items-center gap-2 mb-1">
      <i class="pi pi-envelope text-brand-muted text-sm" />
      <h2 class="text-base font-display font-bold text-brand-ink m-0">
        Kontak Pribadi &amp; Email
      </h2>
    </div>
    <p class="text-xs text-brand-muted mb-4">
      Alamat email utama digunakan untuk login, verifikasi keamanan, dan notifikasi transaksi
      belanja.
    </p>

    <UiAlert v-if="emailNotice" variant="info" class="mb-4">{{ emailNotice }}</UiAlert>

    <div class="space-y-4 max-w-lg">
      <div
        class="p-3.5 rounded-field bg-brand-canvas border border-brand-hair flex items-center justify-between"
      >
        <div>
          <span class="text-[11px] text-brand-muted block font-medium"
            >Alamat Email Terdaftar:</span
          >
          <span class="font-bold text-brand-ink font-mono text-xs">{{ currentEmail }}</span>
        </div>
        <span
          class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1"
        >
          <i class="pi pi-check text-[9px]" />
          <span>Terverifikasi</span>
        </span>
      </div>

      <UiInput
        v-model="newEmail"
        label="Ganti dengan Email Baru"
        type="email"
        placeholder="email-baru@example.com"
        hint="Tautan verifikasi akan dikirimkan ke alamat email baru."
        :error="emailError"
        :disabled="isUpdatingEmail"
      />
    </div>

    <div class="pt-5 mt-6 border-t border-brand-hair flex justify-end">
      <UiButton
        variant="secondary"
        size="sm"
        :loading="isUpdatingEmail"
        :disabled="!newEmail || isUpdatingEmail"
        class="active:scale-95"
        @click="handleUpdate"
      >
        Perbarui Email
      </UiButton>
    </div>
  </div>
</template>
