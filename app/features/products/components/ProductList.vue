<script setup lang="ts">
import type { Product } from '~/types/product'

defineProps<{
  products: Product[]
  loading: boolean
  isSearching?: boolean
  isTrash?: boolean
  /** Mode etalase publik: sembunyikan tombol edit/hapus, kartu klik ke detail. */
  hideActions?: boolean
  /** Kepadatan grid: compact (4 kolom) atau spacious (3 kolom) */
  density?: 'compact' | 'spacious'
}>()

const emit = defineEmits<{
  edit: [product: Product]
  delete: [id: number]
  restore: [id: number]
}>()

const router = useRouter()

const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <div>
    <!-- Loading State: Modernist Skeletal Grid -->
    <div
      v-if="loading"
      :class="[
        'grid gap-6',
        density === 'spacious'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      ]"
    >
      <div
        v-for="i in 8"
        :key="i"
        class="flex flex-col bg-brand-canvas border border-brand-hairsoft rounded-card p-4 overflow-hidden animate-pulse"
      >
        <div class="aspect-square w-full bg-brand-field rounded-media mb-4" />
        <div class="space-y-2 flex-1">
          <div class="h-3 w-1/3 bg-brand-field rounded-full" />
          <div class="h-5 w-4/5 bg-brand-field rounded-full" />
          <div class="h-3 w-full bg-brand-field rounded-full" />
          <div class="h-3 w-2/3 bg-brand-field rounded-full" />
        </div>
        <div class="mt-4 pt-3 border-t border-brand-hairsoft flex items-center justify-between">
          <div class="h-5 w-24 bg-brand-field rounded-full" />
          <div class="h-8 w-24 bg-brand-field rounded-full" />
        </div>
      </div>
    </div>

    <!-- Empty State: Modernist Composed Empty View -->
    <div
      v-else-if="products.length === 0"
      class="flex flex-col items-center justify-center py-20 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card text-center my-6"
    >
      <template v-if="isSearching">
        <div
          class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mb-4 text-brand-muted shadow-whisper"
        >
          <i class="pi pi-search text-xl" />
        </div>
        <h3 class="font-display m-0 mb-2 text-lg font-bold text-brand-ink">Tidak ada produk</h3>
        <p class="font-body m-0 text-sm text-brand-muted max-w-md leading-relaxed">
          Belum ada produk aktif yang ditemukan dengan kata kunci pencarian Anda. Coba periksa
          kembali ejaan atau gunakan istilah lain.
        </p>
      </template>

      <template v-else-if="isTrash">
        <div
          class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mb-4 text-brand-muted shadow-whisper"
        >
          <i class="pi pi-trash text-xl" />
        </div>
        <h3 class="font-display m-0 mb-2 text-lg font-bold text-brand-ink">
          Keranjang Sampah Kosong
        </h3>
        <p class="font-body m-0 text-sm text-brand-muted max-w-md leading-relaxed">
          Tidak ada produk yang dihapus saat ini. Semua data tersimpan dengan aman di database.
        </p>
      </template>

      <template v-else>
        <div
          class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mb-4 text-brand-muted shadow-whisper"
        >
          <i class="pi pi-box text-xl" />
        </div>
        <h3 class="font-display m-0 mb-2 text-lg font-bold text-brand-ink">Tidak ada hasil</h3>
        <p class="font-body m-0 text-sm text-brand-muted max-w-md leading-relaxed">
          Belum ada produk dalam katalog. Anda dapat mulai menambahkan item baru melalui dashboard
          manajemen katalog.
        </p>
      </template>
    </div>

    <!-- Product Grid: Modernist Product Cards -->
    <div
      v-else
      :class="[
        'grid gap-6',
        density === 'spacious'
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      ]"
    >
      <article
        v-for="product in products"
        :key="product.id"
        class="product-card group flex flex-col bg-brand-canvas border border-brand-hairsoft rounded-card overflow-hidden transition-all duration-300 hover:border-brand-hair hover:shadow-floating cursor-pointer"
        @click="router.push(`/product/${product.id}`)"
      >
        <!-- Media Container -->
        <div
          class="relative aspect-square w-full bg-brand-field overflow-hidden flex items-center justify-center p-3 border-b border-brand-hairsoft"
        >
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name"
            loading="lazy"
            class="w-full h-full object-cover rounded-media transition-transform duration-500 group-hover:scale-105"
          />
          <div
            v-else
            class="flex items-center justify-center w-full h-full text-brand-faint bg-brand-canvas-soft rounded-media"
          >
            <i class="pi pi-image text-3xl" />
          </div>

          <!-- Modernist Floating Badges -->
          <div class="absolute top-4 left-4 flex flex-col gap-1.5 items-start pointer-events-none">
            <span
              class="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-brand-ink/85 text-brand-onink backdrop-blur-sm shadow-whisper"
            >
              Pilihan Kurator
            </span>
          </div>

          <!-- Quick view indicator bottom right -->
          <div
            class="absolute bottom-3 right-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span
              class="inline-flex items-center gap-1 bg-brand-canvas/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-brand-ink shadow-whisper"
            >
              <span>Detail</span>
              <i class="pi pi-arrow-right text-[10px]" />
            </span>
          </div>
        </div>

        <!-- Content Body -->
        <div class="p-5 flex flex-col flex-1 justify-between gap-3">
          <div>
            <div class="flex items-center justify-between text-xs text-brand-muted mb-1">
              <span class="font-medium text-[11px] text-brand-muted tracking-tight"
                >Katalog #{{ product.id }}</span
              >
              <span class="text-brand-success font-medium flex items-center gap-1.5 text-[11px]">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-success" />
                Tersedia
              </span>
            </div>

            <h3
              class="font-display m-0 text-base sm:text-lg font-bold text-brand-ink line-clamp-1 group-hover:text-brand-accent transition-colors"
              :title="product.name"
            >
              {{ product.name }}
            </h3>

            <p class="font-body m-0 mt-1.5 text-xs text-brand-muted line-clamp-2 leading-relaxed">
              {{
                product.description || 'Deskripsi kurasi produk esensial untuk kebutuhan modern.'
              }}
            </p>
          </div>

          <!-- Price & Action Section -->
          <div
            class="mt-2 pt-3 border-t border-brand-hairsoft flex items-center justify-between gap-2"
            @click.stop
          >
            <div>
              <span class="text-[11px] font-medium text-brand-muted block"> Harga </span>
              <span class="text-base sm:text-lg font-bold tracking-tight text-brand-ink">
                {{ formatRupiah(product.price) }}
              </span>
            </div>

            <!-- Public View Action -->
            <NuxtLink
              v-if="hideActions"
              :to="`/product/${product.id}`"
              class="inline-flex items-center gap-1 h-8 px-3.5 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-ink text-xs font-semibold no-underline transition-colors shadow-whisper"
            >
              <span>Detail</span>
              <i class="pi pi-arrow-right text-[10px]" />
            </NuxtLink>

            <!-- Admin Actions -->
            <div v-else class="flex items-center gap-1">
              <template v-if="isTrash">
                <button
                  type="button"
                  class="h-8 px-3 rounded-full bg-brand-canvas-soft hover:bg-brand-success hover:text-white text-brand-ink text-xs font-semibold transition-colors flex items-center gap-1"
                  @click="emit('restore', product.id)"
                >
                  <i class="pi pi-refresh text-xs" />
                  <span>Restore</span>
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="w-8 h-8 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-muted transition-colors flex items-center justify-center"
                  title="Ubah Produk"
                  @click="emit('edit', product)"
                >
                  <i class="pi pi-pencil text-xs" />
                </button>
                <button
                  type="button"
                  class="w-8 h-8 rounded-full bg-brand-canvas-soft hover:bg-red-600 hover:text-white text-brand-muted transition-colors flex items-center justify-center"
                  title="Hapus Produk"
                  @click="emit('delete', product.id)"
                >
                  <i class="pi pi-trash text-xs" />
                </button>
              </template>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
