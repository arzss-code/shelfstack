<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'
import { useHomeFlashDeals } from '~/composables/useHomeFlashDeals'

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
</script>

<template>
  <section
    ref="flashSectionRef"
    class="w-full bg-brand-ink text-white rounded-card p-6 sm:p-10 shadow-floating"
  >
    <div
      class="flex flex-col lg:flex-row lg:items-center justify-between pb-8 gap-4 border-b border-white/10"
    >
      <div>
        <div class="flex items-center gap-2 mb-1.5 text-brand-accent">
          <i class="pi pi-bolt text-base" aria-hidden="true" />
          <span class="text-xs font-bold tracking-wide uppercase">Penawaran Pilihan Toko</span>
        </div>
        <h2 class="font-display text-2xl sm:text-3xl font-bold text-white m-0">
          Koleksi Pilihan Terbatas
        </h2>
        <p class="text-xs sm:text-sm text-white/70 m-0 mt-1">
          Koleksi kurasi produk unggulan dengan harga langsung dari katalog resmi ShelfStack.
        </p>
      </div>

      <!-- Countdown HANYA TAMPIL jika ada promoEndsAt nyata dari data backend -->
      <div
        v-if="countdownData"
        class="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-card border border-white/10 shrink-0"
      >
        <span class="text-xs text-white/70">Berakhir dalam</span>
        <span
          data-testid="flash-deals-timer"
          class="font-display text-base font-bold text-white tracking-widest tabular-nums"
        >
          {{ countdownData.formatted }}
        </span>
      </div>

      <!-- Badge Kurasi Jujur jika tidak ada timer promo data-driven (anti fake urgency) -->
      <div
        v-else
        data-testid="flash-deals-curated-badge"
        class="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-card border border-white/10 shrink-0 text-white/90 text-xs font-medium"
      >
        <i class="pi pi-verified text-brand-accent text-sm" aria-hidden="true" />
        <span>Koleksi Pilihan Resmi</span>
      </div>
    </div>

    <!-- Loading Skeleton Grid -->
    <div
      v-if="isLoading"
      data-testid="flash-deals-skeleton"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8 animate-pulse"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="bg-white/10 rounded-card p-4 flex flex-col justify-between gap-3 border border-white/5"
      >
        <div class="aspect-square rounded-media bg-white/20 w-full" />
        <div class="space-y-2 mt-2">
          <div class="h-3 bg-white/20 rounded w-1/3" />
          <div class="h-4 bg-white/30 rounded w-3/4" />
          <div class="h-4 bg-white/20 rounded w-1/2" />
        </div>
        <div class="h-9 bg-white/20 rounded-full w-full mt-2" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="displayProducts.length === 0"
      data-testid="flash-deals-empty"
      class="pt-8 pb-4 text-center flex flex-col items-center justify-center py-10"
    >
      <div
        class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-brand-accent mb-3"
      >
        <i class="pi pi-bolt text-xl" />
      </div>
      <h3 class="font-display text-lg font-bold text-white m-0">Penawaran Spesial Segera Hadir</h3>
      <p class="text-xs sm:text-sm text-white/70 max-w-md m-0 mt-1">
        Saat ini penawaran terbatas sedang dipersiapkan. Pantau terus halaman ini untuk alokasi
        produk pilihan berikutnya.
      </p>
      <NuxtLink
        to="/katalog"
        class="mt-4 inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold px-5 py-2.5 rounded-full no-underline transition-colors shadow-whisper"
      >
        <span>Jelajahi Semua Produk</span>
        <i class="pi pi-arrow-right text-xs" />
      </NuxtLink>
    </div>

    <!-- Real Deal Cards Grid -->
    <div
      v-else
      data-testid="flash-deals-grid"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8"
    >
      <div
        v-for="product in displayProducts"
        :key="product.id"
        class="bg-white text-brand-ink rounded-card p-4 flex flex-col justify-between gap-3 shadow-whisper group"
        data-testid="flash-deal-card"
      >
        <div
          class="relative aspect-square rounded-media overflow-hidden bg-brand-canvas-soft border border-brand-hair flex items-center justify-center"
        >
          <img
            v-if="product.image_url && !failedDealImages[product.id]"
            :src="product.image_url"
            :alt="product.name"
            :data-product-id="product.id"
            width="400"
            height="400"
            decoding="async"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            @error="onImageError(product.id)"
          />
          <div
            v-else
            class="flex flex-col items-center justify-center w-full h-full text-brand-muted gap-1.5 bg-brand-canvas-soft"
          >
            <i class="pi pi-image text-2xl opacity-25" aria-hidden="true" />
            <span class="text-[10px] font-semibold tracking-widest uppercase opacity-40"
              >ShelfStack</span
            >
          </div>
          <span
            data-testid="deal-badge"
            class="absolute top-2 left-2 bg-brand-ink text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm"
          >
            {{ getProductBadge(product) }}
          </span>
        </div>

        <div>
          <!-- Hanya tampilkan rating jika data rating nyata > 0 -->
          <div
            v-if="product.rating && Number(product.rating) > 0"
            class="flex items-center gap-1 text-[11px] text-brand-muted mb-1 tabular-nums"
          >
            <i class="pi pi-star-fill text-[10px] text-amber-500" aria-hidden="true" />
            <span class="font-bold text-brand-ink">{{ Number(product.rating).toFixed(1) }}</span>
            <span v-if="product.review_count">({{ product.review_count }})</span>
            <span v-else-if="product.sold_count">· {{ product.sold_count }} terjual</span>
          </div>
          <!-- Jika tidak ada rating terverifikasi, tampilkan ketersediaan stok fisik -->
          <div v-else class="flex items-center gap-1 text-[11px] text-brand-muted mb-1">
            <span
              v-if="product.stock > 0"
              class="text-emerald-600 font-medium flex items-center gap-1"
            >
              <i class="pi pi-check-circle text-[10px]" aria-hidden="true" />
              Stok Tersedia
            </span>
            <span v-else class="text-rose-600 font-medium">Stok Habis</span>
          </div>

          <h4
            class="font-display text-sm font-bold text-brand-ink m-0 line-clamp-1"
            :title="product.name"
          >
            {{ product.name }}
          </h4>
          <div class="flex items-baseline gap-2 mt-1.5">
            <span
              data-testid="deal-price"
              class="font-display text-base font-bold text-brand-ink tabular-nums"
            >
              {{ formatRupiah(product.price) }}
            </span>
          </div>
        </div>

        <NuxtLink
          :to="`/product/${product.id}`"
          data-testid="deal-link"
          class="w-full bg-brand-ink hover:bg-black text-white text-xs font-semibold py-2.5 rounded-full text-center no-underline transition-colors shadow-whisper inline-block"
        >
          Lihat Produk
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
