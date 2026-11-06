<script setup lang="ts">
import { type CartItem, useCartStore } from '~/features/cart/stores/cart'
import CartDrawerItem from './CartDrawerItem.vue'

const cartStore = useCartStore()
const router = useRouter()

const close = () => {
  cartStore.closeDrawer()
}

const goToCheckout = () => {
  close()
  router.push('/checkout')
}

const goToCartPage = () => {
  close()
  router.push('/cart')
}

const goToKatalog = () => {
  close()
  router.push('/katalog')
}

const goToProduct = (item: CartItem) => {
  close()
  router.push(`/product/${item.slug || item.productId}`)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="cartStore.isDrawerOpen"
        class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[90] transition-opacity"
        @click="close"
      />
    </Transition>

    <Transition
      enter-active-class="transform transition duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="cartStore.isDrawerOpen"
        class="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-brand-canvas z-[100] shadow-floating flex flex-col border-l border-brand-hair select-none"
        aria-label="Keranjang Belanja"
      >
        <!-- Header -->
        <header
          class="flex items-center justify-between px-5 py-4 border-b border-brand-hair bg-brand-canvas shrink-0"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-field bg-brand-canvas-soft border border-brand-hair text-brand-ink flex items-center justify-center"
            >
              <i class="pi pi-shopping-bag text-sm" />
            </div>
            <div>
              <h2
                class="font-display font-bold text-sm text-brand-ink m-0 flex items-center gap-1.5"
              >
                Keranjang Belanja
                <span
                  class="text-[11px] font-semibold text-brand-ink bg-brand-canvas-soft border border-brand-hair px-2 py-0.5 rounded-full"
                >
                  {{ cartStore.totalItems }}
                </span>
              </h2>
            </div>
          </div>
          <UiTooltip text="Tutup Keranjang" position="bottom" align="end">
            <button
              type="button"
              class="w-8 h-8 rounded-field flex items-center justify-center text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft transition-colors cursor-pointer border-0"
              aria-label="Tutup Keranjang"
              @click="close"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </UiTooltip>
        </header>

        <!-- Body / Items List -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <!-- Empty State -->
          <div
            v-if="cartStore.isEmpty"
            class="h-full flex flex-col items-center justify-center text-center py-16 space-y-4"
          >
            <div
              class="w-16 h-16 rounded-card bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-muted shadow-whisper"
            >
              <i class="pi pi-shopping-cart text-2xl" />
            </div>
            <div>
              <p class="font-display font-bold text-sm text-brand-ink m-0">
                Keranjang Anda Masih Kosong
              </p>
              <p class="font-body text-xs text-brand-muted m-0 mt-1 max-w-[240px] leading-relaxed">
                Jelajahi katalog produk pilihan kami dan temukan kebutuhan perlengkapan Anda.
              </p>
            </div>
            <UiButton
              variant="primary"
              size="sm"
              icon="pi-arrow-right"
              icon-pos="right"
              @click="goToKatalog"
            >
              Mulai Belanja
            </UiButton>
          </div>

          <!-- Items Loop -->
          <div v-else class="divide-y divide-brand-hairsoft">
            <CartDrawerItem
              v-for="item in cartStore.items"
              :key="`${item.productId}-${item.color}-${item.material}`"
              :item="item"
              @navigate-product="goToProduct"
            />
          </div>
        </div>

        <!-- Footer / Checkout Action -->
        <footer
          v-if="!cartStore.isEmpty"
          class="p-5 border-t border-brand-hair bg-brand-canvas space-y-3.5 shrink-0"
        >
          <!-- Voucher Promo Input -->
          <CartCouponInput compact />

          <div class="space-y-2 pt-1 border-t border-brand-hairsoft text-xs">
            <div class="flex items-center justify-between text-brand-muted">
              <span>Subtotal</span>
              <span class="font-semibold text-brand-ink tabular-nums">
                {{ cartStore.formattedTotalPrice }}
              </span>
            </div>
            <div
              v-if="cartStore.discountCents > 0"
              class="flex items-center justify-between text-brand-success-text"
            >
              <span>Diskon Voucher</span>
              <span class="font-bold tabular-nums"> -{{ cartStore.formattedDiscountAmount }} </span>
            </div>
            <div
              class="flex items-center justify-between pt-1 border-t border-brand-hairsoft font-bold"
            >
              <span class="text-brand-ink">Total Tagihan</span>
              <span class="font-display text-base text-brand-ink tabular-nums">
                {{ cartStore.formattedFinalPrice }}
              </span>
            </div>
          </div>

          <div
            class="p-2.5 rounded-field bg-brand-canvas-soft border border-brand-hairsoft flex items-center gap-2"
          >
            <i class="pi pi-shield-check text-brand-accent text-xs shrink-0" />
            <p class="text-[10.5px] text-brand-muted m-0 leading-tight">
              Garansi pengiriman resmi &amp; transaksi aman melalui Midtrans.
            </p>
          </div>

          <div class="space-y-2 pt-0.5">
            <UiButton
              variant="primary"
              size="md"
              class="w-full justify-center text-xs font-semibold py-2.5 rounded-full shadow-whisper"
              icon="pi-lock"
              @click="goToCheckout"
            >
              Checkout Sekarang
            </UiButton>

            <UiButton
              variant="ghost"
              size="sm"
              class="w-full justify-center text-xs text-brand-muted hover:text-brand-ink"
              @click="goToCartPage"
            >
              Buka Halaman Keranjang Lengkap
            </UiButton>
          </div>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
