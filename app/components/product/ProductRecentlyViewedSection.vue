<script setup lang="ts">
import { computed } from 'vue'
import { useRecentlyViewed } from '~/composables/useRecentlyViewed'
import { formatRupiah } from '~/utils/format'

const props = defineProps<{
  currentProductId?: string | number
}>()

const { recentlyViewed, clearRecentlyViewed, removeItem } = useRecentlyViewed()

const items = computed(() => {
  if (!props.currentProductId) return recentlyViewed.value
  const currentId = String(props.currentProductId)
  return recentlyViewed.value.filter((item) => String(item.id) !== currentId)
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
      <div
        v-for="item in items"
        :key="item.id"
        class="group relative bg-brand-canvas rounded-card border border-brand-hair/80 hover:border-brand-ink hover:shadow-whisper transition-all duration-200 overflow-hidden flex flex-col"
      >
        <NuxtLink
          :to="`/product/${item.slug || item.id}`"
          class="block flex-1 p-2.5 text-inherit no-underline"
        >
          <div
            class="aspect-square w-full rounded-field bg-brand-canvas-soft overflow-hidden mb-2 relative flex items-center justify-center border border-brand-hair/40"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <i v-else class="pi pi-image text-brand-muted text-base" aria-hidden="true" />

            <div
              v-if="item.stock <= 0"
              class="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center"
            >
              <span class="text-[10px] font-bold text-white bg-red-600/90 px-1.5 py-0.5 rounded">
                Habis
              </span>
            </div>
          </div>

          <div class="space-y-1">
            <span
              v-if="item.category"
              class="text-[9px] font-semibold text-brand-muted uppercase tracking-wider block truncate"
            >
              {{ item.category }}
            </span>
            <h4
              class="font-body text-xs font-semibold text-brand-ink line-clamp-2 leading-snug m-0 group-hover:text-brand-accent transition-colors"
            >
              {{ item.name }}
            </h4>
            <div class="text-xs font-bold text-brand-ink tabular pt-0.5">
              {{ formatRupiah(item.price) }}
            </div>
          </div>
        </NuxtLink>

        <!-- Quick Remove One Item -->
        <button
          type="button"
          aria-label="Hapus dari daftar dilihat"
          class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/80 hover:bg-white text-brand-muted hover:text-brand-danger shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-0"
          @click.stop.prevent="removeItem(item.id)"
        >
          <i class="pi pi-times text-[9px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>
