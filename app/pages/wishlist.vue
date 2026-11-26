<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useWishlistStore } from '~/features/wishlist/stores/wishlist'
import { useCartStore } from '~/features/cart/stores/cart'
import { useUiConfirm } from '~/composables/useUiConfirm'
import { formatRupiah } from '~/utils/format'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import WishlistItemRow from '~/components/wishlist/WishlistItemRow.vue'
import WishlistFilterBar from '~/components/wishlist/WishlistFilterBar.vue'
import {
  type WishlistSortOption,
  type WishlistStockFilter,
  filterAndSortWishlist,
  parseWishlistSortQuery,
  parseWishlistStockQuery,
} from '~/features/wishlist/utils/wishlist-helper'

useHead({ title: 'Wishlist - ShelfStack' })

const wishlistStore = useWishlistStore()
const cartStore = useCartStore()
const confirm = useUiConfirm()
const toast = useUiToast()
const route = useRoute()
const router = useRouter()

const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q : '')
const stockFilter = ref<WishlistStockFilter>(parseWishlistStockQuery(route.query.stock))
const sortBy = ref<WishlistSortOption>(parseWishlistSortQuery(route.query.sort))
const statusAnnouncement = ref('')

onMounted(() => {
  wishlistStore.initWishlist()
})

const availableItems = computed(() => wishlistStore.items.filter((item) => item.stock > 0))
const outOfStockCount = computed(() => wishlistStore.items.length - availableItems.value.length)
const availableTotal = computed(() =>
  availableItems.value.reduce((sum, item) => sum + item.price, 0),
)

const hasActiveFilter = computed(
  () =>
    searchQuery.value.trim().length > 0 || stockFilter.value !== 'all' || sortBy.value !== 'newest',
)

const showToolbar = computed(() => wishlistStore.totalItems > 1 || hasActiveFilter.value)

const filteredItems = computed(() =>
  filterAndSortWishlist(wishlistStore.items, searchQuery.value, stockFilter.value, sortBy.value),
)

const sortLabelMap: Record<WishlistSortOption, string> = {
  newest: 'terbaru disimpan',
  price_asc: 'harga terendah',
  price_desc: 'harga tertinggi',
}

watch([searchQuery, stockFilter, sortBy], ([q, stock, sort]) => {
  const nextQuery: Record<string, string> = {}
  const trimmed = q.trim()
  if (trimmed) nextQuery.q = trimmed
  if (stock !== 'all') nextQuery.stock = stock
  if (sort !== 'newest') nextQuery.sort = sort
  router.replace({ query: nextQuery })

  statusAnnouncement.value = `Menampilkan ${filteredItems.value.length} produk, diurutkan dari ${sortLabelMap[sort]}.`
})

const resetFilters = () => {
  searchQuery.value = ''
  stockFilter.value = 'all'
  sortBy.value = 'newest'
}

const notify = (
  severity: 'success' | 'info' | 'warn',
  summary: string,
  detail: string,
  life = 2500,
) => toast.add({ severity, summary, detail, life })

const handleMoveToCart = (productId: number, productName: string) => {
  if (!wishlistStore.moveToCart(productId)) return
  cartStore.isDrawerOpen = true
  notify('success', 'Masuk Keranjang', `${productName} dipindahkan ke keranjang belanja.`)
}

const handleRemove = (productId: number, productName: string) => {
  wishlistStore.removeItem(productId)
  notify('info', 'Wishlist', `${productName} dihapus dari wishlist.`, 2000)
}

const handleMoveAll = () => {
  const count = wishlistStore.moveAllToCart()
  if (count > 0) {
    cartStore.isDrawerOpen = true
    notify(
      'success',
      'Semua Produk Dipindahkan',
      `${count} produk siap beli telah masuk ke keranjang belanja.`,
      3000,
    )
    return
  }
  notify('warn', 'Tidak Dapat Memindahkan', 'Semua produk di wishlist saat ini kehabisan stok.')
}

const handleClear = () => {
  confirm.require({
    header: 'Kosongkan Wishlist?',
    message: `Semua ${wishlistStore.totalItems} produk yang tersimpan di wishlist akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
    tone: 'danger',
    acceptLabel: 'Ya, Kosongkan',
    rejectLabel: 'Batal',
    accept: () => {
      wishlistStore.clearWishlist()
      resetFilters()
      notify('info', 'Wishlist Dikosongkan', 'Seluruh produk tersimpan telah dihapus.', 2000)
    },
  })
}
</script>

<template>
  <div class="space-y-4 pb-16">
    <!-- Desktop Breadcrumbs (hidden on mobile where AccountSidebar tab already shows active section) -->
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
      <span class="text-brand-ink font-semibold">Wishlist</span>
    </nav>

    <!-- 2-Column Layout (Sidebar on xl, Horizontal Tabs on < xl) -->
    <div class="flex flex-col xl:flex-row gap-4 xl:gap-6 items-start">
      <AccountSidebar />

      <div class="flex-1 min-w-0 w-full space-y-3.5">
        <!-- Compact Header & Live Summary -->
        <header
          class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3.5 border-b border-brand-hair"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1
                class="font-display text-lg sm:text-2xl font-bold text-brand-ink tracking-[-0.02em] m-0 [text-wrap:balance]"
              >
                Wishlist Saya
              </h1>
              <span
                v-if="wishlistStore.totalItems > 0"
                class="px-2 py-0.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-brand-ink text-[11px] font-semibold tabular-nums"
              >
                {{ wishlistStore.totalItems }}
              </span>
            </div>

            <p
              v-if="wishlistStore.totalItems > 0"
              class="text-xs text-brand-muted m-0 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums [text-wrap:pretty]"
            >
              <span>{{ availableItems.length }} siap dibeli</span>
              <template v-if="outOfStockCount > 0">
                <span aria-hidden="true">·</span>
                <span class="text-brand-danger-text font-medium">{{ outOfStockCount }} habis</span>
              </template>
              <template v-if="availableTotal > 0">
                <span aria-hidden="true">·</span>
                <span>
                  Estimasi
                  <strong class="font-semibold text-brand-ink">{{
                    formatRupiah(availableTotal)
                  }}</strong>
                </span>
              </template>
            </p>
            <p v-else class="text-xs text-brand-muted m-0 mt-1 [text-wrap:pretty]">
              Simpan produk incaran untuk memantau harga dan ketersediaan stok.
            </p>
          </div>

          <!-- Compact Bulk Actions -->
          <div
            v-if="!wishlistStore.isEmpty"
            class="flex items-center justify-between sm:justify-end gap-2 shrink-0"
          >
            <UiButton
              variant="ghost"
              size="xs"
              icon="pi-trash"
              class="shrink-0"
              @click="handleClear"
            >
              Kosongkan
            </UiButton>
            <UiButton
              variant="primary"
              size="xs"
              icon="pi-shopping-bag"
              class="shrink-0 sm:px-4 sm:py-2"
              :disabled="availableItems.length === 0"
              @click="handleMoveAll"
            >
              Semua ke Bag
            </UiButton>
          </div>
        </header>

        <!-- Compact Filter & Sort Strip -->
        <WishlistFilterBar
          v-if="showToolbar"
          v-model:search-query="searchQuery"
          v-model:stock-filter="stockFilter"
          v-model:sort-by="sortBy"
          :total-count="wishlistStore.totalItems"
          :available-count="availableItems.length"
          :out-of-stock-count="outOfStockCount"
        />

        <!-- Screen-reader announcement for filter & sort updates -->
        <p role="status" class="sr-only">{{ statusAnnouncement }}</p>

        <!-- Loading Skeleton State -->
        <UiCard
          v-if="wishlistStore.isSyncing && wishlistStore.isEmpty"
          :padded="false"
          role="status"
          aria-busy="true"
          class="shadow-none divide-y divide-brand-hairsoft"
        >
          <span class="sr-only">Memuat daftar wishlist…</span>
          <div v-for="n in 3" :key="n" class="p-3 sm:px-4 flex items-center gap-3">
            <UiSkeleton width="w-16 sm:w-[72px]" height="h-16 sm:h-[72px]" class="shrink-0" />
            <div class="flex-1 min-w-0 space-y-2">
              <UiSkeleton width="w-3/5" height="h-4" />
              <UiSkeleton width="w-40" height="h-3" />
            </div>
            <UiSkeleton width="w-24" height="h-8" shape="pill" class="hidden sm:block" />
          </div>
        </UiCard>

        <!-- Empty Wishlist State -->
        <UiEmptyState
          v-else-if="wishlistStore.isEmpty"
          icon="pi-heart"
          title="Belum Ada Produk Tersimpan"
          description="Simpan produk dari katalog untuk memantau harga dan ketersediaan stok kapan saja."
          action-label="Jelajahi Katalog"
          @action="navigateTo('/katalog')"
        />

        <!-- Empty Filtered Result State -->
        <UiEmptyState
          v-else-if="filteredItems.length === 0"
          icon="pi-filter"
          title="Tidak Ada Produk yang Cocok"
          description="Ubah kata kunci pencarian atau reset filter untuk melihat kembali semua produk tersimpan."
          action-label="Reset Filter"
          @action="resetFilters"
        />

        <!-- Compact Informative Wishlist List -->
        <UiCard v-else :padded="false" class="shadow-none">
          <ul class="m-0 list-none p-0 divide-y divide-brand-hairsoft">
            <WishlistItemRow
              v-for="(item, index) in filteredItems"
              :key="item.productId"
              :item="item"
              :eager="index < 3"
              :priority="index === 0"
              @move-to-cart="handleMoveToCart"
              @remove="handleRemove"
            />
          </ul>
        </UiCard>
      </div>
    </div>
  </div>
</template>
