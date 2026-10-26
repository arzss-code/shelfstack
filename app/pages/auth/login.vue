<script setup lang="ts">
import { loginSchema } from '~~/shared/schemas/auth'
import { useAuth } from '~/features/auth/composables/useAuth'

useSeoMeta({
  title: 'Masuk ke Akun - ShelfStack',
  description:
    'Masuk ke akun ShelfStack untuk kemudahan belanja, lacak pesanan, dan penawaran eksklusif.',
})
definePageMeta({
  layout: 'default',
  middleware: 'guest',
})

const toast = useUiToast()
const route = useRoute()
const user = useSupabaseUser()
const { signIn, signInWithGoogle, pending } = useAuth()

const email = ref('')
const password = ref('')
const errors = ref<{ email?: string; password?: string }>({})

const redirectTo = computed(() =>
  typeof route.query.redirect === 'string' &&
  route.query.redirect.startsWith('/') &&
  !route.query.redirect.startsWith('//')
    ? route.query.redirect
    : '/',
)

if (import.meta.client) {
  watch(
    user,
    (currentUser) => {
      if (currentUser) {
        navigateTo(redirectTo.value)
      }
    },
    { immediate: true },
  )
}

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
  <AuthCard title="Masuk" subtitle="Masuk ke akun Anda untuk melanjutkan pesanan belanja.">
    <!-- Login Form -->
    <form novalidate class="flex flex-col gap-3.5" @submit.prevent="handleLogin">
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

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label for="password" class="text-xs sm:text-sm font-semibold text-brand-ink">
            Kata Sandi
          </label>
          <NuxtLink
            to="/auth/forgot-password"
            class="text-xs text-brand-accent hover:underline font-medium no-underline"
          >
            Lupa sandi?
          </NuxtLink>
        </div>
        <!-- Render input only, label hidden via empty string -->
        <AuthFormInput
          id="password"
          v-model="password"
          label=""
          type="password"
          placeholder="••••••••"
          autocomplete="current-password"
          :error="errors.password"
          @clear-error="errors.password = undefined"
        />
      </div>

      <AuthSubmitButton
        :loading="pending"
        label="Masuk"
        loading-label="Memproses..."
        icon="pi-sign-in"
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
        Masuk dengan Google
      </UiButton>
    </template>

    <!-- Footer -->
    <template #footer>
      <p class="mt-5 text-center text-xs sm:text-sm text-brand-muted m-0">
        Belum punya akun?
        <NuxtLink to="/auth/register" class="font-bold text-brand-accent hover:underline ml-1">
          Daftar sekarang
        </NuxtLink>
      </p>
    </template>
  </AuthCard>
</template>
