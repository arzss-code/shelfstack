<script setup lang="ts">
import { ref, watch } from 'vue'

export interface ProductPickerItem {
  id: number
  title: string
  price_cents: number
  image_url?: string | null
}

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectProduct: [product: ProductPickerItem]
  close: []
}>()

const products = ref<ProductPickerItem[]>([])
const searchQuery = ref('')
const isLoading = ref(false)

interface RawProductResponseItem {
  id: number | string
  name?: string
  title?: string
  price_cents?: number
  image_url?: string | null
  images?: string[]
}

const searchProducts = async (query = '') => {
  isLoading.value = true
  try {
    const res = await $fetch<{
      status: string
      data?: { products: RawProductResponseItem[] } | RawProductResponseItem[]
    }>('/api/products', { query: { q: query.trim() || undefined, limit: 15 } })
    let rawList: RawProductResponseItem[] = []
    if (Array.isArray(res)) rawList = res
    else if (res?.data) rawList = Array.isArray(res.data) ? res.data : res.data.products || []

    products.value = rawList.map((p) => ({
      id: Number(p.id),
      title: p.name || p.title || 'Produk ShelfStack',
      price_cents: Number(p.price_cents || 0),
      image_url: p.image_url || p.images?.[0] || null,
    }))
  } catch {
    products.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && products.value.length === 0) searchProducts()
  },
)

const formatRupiah = (cents: number): string => {
  return `Rp ${Math.round(cents / 100).toLocaleString('id-ID')}`
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click="emit('close')"
  >
    <div
      class="w-full max-w-md rounded-card border border-brand-hair bg-white p-4 shadow-floating"
      @click.stop
    >
      <div class="flex items-center justify-between pb-3 border-b border-brand-hair">
        <div class="flex items-center gap-2">
          <i class="pi pi-box text-brand-accent text-sm" />
          <h3 class="text-sm font-bold text-brand-ink m-0">Pilih Produk untuk Dilampirkan</h3>
        </div>
        <button
          type="button"
          class="text-brand-muted hover:text-brand-ink text-xs p-1"
          aria-label="Tutup pemilih produk"
          @click="emit('close')"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <!-- Search Bar -->
      <div class="relative mt-3 mb-2">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama produk..."
          class="w-full rounded-field border border-brand-hair bg-brand-canvas-soft pl-8 pr-3 py-1.5 text-xs text-brand-ink placeholder:text-brand-faint focus:border-brand-ink focus:bg-white focus:outline-none transition-colors"
          @input="searchProducts(searchQuery)"
        />
      </div>

      <!-- Products List -->
      <div class="max-h-72 overflow-y-auto space-y-2 pr-1">
        <div
          v-if="isLoading"
          class="p-6 text-center text-xs text-brand-muted flex flex-col items-center gap-2"
        >
          <i class="pi pi-spin pi-spinner text-base text-brand-accent" />
          <span>Mencari produk katalog...</span>
        </div>

        <div v-else-if="products.length === 0" class="p-6 text-center text-xs text-brand-muted">
          Tidak ada produk yang cocok dengan pencarian.
        </div>

        <button
          v-for="prod in products"
          v-else
          :key="prod.id"
          type="button"
          class="w-full rounded-field border border-brand-hair p-2 text-left transition-colors hover:border-brand-ink hover:bg-brand-canvas-soft flex items-center gap-3 group"
          @click="emit('selectProduct', prod)"
        >
          <div
            class="h-10 w-10 shrink-0 rounded border border-brand-hair bg-brand-canvas-soft overflow-hidden flex items-center justify-center"
          >
            <img
              v-if="prod.image_url"
              :src="prod.image_url"
              :alt="prod.title"
              class="h-full w-full object-cover"
            />
            <i v-else class="pi pi-box text-xs text-brand-muted" />
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-xs font-semibold text-brand-ink truncate group-hover:text-brand-accent transition-colors m-0"
            >
              {{ prod.title }}
            </p>
            <p class="text-[11px] font-bold text-brand-ink mt-0.5 m-0">
              {{ formatRupiah(prod.price_cents) }}
            </p>
          </div>
          <span class="text-[11px] font-medium text-brand-accent shrink-0">Pilih</span>
        </button>
      </div>
    </div>
  </div>
</template>
