<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useAuth } from '~/features/auth/composables/useAuth'

useSeoMeta({
  title: 'Lupa Kata Sandi — ShelfStack',
  description:
    'Masukkan email terdaftar dan kami akan mengirim tautan untuk mengatur ulang kata sandi Anda.',
})
definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const toast = useToast()
const user = useSupabaseUser()
const { sendPasswordResetEmail, pending } = useAuth()

if (import.meta.client) {
  watch(
    user,
    (currentUser) => {
      if (currentUser) {
        navigateTo('/')
      }
    },
    { immediate: true },
  )
}

const email = ref('')
const emailError = ref('')
const isEmailSent = ref(false)

const validateEmail = (value: string) => {
  if (!value.trim()) return 'Email wajib diisi.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Format email tidak valid.'
  return ''
}

const handleSubmit = async () => {
  emailError.value = validateEmail(email.value)
  if (emailError.value) return

  try {
    await sendPasswordResetEmail(email.value.trim())
    isEmailSent.value = true
  } catch (e: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Mengirim',
      detail: e instanceof Error ? e.message : 'Terjadi kesalahan. Coba lagi.',
      life: 5000,
    })
  }
}
</script>

<template>
  <AuthCard
    title="Lupa Kata Sandi?"
    subtitle="Masukkan email terdaftar Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi."
  >
    <!-- Success State -->
    <div v-if="isEmailSent" class="flex flex-col items-center text-center gap-4 py-4">
      <div
        class="w-14 h-14 rounded-full bg-brand-canvas-soft flex items-center justify-center border border-brand-hair"
      >
        <i class="pi pi-envelope-open text-2xl text-brand-accent" />
      </div>
      <div>
        <p class="text-sm font-semibold text-brand-ink m-0">Email dikirim!</p>
        <p class="text-xs text-brand-muted m-0 mt-1.5 leading-relaxed">
          Cek inbox Anda di <span class="font-semibold text-brand-ink">{{ email }}</span
          >.<br />
          Klik tautan di email untuk mengatur password baru.
        </p>
      </div>
      <p class="text-xs text-brand-muted m-0">
        Tidak menerima email?
        <button
          type="button"
          class="text-brand-accent font-semibold hover:underline cursor-pointer"
          @click="isEmailSent = false"
        >
          Kirim ulang
        </button>
      </p>
    </div>

    <!-- Form State -->
    <form v-else novalidate class="flex flex-col gap-4" @submit.prevent="handleSubmit">
      <AuthFormInput
        id="email"
        v-model="email"
        label="Alamat Email"
        type="email"
        placeholder="nama@email.com"
        autocomplete="email"
        :error="emailError"
        @clear-error="emailError = ''"
      />

      <AuthSubmitButton
        :loading="pending"
        label="Kirim Tautan Reset"
        loading-label="Mengirim..."
        icon="pi-send"
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
