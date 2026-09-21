<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { loginSchema } from '~~/shared/schemas/auth'
import { useAuth } from '~/features/auth/composables/useAuth'

useSeoMeta({ title: 'Masuk' })
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
  <div class="mx-auto w-full max-w-[440px] py-10">
    <h1 class="m-0 mb-1 text-4xl font-medium leading-[1.17] text-brand-ink">Masuk</h1>
    <p class="m-0 mb-8 text-surface-500 dark:text-surface-400">
      Kelola ShelfStack sebagai admin atau belanja sebagai customer.
    </p>

    <form class="flex flex-col gap-5" @submit.prevent="handleLogin">
      <div class="flex flex-col gap-2">
        <label for="email" class="text-sm font-medium">Email</label>
        <InputText
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="nama@email.com"
          :invalid="!!errors.email"
        />
        <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
      </div>

      <div class="flex flex-col gap-2">
        <label for="password" class="text-sm font-medium">Password</label>
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
        <small v-if="errors.password" class="text-red-500">{{ errors.password }}</small>
      </div>

      <Button
        type="submit"
        label="Masuk"
        icon="pi pi-sign-in"
        severity="contrast"
        rounded
        :loading="pending"
        @click="handleLogin"
      />
    </form>

    <Divider align="center"><span class="text-sm text-surface-500">atau</span></Divider>

    <Button
      label="Masuk dengan Google"
      icon="pi pi-google"
      severity="secondary"
      outlined
      rounded
      class="w-full"
      :loading="pending"
      @click="handleGoogle"
    />

    <p class="mt-8 text-center text-sm text-surface-500">
      Belum punya akun?
      <NuxtLink to="/auth/register" class="font-bold text-brand-cobaltdeep">Daftar</NuxtLink>
    </p>
  </div>
</template>
