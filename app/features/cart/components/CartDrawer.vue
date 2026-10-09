<script setup lang="ts">
import { type CartItem, useCartStore } from '~/features/cart/stores/cart'
import { formatRupiah } from '~/utils/format'

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

const handleManualQuantityInput = (event: Event, item: CartItem) => {
  const target = event.target as HTMLInputElement
  const sanitized = target.value.replace(/[^0-9]/g, '')
  target.value = sanitized
  if (!sanitized) return
  const val = parseInt(sanitized, 10)
  if (val > item.stock) {
    target.value = String(item.stock)
    cartStore.updateQuantity(item.productId, item.stock, item.color, item.material)
  } else if (val >= 1) {
    cartStore.updateQuantity(item.productId, val, item.color, item.material)
  }
}

const handleManualQuantityBlur = (event: Event, item: CartItem) => {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  if (!target.value || isNaN(val) || val < 1) {
    target.value = '1'
    cartStore.updateQuantity(item.productId, 1, item.color, item.material)
  } else if (val > item.stock) {
    target.value = String(item.stock)
    cartStore.updateQuantity(item.productId, item.stock, item.color, item.material)
  } else {
    target.value = String(val)
    cartStore.updateQuantity(item.productId, val, item.color, item.material)
  }
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
        class="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white dark:bg-zinc-900 z-[100] shadow-2xl flex flex-col border-l border-slate-100 dark:border-zinc-800 select-none"
        aria-label="Keranjang Belanja"
      >
        <!-- Header -->
        <header
          class="flex items-center justify-between px-5 py-4 border-b border-brand-hair bg-white dark:bg-zinc-900 shrink-0"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-lg bg-brand-canvas-soft border border-brand-hair text-brand-ink dark:text-white flex items-center justify-center"
            >
              <i class="pi pi-shopping-bag text-sm" />
            </div>
            <div>
              <h2
                class="font-display font-bold text-sm text-brand-ink dark:text-white m-0 flex items-center gap-1.5"
              >
                Keranjang Belanja
                <span
                  class="text-[11px] font-semibold text-brand-ink dark:text-zinc-200 bg-brand-canvas-soft border border-brand-hair px-2 py-0.5 rounded-full"
                >
                  {{ cartStore.totalItems }}
                </span>
              </h2>
            </div>
          </div>
          <UiTooltip text="Tutup Keranjang" position="bottom" align="end">
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
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
              class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-center text-slate-400 shadow-sm"
            >
              <i class="pi pi-shopping-cart text-2xl" />
            </div>
            <div>
              <p class="font-display font-bold text-sm text-slate-900 dark:text-white m-0">
                Keranjang Anda Masih Kosong
              </p>
              <p
                class="font-body text-xs text-slate-500 dark:text-zinc-400 m-0 mt-1 max-w-[240px] leading-relaxed"
              >
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
          <div v-else class="divide-y divide-slate-100 dark:divide-zinc-800">
            <article
              v-for="item in cartStore.items"
              :key="`${item.productId}-${item.color}-${item.material}`"
              class="py-3.5 first:pt-0 last:pb-0 flex gap-3.5 items-start group"
            >
              <!-- Thumbnail -->
              <div
                class="w-16 h-16 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700/60 overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                @click="
                  () => {
                    close()
                    router.push(`/product/${item.slug || item.productId}`)
                  }
                "
              >
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
                <i v-else class="pi pi-image text-slate-300 text-lg" />
              </div>

              <!-- Info & Stepper -->
              <div class="flex-1 min-w-0 flex flex-col justify-between min-h-[64px] gap-1.5">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <h3
                      class="font-display font-semibold text-xs text-slate-900 dark:text-white line-clamp-1 m-0 hover:text-blue-600 cursor-pointer transition-colors"
                      :title="item.name"
                      @click="
                        () => {
                          close()
                          router.push(`/product/${item.slug || item.productId}`)
                        }
                      "
                    >
                      {{ item.name }}
                    </h3>
                    <p
                      v-if="item.color || item.material"
                      class="font-body text-[10px] text-slate-500 dark:text-zinc-400 m-0 mt-0.5 line-clamp-1"
                    >
                      <span v-if="item.color">{{ item.color }}</span>
                      <span v-if="item.color && item.material"> · </span>
                      <span v-if="item.material">{{ item.material }}</span>
                    </p>
                  </div>

                  <!-- Remove Button -->
                  <UiTooltip text="Hapus item" position="left">
                    <button
                      type="button"
                      class="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors p-1 rounded-md cursor-pointer shrink-0 -mr-1"
                      aria-label="Hapus item"
                      @click="cartStore.removeItem(item.productId, item.color, item.material)"
                    >
                      <i class="pi pi-trash text-xs" />
                    </button>
                  </UiTooltip>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <!-- Stepper -->
                  <div
                    class="flex items-center border border-slate-200 dark:border-zinc-700 rounded-lg bg-slate-50 dark:bg-zinc-800 h-7 px-1 gap-0.5"
                  >
                    <button
                      type="button"
                      class="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors cursor-pointer text-xs"
                      aria-label="Kurangi kuantitas"
                      @click="
                        cartStore.updateQuantity(
                          item.productId,
                          item.quantity - 1,
                          item.color,
                          item.material,
                        )
                      "
                    >
                      <i class="pi pi-minus text-[8px]" />
                    </button>
                    <input
                      :value="item.quantity"
                      type="text"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      aria-label="Kuantitas item"
                      class="w-7 text-center text-xs font-bold text-slate-900 dark:text-white bg-transparent border-0 outline-none tabular-nums focus:bg-white dark:focus:bg-zinc-700 rounded transition-colors p-0 select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      @focus="($event.target as HTMLInputElement).select()"
                      @input="handleManualQuantityInput($event, item)"
                      @blur="handleManualQuantityBlur($event, item)"
                      @keydown.enter="($event.target as HTMLInputElement).blur()"
                    />
                    <button
                      type="button"
                      class="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors cursor-pointer text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                      :disabled="item.quantity >= item.stock"
                      aria-label="Tambah kuantitas"
                      @click="
                        cartStore.updateQuantity(
                          item.productId,
                          item.quantity + 1,
                          item.color,
                          item.material,
                        )
                      "
                    >
                      <i class="pi pi-plus text-[8px]" />
                    </button>
                  </div>

                  <!-- Subtotal Item -->
                  <span
                    class="font-display text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white tabular-nums"
                  >
                    {{ formatRupiah(item.price * item.quantity) }}
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- Footer / Checkout Action -->
        <footer
          v-if="!cartStore.isEmpty"
          class="p-5 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3.5 shrink-0"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-500 dark:text-zinc-400 font-medium"
              >Total Sementara</span
            >
            <span
              class="font-display text-base font-bold text-slate-900 dark:text-white tabular-nums"
            >
              {{ cartStore.formattedTotalPrice }}
            </span>
          </div>

          <div
            class="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/50 flex items-center gap-2"
          >
            <i class="pi pi-shield-check text-blue-600 text-xs shrink-0" />
            <p class="text-[10.5px] text-slate-500 dark:text-zinc-400 m-0 leading-tight">
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
              class="w-full justify-center text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
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
