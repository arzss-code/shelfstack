<script setup lang="ts">
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'
import { useProductCard } from '~/composables/useProductCard'
import WishlistButton from '~/components/wishlist/WishlistButton.vue'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'

const props = withDefaults(
  defineProps<{
    product: Product
    hideActions?: boolean
  }>(),
  {
    hideActions: true,
  },
)

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
    class="product-compact-card group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-card border border-brand-hair bg-brand-canvas hover:border-brand-muted/40 shadow-whisper hover:shadow-floating transition-all duration-200 cursor-pointer overflow-hidden"
    data-testid="product-compact-card"
    @click="navigateToDetail"
  >
    <!-- Stretched Semantic Link for Accessibility, Hover URL & SEO -->
    <NuxtLink
      :to="`/product/${product.slug || product.id}`"
      class="absolute inset-0 z-0 rounded-card"
      :aria-label="product.name"
      tabindex="-1"
    />

    <!-- Left Media Thumbnail -->
    <div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
      <div
        class="relative aspect-square w-20 h-20 sm:w-24 sm:h-24 rounded-media overflow-hidden shrink-0 bg-brand-canvas-soft border border-brand-hairsoft"
      >
        <img
          v-if="product.image_url && !imageLoadError"
          ref="imageEl"
          :src="product.image_url"
          :alt="product.name"
          width="160"
          height="160"
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
          class="flex flex-col items-center justify-center w-full h-full text-brand-muted gap-1 bg-brand-canvas-soft"
        >
          <i class="pi pi-image text-xl opacity-25" aria-hidden="true" />
          <span class="text-[9px] font-semibold tracking-widest uppercase opacity-40">
            ShelfStack
          </span>
        </div>

        <span
          v-if="badgeInfo"
          class="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm"
          :class="badgeInfo.badgeClass"
        >
          {{ badgeInfo.label }}
        </span>
      </div>

      <!-- Center Product Details -->
      <div class="space-y-1.5 min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <UiBadge v-if="categoryName" :label="categoryName" variant="default" size="sm" />
          <UiBadge v-if="product.stock === 0" label="Habis" variant="danger" size="sm" />
          <UiBadge
            v-else-if="product.stock <= 3"
            :label="stockStatusText"
            variant="warning"
            size="sm"
          />
          <span
            v-else
            class="text-[11px] text-brand-success font-medium inline-flex items-center gap-1"
          >
            <i class="pi pi-check-circle text-[10px]" aria-hidden="true" />
            Tersedia
          </span>
        </div>

        <h3
          class="m-0 font-display text-sm sm:text-base font-bold text-brand-ink group-hover:text-brand-accent line-clamp-1 transition-colors"
          :title="product.name"
        >
          {{ product.name }}
        </h3>

        <p
          v-if="product.description"
          class="m-0 font-body text-xs text-brand-muted line-clamp-1 hidden sm:block"
        >
          {{ product.description }}
        </p>

        <!-- Rating Indicator -->
        <div
          v-if="formattedRating"
          class="flex items-center gap-1 text-[11px] text-brand-muted tabular-nums"
        >
          <i class="pi pi-star-fill text-[10px] text-amber-500" aria-hidden="true" />
          <span class="font-bold text-brand-ink">{{ formattedRating }}</span>
          <span v-if="product.review_count">({{ product.review_count }})</span>
          <span v-else-if="product.sold_count">· {{ product.sold_count }} terjual</span>
        </div>
      </div>
    </div>

    <!-- Right Price Block & Quick Actions -->
    <div
      class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-hairsoft z-10"
      @click.stop
    >
      <div class="text-left sm:text-right">
        <div class="font-display text-base sm:text-lg font-extrabold text-brand-ink tabular-nums">
          {{ formatRupiah(product.price) }}
        </div>
        <div
          v-if="product.stock > 0 && product.stock <= 3"
          class="text-[11px] text-brand-warning font-medium"
        >
          Sisa {{ product.stock }} unit
        </div>
      </div>

      <div class="flex items-center gap-2">
        <WishlistButton
          v-if="hideActions"
          :product="product"
          :category-name="categoryName"
          variant="inline"
          size="sm"
        />

        <UiButton
          v-if="hideActions && product.stock > 0"
          variant="outline"
          size="sm"
          icon="pi-shopping-bag"
          :loading="justAdded"
          class="text-xs h-8 px-3"
          @click.stop="handleQuickAdd"
        >
          {{ justAdded ? 'Ditambah' : 'Beli' }}
        </UiButton>
        <UiButton
          v-else-if="hideActions"
          variant="secondary"
          size="sm"
          disabled
          class="text-xs h-8 px-3 opacity-60"
        >
          Habis
        </UiButton>
      </div>
    </div>
  </article>
</template>
