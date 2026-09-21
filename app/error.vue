<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError,
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
      <div class="mb-6 flex justify-center">
        <i class="pi pi-exclamation-triangle text-6xl text-red-500" />
      </div>

      <h1 class="text-4xl font-bold text-gray-900 mb-2">
        {{ error?.statusCode || 500 }}
      </h1>

      <h2 class="text-xl font-semibold text-gray-700 mb-4">Oops! Ada yang salah.</h2>

      <p class="text-gray-500 mb-8">
        {{
          error?.message ||
          'Kami mengalami masalah saat memproses permintaan Anda. Silakan coba lagi.'
        }}
      </p>

      <Button
        label="Kembali ke Beranda"
        icon="pi pi-home"
        severity="primary"
        class="w-full"
        @click="handleError"
      />
    </div>
  </div>
</template>
