<script setup lang="ts">
import { computed } from 'vue'

const loginUrl = computed(() => {
  let redirect = '/'
  try {
    const route = useRoute()
    if (route?.fullPath) redirect = route.fullPath
  } catch {
    // Route fallback in unit testing environments
  }
  return `/auth/login?redirect=${encodeURIComponent(redirect)}`
})
</script>

<template>
  <div
    class="guest-prompt-card flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-canvas-soft text-brand-ink"
    >
      <i class="pi pi-user text-xl text-brand-muted" aria-hidden="true" />
    </div>
    <h3 class="m-0 text-sm font-bold text-brand-ink">Silakan Masuk untuk Memulai Chat</h3>
    <p class="m-0 text-xs text-brand-muted max-w-xs leading-relaxed">
      Masuk ke akun ShelfStack Anda agar kami dapat memeriksa riwayat pesanan dan memberikan bantuan
      lebih cepat.
    </p>
    <a
      :href="loginUrl"
      class="btn-login inline-flex items-center justify-center rounded-full bg-brand-ink px-5 py-2 text-xs font-semibold text-white no-underline transition-all hover:bg-brand-inkhover active:scale-95 shadow-whisper"
    >
      Masuk Akun
    </a>
  </div>
</template>
