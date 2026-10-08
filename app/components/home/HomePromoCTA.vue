<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'

const { isLoggedIn, isAdmin } = useAuth()
</script>

<template>
  <section class="rounded-card bg-brand-ink text-white p-8 sm:p-12 shadow-floating">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
      <div class="max-w-xl">
        <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold leading-tight text-white mb-2">
          Kelola katalogmu sendiri
        </h2>
        <p class="font-body m-0 text-sm sm:text-base leading-relaxed text-white/80">
          Masuk sebagai pemilik toko untuk menambah produk baru, mengatur persediaan stok, dan
          memantau pesanan dari satu dashboard terpadu.
        </p>
      </div>

      <NuxtLink
        v-if="!isLoggedIn"
        to="/auth/login"
        class="shrink-0 rounded-full bg-white text-brand-ink px-8 py-3.5 text-sm font-bold no-underline hover:bg-white/90 transition-colors shadow-whisper inline-flex items-center justify-center"
      >
        Masuk
      </NuxtLink>
      <NuxtLink
        v-else-if="isAdmin"
        to="/admin/products"
        class="shrink-0 rounded-full bg-white text-brand-ink px-8 py-3.5 text-sm font-bold no-underline hover:bg-white/90 transition-colors shadow-whisper inline-flex items-center justify-center gap-2"
      >
        <span>Kelola Produk (Admin)</span>
        <i class="pi pi-arrow-right text-xs" />
      </NuxtLink>
      <NuxtLink
        v-else
        to="/katalog"
        class="shrink-0 rounded-full bg-white text-brand-ink px-8 py-3.5 text-sm font-bold no-underline hover:bg-white/90 transition-colors shadow-whisper inline-flex items-center justify-center gap-2"
      >
        <span>Jelajahi Katalog</span>
        <i class="pi pi-arrow-right text-xs" />
      </NuxtLink>
    </div>
  </section>
</template>
