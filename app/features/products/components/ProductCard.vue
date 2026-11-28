<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'
import { useProductCard } from '~/composables/useProductCard'
import WishlistButton from '~/components/wishlist/WishlistButton.vue'

const props = withDefaults(
  defineProps<{
    product: Product
    hideActions?: boolean
    isTrash?: boolean
    /** Mode grid 6 kolom agar padding & tipografi tetap proporsional. */
    dense?: boolean
  }>(),
  {
    hideActions: true,
    isTrash: false,
    dense: false,
  },
)

const emit = defineEmits<{
  edit: [product: Product]
  delete: [id: number]
  restore: [id: number]
  viewStockMovements: [product: Product]
  manageVariants: [product: Product]
}>()

const {
  justAdded,
  imageLoadError,
  imageEl,
  onImgError,
  categoryName,
  formattedRating,
  stockStatusText,
  badgeInfo,
  navigateToDetail,
  handleQuickAdd,
} = useProductCard(() => props.product)
</script>

<template>
  <article
    class="product-card group relative isolate flex flex-col bg-brand-canvas rounded-card border border-brand-hair hover:border-brand-muted/40 shadow-whisper hover:shadow-floating transition-shadow duration-200 cursor-pointer"
    @click="navigateToDetail"
  >
    <!-- Stretched Semantic Link for Accessibility, Hover URL & SEO -->
    <NuxtLink
      :to="`/product/${product.slug || product.id}`"
      class="absolute inset-0 z-0 rounded-card focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-2"
      :aria-label="product.name"
    />

    <!-- Curved Ribbon Badge: Flush to Left Edge -->
    <div v-if="badgeInfo" class="absolute top-3 left-0 z-10 pointer-events-none">
      <span
        class="inline-flex items-center text-[10px] font-bold tracking-wider uppercase pl-2.5 pr-3 py-1 rounded-r-full shadow-sm"
        :class="badgeInfo.badgeClass"
      >
        {{ badgeInfo.label }}
      </span>
    </div>

    <!-- Wishlist Button: Top Right Corner Overlay -->
    <div v-if="hideActions" class="absolute top-2.5 right-2.5 z-10 pointer-events-auto">
      <WishlistButton :product="product" :category-name="categoryName" variant="overlay" />
    </div>

    <!-- Media Canvas: 1:1 Aspect Ratio with rounded-t-card -->
    <div
      class="relative aspect-square w-full bg-brand-canvas-soft rounded-t-card overflow-hidden pointer-events-none border-b border-brand-hairsoft"
    >
      <img
        v-if="product.image_url && !imageLoadError"
        ref="imageEl"
        :src="product.image_url"
        :alt="product.name"
        width="400"
        height="400"
        decoding="async"
        loading="lazy"
        :class="[
          'w-full h-full object-cover block transition-transform duration-500 ease-out group-hover:scale-105',
          product.stock === 0 ? 'opacity-60 grayscale' : '',
        ]"
        @error="onImgError"
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

      <!-- Floating Quick Add Button (Smooth fade without any vertical translation/geser) -->
      <div
        v-if="hideActions && product.stock > 0"
        class="absolute bottom-2.5 right-2.5 z-10 pointer-events-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity duration-150"
      >
        <button
          type="button"
          class="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-brand-canvas text-brand-ink shadow-sm border border-brand-hair flex items-center justify-center cursor-pointer hover:bg-brand-ink hover:text-brand-onink transition-colors duration-150 active:scale-95"
          :title="justAdded ? 'Ditambahkan ke Bag' : `Tambah ${product.name} ke Bag`"
          :aria-label="`Tambah ${product.name} ke Keranjang`"
          @click.stop.prevent="handleQuickAdd"
        >
          <i v-if="justAdded" class="pi pi-check text-xs text-brand-success" aria-hidden="true" />
          <i v-else class="pi pi-plus text-xs" aria-hidden="true" />
        </button>
      </div>
    </div>

    <!-- Compact Content Body: Zero divider lines, small crisp typography -->
    <div
      class="flex flex-col justify-between flex-1 relative z-10 pointer-events-none"
      :class="dense ? 'p-2.5 sm:p-3 gap-2' : 'p-3 sm:p-3.5 gap-2.5'"
    >
      <div class="space-y-1">
        <!-- Top Row: Category (Left) and Rating (Right) -->
        <div class="flex items-center justify-between gap-1.5 min-h-[16px]">
          <span
            v-if="categoryName"
            class="font-body text-[10px] uppercase font-bold text-brand-muted tracking-wider truncate"
          >
            {{ categoryName }}
          </span>
          <span v-else class="text-[10px] text-transparent select-none">-</span>

          <div
            v-if="formattedRating"
            class="flex items-center gap-1 shrink-0 text-[11px] font-bold text-brand-ink tabular-nums"
          >
            <i class="pi pi-star-fill text-brand-warning text-[10px]" aria-hidden="true" />
            <span>{{ formattedRating }}</span>
          </div>
        </div>

        <!-- Product Title: Small, crisp font without raw blue hyperlink color -->
        <h3
          class="font-display font-semibold text-xs sm:text-[13px] text-brand-ink tracking-tight line-clamp-2 transition-colors m-0 leading-snug"
          :title="product.name"
        >
          {{ product.name }}
        </h3>
      </div>

      <!-- Price & Status Row: Side-by-side, Clean Alignment -->
      <div class="space-y-2 pt-0.5 pointer-events-auto" @click.stop>
        <div class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 min-w-0">
          <!-- Price on Left -->
          <span
            class="font-display font-bold text-brand-ink tabular-nums tracking-tight whitespace-nowrap"
            :class="dense ? 'text-xs sm:text-sm' : 'text-[13px] sm:text-[15px]'"
          >
            {{ formatRupiah(product.price) }}
          </span>

          <!-- Stock Status / Verified Sold on Right (Storefront Mode) -->
          <span
            v-if="hideActions"
            class="font-medium tabular-nums shrink-0 whitespace-nowrap"
            :class="[
              dense ? 'text-[10px] sm:text-[11px]' : 'text-[11px]',
              product.stock === 0
                ? 'text-brand-danger font-semibold'
                : product.stock <= 3
                  ? 'text-brand-warning-text font-semibold'
                  : 'text-brand-muted',
            ]"
          >
            {{ stockStatusText }}
          </span>

          <!-- Stock Pill (Admin Mode) -->
          <span
            v-else
            class="px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 whitespace-nowrap tabular-nums"
            :class="[
              product.stock === 0
                ? 'bg-brand-danger-tint text-brand-danger-text border-brand-danger-edge'
                : product.stock < 5
                  ? 'bg-brand-warning-tint text-brand-warning-text border-brand-warning-edge'
                  : 'bg-brand-success-tint text-brand-success-text border-brand-success-edge',
            ]"
          >
            Stok: {{ product.stock }}
          </span>
        </div>

        <!-- Admin Actions Bar (Dedicated Footer Row to Prevent Card Overflow) -->
        <div
          v-if="!hideActions"
          class="flex items-center justify-end gap-1.5 flex-wrap border-t border-brand-hairsoft pt-2"
        >
          <template v-if="isTrash">
            <button
              type="button"
              class="px-2.5 py-1 rounded-field text-[11px] font-medium bg-brand-field hover:bg-brand-ink hover:text-brand-onink text-brand-ink border border-brand-hairsoft transition-colors cursor-pointer"
              @click.stop="emit('restore', product.id)"
            >
              Restore
            </button>
          </template>
          <template v-else>
            <UiTooltip text="Kelola Varian" position="top">
              <button
                type="button"
                class="w-7 h-7 rounded-full bg-brand-field hover:bg-brand-accent hover:text-white text-brand-muted hover:border-brand-accent border border-brand-hairsoft transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Kelola Varian Produk"
                @click.stop="emit('manageVariants', product)"
              >
                <i class="pi pi-sitemap text-[10px]" aria-hidden="true" />
              </button>
            </UiTooltip>
            <UiTooltip text="Riwayat Mutasi Stok" position="top">
              <button
                type="button"
                class="w-7 h-7 rounded-full bg-brand-field hover:bg-brand-accent hover:text-white text-brand-muted hover:border-brand-accent border border-brand-hairsoft transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Riwayat Mutasi Stok"
                @click.stop="emit('viewStockMovements', product)"
              >
                <i class="pi pi-history text-[10px]" aria-hidden="true" />
              </button>
            </UiTooltip>
            <UiTooltip text="Ubah Produk" position="top">
              <button
                type="button"
                class="w-7 h-7 rounded-full bg-brand-field hover:bg-brand-ink hover:text-brand-onink text-brand-muted border border-brand-hairsoft transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Ubah Produk"
                @click.stop="emit('edit', product)"
              >
                <i class="pi pi-pencil text-[10px]" aria-hidden="true" />
              </button>
            </UiTooltip>
            <UiTooltip text="Hapus Produk" position="top" align="end">
              <button
                type="button"
                class="w-7 h-7 rounded-full bg-brand-field hover:bg-brand-danger hover:text-white text-brand-muted border border-brand-hairsoft transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Hapus Produk"
                @click.stop="emit('delete', product.id)"
              >
                <i class="pi pi-trash text-[10px]" aria-hidden="true" />
              </button>
            </UiTooltip>
          </template>
        </div>
      </div>
    </div>
  </article>
</template>
