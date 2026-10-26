<script setup lang="ts">
import { registerSchema } from '~~/shared/schemas/auth'
import { useAuth } from '~/features/auth/composables/useAuth'

useSeoMeta({
  title: 'Buat Akun Baru - ShelfStack',
  description:
    'Daftar akun ShelfStack sekarang untuk menikmati promo eksklusif dan belanja produk kurasi terbaik.',
})
definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const toast = useUiToast()
const user = useSupabaseUser()
const { signUp, signInWithGoogle, pending } = useAuth()

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
  <AuthCard
    title="Buat Akun"
    subtitle="Daftar akun untuk menyimpan alamat dan belanja produk kurasi."
  >
    <!-- Register Form -->
    <form novalidate class="flex flex-col gap-3 sm:gap-3.5" @submit.prevent="handleRegister">
      <AuthFormInput
        id="full_name"
        v-model="fullName"
        label="Nama Lengkap"
        placeholder="Nama lengkap Anda"
        autocomplete="name"
        :error="errors.full_name"
        @clear-error="errors.full_name = undefined"
      />

      <AuthFormInput
        id="email"
        v-model="email"
        label="Alamat Email"
        type="email"
        placeholder="nama@email.com"
        autocomplete="email"
        :error="errors.email"
        @clear-error="errors.email = undefined"
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        <AuthFormInput
          id="password"
          v-model="password"
          label="Kata Sandi"
          type="password"
          placeholder="Min. 8 karakter"
          autocomplete="new-password"
          :error="errors.password"
          @clear-error="errors.password = undefined"
        />

        <AuthFormInput
          id="confirm_password"
          v-model="confirmPassword"
          label="Konfirmasi Sandi"
          type="password"
          placeholder="Ulangi kata sandi"
          autocomplete="new-password"
          :error="errors.confirm_password"
          @clear-error="errors.confirm_password = undefined"
        />
      </div>

      <AuthSubmitButton
        :loading="pending"
        label="Buat Akun"
        loading-label="Memproses..."
        icon="pi-user-plus"
      />
    </form>

    <!-- OAuth -->
    <template #oauth>
      <AuthDivider />
      <UiButton
        type="button"
        variant="outline"
        block
        :disabled="pending"
        icon="pi-google"
        @click="handleGoogle"
      >
        Daftar dengan Google
      </UiButton>
    </template>

    <!-- Footer -->
    <template #footer>
      <p class="mt-4 sm:mt-5 text-center text-xs sm:text-sm text-brand-muted m-0">
        Sudah punya akun?
        <NuxtLink to="/auth/login" class="font-bold text-brand-accent hover:underline ml-1">
          Masuk
        </NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>
