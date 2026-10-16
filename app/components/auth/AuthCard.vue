<script setup lang="ts">
/**
 * AuthCard: Shell container card for all authentication pages.
 * Provides logo, heading, sub-text, and back-to-home link in one wrapper.
 */
defineProps<{
  title: string
  subtitle?: string
}>()
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
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1.5 leading-relaxed max-w-xs"
        >
          {{ subtitle }}
        </p>
      </div>

      <!-- Main Content (Form, Success State, etc.) -->
      <slot />

      <!-- OAuth Divider + Google Button -->
      <slot name="oauth" />

      <!-- Trust Row -->
      <slot name="trust" />

      <!-- Footer link (login prompt / register prompt) -->
      <slot name="footer" />
    </div>

    <!-- Back to Home -->
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
