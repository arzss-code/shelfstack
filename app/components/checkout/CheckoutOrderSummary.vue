<script setup lang="ts">
import { formatRupiah } from '~/utils/format'

interface CheckoutItem {
  productId: number
  name: string
  price: number
  quantity: number
  imageUrl?: string | null
  color?: string
  material?: string
}

withDefaults(
  defineProps<{
    items: CheckoutItem[]
    totalItems: number
    totalPrice: string
    discountAmount?: string | null
    couponCode?: string | null
    coinsDiscountAmount?: string | null
    coinsUsed?: number
    shippingFeeFormatted?: string
    isFreeShipping?: boolean
    finalPrice: string
    isSubmitting?: boolean
    isOrderPlaced?: boolean
    submitButtonLabel?: string
  }>(),
  {
    discountAmount: null,
    couponCode: null,
    coinsDiscountAmount: null,
    coinsUsed: 0,
    shippingFeeFormatted: 'Gratis',
    isFreeShipping: true,
    isSubmitting: false,
    isOrderPlaced: false,
    submitButtonLabel: 'Bayar Sekarang',
  },
)

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <aside
    class="space-y-5 rounded-card border border-brand-hair bg-brand-canvas p-6 shadow-whisper lg:sticky lg:top-36"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-brand-hairsoft pb-3">
      <div class="flex items-center gap-2">
        <i class="pi pi-receipt text-base text-brand-ink" />
        <h2 class="m-0 font-display text-base font-bold text-brand-ink">Ringkasan Belanja</h2>
      </div>
      <span
        class="rounded-full border border-brand-hair bg-brand-canvas-soft px-2.5 py-0.5 text-xs font-semibold text-brand-ink"
      >
        {{ totalItems }} barang
      </span>
    </div>

    <!-- Items Preview Scrollable -->
    <div class="max-h-64 space-y-0.5 divide-y divide-brand-hairsoft overflow-y-auto pr-1">
      <div
        v-for="item in items"
        :key="`${item.productId}-${item.color || ''}-${item.material || ''}`"
        class="flex items-center justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-hairsoft bg-brand-field shadow-2xs"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="h-full w-full object-cover"
            />
            <i v-else class="pi pi-image text-sm text-brand-faint" />
          </div>

          <div class="min-w-0">
            <p class="m-0 truncate font-medium text-xs leading-snug text-brand-ink">
              {{ item.name }}
            </p>
            <p
              v-if="item.color || item.material"
              class="m-0 mt-0.5 truncate text-[10.5px] text-brand-muted"
            >
              <span v-if="item.color">{{ item.color }}</span>
              <span v-if="item.color && item.material">, </span>
              <span v-if="item.material">{{ item.material }}</span>
            </p>
            <p class="m-0 mt-0.5 text-[11px] tabular-nums text-brand-muted">
              {{ item.quantity }} &times; {{ formatRupiah(item.price) }}
            </p>
          </div>
        </div>

        <span
          class="shrink-0 text-right font-display font-bold text-xs tabular-nums text-brand-ink"
        >
          {{ formatRupiah(item.price * item.quantity) }}
        </span>
      </div>
    </div>

    <!-- Voucher & Pricing Breakdown -->
    <div class="space-y-2.5 border-t border-brand-hairsoft pt-4 text-xs text-brand-muted">
      <!-- Coupon Slot -->
      <div v-if="!isOrderPlaced" class="border-b border-brand-hairsoft pb-2">
        <CartCouponInput compact />
      </div>

      <!-- Breakdown Rows -->
      <div class="flex items-center justify-between">
        <span>Subtotal Produk</span>
        <span class="font-semibold tabular-nums text-brand-ink">{{ totalPrice }}</span>
      </div>

      <!-- Voucher Discount -->
      <div
        v-if="discountAmount"
        class="flex items-center justify-between font-medium text-brand-success-text"
      >
        <span class="flex items-center gap-1.5 truncate">
          <span>Potongan Voucher</span>
          <span
            v-if="couponCode"
            class="rounded border border-brand-hair bg-brand-canvas-soft px-1.5 py-0.5 font-mono text-[10px] uppercase text-brand-ink"
          >
            {{ couponCode }}
          </span>
        </span>
        <span class="shrink-0 font-bold tabular-nums">-{{ discountAmount }}</span>
      </div>

      <!-- Coin Discount -->
      <div
        v-if="coinsDiscountAmount"
        class="flex items-center justify-between font-medium text-amber-700 dark:text-amber-400"
      >
        <span class="flex items-center gap-1.5 truncate">
          <span>Potongan Koin</span>
          <span
            v-if="coinsUsed"
            class="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            {{ new Intl.NumberFormat('id-ID').format(coinsUsed) }} Koin
          </span>
        </span>
        <span class="shrink-0 font-bold tabular-nums">-{{ coinsDiscountAmount }}</span>
      </div>

      <div class="flex items-center justify-between">
        <span>Biaya Pengiriman</span>
        <span
          :class="[
            isFreeShipping
              ? 'font-semibold text-brand-success'
              : 'font-semibold tabular-nums text-brand-ink',
          ]"
        >
          {{ shippingFeeFormatted }}
        </span>
      </div>

      <div class="flex items-center justify-between">
        <span>Pajak Pertambahan Nilai (PPN 11%)</span>
        <span class="font-semibold text-brand-ink">Termasuk</span>
      </div>

      <!-- Total Row -->
      <div class="flex items-center justify-between border-t border-brand-hairsoft pt-3">
        <div>
          <span class="block font-display font-bold text-sm text-brand-ink">Total Pembayaran</span>
          <span class="text-[10.5px] text-brand-muted">Sudah termasuk ongkir &amp; PPN</span>
        </div>
        <span class="font-display font-bold text-xl tabular-nums text-brand-ink sm:text-2xl">
          {{ finalPrice }}
        </span>
      </div>
    </div>

    <!-- Submit CTA Button -->
    <UiButton
      variant="primary"
      size="md"
      class="w-full justify-center rounded-full py-3 font-semibold text-xs shadow-whisper"
      icon="pi-lock"
      :loading="isSubmitting || isOrderPlaced"
      :disabled="isSubmitting || isOrderPlaced"
      @click="emit('submit')"
    >
      {{ submitButtonLabel }}
    </UiButton>

    <div
      class="flex items-center justify-center gap-1.5 pt-0.5 text-center text-[11px] text-brand-muted"
    >
      <i class="pi pi-shield text-xs text-brand-ink" />
      <span>Pembayaran resmi aman dilindungi Midtrans</span>
    </div>
  </aside>
</template>
