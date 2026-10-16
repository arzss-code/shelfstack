<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'

useSeoMeta({
  title: 'Atur Ulang Kata Sandi — ShelfStack',
  description: 'Buat kata sandi baru untuk akun ShelfStack Anda.',
})
definePageMeta({ layout: 'default' })

const toast = useUiToast()
const { updatePassword, pending } = useAuth()

const newPassword = ref('')
const confirmPassword = ref('')
const errors = ref<{ newPassword?: string; confirmPassword?: string }>({})
const isSuccess = ref(false)

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
    <!-- Success State -->
    <div v-if="isSuccess" class="flex flex-col items-center text-center gap-4 py-4">
      <div
        class="w-14 h-14 rounded-full bg-brand-canvas-soft flex items-center justify-center border border-brand-hair"
      >
        <i class="pi pi-check-circle text-2xl text-green-500" />
      </div>
      <div>
        <p class="text-sm font-semibold text-brand-ink m-0">Password berhasil diperbarui!</p>
        <p class="text-xs text-brand-muted m-0 mt-1.5 leading-relaxed">
          Gunakan password baru Anda untuk masuk ke akun ShelfStack.
        </p>
      </div>
      <NuxtLink
        to="/auth/login"
        class="mt-2 inline-flex items-center justify-center gap-2 h-11 px-8 rounded-full bg-brand-ink text-white text-sm font-bold hover:bg-black transition-all"
      >
        <i class="pi pi-sign-in text-xs" />
        <span>Masuk Sekarang</span>
      </NuxtLink>
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
