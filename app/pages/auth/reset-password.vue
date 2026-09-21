<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useAuth } from '~/features/auth/composables/useAuth'
import AppLogo from '~/components/AppLogo.vue'

useSeoMeta({
  title: 'Atur Ulang Kata Sandi — ShelfStack',
  description: 'Buat kata sandi baru untuk akun ShelfStack Anda.',
})
definePageMeta({ layout: 'default' })

const toast = useToast()
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
  <div class="min-h-[75vh] flex flex-col items-center justify-center py-8 sm:py-12 px-4">
    <div
      class="w-full max-w-[460px] bg-brand-canvas border border-brand-hair rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-floating"
    >
      <!-- Brand Header -->
      <div class="flex flex-col items-center text-center mb-8">
        <NuxtLink to="/" class="mb-4 inline-block hover:opacity-90 transition-opacity">
          <AppLogo />
        </NuxtLink>
        <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0">
          Buat Password Baru
        </h1>
        <p
          class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1.5 leading-relaxed max-w-xs"
        >
          Pilih password yang kuat dan belum pernah digunakan sebelumnya.
        </p>
      </div>

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
        <!-- New Password -->
        <div class="flex flex-col gap-1.5">
          <label for="new_password" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Kata Sandi Baru
          </label>
          <input
            id="new_password"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            :class="[
              'w-full h-11 px-4 rounded-xl border text-sm text-brand-ink bg-white placeholder:text-zinc-400 outline-none transition-all',
              errors.newPassword
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
            ]"
            @input="errors.newPassword = undefined"
          />
          <small v-if="errors.newPassword" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.newPassword }}
          </small>
        </div>

        <!-- Confirm Password -->
        <div class="flex flex-col gap-1.5">
          <label for="confirm_new_password" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Konfirmasi Kata Sandi
          </label>
          <input
            id="confirm_new_password"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Ulangi kata sandi baru"
            :class="[
              'w-full h-11 px-4 rounded-xl border text-sm text-brand-ink bg-white placeholder:text-zinc-400 outline-none transition-all',
              errors.confirmPassword
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
            ]"
            @input="errors.confirmPassword = undefined"
          />
          <small v-if="errors.confirmPassword" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.confirmPassword }}
          </small>
        </div>

        <!-- CTA -->
        <button
          type="submit"
          :disabled="pending"
          class="mt-2 w-full h-11 rounded-full bg-brand-ink text-white text-sm font-bold tracking-wide hover:bg-black active:scale-[0.98] transition-all shadow-whisper flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <i v-if="pending" class="pi pi-spin pi-spinner text-xs" />
          <i v-else class="pi pi-lock text-xs" />
          <span>{{ pending ? 'Menyimpan...' : 'Simpan Password Baru' }}</span>
        </button>
      </form>

      <!-- Back to Login -->
      <div class="mt-6 text-center">
        <NuxtLink
          to="/auth/login"
          class="text-xs text-brand-muted hover:text-brand-ink transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <i class="pi pi-arrow-left text-[10px]" />
          <span>Kembali ke halaman masuk</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
