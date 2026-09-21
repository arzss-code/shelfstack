<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { loginSchema } from '~~/shared/schemas/auth'
import { useAuth } from '~/features/auth/composables/useAuth'
import AppLogo from '~/components/AppLogo.vue'

useSeoMeta({
  title: 'Masuk ke Akun — ShelfStack',
  description:
    'Masuk ke akun ShelfStack untuk kemudahan belanja, lacak pesanan, dan penawaran eksklusif.',
})
definePageMeta({ layout: 'default' })

const toast = useToast()
const route = useRoute()
const { signIn, signInWithGoogle, pending } = useAuth()

const email = ref('')
const password = ref('')
const errors = ref<{ email?: string; password?: string }>({})

const redirectTo = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/',
)

const handleLogin = async () => {
  const parsed = loginSchema.safeParse({ email: email.value, password: password.value })
  errors.value = parsed.success
    ? {}
    : {
        email: parsed.error.flatten().fieldErrors.email?.[0],
        password: parsed.error.flatten().fieldErrors.password?.[0],
      }
  if (!parsed.success) return

  try {
    await signIn(parsed.data.email, parsed.data.password)
    await navigateTo(redirectTo.value)
  } catch (e: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Masuk',
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
          Masuk
        </h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1.5 leading-relaxed">
          Silakan masuk untuk melanjutkan transaksi dan kelola akun belanja Anda.
        </p>
      </div>

      <!-- Login Form -->
      <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
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
          <div class="flex items-center justify-between">
            <label for="password" class="text-xs sm:text-sm font-semibold text-brand-ink">
              Kata Sandi
            </label>
            <span
              class="text-xs text-brand-muted hover:text-brand-ink cursor-pointer transition-colors"
            >
              Lupa sandi?
            </span>
          </div>
          <Password
            id="password"
            v-model="password"
            :feedback="false"
            toggle-mask
            autocomplete="current-password"
            placeholder="••••••••"
            input-class="w-full"
            class="w-full"
            :invalid="!!errors.password"
          />
          <small v-if="errors.password" class="text-red-500 text-xs font-medium mt-0.5">
            {{ errors.password }}
          </small>
        </div>

        <Button
          type="submit"
          label="Masuk"
          icon="pi pi-sign-in"
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
        label="Masuk dengan Google"
        icon="pi pi-google"
        severity="secondary"
        outlined
        rounded
        class="w-full h-11 font-semibold text-sm cursor-pointer hover:bg-brand-canvas-soft transition-colors"
        :loading="pending"
        @click="handleGoogle"
      />

      <!-- Security / Trust Reassurance -->
      <div
        class="mt-6 pt-5 border-t border-brand-hairsoft flex items-center justify-center gap-4 text-[11px] text-brand-muted"
      >
        <span class="inline-flex items-center gap-1.5">
          <i class="pi pi-shield text-brand-accent text-xs" />
          <span>Enkripsi 256-bit Aman</span>
        </span>
        <span class="text-brand-faint">•</span>
        <span class="inline-flex items-center gap-1.5">
          <i class="pi pi-check-circle text-brand-success text-xs" />
          <span>Privasi Terjaga</span>
        </span>
      </div>

      <!-- Register Prompt -->
      <p class="mt-6 text-center text-xs sm:text-sm text-brand-muted m-0">
        Belum punya akun?
        <NuxtLink to="/auth/register" class="font-bold text-brand-accent hover:underline ml-1">
          Daftar sekarang
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
