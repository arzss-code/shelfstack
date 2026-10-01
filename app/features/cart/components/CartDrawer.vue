<script setup lang="ts">
import { useCartStore } from '~/features/cart/stores/cart'
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
        class="fixed inset-0 bg-brand-ink/50 backdrop-blur-xs z-50 transition-opacity"
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
        class="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col border-l border-brand-hair select-none"
        aria-label="Keranjang Belanja"
      >
        <!-- Header -->
        <header
          class="flex items-center justify-between px-6 py-4 border-b border-brand-hairsoft bg-brand-canvas"
        >
          <div class="flex items-center gap-2">
            <i class="pi pi-shopping-bag text-brand-ink text-lg" />
            <h2 class="font-display font-bold text-base text-brand-ink m-0">
              Keranjang
              <span class="text-xs font-normal text-brand-muted">
                ({{ cartStore.totalItems }} item)
              </span>
            </h2>
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft transition-colors cursor-pointer"
            aria-label="Tutup Keranjang"
            @click="close"
          >
            <i class="pi pi-times text-sm" />
          </button>
        </header>

        <!-- Body / Items List -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <!-- Empty State -->
          <div
            v-if="cartStore.isEmpty"
            class="h-full flex flex-col items-center justify-center text-center py-12 space-y-4"
          >
            <div
              class="w-16 h-16 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-muted shadow-whisper"
            >
              <i class="pi pi-shopping-cart text-2xl text-brand-muted" />
            </div>
            <div>
              <p class="font-display font-bold text-base text-brand-ink m-0">
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
            <article
              v-for="item in cartStore.items"
              :key="`${item.productId}-${item.color}-${item.material}`"
              class="py-4 first:pt-0 last:pb-0 flex gap-3.5 items-start group"
            >
              <!-- Thumbnail -->
              <div
                class="w-18 h-18 rounded-card bg-brand-field border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center"
              >
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
                <i v-else class="pi pi-image text-brand-faint text-xl" />
              </div>

              <!-- Info & Stepper -->
              <div class="flex-1 min-w-0 flex flex-col justify-between h-full gap-1.5">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <h3
                      class="font-display font-semibold text-xs text-brand-ink line-clamp-1 m-0 hover:text-brand-accent cursor-pointer transition-colors"
                      @click="
                        () => {
                          close()
                          router.push(`/product/${item.productId}`)
                        }
                      "
                    >
                      {{ item.name }}
                    </h3>
                    <p
                      v-if="item.color || item.material"
                      class="font-body text-[10px] text-brand-muted m-0 mt-0.5 line-clamp-1"
                    >
                      <span v-if="item.color">{{ item.color }}</span>
                      <span v-if="item.color && item.material"> · </span>
                      <span v-if="item.material">{{ item.material }}</span>
                    </p>
                  </div>

                  <!-- Remove Button -->
                  <button
                    type="button"
                    class="text-brand-faint hover:text-red-600 transition-colors p-1 -mr-1 cursor-pointer"
                    aria-label="Hapus item"
                    @click="cartStore.removeItem(item.productId, item.color, item.material)"
                  >
                    <i class="pi pi-trash text-xs" />
                  </button>
                </div>

                <div class="flex items-center justify-between pt-1">
                  <!-- Stepper -->
                  <div
                    class="flex items-center border border-brand-hair rounded-full bg-brand-field h-7 px-1"
                  >
                    <button
                      type="button"
                      class="w-5 h-5 flex items-center justify-center text-brand-ink hover:bg-white rounded-full transition-colors cursor-pointer text-xs"
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
                      <i class="pi pi-minus text-[9px]" />
                    </button>
                    <span class="w-6 text-center text-xs font-semibold text-brand-ink tabular-nums">
                      {{ item.quantity }}
                    </span>
                    <button
                      type="button"
                      class="w-5 h-5 flex items-center justify-center text-brand-ink hover:bg-white rounded-full transition-colors cursor-pointer text-xs disabled:opacity-30 disabled:cursor-not-allowed"
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
                      <i class="pi pi-plus text-[9px]" />
                    </button>
                  </div>

                  <!-- Subtotal Item -->
                  <span class="font-display text-xs font-bold text-brand-ink tabular-nums">
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
          class="p-6 border-t border-brand-hairsoft bg-brand-canvas space-y-4"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs text-brand-muted font-medium">Total Sementara</span>
            <span class="font-display text-base font-bold text-brand-ink tabular-nums">
              {{ cartStore.formattedTotalPrice }}
            </span>
          </div>

          <p class="text-[10px] text-brand-muted m-0 leading-tight">
            Pajak dihitung saat checkout. Biaya pengiriman gratis untuk pembelian minimal Rp500.000.
          </p>

          <div class="space-y-2">
            <UiButton
              variant="primary"
              size="md"
              class="w-full justify-center"
              icon="pi-lock"
              @click="goToCheckout"
            >
              Checkout Pesanan
            </UiButton>

            <UiButton
              variant="ghost"
              size="sm"
              class="w-full justify-center text-xs text-brand-muted hover:text-brand-ink"
              @click="goToCartPage"
            >
              Buka Halaman Keranjang
            </UiButton>
          </div>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
