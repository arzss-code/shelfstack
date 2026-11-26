<script setup lang="ts">
import type { Order } from '~/types/order'
import OrderCard from '~/features/orders/components/OrderCard.vue'
import ReviewFormModal from '~/components/product/ReviewFormModal.vue'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import { useOrdersList } from '~/composables/useOrdersList'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Riwayat Pesanan - ShelfStack',
  description: 'Daftar riwayat dan status transaksi pesanan resmi Anda di ShelfStack.',
})

const {
  BATCH_SIZE,
  orders,
  loading,
  isLoadingMore,
  hasMore,
  errorMsg,
  activeTab,
  searchQuery,
  payingOrderId,
  statusCounts,
  tabItems,
  filteredOrders,
  sentinelEl,
  fetchInitialOrders,
  handlePayNow,
  resetFilters,
} = useOrdersList()

const router = useRouter()
const toast = useUiToast()

const isReviewModalOpen = ref(false)
const isItemPickerOpen = ref(false)
const selectedReviewOrder = ref<Order | null>(null)
const selectedReviewProduct = ref<{ id: number | string; name: string } | null>(null)

const handleOpenReview = (order: Order) => {
  selectedReviewOrder.value = order
  if (!order.items || order.items.length === 0) {
    router.push(`/orders/${order.id}`)
    return
  }
  if (order.items.length === 1 && order.items[0]) {
    const item = order.items[0]
    selectedReviewProduct.value = {
      id: item.product_id,
      name: item.product?.name || `Produk #${item.product_id}`,
    }
    isReviewModalOpen.value = true
    return
  }
  isItemPickerOpen.value = true
}

const selectItemToReview = (item: {
  product_id: number | string
  product?: { name?: string } | null
}) => {
  isItemPickerOpen.value = false
  selectedReviewProduct.value = {
    id: item.product_id,
    name: item.product?.name || `Produk #${item.product_id}`,
  }
  isReviewModalOpen.value = true
}

const handleReviewSuccess = () => {
  toast.show({
    title: 'Ulasan Terkirim',
    message: 'Terima kasih atas ulasan produk Anda.',
    tone: 'success',
  })
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
      <span class="text-brand-ink font-semibold">Pesanan Saya</span>
    </nav>

    <!-- 2-Column Layout (Sidebar on xl, full-width on smaller screens) -->
    <div class="flex flex-col xl:flex-row gap-4 xl:gap-6 items-start">
      <AccountSidebar />

      <div class="flex-1 min-w-0 w-full space-y-3.5">
        <!-- Compact Header -->
        <header class="pb-3.5 border-b border-brand-hair">
          <div class="flex items-center gap-2">
            <h1
              class="font-display text-lg sm:text-2xl font-bold text-brand-ink tracking-[-0.02em] m-0 [text-wrap:balance]"
            >
              Pesanan Saya
            </h1>
            <span
              v-if="statusCounts.all > 0"
              class="px-2 py-0.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-brand-ink text-[11px] font-semibold tabular-nums"
            >
              {{ statusCounts.all }}
            </span>
          </div>
          <p class="text-xs text-brand-muted m-0 mt-1 [text-wrap:pretty]">
            Pantau status pembayaran, pengiriman, dan riwayat transaksi resmi Anda.
          </p>
        </header>

        <!-- Filter Tabs & Search Bar -->
        <div v-if="statusCounts.all > 0 || orders.length > 0 || loading" class="w-full space-y-2.5">
          <UiTabs
            v-model="activeTab"
            :items="tabItems"
            full-width
            aria-label="Filter status pesanan"
          />

          <div class="w-full flex items-center gap-2">
            <div class="relative flex-1 min-w-0">
              <UiInput
                v-model="searchQuery"
                placeholder="Cari No. Pesanan atau nama produk…"
                left-icon="pi-search"
                size="sm"
                class="w-full"
              />
            </div>
            <UiButton
              v-if="searchQuery"
              variant="ghost"
              size="xs"
              icon="pi-times"
              class="shrink-0"
              @click="searchQuery = ''"
            >
              Hapus
            </UiButton>
          </div>
        </div>

        <!-- Error Alert (Semantic Dark/Light Safe) -->
        <UiAlert v-if="errorMsg" variant="danger">
          <div class="flex items-center justify-between gap-3">
            <span>{{ errorMsg }}</span>
            <UiButton variant="ghost" size="xs" @click="() => fetchInitialOrders()">
              Coba Lagi
            </UiButton>
          </div>
        </UiAlert>

        <!-- Loading Skeleton -->
        <div v-if="loading" role="status" aria-busy="true" class="space-y-3">
          <span class="sr-only">Memuat riwayat pesanan…</span>
          <div
            v-for="i in 3"
            :key="i"
            class="p-4 rounded-card border border-brand-hair bg-brand-canvas space-y-3"
          >
            <div class="flex items-center justify-between gap-3">
              <UiSkeleton width="w-36" height="h-4" />
              <UiSkeleton width="w-20" height="h-5" shape="pill" />
            </div>
            <div class="flex items-center gap-3">
              <UiSkeleton width="w-14" height="h-14" class="shrink-0" />
              <div class="flex-1 min-w-0 space-y-2">
                <UiSkeleton width="w-3/5" height="h-4" />
                <UiSkeleton width="w-28" height="h-3" />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State: No orders at all -->
        <UiEmptyState
          v-else-if="statusCounts.all === 0 && orders.length === 0"
          icon="pi-inbox"
          title="Belum Ada Riwayat Pesanan"
          description="Anda belum pernah melakukan pemesanan. Jelajahi katalog untuk menemukan produk pilihan."
          action-label="Mulai Belanja"
          @action="router.push('/katalog')"
        />

        <!-- Empty State: Filter / search yields nothing -->
        <UiEmptyState
          v-else-if="filteredOrders.length === 0"
          icon="pi-search"
          title="Tidak Ada Pesanan Ditemukan"
          description="Tidak ada pesanan yang cocok dengan tab status atau kata kunci pencarian Anda."
          action-label="Reset Filter"
          @action="resetFilters"
        />

        <!-- Orders List with Infinite Scroll Sentinel -->
        <div v-else class="space-y-3">
          <OrderCard
            v-for="order in filteredOrders"
            :key="order.id"
            :order="order"
            :is-paying="payingOrderId === order.id"
            @select="router.push(`/orders/${$event.id}`)"
            @pay="handlePayNow"
            @review="handleOpenReview"
          />

          <div ref="sentinelEl" class="min-h-8 w-full flex items-center justify-center">
            <div v-if="isLoadingMore" role="status" aria-busy="true" class="w-full pt-1">
              <span class="sr-only">Memuat pesanan lainnya…</span>
              <UiSkeleton width="w-full" height="h-24" />
            </div>
          </div>

          <p
            v-if="!hasMore && orders.length >= BATCH_SIZE"
            class="text-xs text-brand-faint text-center py-3 m-0"
          >
            Semua pesanan telah ditampilkan
          </p>
        </div>
      </div>
    </div>

    <!-- Modal: Item picker for multi-item orders -->
    <UiModal
      v-model:visible="isItemPickerOpen"
      title="Pilih Produk untuk Diulas"
      description="Pilih salah satu produk dari pesanan ini yang ingin Anda berikan ulasan."
      size="md"
    >
      <div v-if="selectedReviewOrder?.items" class="space-y-2.5 pt-2">
        <div
          v-for="item in selectedReviewOrder.items"
          :key="item.id"
          class="flex items-center justify-between gap-3 p-3 rounded-card border border-brand-hair hover:border-brand-ink transition-colors bg-brand-canvas"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="w-12 h-12 rounded-media bg-brand-canvas-soft border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center"
            >
              <img
                v-if="item.product?.image_url"
                :src="item.product.image_url"
                :alt="item.product.name"
                width="48"
                height="48"
                decoding="async"
                class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-box text-brand-faint text-lg" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-xs sm:text-sm text-brand-ink m-0 truncate">
                {{ item.product?.name || `Produk #${item.product_id}` }}
              </p>
              <p class="text-[11px] text-brand-muted m-0 mt-0.5 tabular-nums">
                {{ item.qty }} barang
              </p>
            </div>
          </div>
          <UiButton variant="outline" size="xs" icon="pi-pencil" @click="selectItemToReview(item)">
            Ulas
          </UiButton>
        </div>
      </div>
    </UiModal>

    <!-- Modal: Write product review -->
    <ReviewFormModal
      v-if="selectedReviewProduct && selectedReviewOrder"
      v-model="isReviewModalOpen"
      :product-id="selectedReviewProduct.id"
      :product-name="selectedReviewProduct.name"
      :order-id="selectedReviewOrder.id"
      @success="handleReviewSuccess"
    />
  </div>
</template>
