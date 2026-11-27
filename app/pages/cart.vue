<script setup lang="ts">
import { onMounted } from 'vue'
import { type CartItem, useCartStore } from '~/features/cart/stores/cart'
import { useCartReconciliation } from '~/features/cart/composables/useCartReconciliation'
import { useUiConfirm } from '~/composables/useUiConfirm'
import { useUiToast } from '~/composables/useUiToast'
import CartItemRow from '~/components/cart/CartItemRow.vue'
import CartSummarySidebar from '~/components/cart/CartSummarySidebar.vue'

const cartStore = useCartStore()
const router = useRouter()
const confirm = useUiConfirm()
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

const removeItem = (item: CartItem) => {
  cartStore.removeItem(item.productId, item.color, item.material)
}

const handleClearCart = () => {
  confirm.require({
    header: 'Kosongkan Keranjang?',
    message: `Semua ${cartStore.totalItems} item di keranjang belanja akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
    tone: 'danger',
    acceptLabel: 'Ya, Kosongkan',
    rejectLabel: 'Batal',
    accept: () => {
      cartStore.clearCart()
      toast.show({
        title: 'Keranjang Dikosongkan',
        message: 'Seluruh produk telah dihapus dari keranjang belanja.',
        tone: 'info',
      })
    },
  })
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
</script>

<template>
  <div class="space-y-4 pb-16">
    <!-- Desktop Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="hidden sm:flex items-center gap-2 text-xs font-medium text-brand-muted overflow-x-auto"
    >
      <NuxtLink
        to="/"
        class="hover:text-brand-ink no-underline text-brand-muted transition-colors focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0 rounded-sm"
      >
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint" aria-hidden="true">/</span>
      <span class="text-brand-ink font-semibold">Keranjang Belanja</span>
    </nav>

    <!-- Compact Page Header -->
    <header
      class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3.5 border-b border-brand-hair"
    >
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1
            class="font-display text-lg sm:text-2xl font-bold text-brand-ink tracking-[-0.02em] m-0 [text-wrap:balance]"
          >
            Keranjang Belanja
          </h1>
          <span
            v-if="cartStore.totalItems > 0"
            class="px-2 py-0.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-brand-ink text-[11px] font-semibold tabular-nums"
          >
            {{ cartStore.totalItems }}
          </span>
        </div>
        <p class="font-body text-xs text-brand-muted m-0 mt-1 [text-wrap:pretty]">
          Tinjau jumlah, varian, dan ketersediaan stok sebelum lanjut ke pembayaran.
        </p>
      </div>

      <UiButton
        v-if="!cartStore.isEmpty"
        variant="ghost"
        size="xs"
        icon="pi-trash"
        class="self-start sm:self-auto shrink-0 text-brand-danger-text hover:bg-brand-danger-tint hover:text-brand-danger-text"
        @click="handleClearCart"
      >
        Kosongkan Keranjang
      </UiButton>
    </header>

    <!-- Empty State -->
    <UiEmptyState
      v-if="cartStore.isEmpty"
      icon="pi-shopping-bag"
      title="Keranjang Belanja Masih Kosong"
      description="Belum ada produk yang Anda tambahkan. Kunjungi katalog untuk memilih produk kurasi ShelfStack."
      action-label="Jelajahi Katalog"
      @action="router.push('/katalog')"
    />

    <!-- Filled Cart View -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
      <div class="lg:col-span-8 space-y-3.5">
        <!-- Drift Warnings Banner (Semantic Dark/Light Safe) -->
        <div
          v-if="driftWarnings.length > 0"
          role="alert"
          class="bg-brand-warning-tint border border-brand-warning-edge rounded-card p-3.5 space-y-1.5 text-xs text-brand-warning-text"
        >
          <div class="flex items-center justify-between gap-2 font-semibold">
            <span class="flex items-center gap-1.5">
              <i class="pi pi-exclamation-triangle text-xs shrink-0" aria-hidden="true" />
              Penyesuaian Inventaris
            </span>
            <button
              type="button"
              class="text-brand-warning-text hover:underline text-[11px] font-medium cursor-pointer bg-transparent border-0 p-0 focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0 rounded-sm"
              @click="driftWarnings = []"
            >
              Tutup
            </button>
          </div>
          <ul class="list-disc list-inside space-y-0.5 m-0 pl-1 text-[11px] opacity-90">
            <li v-for="(warn, idx) in driftWarnings" :key="idx">{{ warn }}</li>
          </ul>
        </div>

        <UiCard :padded="false" class="shadow-none">
          <ul class="m-0 list-none p-0 divide-y divide-brand-hairsoft">
            <CartItemRow
              v-for="item in cartStore.items"
              :key="`${item.productId}-${item.color}-${item.material}`"
              :item="item"
              @update-qty="updateItemQty"
              @remove="removeItem"
            />
          </ul>
        </UiCard>

        <div class="flex items-center justify-between pt-1">
          <UiButton to="/katalog" variant="secondary" size="xs" icon="pi-arrow-left">
            Lanjut Belanja
          </UiButton>
        </div>
      </div>

      <CartSummarySidebar
        class="lg:col-span-4"
        :has-out-of-stock-items="hasOutOfStockItems"
        @checkout="goToCheckout"
      />
    </div>
  </div>
</template>
