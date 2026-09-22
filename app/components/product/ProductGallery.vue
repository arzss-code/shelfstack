<script setup lang="ts">
import type { Product } from '~/types/product'

defineProps<{
  product: Product
}>()
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Main Media Container -->
    <div
      class="relative w-full aspect-[4/3] rounded-card bg-brand-field border border-brand-hair overflow-hidden flex items-center justify-center p-6 shadow-whisper group"
    >
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        class="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
      >
      <div v-else class="flex flex-col items-center justify-center text-brand-faint">
        <i class="pi pi-image text-5xl mb-2" />
        <span class="text-xs font-medium">Gambar Produk Belum Tersedia</span>
      </div>

      <!-- Architectural Badge -->
      <div
        class="absolute bottom-4 right-4 bg-brand-ink text-brand-onink text-xs font-medium px-3 py-1 rounded-full shadow-whisper"
      >
        ShelfStack Original
      </div>
    </div>

    <!-- Micro-Showcase Spec Grid (3 Triad Boxes) -->
    <div class="grid grid-cols-3 gap-3 pt-2">
      <div
        class="bg-brand-canvas-soft border border-brand-hairsoft p-3.5 rounded-field flex flex-col items-center justify-center text-center shadow-whisper"
      >
        <i class="pi pi-shield text-brand-ink text-lg mb-1" />
        <span class="font-display font-bold text-sm text-brand-ink">2 Tahun</span>
        <span class="text-[11px] text-brand-muted">Garansi Resmi</span>
      </div>
      <div
        class="bg-brand-canvas-soft border border-brand-hairsoft p-3.5 rounded-field flex flex-col items-center justify-center text-center shadow-whisper"
      >
        <i class="pi pi-check-circle text-brand-accent text-lg mb-1" />
        <span class="font-display font-bold text-sm text-brand-ink">100% Asli</span>
        <span class="text-[11px] text-brand-muted">Terverifikasi</span>
      </div>
      <div
        class="bg-brand-canvas-soft border border-brand-hairsoft p-3.5 rounded-field flex flex-col items-center justify-center text-center shadow-whisper"
      >
        <i class="pi pi-box text-brand-ink text-lg mb-1" />
        <span class="font-display font-bold text-sm text-brand-ink">Kemasan Aman</span>
        <span class="text-[11px] text-brand-muted">Proteksi Ekstra</span>
      </div>
    </div>

    <!-- Description & Information -->
    <UiCard :padded="true" class="mt-2 space-y-4">
      <h2 class="font-display text-lg font-bold text-brand-ink m-0">
        Deskripsi &amp; Informasi Produk
      </h2>
      <p
        class="font-body text-sm sm:text-base leading-relaxed text-brand-muted m-0 whitespace-pre-wrap"
      >
        {{ product.description || 'Tidak ada deskripsi rinci untuk produk ini.' }}
      </p>

      <div v-if="product.link" class="pt-2">
        <a
          :href="product.link"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-ink border border-brand-hair text-xs font-semibold no-underline transition-colors shadow-whisper"
        >
          <span>Kunjungi Halaman Referensi Asli</span>
          <i class="pi pi-external-link text-xs" />
        </a>
      </div>
    </UiCard>
  </div>
</template>
