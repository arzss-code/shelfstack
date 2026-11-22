<script setup lang="ts">
import { computed } from 'vue'
import { useRecentlyViewed, type RecentlyViewedItem } from '~/composables/useRecentlyViewed'
import ProductCard from '~/features/products/components/ProductCard.vue'
import type { Product } from '~/types/product'

const props = defineProps<{
  currentProductId?: string | number
}>()

const { recentlyViewed, clearRecentlyViewed, removeItem } = useRecentlyViewed()

const items = computed(() => {
  if (!props.currentProductId) return recentlyViewed.value
  const currentId = String(props.currentProductId)
  return recentlyViewed.value.filter((item) => String(item.id) !== currentId)
})

const mapToProduct = (item: RecentlyViewedItem): Product => ({
  id: typeof item.id === 'number' ? item.id : Number.parseInt(String(item.id), 10) || 0,
  name: item.name,
  slug: item.slug ?? null,
  price: item.price,
  stock: item.stock ?? 10,
  image_url: item.imageUrl || null,
  category_id: item.category ?? null,
  rating: item.rating ?? 5.0,
})
</script>

<template>
  <section
    v-if="items.length > 0"
    aria-label="Produk Terakhir Dilihat"
    class="pt-8 border-t border-brand-hair/60"
  >
    <div class="flex items-center justify-between gap-4 mb-4">
      <div class="flex items-center gap-2">
        <div
          class="w-7 h-7 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-ink"
        >
          <i class="pi pi-history text-xs" aria-hidden="true" />
        </div>
        <div>
          <h3 class="font-display text-sm sm:text-base font-bold text-brand-ink m-0">
            Terakhir Dilihat
          </h3>
          <p class="font-body text-[11px] text-brand-muted m-0 hidden sm:block">
            Jejak produk yang baru saja Anda jelajahi di ShelfStack.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="text-xs text-brand-muted hover:text-brand-danger transition-colors cursor-pointer bg-transparent border-0 p-1 flex items-center gap-1"
        @click="clearRecentlyViewed"
      >
        <i class="pi pi-trash text-[11px]" aria-hidden="true" />
        <span>Hapus Riwayat</span>
      </button>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
      <div v-for="item in items" :key="item.id" class="group/recent relative flex flex-col h-full">
        <ProductCard :product="mapToProduct(item)" :hide-actions="true" class="h-full flex-1" />

        <!-- Quick Remove One Item from History -->
        <button
          type="button"
          aria-label="Hapus dari riwayat terakhir dilihat"
          class="absolute top-2.5 left-2.5 z-20 w-7 h-7 rounded-full bg-brand-canvas/90 hover:bg-rose-50 text-brand-muted hover:text-rose-600 border border-brand-hair hover:border-rose-200 shadow-whisper flex items-center justify-center opacity-0 group-hover/recent:opacity-100 transition-all cursor-pointer backdrop-blur-xs"
          @click.stop.prevent="removeItem(item.id)"
        >
          <i class="pi pi-times text-[10px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>
