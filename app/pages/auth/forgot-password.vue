<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useAuth } from '~/features/auth/composables/useAuth'
import AppLogo from '~/components/AppLogo.vue'

useSeoMeta({
  title: 'Lupa Kata Sandi — ShelfStack',
  description:
    'Masukkan email terdaftar dan kami akan mengirim tautan untuk mengatur ulang kata sandi Anda.',
})
definePageMeta({ layout: 'default' })

const toast = useToast()
const { sendPasswordResetEmail, pending } = useAuth()

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
          Lupa Kata Sandi?
        </h1>
        <p
          class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1.5 leading-relaxed max-w-xs"
        >
          Masukkan email terdaftar Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi.
        </p>
      </div>

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
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Alamat Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
            :class="[
              'w-full h-11 px-4 rounded-xl border text-sm text-brand-ink bg-white placeholder:text-zinc-400 outline-none transition-all',
              emailError
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
            ]"
            @input="emailError = ''"
          />
          <small v-if="emailError" class="text-red-500 text-xs font-medium mt-0.5">
            {{ emailError }}
          </small>
        </div>

        <button
          type="submit"
          :disabled="pending"
          class="mt-2 w-full h-11 rounded-full bg-brand-ink text-white text-sm font-bold tracking-wide hover:bg-black active:scale-[0.98] transition-all shadow-whisper flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <i v-if="pending" class="pi pi-spin pi-spinner text-xs" />
          <i v-else class="pi pi-send text-xs" />
          <span>{{ pending ? 'Mengirim...' : 'Kirim Tautan Reset' }}</span>
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
