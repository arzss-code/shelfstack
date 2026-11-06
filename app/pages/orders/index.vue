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

// --- Review modal state (UI-only, stays in page) ---

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
  } else {
    isItemPickerOpen.value = true
  }
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
      <span class="text-brand-ink font-semibold">Pesanan Saya</span>
    </nav>

    <!-- 2-Column Layout (Sidebar on xl, full-width on smaller screens) -->
    <div class="flex flex-col xl:flex-row gap-6 items-start">
      <AccountSidebar />

      <div class="flex-1 min-w-0 w-full space-y-6">
        <!-- Filter Tabs & Search Bar -->
        <div v-if="statusCounts.all > 0 || orders.length > 0 || loading" class="w-full space-y-4">
          <div class="w-full">
            <UiTabs
              v-model="activeTab"
              :items="tabItems"
              full-width
              aria-label="Filter status pesanan"
            />
          </div>

          <div class="w-full flex items-center gap-2">
            <div class="relative w-full">
              <UiInput
                v-model="searchQuery"
                placeholder="Cari berdasarkan No. Pesanan atau nama produk..."
                left-icon="pi-search"
                size="sm"
                class="w-full"
              />
            </div>
            <UiButton
              v-if="searchQuery"
              variant="ghost"
              size="sm"
              icon="pi-times"
              @click="searchQuery = ''"
            >
              Hapus
            </UiButton>
          </div>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMsg"
          class="p-4 bg-red-50 border border-red-200 rounded-card flex items-center justify-between text-red-700 text-xs"
        >
          <span>{{ errorMsg }}</span>
          <UiButton variant="ghost" size="sm" @click="() => fetchInitialOrders()"
            >Coba Lagi</UiButton
          >
        </div>

        <!-- Loading Skeleton -->
        <div v-if="loading" class="space-y-4 animate-pulse">
          <div v-for="i in 3" :key="i" class="h-36 bg-brand-field rounded-card" />
        </div>

        <!-- Empty State: No orders at all -->
        <div
          v-else-if="statusCounts.all === 0 && orders.length === 0"
          class="text-center py-16 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card max-w-lg mx-auto space-y-4"
        >
          <div
            class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mx-auto text-brand-muted shadow-whisper"
          >
            <i class="pi pi-inbox text-2xl text-brand-muted" aria-hidden="true" />
          </div>
          <div>
            <h2 class="font-display text-base font-bold text-brand-ink m-0">
              Belum Ada Riwayat Pesanan
            </h2>
            <p class="font-body text-xs text-brand-muted m-0 mt-1">
              Anda belum pernah melakukan pemesanan. Jelajahi katalog dan temukan produk pilihan
              Anda.
            </p>
          </div>
          <UiButton
            to="/katalog"
            variant="primary"
            size="sm"
            icon="pi-arrow-right"
            icon-pos="right"
          >
            Mulai Belanja
          </UiButton>
        </div>

        <!-- Empty State: Filter / search yields nothing -->
        <div
          v-else-if="filteredOrders.length === 0"
          class="text-center py-12 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card max-w-md mx-auto space-y-3"
        >
          <div
            class="w-12 h-12 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mx-auto text-brand-muted shadow-whisper"
          >
            <i class="pi pi-search text-xl text-brand-muted" aria-hidden="true" />
          </div>
          <div>
            <h2 class="font-display text-sm font-bold text-brand-ink m-0">
              Tidak Ada Pesanan Ditemukan
            </h2>
            <p class="font-body text-xs text-brand-muted m-0 mt-1">
              Tidak ada pesanan yang sesuai dengan filter atau kata kunci pencarian Anda.
            </p>
          </div>
          <UiButton variant="secondary" size="sm" icon="pi-filter-slash" @click="resetFilters">
            Reset Filter
          </UiButton>
        </div>

        <!-- Orders List with Infinite Scroll Sentinel -->
        <div v-else class="space-y-4">
          <OrderCard
            v-for="order in filteredOrders"
            :key="order.id"
            :order="order"
            :is-paying="payingOrderId === order.id"
            @select="router.push(`/orders/${$event.id}`)"
            @pay="handlePayNow"
            @review="handleOpenReview"
          />

          <!-- Infinite Scroll Sentinel -->
          <div ref="sentinelEl" class="h-10 w-full flex items-center justify-center">
            <div v-if="isLoadingMore" class="w-full space-y-3 animate-pulse pt-2">
              <div class="h-28 bg-brand-field rounded-card" />
            </div>
          </div>

          <p
            v-if="!hasMore && orders.length >= BATCH_SIZE"
            class="text-xs text-brand-faint text-center py-4 m-0"
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
      <div v-if="selectedReviewOrder?.items" class="space-y-3 pt-2">
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
                class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-box text-brand-faint text-lg" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-xs sm:text-sm text-brand-ink m-0 truncate">
                {{ item.product?.name || `Produk #${item.product_id}` }}
              </p>
              <p class="text-[11px] text-brand-muted m-0 mt-0.5">{{ item.qty }} barang</p>
            </div>
          </div>
          <UiButton variant="outline" size="sm" icon="pi-pencil" @click="selectItemToReview(item)">
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
