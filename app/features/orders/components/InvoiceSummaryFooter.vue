<script setup lang="ts">
import type { Order } from '~/types/order'
import { formatRupiah } from '~/utils/format'

defineProps<{
  order: Order
  shippingFeeDisplay: string
  verificationQrSvg: string
}>()
</script>

<template>
  <footer
    class="border-t border-brand-hair pt-6 flex flex-col sm:flex-row items-start justify-between gap-6"
  >
    <!-- Verification QR & Stamp -->
    <div class="flex items-center gap-4">
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="p-1 border border-brand-hair rounded bg-brand-canvas shadow-whisper"
        v-html="verificationQrSvg"
      />
      <!-- eslint-enable vue/no-v-html -->
      <div class="text-[10px] text-brand-muted leading-relaxed">
        <span class="font-bold text-brand-ink block text-xs">Verifikasi Digital</span>
        Pindai kode QR untuk memverifikasi keaslian dokumen faktur ini secara online di portal resmi
        ShelfStack.
      </div>
    </div>

    <!-- Breakdown Numbers -->
    <div class="w-full sm:w-72 space-y-2 text-xs">
      <div class="flex justify-between text-brand-muted">
        <span>Subtotal Produk</span>
        <span class="font-mono tabular text-brand-ink">
          {{ formatRupiah((order.subtotal_cents ?? order.total_cents) / 100) }}
        </span>
      </div>

      <div
        v-if="order.discount_cents && order.discount_cents > 0"
        class="flex justify-between text-emerald-600 font-semibold"
      >
        <span>Diskon Voucher</span>
        <span class="font-mono tabular">-{{ formatRupiah(order.discount_cents / 100) }}</span>
      </div>

      <div
        v-if="
          (order.coins_discount_cents && order.coins_discount_cents > 0) ||
          (order.coins_used && order.coins_used > 0)
        "
        class="flex justify-between text-amber-600 font-semibold"
      >
        <span>Potongan Koin</span>
        <span class="font-mono tabular">
          -{{
            formatRupiah(
              (order.coins_discount_cents ?? (order.coins_used ? order.coins_used * 100 : 0)) / 100,
            )
          }}
        </span>
      </div>

      <div class="flex justify-between text-brand-muted">
        <span>Biaya Pengiriman</span>
        <span class="font-mono tabular text-brand-ink">{{ shippingFeeDisplay }}</span>
      </div>

      <div
        class="flex justify-between text-sm font-bold text-brand-ink border-t border-brand-hair pt-2"
      >
        <span>Total Akhir</span>
        <span class="font-mono tabular text-brand-accent text-base">
          {{ formatRupiah(order.total_cents / 100) }}
        </span>
      </div>
    </div>
  </footer>
</template>
