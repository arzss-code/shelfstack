<script setup lang="ts">
import { useAuth } from '~/features/auth/composables/useAuth'

const { isLoggedIn, isAdmin } = useAuth()
</script>

<template>
  <section
    class="rounded-card bg-brand-obsidian text-white p-8 sm:p-12 shadow-floating relative overflow-hidden"
  >
    <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
      <div class="max-w-2xl">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold tracking-wide uppercase mb-3"
        >
          <i class="pi pi-ticket text-xs text-brand-accent" aria-hidden="true" />
          <span>Penawaran Pelanggan Baru</span>
        </div>

        <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold leading-tight text-white mb-3">
          Hemat 10% untuk Pesanan Pertamamu
        </h2>

        <p class="font-body m-0 text-sm sm:text-base leading-relaxed text-white/80">
          Gunakan voucher pelanggan baru saat checkout untuk mendapatkan potongan harga langsung dan
          mulai kumpulkan koin loyalitas di setiap transaksi selesai.
        </p>

        <!-- Customer Benefits Strip -->
        <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/75">
          <span class="inline-flex items-center gap-1.5">
            <i class="pi pi-check text-brand-success text-xs" aria-hidden="true" />
            Kode Voucher: <strong class="text-white">WELCOME10</strong>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <i class="pi pi-check text-brand-success text-xs" aria-hidden="true" />
            Diskon 10% Pesanan Pertama
          </span>
          <span class="inline-flex items-center gap-1.5">
            <i class="pi pi-check text-brand-success text-xs" aria-hidden="true" />
            Bebas Ongkir min. Rp500.000
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 shrink-0">
        <NuxtLink
          to="/promos"
          class="rounded-full bg-white/15 hover:bg-brand-canvas/25 text-white border border-white/20 px-6 py-3.5 text-sm font-semibold no-underline transition-colors shadow-whisper inline-flex items-center justify-center gap-2 min-h-[44px]"
        >
          <i class="pi pi-percentage text-xs" aria-hidden="true" />
          <span>Lihat Voucher</span>
        </NuxtLink>

        <NuxtLink
          v-if="!isLoggedIn"
          to="/auth/login"
          class="rounded-full bg-brand-canvas text-brand-ink px-8 py-3.5 text-sm font-bold no-underline hover:bg-brand-field transition-colors shadow-whisper inline-flex items-center justify-center min-h-[44px]"
        >
          Masuk
        </NuxtLink>
        <NuxtLink
          v-else-if="isAdmin"
          to="/admin/products"
          class="rounded-full bg-brand-canvas text-brand-ink px-8 py-3.5 text-sm font-bold no-underline hover:bg-brand-field transition-colors shadow-whisper inline-flex items-center justify-center gap-2 min-h-[44px]"
        >
          <span>Kelola Produk (Admin)</span>
          <i class="pi pi-arrow-right text-xs" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink
          v-else
          to="/katalog"
          class="rounded-full bg-brand-canvas text-brand-ink px-8 py-3.5 text-sm font-bold no-underline hover:bg-brand-field transition-colors shadow-whisper inline-flex items-center justify-center gap-2 min-h-[44px]"
        >
          <span>Jelajahi Katalog</span>
          <i class="pi pi-arrow-right text-xs" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
