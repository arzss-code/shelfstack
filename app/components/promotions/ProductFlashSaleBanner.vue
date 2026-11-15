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
    class="relative overflow-hidden rounded-2xl border border-white/10 bg-[#12131a] text-white shadow-floating"
    role="region"
    aria-label="Penawaran Flash Sale Produk"
  >
    <!-- Header Bar -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-2.5"
    >
      <UiBadge label="Flash Sale" variant="solid-danger" />

      <!-- Segmented Watch Ticker -->
      <div class="flex items-center gap-2 text-xs" role="timer" aria-live="polite">
        <span class="text-[11px] font-medium text-white/70">Berakhir dalam:</span>
        <div class="inline-flex items-center gap-1 font-mono text-xs font-bold tabular-nums">
          <span class="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-white">
            {{ timerSegments.hours }}
          </span>
          <span class="text-white/40">:</span>
          <span class="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-white">
            {{ timerSegments.minutes }}
          </span>
          <span class="text-white/40">:</span>
          <span class="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-white">
            {{ timerSegments.seconds }}
          </span>
        </div>
      </div>
    </div>

    <!-- Body: Pricing & Quota Presentation -->
    <div class="space-y-3.5 p-4 sm:p-5">
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
          variant="solid-danger"
          class="shadow-sm"
        />
      </div>

      <!-- Quota Progress Card Container -->
      <div class="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <FlashSaleProgress :claimed="deal.claimed" :quota="deal.quota" />
      </div>
    </div>
  </div>
</template>
