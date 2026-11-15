<script setup lang="ts">
import { useCartStore } from '~/features/cart/stores/cart'
import CartCouponInput from '~/components/cart/CartCouponInput.vue'
import UiButton from '~/components/ui/UiButton.vue'

const cartStore = useCartStore()

defineProps<{
  hasOutOfStockItems?: boolean
}>()

defineEmits<{
  checkout: []
}>()
</script>

<template>
  <aside class="sticky top-28">
    <UiCard class="space-y-5">
      <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Ringkasan Pesanan</h2>
        <UiBadge :label="`${cartStore.totalItems} item`" variant="default" />
      </div>

      <!-- Voucher Promo Input -->
      <CartCouponInput />

      <div class="space-y-3 text-xs text-brand-muted">
        <div class="flex items-center justify-between">
          <span>Subtotal Produk ({{ cartStore.totalItems }} item)</span>
          <span class="font-semibold text-brand-ink tabular-nums">
            {{ cartStore.formattedTotalPrice }}
          </span>
        </div>
        <div
          v-if="cartStore.discountCents > 0"
          class="flex items-center justify-between text-brand-success-text font-medium"
        >
          <span>Diskon Voucher ({{ cartStore.appliedCoupon?.code }})</span>
          <span class="font-bold tabular-nums"> -{{ cartStore.formattedDiscountAmount }} </span>
        </div>
        <div class="flex items-center justify-between">
          <span>Biaya Pengiriman</span>
          <span class="text-brand-success font-semibold">Gratis Ongkir</span>
        </div>
        <div class="flex items-center justify-between">
          <span>Estimasi Pajak (PPN 11%)</span>
          <span class="font-semibold text-brand-ink">Termasuk</span>
        </div>
      </div>

      <div class="pt-4 border-t border-brand-hairsoft flex items-center justify-between">
        <span class="font-display text-sm font-bold text-brand-ink">Total Tagihan</span>
        <span class="font-display text-xl font-bold text-brand-ink tabular-nums">
          {{ cartStore.formattedFinalPrice }}
        </span>
      </div>

      <UiButton
        variant="primary"
        size="md"
        class="w-full justify-center text-xs font-semibold py-3 rounded-full shadow-whisper disabled:opacity-50 disabled:cursor-not-allowed"
        icon="pi-lock"
        :disabled="hasOutOfStockItems"
        @click="$emit('checkout')"
      >
        {{ hasOutOfStockItems ? 'Ada Barang Habis di Keranjang' : 'Lanjut ke Pembayaran' }}
      </UiButton>

      <!-- Trust Badges -->
      <div class="pt-3 border-t border-brand-hairsoft space-y-2 text-[11px] text-brand-muted">
        <div class="flex items-center gap-2">
          <i class="pi pi-shield text-brand-ink" />
          <span>Pembayaran Aman via Midtrans</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="pi pi-sync text-brand-ink" />
          <span>Garansi Pengembalian 30 Hari</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="pi pi-check-circle text-brand-success" />
          <span>Koleksi 100% Terkurasi Original</span>
        </div>
      </div>
    </UiCard>
  </aside>
</template>
