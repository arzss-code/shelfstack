<script setup lang="ts">
import { computed } from 'vue'
import type { WishlistItem } from '~/features/wishlist/stores/wishlist'
import { formatReviewDate, formatRupiah } from '~/utils/format'

const props = defineProps<{
  item: WishlistItem
  eager?: boolean
  priority?: boolean
}>()

const emit = defineEmits<{
  moveToCart: [productId: number, productName: string]
  remove: [productId: number, productName: string]
}>()

const savedDateLabel = computed(() => formatReviewDate(props.item.addedAt))
const hasRating = computed(() => typeof props.item.rating === 'number' && props.item.rating > 0)
const productUrl = computed(() => `/product/${props.item.slug || props.item.productId}`)
</script>

<template>
  <li class="wishlist-row-host">
    <article
      class="wishlist-row transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-canvas-soft/60"
    >
      <!-- Compact Studio Thumbnail -->
      <NuxtLink
        :to="productUrl"
        class="wishlist-media block rounded-media bg-brand-canvas-soft border border-brand-hairsoft overflow-hidden shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2"
      >
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.name"
          width="72"
          height="72"
          decoding="async"
          :loading="eager ? 'eager' : 'lazy'"
          :fetchpriority="priority ? 'high' : undefined"
          class="w-full h-full object-cover transition-transform duration-200 motion-reduce:transition-none hover:scale-105"
          :class="item.stock === 0 ? 'opacity-45 grayscale' : ''"
        />
        <div
          v-else
          class="flex items-center justify-center w-full h-full text-brand-faint"
          aria-hidden="true"
        >
          <i class="pi pi-image text-base opacity-50" />
        </div>
      </NuxtLink>

      <!-- Title First + Informative Metadata Strip -->
      <div class="wishlist-info min-w-0">
        <h2
          class="m-0 font-display text-[13px] sm:text-sm font-semibold leading-snug tracking-[-0.01em] [text-wrap:balance]"
        >
          <NuxtLink
            :to="productUrl"
            class="text-brand-ink hover:text-brand-accent transition-colors no-underline line-clamp-2 sm:line-clamp-1 break-words focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
          >
            {{ item.name }}
          </NuxtLink>
        </h2>

        <div
          class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-brand-muted"
        >
          <!-- Availability Signal (Text + Semantic Surface) -->
          <span
            v-if="item.stock === 0"
            class="inline-flex items-center rounded-md bg-brand-danger-tint border border-brand-danger-edge px-1.5 py-0.5 text-[10px] font-semibold leading-none text-brand-danger-text"
          >
            Stok Habis
          </span>
          <span
            v-else-if="item.stock <= 5"
            class="inline-flex items-center rounded-md bg-brand-warning-tint border border-brand-warning-edge px-1.5 py-0.5 text-[10px] font-semibold leading-none text-brand-warning-text tabular-nums"
          >
            Sisa {{ item.stock }}
          </span>
          <span v-else class="font-medium text-brand-success-text tabular-nums">
            Stok {{ item.stock }}
          </span>

          <span v-if="item.categoryName" class="truncate max-w-[11rem]">
            {{ item.categoryName }}
          </span>

          <span
            v-if="hasRating"
            class="inline-flex items-center gap-1 tabular-nums text-brand-ink-soft font-medium"
          >
            <i class="pi pi-star-fill text-[10px] text-brand-warning" aria-hidden="true" />
            <span>{{ item.rating?.toFixed(1) }}</span>
            <span
              v-if="item.reviewCount && item.reviewCount > 0"
              class="text-brand-muted font-normal"
            >
              ({{ item.reviewCount }})
            </span>
          </span>

          <span v-if="savedDateLabel" class="wishlist-saved-date">
            Disimpan {{ savedDateLabel }}
          </span>
        </div>
      </div>

      <!-- Price & Primary Action (Inline Bottom Bar on Mobile, Aligned Columns on Wide) -->
      <div class="wishlist-bottom flex items-center justify-between gap-2.5">
        <span
          class="wishlist-price font-display text-sm sm:text-[15px] font-bold text-brand-ink tabular-nums whitespace-nowrap"
        >
          {{ formatRupiah(item.price) }}
        </span>

        <UiButton
          variant="primary"
          size="xs"
          class="wishlist-cta shrink-0"
          :disabled="item.stock === 0"
          icon="pi-shopping-bag"
          @click="emit('moveToCart', item.productId, item.name)"
        >
          {{ item.stock === 0 ? 'Habis' : 'Masuk Bag' }}
        </UiButton>
      </div>

      <!-- Remove Control (Top-Right on Mobile, Right End on Wide) -->
      <div class="wishlist-remove-slot">
        <button
          type="button"
          :aria-label="`Hapus ${item.name} dari wishlist`"
          :title="`Hapus ${item.name} dari wishlist`"
          class="wishlist-remove relative inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border border-transparent text-brand-muted transition-colors duration-150 motion-reduce:transition-none hover:border-brand-danger-edge hover:bg-brand-danger-tint hover:text-brand-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1 cursor-pointer"
          @click="emit('remove', item.productId, item.name)"
        >
          <i class="pi pi-trash text-xs" aria-hidden="true" />
        </button>
      </div>
    </article>
  </li>
</template>

<style scoped>
.wishlist-row-host {
  container-type: inline-size;
}

.wishlist-row {
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  grid-template-areas:
    'media info remove'
    'media bottom bottom';
  gap: 0.5rem 0.75rem;
  align-items: start;
  padding: 0.75rem;
}

.wishlist-media {
  grid-area: media;
  width: 4rem;
  height: 4rem;
}

.wishlist-info {
  grid-area: info;
}

.wishlist-bottom {
  grid-area: bottom;
}

.wishlist-remove-slot {
  grid-area: remove;
}

.wishlist-saved-date {
  display: none;
}

.wishlist-remove,
.wishlist-cta {
  touch-action: manipulation;
}

@media (pointer: coarse) {
  .wishlist-cta {
    min-block-size: 36px;
    position: relative;
  }

  .wishlist-cta::after {
    content: '';
    position: absolute;
    inset: -4px 0;
  }

  .wishlist-remove::after {
    content: '';
    position: absolute;
    inset: -8px;
  }
}

@container (min-width: 34rem) {
  .wishlist-row {
    grid-template-columns: 4.5rem minmax(0, 1fr) auto auto;
    grid-template-areas: 'media info bottom remove';
    gap: 0.75rem 1rem;
    align-items: center;
    padding: 0.75rem 1rem;
  }

  .wishlist-media {
    width: 4.5rem;
    height: 4.5rem;
  }

  .wishlist-bottom {
    gap: 1rem;
  }

  .wishlist-price {
    min-inline-size: 6.5rem;
    text-align: right;
  }

  .wishlist-saved-date {
    display: inline;
  }
}
</style>
