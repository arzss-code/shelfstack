<script setup lang="ts">
import { onMounted } from 'vue'
import { type CartItem, useCartStore } from '~/features/cart/stores/cart'
import { useCartReconciliation } from '~/features/cart/composables/useCartReconciliation'
import { useUiToast } from '~/composables/useUiToast'
import { formatRupiah } from '~/utils/format'
import CartSummarySidebar from '~/components/cart/CartSummarySidebar.vue'

const cartStore = useCartStore()
const router = useRouter()
const toast = useUiToast()
const { driftWarnings, hasOutOfStockItems, reconcileCart } = useCartReconciliation()

onMounted(async () => {
  await reconcileCart(true)
})

useSeoMeta({
  title: 'Keranjang Belanja - ShelfStack',
  description: 'Tinjau produk kurasi pilihan Anda sebelum melanjutkan ke pembayaran.',
})

const updateItemQty = (item: CartItem, qty: number) => {
  cartStore.updateQuantity(item.productId, qty, item.color, item.material)
}

const goToCheckout = () => {
  if (hasOutOfStockItems.value) {
    toast.show({
      title: 'Barang Tidak Tersedia',
      message: 'Mohon hapus barang yang telah habis dari keranjang sebelum melanjutkan checkout.',
      tone: 'error',
    })
    return
  }
  router.push('/checkout')
}

const handleManualQuantityInput = (event: Event, item: CartItem) => {
  const target = event.target as HTMLInputElement
  const sanitized = target.value.replace(/[^0-9]/g, '')
  target.value = sanitized
  if (!sanitized) return
  const val = parseInt(sanitized, 10)
  const targetQty = val > item.stock ? item.stock : val >= 1 ? val : 1
  target.value = String(targetQty)
  cartStore.updateQuantity(item.productId, targetQty, item.color, item.material)
}

const handleManualQuantityBlur = (event: Event, item: CartItem) => {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  const targetQty = !target.value || isNaN(val) || val < 1 ? 1 : val > item.stock ? item.stock : val
  target.value = String(targetQty)
  cartStore.updateQuantity(item.productId, targetQty, item.color, item.material)
}
</script>

<template>
  <div class="space-y-6 pb-16">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 border-b border-brand-hairsoft overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Keranjang Belanja</span>
    </nav>

    <!-- Page Title -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0">
          Keranjang Belanja
        </h1>
        <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
          Kelola barang pilihan Anda sebelum melanjutkan ke proses pemesanan resmi.
        </p>
      </div>

      <UiButton
        v-if="!cartStore.isEmpty"
        variant="ghost"
        size="sm"
        icon="pi-trash"
        class="text-xs text-brand-danger hover:text-brand-danger"
        @click="cartStore.clearCart"
      >
        Kosongkan Keranjang
      </UiButton>
    </div>

    <!-- Empty State -->
    <div
      v-if="cartStore.isEmpty"
      class="text-center py-20 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card max-w-xl mx-auto space-y-4"
    >
      <div
        class="w-16 h-16 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mx-auto text-brand-muted shadow-whisper"
      >
        <i class="pi pi-shopping-bag text-3xl text-brand-muted" />
      </div>
      <h2 class="font-display text-xl font-bold text-brand-ink m-0">
        Keranjang Belanja Anda Masih Kosong
      </h2>
      <p class="font-body text-xs sm:text-sm text-brand-muted m-0 leading-relaxed">
        Belum ada produk yang Anda tambahkan. Silakan kunjungi katalog untuk melihat koleksi resmi
        kami.
      </p>
      <UiButton to="/katalog" variant="primary" icon="pi-arrow-right" icon-pos="right">
        Jelajahi Katalog
      </UiButton>
    </div>

    <!-- Filled Cart View -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Items List -->
      <div class="lg:col-span-8 space-y-4">
        <!-- Drift Warnings Banner -->
        <div
          v-if="driftWarnings.length > 0"
          class="bg-amber-50/90 border border-amber-200 rounded-card p-4 space-y-2 text-xs text-amber-900"
        >
          <div class="flex items-center justify-between font-bold">
            <span class="flex items-center gap-1.5">
              <i class="pi pi-exclamation-triangle text-amber-600" />
              Pemberitahuan Penyesuaian Inventaris
            </span>
            <button
              type="button"
              class="text-amber-700 hover:text-amber-900 text-[11px] underline cursor-pointer bg-transparent border-0 p-0"
              @click="driftWarnings = []"
            >
              Tutup
            </button>
          </div>
          <ul class="list-disc list-inside space-y-1 m-0 pl-1 text-[11px] text-amber-800">
            <li v-for="(warn, idx) in driftWarnings" :key="idx">{{ warn }}</li>
          </ul>
        </div>

        <UiCard :padded="false" class="divide-y divide-brand-hairsoft">
          <article
            v-for="item in cartStore.items"
            :key="`${item.productId}-${item.color}-${item.material}`"
            class="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
          >
            <!-- Media & Details -->
            <div class="flex items-center gap-4 min-w-0">
              <div
                class="w-20 h-20 rounded-card bg-brand-field border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center cursor-pointer"
                @click="router.push(`/product/${item.slug || item.productId}`)"
              >
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                />
                <i v-else class="pi pi-image text-brand-faint text-2xl" />
              </div>

              <div class="min-w-0">
                <NuxtLink
                  :to="`/product/${item.slug || item.productId}`"
                  class="font-display font-bold text-sm sm:text-base text-brand-ink hover:text-brand-accent transition-colors no-underline line-clamp-1"
                >
                  {{ item.name }}
                </NuxtLink>
                <div
                  v-if="item.color || item.material || item.stock <= 0"
                  class="flex items-center gap-1.5 mt-0.5 flex-wrap"
                >
                  <p
                    v-if="item.color || item.material"
                    class="font-body text-xs text-brand-muted m-0 line-clamp-1"
                  >
                    <span v-if="item.color">{{ item.color }}</span>
                    <span v-if="item.color && item.material"> · </span>
                    <span v-if="item.material">{{ item.material }}</span>
                  </p>
                  <span
                    v-if="item.stock <= 0"
                    class="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] text-red-700 font-bold"
                  >
                    <i class="pi pi-times-circle text-[9px]" /> Stok Habis
                  </span>
                </div>
                <p
                  v-if="item.quantity > 1"
                  class="font-body text-xs text-brand-muted m-0 mt-1 tabular-nums"
                >
                  @ {{ formatRupiah(item.price) }} / unit
                </p>
              </div>
            </div>

            <!-- Stepper & Subtotal Action -->
            <div
              class="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-hairsoft"
            >
              <!-- Stepper -->
              <div
                class="flex items-center border border-brand-hair rounded-full bg-brand-field h-8 px-1.5"
              >
                <button
                  type="button"
                  class="w-6 h-6 flex items-center justify-center text-brand-ink hover:bg-brand-canvas rounded-full transition-colors cursor-pointer text-xs"
                  aria-label="Kurangi kuantitas"
                  @click="updateItemQty(item, item.quantity - 1)"
                >
                  <i class="pi pi-minus text-[10px]" />
                </button>
                <input
                  :value="item.quantity"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  aria-label="Kuantitas produk"
                  class="w-10 text-center text-xs font-semibold text-brand-ink bg-transparent border-0 outline-none tabular-nums focus:bg-brand-canvas focus:ring-1 focus:ring-brand-accent/50 rounded-full transition-all p-0 select-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  @focus="($event.target as HTMLInputElement).select()"
                  @input="handleManualQuantityInput($event, item)"
                  @blur="handleManualQuantityBlur($event, item)"
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                />
                <button
                  type="button"
                  class="w-6 h-6 flex items-center justify-center text-brand-ink hover:bg-brand-canvas rounded-full transition-colors cursor-pointer text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  :disabled="item.stock <= 0 || item.quantity >= item.stock"
                  aria-label="Tambah kuantitas"
                  @click="updateItemQty(item, item.quantity + 1)"
                >
                  <i class="pi pi-plus text-[10px]" />
                </button>
              </div>

              <!-- Item Total Price -->
              <div class="text-right">
                <span
                  class="font-display text-sm sm:text-base font-bold text-brand-ink tabular-nums block"
                >
                  {{ formatRupiah(item.price * item.quantity) }}
                </span>
              </div>

              <!-- Delete Button -->
              <UiTooltip text="Hapus item" position="top" align="end">
                <UiIconButton
                  icon="pi-trash"
                  label="Hapus produk"
                  variant="danger"
                  size="sm"
                  @click="cartStore.removeItem(item.productId, item.color, item.material)"
                />
              </UiTooltip>
            </div>
          </article>
        </UiCard>

        <div class="flex items-center justify-between pt-2">
          <UiButton to="/katalog" variant="secondary" size="sm" icon="pi-arrow-left">
            Lanjut Belanja
          </UiButton>
        </div>
      </div>

      <!-- Summary Sidebar (Modular Component) -->
      <CartSummarySidebar
        class="lg:col-span-4"
        :has-out-of-stock-items="hasOutOfStockItems"
        @checkout="goToCheckout"
      />
    </div>
  </div>
</template>
