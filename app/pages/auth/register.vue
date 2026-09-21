<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { registerSchema } from '~~/shared/schemas/auth'
import { useAuth } from '~/features/auth/composables/useAuth'
import AppLogo from '~/components/AppLogo.vue'

useSeoMeta({
  title: 'Buat Akun Baru — ShelfStack',
  description:
    'Daftar akun ShelfStack sekarang untuk menikmati promo eksklusif dan belanja produk kurasi terbaik.',
})
definePageMeta({ layout: 'default' })

const toast = useToast()
const { signUp, signInWithGoogle, pending } = useAuth()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errors = ref<Record<string, string | undefined>>({})

const handleRegister = async () => {
  const parsed = registerSchema.safeParse({
    full_name: fullName.value,
    email: email.value,
    password: password.value,
    confirm_password: confirmPassword.value,
  })
  errors.value = {}
  if (!parsed.success) {
    for (const [field, msgs] of Object.entries(parsed.error.flatten().fieldErrors)) {
      errors.value[field] = msgs?.[0]
    }
    return
  }

  try {
    await signUp(parsed.data.full_name, parsed.data.email, parsed.data.password)
    toast.add({
      severity: 'success',
      summary: 'Berhasil Daftar',
      detail: 'Akun berhasil dibuat. Selamat datang di ShelfStack!',
      life: 4000,
    })
    await navigateTo('/')
  } catch (e: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Daftar',
      detail: e instanceof Error ? e.message : 'Terjadi kesalahan.',
      life: 5000,
    })
  }
}

const handleGoogle = async () => {
  try {
    await signInWithGoogle()
  } catch (e: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal',
      detail: e instanceof Error ? e.message : 'Login Google gagal.',
      life: 5000,
    })
  }
}
</script>

<template>
  <div class="min-h-[75vh] flex flex-col items-center justify-center py-8 sm:py-12 px-4">
    <!-- Card Container -->
    <div
      class="w-full max-w-[460px] bg-brand-canvas border border-brand-hair rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-floating"
    >
      <!-- Brand Header -->
      <div class="flex flex-col items-center text-center mb-8">
        <NuxtLink to="/" class="mb-4 inline-block hover:opacity-90 transition-opacity">
          <AppLogo />
        </NuxtLink>
        <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0">
          Buat Akun
        </h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1.5 leading-relaxed">
          Daftar gratis dan mulai belanja produk kurasi terbaik ShelfStack.
        </p>
      </div>

      <!-- Register Form -->
      <form novalidate class="flex flex-col gap-4" @submit.prevent="handleRegister">
        <!-- Full Name -->
        <div class="flex flex-col gap-1.5">
          <label for="full_name" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Nama Lengkap
          </label>
          <input
            id="full_name"
            v-model="fullName"
            type="text"
            autocomplete="name"
            placeholder="Nama lengkap Anda"
            :class="[
              'w-full h-11 px-4 rounded-xl border text-sm text-brand-ink bg-white placeholder:text-zinc-400 outline-none transition-all',
              errors.full_name
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
            ]"
          />
          <small v-if="errors.full_name" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.full_name }}
          </small>
        </div>

        <!-- Email -->
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
              errors.email
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
            ]"
          />
          <small v-if="errors.email" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.email }}
          </small>
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Kata Sandi
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            :class="[
              'w-full h-11 px-4 rounded-xl border text-sm text-brand-ink bg-white placeholder:text-zinc-400 outline-none transition-all',
              errors.password
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
            ]"
          />
          <small v-if="errors.password" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.password }}
          </small>
        </div>

        <!-- Confirm Password -->
        <div class="flex flex-col gap-1.5">
          <label for="confirm_password" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Konfirmasi Kata Sandi
          </label>
          <input
            id="confirm_password"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="Ulangi kata sandi"
            :class="[
              'w-full h-11 px-4 rounded-xl border text-sm text-brand-ink bg-white placeholder:text-zinc-400 outline-none transition-all',
              errors.confirm_password
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-zinc-300 focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/10',
            ]"
          />
          <small v-if="errors.confirm_password" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.confirm_password }}
          </small>
        </div>

        <!-- Primary CTA Button -->
        <button
          type="submit"
          :disabled="pending"
          class="mt-2 w-full h-11 rounded-full bg-brand-ink text-white text-sm font-bold tracking-wide hover:bg-black active:scale-[0.98] transition-all shadow-whisper flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          <i v-if="pending" class="pi pi-spin pi-spinner text-xs" />
          <i v-else class="pi pi-user-plus text-xs" />
          <span>{{ pending ? 'Memproses...' : 'Buat Akun' }}</span>
        </button>
      </form>

      <!-- Divider -->
      <div class="relative my-6 text-center">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-brand-hairsoft" />
        </div>
        <div class="relative flex justify-center">
          <span class="bg-brand-canvas px-3 text-xs text-brand-muted">atau</span>
        </div>
      </div>

      <!-- Google OAuth -->
      <button
        type="button"
        :disabled="pending"
        class="w-full h-11 rounded-full border border-zinc-300 hover:border-zinc-400 bg-white text-brand-ink text-sm font-semibold hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        @click="handleGoogle"
      >
        <i class="pi pi-google text-sm" />
        <span>Daftar dengan Google</span>
      </button>

      <!-- Security / Trust Reassurance -->
      <div
        class="mt-6 pt-5 border-t border-brand-hairsoft flex items-center justify-center gap-4 text-[11px] text-brand-muted"
      >
        <span class="inline-flex items-center gap-1.5">
          <i class="pi pi-shield text-brand-accent text-xs" />
          <span>Keamanan Terjamin</span>
        </span>
        <span class="text-brand-faint">•</span>
        <span class="inline-flex items-center gap-1.5">
          <i class="pi pi-bolt text-brand-accent text-xs" />
          <span>Checkout Lebih Cepat</span>
        </span>
      </div>

      <!-- Login Prompt -->
      <p class="mt-6 text-center text-xs sm:text-sm text-brand-muted m-0">
        Sudah punya akun?
        <NuxtLink to="/auth/login" class="font-bold text-brand-accent hover:underline ml-1">
          Masuk
        </NuxtLink>
      </p>
    </div>

    <!-- Quick Back to Home -->
    <div class="mt-6 text-center">
      <NuxtLink
        to="/"
        class="text-xs text-brand-muted hover:text-brand-ink transition-colors inline-flex items-center gap-1.5"
      >
        <i class="pi pi-arrow-left text-[10px]" />
        <span>Kembali ke Beranda ShelfStack</span>
      </NuxtLink>
    </div>
  </div>
</template>
