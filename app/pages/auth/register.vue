<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { registerSchema } from '~~/shared/schemas/auth'
import { useAuth } from '~/features/auth/composables/useAuth'

useSeoMeta({ title: 'Daftar' })

const toast = useToast()
const { signUp, pending } = useAuth()

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
      detail: 'Akun dibuat. Kamu langsung masuk sebagai customer.',
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
</script>

<template>
  <div class="mx-auto w-full max-w-[440px] py-10">
    <h1 class="m-0 mb-1 text-4xl font-medium leading-[1.17] text-brand-ink">Daftar</h1>
    <p class="m-0 mb-8 text-surface-500 dark:text-surface-400">
      Satu akun untuk belanja. Akses admin diberikan manual oleh pemilik toko.
    </p>

    <form class="flex flex-col gap-5" @submit.prevent="handleRegister">
      <div class="flex flex-col gap-2">
        <label for="full_name" class="text-sm font-medium">Nama lengkap</label>
        <InputText
          id="full_name"
          v-model="fullName"
          autocomplete="name"
          placeholder="Nama kamu"
          :invalid="!!errors.full_name"
        />
        <small v-if="errors.full_name" class="text-red-500">{{ errors.full_name }}</small>
      </div>

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
          v-model="password"
          toggle-mask
          autocomplete="new-password"
          placeholder="Minimal 8 karakter"
          input-class="w-full"
          class="w-full"
          :invalid="!!errors.password"
        />
        <small v-if="errors.password" class="text-red-500">{{ errors.password }}</small>
      </div>

      <div class="flex flex-col gap-2">
        <label for="confirm_password" class="text-sm font-medium">Konfirmasi password</label>
        <Password
          v-model="confirmPassword"
          :feedback="false"
          toggle-mask
          autocomplete="new-password"
          placeholder="Ulangi password"
          input-class="w-full"
          class="w-full"
          :invalid="!!errors.confirm_password"
        />
        <small v-if="errors.confirm_password" class="text-red-500">{{
          errors.confirm_password
        }}</small>
      </div>

      <Button
        type="submit"
        label="Buat Akun"
        icon="pi pi-user-plus"
        severity="contrast"
        rounded
        :loading="pending"
        @click="handleRegister"
      />
    </form>

    <p class="mt-8 text-center text-sm text-surface-500">
      Sudah punya akun?
      <NuxtLink to="/auth/login" class="font-bold text-brand-cobaltdeep">Masuk</NuxtLink>
    </p>
  </div>
</template>
