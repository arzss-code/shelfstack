<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'

useSeoMeta({
  title: 'Atur Ulang Kata Sandi - ShelfStack',
  description: 'Buat kata sandi baru untuk akun ShelfStack Anda.',
})
definePageMeta({ layout: 'default' })

const toast = useUiToast()
const user = useSupabaseUser()
const { updatePassword, pending } = useAuth()

const newPassword = ref('')
const confirmPassword = ref('')
const errors = ref<{ newPassword?: string; confirmPassword?: string }>({})
const isSuccess = ref(false)
const hasRecoverySession = ref(true)

onMounted(() => {
  // Periksa apakah terdapat sesi pemulihan kata sandi aktif
  if (!user.value) {
    hasRecoverySession.value = false
  }
})

const validate = () => {
  const errs: typeof errors.value = {}
  if (!newPassword.value) {
    errs.newPassword = 'Kata sandi baru wajib diisi.'
  } else if (newPassword.value.length < 8) {
    errs.newPassword = 'Kata sandi minimal 8 karakter.'
  }
  if (!confirmPassword.value) {
    errs.confirmPassword = 'Konfirmasi kata sandi wajib diisi.'
  } else if (newPassword.value !== confirmPassword.value) {
    errs.confirmPassword = 'Kata sandi tidak cocok.'
  }
  return errs
}

const handleSubmit = async () => {
  errors.value = validate()
  if (Object.keys(errors.value).length > 0) return

  try {
    await updatePassword(newPassword.value)
    isSuccess.value = true
  } catch (e: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Memperbarui',
      detail: e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.',
      life: 5000,
    })
  }
}
</script>

<template>
  <AuthCard
    title="Buat Password Baru"
    subtitle="Pilih password yang kuat dan belum pernah digunakan sebelumnya."
  >
    <!-- Invalid Session State -->
    <div v-if="!hasRecoverySession" class="flex flex-col items-center text-center gap-4 py-4">
      <div
        class="w-14 h-14 rounded-full bg-brand-canvas-soft flex items-center justify-center border border-brand-hair"
      >
        <i class="pi pi-exclamation-circle text-2xl text-brand-warn-text" />
      </div>
      <div>
        <p class="text-sm font-semibold text-brand-ink m-0">Sesi Pemulihan Tidak Ditemukan</p>
        <p class="text-xs text-brand-muted m-0 mt-1.5 leading-relaxed">
          Tautan pemulihan mungkin sudah kedaluwarsa atau belum dibuka dari email. Silakan minta
          tautan baru.
        </p>
      </div>
      <UiButton to="/auth/forgot-password" variant="primary" icon="pi-refresh" class="mt-2">
        Minta Tautan Baru
      </UiButton>
    </div>

    <!-- Success State -->
    <div v-else-if="isSuccess" class="flex flex-col items-center text-center gap-4 py-4">
      <div
        class="w-14 h-14 rounded-full bg-brand-canvas-soft flex items-center justify-center border border-brand-hair"
      >
        <i class="pi pi-check-circle text-2xl text-brand-success-text" />
      </div>
      <div>
        <p class="text-sm font-semibold text-brand-ink m-0">Password berhasil diperbarui!</p>
        <p class="text-xs text-brand-muted m-0 mt-1.5 leading-relaxed">
          Gunakan password baru Anda untuk masuk ke akun ShelfStack.
        </p>
      </div>
      <UiButton to="/auth/login" variant="primary" icon="pi-sign-in" class="mt-2">
        Masuk Sekarang
      </UiButton>
    </div>

    <!-- Form State -->
    <form v-else novalidate class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <AuthFormInput
        id="new_password"
        v-model="newPassword"
        label="Kata Sandi Baru"
        type="password"
        placeholder="Minimal 8 karakter"
        autocomplete="new-password"
        :error="errors.newPassword"
        @clear-error="errors.newPassword = undefined"
      />

      <AuthFormInput
        id="confirm_new_password"
        v-model="confirmPassword"
        label="Konfirmasi Kata Sandi"
        type="password"
        placeholder="Ulangi kata sandi baru"
        autocomplete="new-password"
        :error="errors.confirmPassword"
        @clear-error="errors.confirmPassword = undefined"
      />

      <AuthSubmitButton
        :loading="pending"
        label="Simpan Password Baru"
        loading-label="Menyimpan..."
        icon="pi-lock"
      />
    </form>

    <!-- Footer -->
    <template #footer>
      <div class="mt-6 text-center">
        <NuxtLink
          to="/auth/login"
          class="text-xs text-brand-muted hover:text-brand-ink transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <i class="pi pi-arrow-left text-[10px]" />
          <span>Kembali ke halaman masuk</span>
        </NuxtLink>
      </div>
    </template>
  </AuthCard>
</template>
