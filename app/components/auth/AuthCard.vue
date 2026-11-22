<script setup lang="ts">
/**
 * AuthCard: Shell container card for all authentication pages.
 * Implements a modernist split layout with an aesthetic visual banner on the left
 * and a compact form container on the right.
 */
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    imageSrc?: string
    imageAlt?: string
    visualTitle?: string
    visualSubtitle?: string
  }>(),
  {
    subtitle: '',
    imageSrc: '/images/auth-showcase.jpg',
    imageAlt: 'Display rak dan furnitur ShelfStack',
    visualTitle: 'Furnitur dan perlengkapan kerja',
    visualSubtitle: 'Pilihan meja, kursi ergonomis, dan rak penyimpanan dengan stok siap kirim.',
  },
)
</script>

<template>
  <div
    class="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center py-4 sm:py-6 px-4"
  >
    <!-- Split Container Card -->
    <div
      class="w-full max-w-4xl lg:max-w-5xl bg-brand-canvas border border-brand-hair rounded-card shadow-floating overflow-hidden grid grid-cols-1 md:grid-cols-12"
    >
      <!-- Left Column: Aesthetic Visual Showcase & Brand Insignia -->
      <div
        class="relative col-span-12 md:col-span-5 bg-brand-strip text-white p-6 sm:p-8 flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-brand-hair min-h-[220px] md:min-h-[500px]"
      >
        <!-- Background Aesthetic Photo with Scrim -->
        <img
          :src="imageSrc"
          :alt="imageAlt"
          class="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity filter brightness-90 contrast-105"
        />
        <!-- Dark Neutral Gradient Scrim -->
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 pointer-events-none"
        />

        <!-- Top Content: Brand Wordmark / Emblem -->
        <div class="relative z-10 flex items-center justify-between">
          <NuxtLink to="/" class="inline-block hover:opacity-90 transition-opacity">
            <AppLogo variant="inverse" size="md" />
          </NuxtLink>
        </div>

        <!-- Bottom Content: Natural Grounded Statement -->
        <div class="relative z-10 mt-8 md:mt-auto pt-4">
          <h2
            class="font-display text-base sm:text-lg font-bold tracking-tight text-white m-0 leading-snug"
          >
            {{ visualTitle }}
          </h2>
          <p class="font-body text-xs text-white/80 m-0 mt-1.5 leading-relaxed max-w-xs">
            {{ visualSubtitle }}
          </p>
        </div>
      </div>

      <!-- Right Column: Compact Form & Action Container -->
      <div
        class="col-span-12 md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-brand-canvas"
      >
        <div class="w-full max-w-md mx-auto">
          <!-- Form Header -->
          <div class="mb-5 sm:mb-6">
            <h1
              class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0"
            >
              {{ title }}
            </h1>
            <p
              v-if="subtitle"
              class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1.5 leading-relaxed"
            >
              {{ subtitle }}
            </p>
          </div>

          <!-- Main Content (Form, Stepper, Success State) -->
          <slot />

          <!-- OAuth (Google Button, Divider) -->
          <slot name="oauth" />

          <!-- Footer (Links to login/register) -->
          <slot name="footer" />
        </div>
      </div>
    </div>

    <!-- Back to Home Link below card -->
    <div class="mt-4 text-center">
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
