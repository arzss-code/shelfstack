<script setup lang="ts">
import type { FlashDealItem } from '~~/shared/schemas/flash-deals'
import { formatRupiah } from '~/utils/format'
import FlashSaleProgress from '~/components/promotions/FlashSaleProgress.vue'

defineProps<{
  deal: FlashDealItem
  timerText: string
}>()
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-brand-hair bg-brand-ink text-white shadow-floating"
  >
    <!-- Header with Ticker -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="flex h-6 w-6 items-center justify-center rounded-full bg-brand-danger text-white shadow-sm"
        >
          <i class="pi pi-bolt text-xs" aria-hidden="true" />
        </span>
        <span class="font-display text-xs font-bold tracking-wider uppercase text-white">
          Flash Sale Eksklusif
        </span>
      </div>

      <div class="flex items-center gap-2 text-xs text-white/80">
        <span class="text-[11px] text-white/60">Berakhir dalam:</span>
        <span
          class="rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-brand-warning tabular-nums"
        >
          {{ timerText }}
        </span>
      </div>
    </div>

    <!-- Body with Price & Claim Quota -->
    <div class="space-y-4 p-4 sm:p-5">
      <div class="flex flex-wrap items-baseline gap-3">
        <span class="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
          {{ formatRupiah(deal.promo_price_cents / 100) }}
        </span>
        <span class="text-sm text-white/50 line-through tabular-nums">
          {{ formatRupiah(deal.original_price_cents / 100) }}
        </span>
        <span
          class="rounded-full bg-brand-danger/90 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
        >
          Hemat {{ deal.discount_percentage }}%
        </span>
      </div>

      <!-- Quota Progress Bar -->
      <div class="rounded-xl bg-white/5 p-3 border border-white/10">
        <FlashSaleProgress :claimed="deal.claimed" :quota="deal.quota" />
      </div>
    </div>
  </div>
</template>
