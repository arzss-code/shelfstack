<script setup lang="ts">
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'
import { useCartStore } from '~/features/cart/stores/cart'
import { formatRupiah } from '~/utils/format'
import AccountSidebar from '~/components/account/AccountSidebar.vue'

useHead({
  title: 'Wishlist - ShelfStack',
})

const wishlistStore = useWishlistStore()
const cartStore = useCartStore()
const toast = useUiToast()

onMounted(() => {
  wishlistStore.initWishlist()
})

const handleMoveToCart = (productId: number, productName: string) => {
  const success = wishlistStore.moveToCart(productId)
  if (success) {
    cartStore.isDrawerOpen = true
    toast.add({
      severity: 'success',
      summary: 'Masuk Keranjang',
      detail: `${productName} dipindahkan ke keranjang belanja.`,
      life: 2500,
    })
  }
}

const handleRemove = (productId: number, productName: string) => {
  wishlistStore.removeItem(productId)
  toast.add({
    severity: 'info',
    summary: 'Wishlist',
    detail: `${productName} dihapus dari wishlist.`,
    life: 2000,
  })
}

const handleMoveAll = () => {
  const count = wishlistStore.moveAllToCart()
  if (count > 0) {
    cartStore.isDrawerOpen = true
    toast.add({
      severity: 'success',
      summary: 'Semua Produk Dipindahkan',
      detail: `${count} produk siap beli telah masuk ke keranjang belanja.`,
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Tidak Dapat Memindahkan',
      detail: 'Semua produk di wishlist saat ini kehabisan stok.',
      life: 2500,
    })
  }
}

const handleClear = () => {
  wishlistStore.clearWishlist()
  toast.add({
    severity: 'info',
    summary: 'Wishlist Dikosongkan',
    detail: 'Seluruh produk tersimpan telah dihapus.',
    life: 2000,
  })
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Wishlist</span>
      <span
        v-if="wishlistStore.totalItems > 0"
        class="ml-1 px-2 py-0.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-brand-ink text-[10px] font-bold tabular-nums"
      >
        {{ wishlistStore.totalItems }} item
      </span>
    </nav>

    <!-- 2-Column Layout (Sidebar on xl, Horizontal Tabs on < xl) -->
    <div class="flex flex-col xl:flex-row gap-6 items-start">
      <AccountSidebar />

      <div class="flex-1 min-w-0 w-full space-y-6">
        <!-- Compact Header Row -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-brand-hair"
        >
          <div>
            <h1
              class="font-display text-xl sm:text-2xl font-bold text-brand-ink tracking-tight m-0"
            >
              Wishlist Saya
            </h1>
            <p class="text-xs text-brand-muted m-0 mt-0.5">
              Daftar produk incaran yang Anda simpan untuk dibeli nanti.
            </p>
          </div>

          <!-- Global Actions -->
          <div v-if="!wishlistStore.isEmpty" class="flex items-center gap-2">
            <UiButton variant="ghost" size="sm" icon="pi-trash" @click="handleClear">
              Kosongkan
            </UiButton>
            <UiButton variant="primary" size="sm" icon="pi-shopping-bag" @click="handleMoveAll">
              Pindahkan Semua ke Bag
            </UiButton>
          </div>
        </div>

        <!-- Empty State View -->
        <div
          v-if="wishlistStore.isEmpty"
          class="py-20 px-4 text-center max-w-md mx-auto flex flex-col items-center justify-center bg-brand-canvas-soft rounded-card border border-brand-hair"
        >
          <div
            class="w-16 h-16 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 mb-4 shadow-whisper"
          >
            <i class="pi pi-heart text-2xl" />
          </div>
          <h2 class="font-display text-lg sm:text-xl font-bold text-brand-ink mb-2">
            Belum Ada Produk Tersimpan
          </h2>
          <p class="font-body text-xs sm:text-sm text-brand-muted max-w-xs mb-6">
            Simpan produk yang Anda sukai dari katalog untuk kemudahan akses dan pembelian di masa
            mendatang.
          </p>
          <UiButton to="/katalog" variant="primary" icon="pi-arrow-right" icon-pos="right">
            Jelajahi Katalog Lengkap
          </UiButton>
        </div>

        <!-- Wishlist Product Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <article
            v-for="item in wishlistStore.items"
            :key="item.productId"
            class="group relative flex flex-col bg-brand-canvas rounded-card border border-brand-hair hover:border-brand-muted/40 shadow-whisper hover:shadow-floating transition-all duration-200 overflow-hidden"
          >
            <!-- Media Thumbnail -->
            <div
              class="relative aspect-square w-full bg-brand-canvas-soft rounded-t-card overflow-hidden"
            >
              <NuxtLink :to="`/product/${item.slug || item.productId}`" class="block w-full h-full">
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  loading="lazy"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  :class="item.stock === 0 ? 'opacity-50 grayscale' : ''"
                />
                <div
                  v-else
                  class="flex flex-col items-center justify-center w-full h-full text-brand-muted gap-1"
                >
                  <i class="pi pi-image text-xl opacity-30" />
                  <span class="text-[9px] font-semibold uppercase opacity-40">ShelfStack</span>
                </div>
              </NuxtLink>

              <!-- Remove Button with UiTooltip -->
              <div class="absolute top-2.5 right-2.5 z-10 pointer-events-auto">
                <UiTooltip text="Hapus dari Wishlist" position="bottom" align="end">
                  <button
                    type="button"
                    :aria-label="`Hapus ${item.name} dari wishlist`"
                    class="w-7 h-7 rounded-full bg-brand-canvas/90 backdrop-blur-xs border border-brand-hair text-brand-muted hover:text-red-600 hover:bg-brand-canvas flex items-center justify-center cursor-pointer transition-all shadow-whisper"
                    @click="handleRemove(item.productId, item.name)"
                  >
                    <i class="pi pi-times text-xs" />
                  </button>
                </UiTooltip>
              </div>

              <!-- Stock Status Overlay for Out of Stock -->
              <div v-if="item.stock === 0" class="absolute bottom-2 left-2 z-10">
                <span
                  class="px-2 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-bold backdrop-blur-xs"
                >
                  Stok Habis
                </span>
              </div>
            </div>

            <!-- Content Details -->
            <div class="p-4 flex flex-col flex-1 justify-between gap-3">
              <div>
                <div class="flex items-center justify-between text-[11px] text-brand-muted mb-1">
                  <span class="uppercase tracking-wider font-semibold truncate">
                    {{ item.categoryName || 'Kurasi Toko' }}
                  </span>
                  <span v-if="item.stock > 0" class="text-brand-success font-medium">
                    Stok {{ item.stock }}
                  </span>
                </div>

                <NuxtLink
                  :to="`/product/${item.slug || item.productId}`"
                  class="font-display text-sm font-bold text-brand-ink hover:text-brand-accent transition-colors line-clamp-2 no-underline"
                >
                  {{ item.name }}
                </NuxtLink>
              </div>

              <div class="pt-2 border-t border-brand-hairsoft flex flex-col gap-2.5">
                <span
                  class="font-display text-sm sm:text-base font-bold text-brand-ink tabular-nums"
                >
                  {{ formatRupiah(item.price) }}
                </span>

                <UiButton
                  variant="primary"
                  size="sm"
                  block
                  :disabled="item.stock === 0"
                  icon="pi-shopping-bag"
                  @click="handleMoveToCart(item.productId, item.name)"
                >
                  <span v-if="item.stock === 0">Kehabisan Stok</span>
                  <span v-else>Pindahkan ke Bag</span>
                </UiButton>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>
