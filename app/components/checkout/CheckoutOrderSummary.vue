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
    class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-5 lg:sticky lg:top-36"
  >
    <!-- Header -->
    <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
      <div class="flex items-center gap-2">
        <i class="pi pi-receipt text-brand-ink text-base" />
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Ringkasan Belanja</h2>
      </div>
      <span
        class="text-xs font-semibold text-brand-ink bg-brand-canvas-soft border border-brand-hair px-2.5 py-0.5 rounded-full"
      >
        {{ totalItems }} barang
      </span>
    </div>

    <!-- Items Preview Scrollable -->
    <div class="max-h-64 overflow-y-auto divide-y divide-brand-hairsoft pr-1 space-y-0.5">
      <div
        v-for="item in items"
        :key="`${item.productId}-${item.color || ''}-${item.material || ''}`"
        class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="relative w-12 h-12 rounded-xl bg-brand-field border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center shadow-2xs"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
            <i v-else class="pi pi-image text-brand-faint text-sm" />
            <span
              class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-ink px-1 text-[9px] font-bold text-white shadow-whisper"
            >
              {{ item.quantity }}
            </span>
          </div>

          <div class="min-w-0">
            <p class="font-medium text-xs text-brand-ink m-0 leading-snug truncate">
              {{ item.name }}
            </p>
            <p
              v-if="item.color || item.material"
              class="text-[10.5px] text-brand-muted m-0 mt-0.5 truncate"
            >
              <span v-if="item.color">{{ item.color }}</span>
              <span v-if="item.color && item.material">, </span>
              <span v-if="item.material">{{ item.material }}</span>
            </p>
            <p class="text-[11px] text-brand-muted m-0 mt-0.5 tabular-nums">
              {{ item.quantity }} &times; {{ formatRupiah(item.price) }}
            </p>
          </div>
        </div>

        <span
          class="font-display font-bold text-xs text-brand-ink tabular-nums shrink-0 text-right"
        >
          {{ formatRupiah(item.price * item.quantity) }}
        </span>
      </div>
    </div>

    <!-- Voucher & Pricing Breakdown -->
    <div class="pt-4 border-t border-brand-hairsoft space-y-2.5 text-xs text-brand-muted">
      <!-- Coupon Slot -->
      <div v-if="!isOrderPlaced" class="pb-2 border-b border-brand-hairsoft">
        <CartCouponInput compact />
      </div>

      <!-- Breakdown Rows -->
      <div class="flex items-center justify-between">
        <span>Subtotal Produk</span>
        <span class="font-semibold text-brand-ink tabular-nums">{{ totalPrice }}</span>
      </div>

      <div
        v-if="discountAmount"
        class="flex items-center justify-between text-brand-success-text font-medium"
      >
        <span class="flex items-center gap-1.5 truncate">
          <span>Potongan Voucher</span>
          <span
            v-if="couponCode"
            class="font-mono text-[10px] bg-brand-canvas-soft border border-brand-hair px-1.5 py-0.5 rounded text-brand-ink uppercase"
          >
            {{ couponCode }}
          </span>
        </span>
        <span class="font-bold tabular-nums shrink-0">-{{ discountAmount }}</span>
      </div>

      <div class="flex items-center justify-between">
        <span>Biaya Pengiriman</span>
        <span
          :class="[
            isFreeShipping
              ? 'text-brand-success font-semibold'
              : 'font-semibold text-brand-ink tabular-nums',
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
      <div class="pt-3 border-t border-brand-hairsoft flex items-center justify-between">
        <div>
          <span class="font-display font-bold text-sm text-brand-ink block">Total Pembayaran</span>
          <span class="text-[10.5px] text-brand-muted">Sudah termasuk ongkir &amp; PPN</span>
        </div>
        <span class="font-display text-xl sm:text-2xl font-bold text-brand-ink tabular-nums">
          {{ finalPrice }}
        </span>
      </div>
    </div>

    <!-- Submit CTA Button -->
    <UiButton
      variant="primary"
      size="md"
      class="w-full justify-center text-xs font-semibold py-3 rounded-full shadow-whisper"
      icon="pi-lock"
      :loading="isSubmitting || isOrderPlaced"
      :disabled="isSubmitting || isOrderPlaced"
      @click="emit('submit')"
    >
      {{ submitButtonLabel }}
    </UiButton>

    <div
      class="flex items-center justify-center gap-1.5 text-[11px] text-brand-muted text-center pt-0.5"
    >
      <i class="pi pi-shield text-brand-ink text-xs" />
      <span>Pembayaran resmi aman dilindungi Midtrans</span>
    </div>
  </aside>
</template>
