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
      class="w-full max-w-[480px] bg-brand-canvas border border-brand-hair rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-floating"
    >
      <!-- Brand Header -->
      <div class="flex flex-col items-center text-center mb-8">
        <NuxtLink to="/" class="mb-4 inline-block hover:opacity-90 transition-opacity">
          <AppLogo />
        </NuxtLink>
        <h1 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0">
          Daftar
        </h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1.5 leading-relaxed">
          Buat akun baru untuk kemudahan transaksi, pelacakan pengiriman, dan penawaran khusus.
        </p>
      </div>

      <!-- Register Form -->
      <form class="flex flex-col gap-4" @submit.prevent="handleRegister">
        <div class="flex flex-col gap-1.5">
          <label for="full_name" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Nama Lengkap
          </label>
          <InputText
            id="full_name"
            v-model="fullName"
            autocomplete="name"
            placeholder="Nama kamu"
            class="w-full"
            :invalid="!!errors.full_name"
          />
          <small v-if="errors.full_name" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.full_name }}
          </small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Alamat Email
          </label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
            class="w-full"
            :invalid="!!errors.email"
          />
          <small v-if="errors.email" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.email }}
          </small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="password" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Kata Sandi
          </label>
          <Password
            id="password"
            v-model="password"
            toggle-mask
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            input-class="w-full"
            class="w-full"
            :invalid="!!errors.password"
          />
          <small v-if="errors.password" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.password }}
          </small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="confirm_password" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Konfirmasi Kata Sandi
          </label>
          <Password
            id="confirm_password"
            v-model="confirmPassword"
            :feedback="false"
            toggle-mask
            autocomplete="new-password"
            placeholder="Ulangi password"
            input-class="w-full"
            class="w-full"
            :invalid="!!errors.confirm_password"
          />
          <small v-if="errors.confirm_password" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.confirm_password }}
          </small>
        </div>

        <Button
          type="submit"
          label="Buat Akun"
          icon="pi pi-user-plus"
          severity="contrast"
          rounded
          class="w-full h-11 font-semibold text-sm cursor-pointer mt-2 shadow-whisper"
          :loading="pending"
        />
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
      <Button
        label="Daftar dengan Google"
        icon="pi pi-google"
        severity="secondary"
        outlined
        rounded
        class="w-full h-11 font-semibold text-sm cursor-pointer hover:bg-brand-canvas-soft transition-colors"
        :loading="pending"
        @click="handleGoogle"
      />

      <!-- Benefits / Trust List -->
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
