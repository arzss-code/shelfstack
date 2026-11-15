<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'
import { useHomeFlashDeals } from '~/composables/useHomeFlashDeals'
import { useFlashSale } from '~/composables/useFlashSale'
import FlashSaleProgress from '~/components/promotions/FlashSaleProgress.vue'

const props = withDefaults(
  defineProps<{
    products?: Product[]
    loading?: boolean
    /**
     * Waktu berakhir promo resmi yang ditentukan oleh database atau campaign.
     * Jika null/undefined, timer TIDAK AKAN ditampilkan untuk mencegah urgensi palsu.
     */
    promoEndsAt?: string | Date | null
  }>(),
  {
    products: undefined,
    loading: undefined,
    promoEndsAt: null,
  },
)

const {
  countdownData,
  isLoading,
  displayProducts,
  getProductBadge,
  failedDealImages,
  onImageError,
  flashSectionRef,
} = useHomeFlashDeals(props)

const { getDealForProduct } = useFlashSale()
</script>

<template>
  <section
    ref="flashSectionRef"
    class="relative w-full overflow-hidden rounded-card bg-[#12131a] p-6 sm:p-8 text-white shadow-floating"
  >
    <!-- Header Section -->
    <div
      class="relative z-10 flex flex-col justify-between gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center"
    >
      <div>
        <div class="mb-2 flex items-center gap-2">
          <UiBadge label="Flash Deals" variant="solid-danger" />
          <h2 class="m-0 font-display text-2xl font-extrabold text-white sm:text-3xl">
            Promo Terbatas Hari Ini
          </h2>
        </div>
        <p class="m-0 text-xs text-white/70 sm:text-sm">
          Diskon spesial produk pilihan dengan alokasi kuota harian.
        </p>
      </div>

      <!-- Countdown HANYA TAMPIL jika ada promoEndsAt nyata dari data backend -->
      <div
        v-if="countdownData"
        class="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 shadow-inner shrink-0"
      >
        <span class="text-xs font-medium text-white/70">Berakhir dalam:</span>
        <div
          data-testid="flash-deals-timer"
          class="font-mono text-sm font-bold text-amber-300 tabular-nums tracking-widest"
        >
          {{ countdownData.formatted }}
        </div>
      </div>

      <!-- Badge Kurasi Jujur jika tidak ada timer promo data-driven (anti fake urgency) -->
      <div
        v-else
        data-testid="flash-deals-curated-badge"
        class="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-medium text-white/90"
      >
        <i class="pi pi-verified text-sm text-brand-accent" aria-hidden="true" />
        <span>Koleksi Pilihan Resmi</span>
      </div>
    </div>

    <!-- Loading Skeleton Grid -->
    <div
      v-if="isLoading"
      data-testid="flash-deals-skeleton"
      class="grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 animate-pulse"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="flex flex-col justify-between gap-3 rounded-card border border-white/5 bg-white/10 p-4"
      >
        <div class="aspect-square w-full rounded-media bg-white/20" />
        <div class="mt-2 space-y-2">
          <div class="h-3 w-1/3 rounded bg-white/20" />
          <div class="h-4 w-3/4 rounded bg-white/30" />
          <div class="h-4 w-1/2 rounded bg-white/20" />
        </div>
        <div class="mt-2 h-9 w-full rounded-full bg-white/20" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="displayProducts.length === 0"
      data-testid="flash-deals-empty"
      class="flex flex-col items-center justify-center py-12 text-center"
    >
      <div
        class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-brand-accent"
      >
        <i class="pi pi-bolt text-xl" />
      </div>
      <h3 class="m-0 font-display text-lg font-bold text-white">Penawaran Spesial Segera Hadir</h3>
      <p class="m-0 mt-1 max-w-md text-xs text-white/70 sm:text-sm">
        Saat ini penawaran terbatas sedang dipersiapkan. Pantau terus halaman ini untuk alokasi
        produk pilihan berikutnya.
      </p>
      <UiButton
        to="/katalog"
        variant="accent"
        size="sm"
        icon="pi-arrow-right"
        icon-pos="right"
        class="mt-4"
      >
        Jelajahi Semua Produk
      </UiButton>
    </div>

    <!-- Real Deal Cards Grid -->
    <div
      v-else
      data-testid="flash-deals-grid"
      class="relative z-10 grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
    >
      <div
        v-for="product in displayProducts"
        :key="product.id"
        class="group flex flex-col justify-between gap-3 rounded-card border border-brand-hair bg-white p-4 text-brand-ink shadow-whisper transition-shadow hover:shadow-floating"
        data-testid="flash-deal-card"
      >
        <div
          class="relative flex aspect-square items-center justify-center overflow-hidden rounded-media border border-brand-hair bg-brand-canvas-soft"
        >
          <img
            v-if="product.image_url && !failedDealImages[product.id]"
            :src="product.image_url"
            :alt="product.name"
            :data-product-id="product.id"
            width="400"
            height="400"
            decoding="async"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            @error="onImageError(product.id)"
          />
          <div
            v-else
            class="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-brand-canvas-soft text-brand-muted"
          >
            <i class="pi pi-image text-2xl opacity-25" aria-hidden="true" />
            <span class="text-[10px] font-semibold uppercase tracking-widest opacity-40">
              ShelfStack
            </span>
          </div>
          <span
            data-testid="deal-badge"
            class="absolute top-2 left-2 rounded-full bg-brand-ink px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
          >
            {{ getProductBadge(product) }}
          </span>
        </div>

        <div>
          <!-- Rating jika > 0 -->
          <div
            v-if="product.rating && Number(product.rating) > 0"
            class="mb-1 flex items-center gap-1 text-[11px] text-brand-muted tabular-nums"
          >
            <i class="pi pi-star-fill text-[10px] text-amber-500" aria-hidden="true" />
            <span class="font-bold text-brand-ink">{{ Number(product.rating).toFixed(1) }}</span>
            <span v-if="product.review_count">({{ product.review_count }})</span>
            <span v-else-if="product.sold_count">· {{ product.sold_count }} terjual</span>
          </div>
          <!-- Stok fisik -->
          <div v-else class="mb-1 flex items-center gap-1 text-[11px] text-brand-muted">
            <span
              v-if="product.stock > 0"
              class="flex items-center gap-1 font-medium text-brand-success"
            >
              <i class="pi pi-check-circle text-[10px]" aria-hidden="true" />
              Stok Tersedia
            </span>
            <span v-else class="font-medium text-brand-danger">Stok Habis</span>
          </div>

          <h3
            class="m-0 line-clamp-1 font-display text-sm font-bold text-brand-ink"
            :title="product.name"
          >
            {{ product.name }}
          </h3>
          <div class="mt-1.5 flex flex-wrap items-baseline gap-2">
            <template v-if="getDealForProduct(product.id)">
              <span
                data-testid="deal-price"
                class="font-display text-base font-extrabold text-rose-600 tabular-nums"
              >
                {{ formatRupiah(getDealForProduct(product.id)!.promo_price_cents / 100) }}
              </span>
              <span class="text-xs text-brand-muted line-through tabular-nums">
                {{ formatRupiah(product.price) }}
              </span>
              <UiBadge
                :label="`-${getDealForProduct(product.id)!.discount_percentage}%`"
                variant="solid-danger"
              />
            </template>
            <span
              v-else
              data-testid="deal-price"
              class="font-display text-base font-bold text-brand-ink tabular-nums"
            >
              {{ formatRupiah(product.price) }}
            </span>
          </div>

          <!-- Flash Sale Progress Bar (Jika terdaftar dalam promo aktif) -->
          <div v-if="getDealForProduct(product.id)" class="mt-2.5">
            <FlashSaleProgress
              :claimed="getDealForProduct(product.id)!.claimed"
              :quota="getDealForProduct(product.id)!.quota"
              theme="light"
            />
          </div>
        </div>

        <UiButton
          :to="`/product/${product.id}`"
          data-testid="deal-link"
          variant="primary"
          size="sm"
          block
        >
          Lihat Produk
        </UiButton>
      </div>
    </div>
  </section>
</template>
