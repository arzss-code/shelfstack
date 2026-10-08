<script setup lang="ts">
import type { NuxtError } from '#app'

withDefaults(
  defineProps<{
    error?: NuxtError
  }>(),
  {
    error: () => ({ statusCode: 500, message: 'Terjadi kesalahan pada sistem.' }) as NuxtError,
  },
)

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-brand-canvas text-brand-ink p-4 selection:bg-brand-accent selection:text-white"
  >
    <div
      class="max-w-md w-full bg-brand-canvas-soft border border-brand-hair rounded-card shadow-floating p-8 text-center space-y-4"
    >
      <div
        class="w-16 h-16 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mx-auto text-brand-muted shadow-whisper"
      >
        <i class="pi pi-exclamation-triangle text-2xl text-brand-warning" />
      </div>

      <span class="font-medium text-xs uppercase tracking-wider text-brand-muted block">
        Kode Status
      </span>

      <h1 class="font-display text-5xl font-bold text-brand-ink m-0">
        {{ error?.statusCode || 500 }}
      </h1>

      <h2 class="font-display text-lg font-bold text-brand-ink m-0">Kendala Akses Terdeteksi</h2>

      <p class="font-body text-xs sm:text-sm text-brand-muted leading-relaxed m-0">
        {{
          error?.message ||
          'Kami mengalami kendala saat memproses permintaan Anda. Silakan coba kembali beberapa saat lagi.'
        }}
      </p>

      <div class="pt-4">
        <UiButton variant="primary" block icon="pi-home" class="h-11" @click="handleError">
          Kembali ke Beranda
        </UiButton>
      </div>
    </div>
  </div>
</template>
