<script setup lang="ts">
import { computed } from 'vue'
import type { FlashDealItem } from '~~/shared/schemas/flash-deals'
import { formatRupiah } from '~/utils/format'
import FlashSaleProgress from '~/components/promotions/FlashSaleProgress.vue'

const props = defineProps<{
  deal: FlashDealItem
  timerText: string
}>()

const timerSegments = computed(() => {
  const parts = (props.timerText || '00:00:00').split(':').map((s) => s.trim())
  if (parts.length === 3) {
    return {
      hours: parts[0] || '00',
      minutes: parts[1] || '00',
      seconds: parts[2] || '00',
    }
  }
  return {
    hours: '00',
    minutes: parts[0] || '00',
    seconds: parts[1] || '00',
  }
})
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#0e0f14] via-brand-ink to-[#13141a] text-white shadow-floating transition-all duration-300"
    role="region"
    aria-label="Penawaran Flash Sale Produk"
  >
    <!-- Subtle Ambient Glow Flares (Anti-Slop Restrained Luxury) -->
    <div
      class="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-transparent blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gradient-to-tr from-rose-500/10 to-transparent blur-2xl"
      aria-hidden="true"
    />

    <!-- Header Live Event Bar -->
    <div
      class="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-white/[0.03] px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span class="relative flex h-2 w-2">
          <span
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"
          />
          <span class="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-300 shadow-2xs"
        >
          <i class="pi pi-bolt text-[10px] text-amber-400" aria-hidden="true" />
          Flash Sale Eksklusif
        </span>
      </div>

      <!-- Segmented Watch Ticker -->
      <div class="flex items-center gap-2 text-xs" role="timer" aria-live="polite">
        <span class="text-[11px] font-medium text-white/60">Berakhir dalam:</span>
        <div class="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums">
          <span
            class="rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-amber-300 shadow-inner"
          >
            {{ timerSegments.hours }}
          </span>
          <span class="font-mono text-white/40">:</span>
          <span
            class="rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-amber-300 shadow-inner"
          >
            {{ timerSegments.minutes }}
          </span>
          <span class="font-mono text-white/40">:</span>
          <span
            class="rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-amber-300 shadow-inner"
          >
            {{ timerSegments.seconds }}
          </span>
        </div>
      </div>
    </div>

    <!-- Body: Pricing & Quota Presentation -->
    <div class="relative z-10 space-y-4 p-4 sm:p-5">
      <div class="flex flex-wrap items-baseline gap-3">
        <span
          class="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white tabular-nums"
        >
          {{ formatRupiah(deal.promo_price_cents / 100) }}
        </span>
        <span class="text-sm font-medium text-white/45 line-through tabular-nums">
          {{ formatRupiah(deal.original_price_cents / 100) }}
        </span>
        <UiBadge
          :label="`Hemat ${deal.discount_percentage}%`"
          variant="danger"
          class="shadow-sm font-extrabold tracking-wide"
        />
      </div>

      <!-- Quota Progress Card Container -->
      <div class="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
        <FlashSaleProgress :claimed="deal.claimed" :quota="deal.quota" />
      </div>

      <p class="m-0 text-[11px] leading-relaxed text-white/50">
        Harga promo resmi berlaku selama alokasi kuota masih tersedia. Selesaikan transaksi sebelum
        waktu berakhir untuk mengamankan diskon.
      </p>
    </div>
  </div>
</template>
