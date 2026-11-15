<script setup lang="ts">
import { computed } from 'vue'
import { formatRupiah } from '~/utils/format'
import type { InstantSearchProduct, InstantSearchCategory } from '~~/shared/types/search'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    isLoading: boolean
    errorMessage: string | null
    query: string
    products: InstantSearchProduct[]
    categories: InstantSearchCategory[]
    activeIndex: number
    recentSearches?: string[]
    popularTags?: readonly string[]
  }>(),
  {
    recentSearches: () => [],
    popularTags: () => [],
  },
)

const emit = defineEmits<{
  selectCategory: [category: InstantSearchCategory]
  selectProduct: [product: InstantSearchProduct]
  submitSearch: [query: string]
  selectTag: [tag: string]
  removeRecent: [term: string]
  clearRecent: []
  retry: []
  close: []
}>()

const getCategoryIndex = (idx: number) => idx
const getProductIndex = (idx: number) => props.categories.length + idx
const getFooterIndex = () => props.categories.length + props.products.length
const isQueryEmpty = computed(() => props.query.trim().length < 2)
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="transform scale-95 opacity-0 -translate-y-1"
    enter-to-class="transform scale-100 opacity-100 translate-y-0"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="transform scale-100 opacity-100 translate-y-0"
    leave-to-class="transform scale-95 opacity-0 -translate-y-1"
  >
    <div
      v-if="isOpen"
      id="instant-search-popover"
      role="listbox"
      aria-label="Saran pencarian langsung"
      :aria-busy="isLoading ? 'true' : undefined"
      class="absolute left-0 right-0 top-full mt-2 bg-brand-canvas border border-brand-hair rounded-card shadow-floating overflow-hidden z-50 text-left"
    >
      <!-- State 0: Discovery Mode (Recent & Popular Searches saat query < 2 karakter) -->
      <div v-if="isQueryEmpty" class="p-3 space-y-4">
        <!-- Pencarian Terakhir -->
        <div v-if="recentSearches.length > 0">
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-[10px] font-semibold text-brand-muted tracking-wider uppercase flex items-center gap-1.5"
            >
              <i class="pi pi-history text-xs text-brand-muted" aria-hidden="true" />
              <span>Pencarian Terakhir</span>
            </span>
            <button
              type="button"
              class="text-[11px] text-brand-muted hover:text-brand-danger transition-colors cursor-pointer bg-transparent border-0 p-0"
              @click.stop="emit('clearRecent')"
            >
              Hapus Semua
            </button>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <div
              v-for="term in recentSearches"
              :key="term"
              class="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium rounded-full bg-brand-canvas-soft border border-brand-hair text-brand-ink group hover:border-brand-ink transition-colors"
            >
              <button
                type="button"
                class="hover:underline cursor-pointer bg-transparent border-0 p-0 text-left text-brand-ink"
                @click="emit('selectTag', term)"
              >
                {{ term }}
              </button>
              <button
                type="button"
                aria-label="Hapus pencarian ini"
                class="w-4 h-4 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-danger hover:bg-brand-hair/60 transition-colors cursor-pointer bg-transparent border-0 p-0 ml-0.5"
                @click.stop="emit('removeRecent', term)"
              >
                <i class="pi pi-times text-[9px]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <!-- Pencarian Populer -->
        <div v-if="popularTags.length > 0">
          <div
            class="text-[10px] font-semibold text-brand-muted tracking-wider uppercase mb-2 flex items-center gap-1.5"
          >
            <i class="pi pi-bolt text-xs text-brand-accent" aria-hidden="true" />
            <span>Pencarian Populer</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tag in popularTags"
              :key="tag"
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-brand-canvas-soft hover:bg-brand-hair border border-brand-hair text-brand-ink transition-colors cursor-pointer"
              @click="emit('selectTag', tag)"
            >
              <i class="pi pi-search text-[9px] text-brand-muted" aria-hidden="true" />
              <span>{{ tag }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- State 1: Loading Skeleton -->
      <div v-else-if="isLoading" class="p-3 space-y-3">
        <div class="flex items-center gap-2">
          <div class="h-3 w-16 bg-brand-hair/60 rounded animate-pulse" />
          <div class="h-6 w-20 bg-brand-canvas-soft rounded-full animate-pulse" />
          <div class="h-6 w-24 bg-brand-canvas-soft rounded-full animate-pulse" />
        </div>
        <div class="space-y-2 pt-1 border-t border-brand-hair/40">
          <div v-for="n in 3" :key="n" class="flex items-center gap-3 p-1.5 rounded-field">
            <div class="w-10 h-10 bg-brand-canvas-soft rounded-field shrink-0 animate-pulse" />
            <div class="flex-1 space-y-1.5">
              <div class="h-3.5 bg-brand-hair/60 rounded w-3/4 animate-pulse" />
              <div class="h-3 bg-brand-canvas-soft rounded w-1/3 animate-pulse" />
            </div>
            <div class="h-3.5 bg-brand-hair/50 rounded w-16 animate-pulse" />
          </div>
        </div>
      </div>

      <!-- State 2: Error State -->
      <div v-else-if="errorMessage" class="p-4 text-center space-y-2">
        <p class="text-xs text-brand-danger font-medium">{{ errorMessage }}</p>
        <button
          type="button"
          class="text-xs text-brand-ink font-semibold underline hover:text-brand-accent transition-colors cursor-pointer"
          @click="emit('retry')"
        >
          Coba lagi
        </button>
      </div>

      <!-- State 3: Empty State -->
      <div
        v-else-if="products.length === 0 && categories.length === 0"
        class="p-5 text-center space-y-2"
      >
        <div
          class="w-8 h-8 mx-auto rounded-full bg-brand-canvas-soft flex items-center justify-center text-brand-muted"
        >
          <i class="pi pi-search text-xs" aria-hidden="true" />
        </div>
        <div>
          <p class="text-xs font-semibold text-brand-ink">Tidak ada produk untuk "{{ query }}"</p>
          <p class="text-[11px] text-brand-muted mt-0.5">
            Coba periksa kata kunci atau telusuri katalog utama.
          </p>
        </div>
        <div class="pt-1">
          <NuxtLink
            to="/katalog"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-ink bg-brand-canvas-soft hover:bg-brand-hair rounded-full transition-colors cursor-pointer"
            @click="emit('close')"
          >
            <span>Buka Katalog Lengkap</span>
            <i class="pi pi-arrow-right text-[10px]" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>

      <!-- State 4: Success State (Categories + Products + Footer) -->
      <div v-else class="py-2">
        <!-- Section: Kategori Terkait -->
        <div v-if="categories.length > 0" class="px-3 pb-2 pt-1 border-b border-brand-hair/40">
          <div class="text-[10px] font-semibold text-brand-muted tracking-wider uppercase mb-1.5">
            Kategori
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="(cat, idx) in categories"
              :id="`search-option-${getCategoryIndex(idx)}`"
              :key="cat.slug"
              type="button"
              role="option"
              :aria-selected="activeIndex === getCategoryIndex(idx)"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer"
              :class="
                activeIndex === getCategoryIndex(idx)
                  ? 'bg-brand-ink text-white border-brand-ink shadow-whisper'
                  : 'bg-brand-canvas-soft text-brand-ink border-brand-hair hover:border-brand-ink'
              "
              @click="emit('selectCategory', cat)"
            >
              <i class="pi pi-tag text-[9px]" aria-hidden="true" />
              <span>{{ cat.name }}</span>
            </button>
          </div>
        </div>

        <!-- Section: Produk Terkait -->
        <div v-if="products.length > 0" class="px-1.5 pt-1.5">
          <div
            class="px-2 text-[10px] font-semibold text-brand-muted tracking-wider uppercase mb-1"
          >
            Produk Terkait
          </div>
          <div class="space-y-0.5">
            <button
              v-for="(prod, idx) in products"
              :id="`search-option-${getProductIndex(idx)}`"
              :key="prod.id"
              type="button"
              role="option"
              :aria-selected="activeIndex === getProductIndex(idx)"
              class="w-full flex items-center justify-between gap-3 px-2 py-1.5 rounded-field text-left transition-colors cursor-pointer border-0"
              :class="
                activeIndex === getProductIndex(idx)
                  ? 'bg-brand-canvas-soft ring-1 ring-brand-hair'
                  : 'hover:bg-brand-canvas-soft/70'
              "
              @click="emit('selectProduct', prod)"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  class="w-9 h-9 rounded-field bg-brand-canvas-soft border border-brand-hair shrink-0 overflow-hidden flex items-center justify-center"
                >
                  <img
                    v-if="prod.image_url"
                    :src="prod.image_url"
                    :alt="prod.name"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <i v-else class="pi pi-image text-brand-muted text-xs" aria-hidden="true" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-brand-ink truncate">
                    {{ prod.name }}
                  </p>
                  <p class="text-[10px] text-brand-muted truncate">
                    {{ prod.category || 'ShelfStack' }}
                  </p>
                </div>
              </div>

              <div class="shrink-0 text-right">
                <span class="text-xs font-bold text-brand-ink tabular">
                  {{ formatRupiah(prod.price) }}
                </span>
                <div v-if="prod.stock <= 0" class="text-[10px] text-brand-danger font-medium">
                  Habis
                </div>
                <div v-else-if="prod.stock < 5" class="text-[10px] text-brand-warning font-medium">
                  Sisa {{ prod.stock }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Section: Footer CTA "Lihat Semua Hasil" -->
        <div class="mt-1 pt-1 border-t border-brand-hair/60 px-1.5">
          <button
            :id="`search-option-${getFooterIndex()}`"
            type="button"
            role="option"
            :aria-selected="activeIndex === getFooterIndex()"
            class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-field transition-colors cursor-pointer text-brand-ink"
            :class="
              activeIndex === getFooterIndex()
                ? 'bg-brand-canvas-soft text-brand-accent'
                : 'hover:bg-brand-canvas-soft'
            "
            @click="emit('submitSearch', query)"
          >
            <span>Lihat semua hasil untuk "{{ query }}"</span>
            <i class="pi pi-arrow-right text-[10px] text-brand-muted" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
