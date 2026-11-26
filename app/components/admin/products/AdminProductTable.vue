<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Product } from '~/types/product'
import { useCategories, CANONICAL_CATEGORIES } from '~/composables/useCategories'
import { formatRupiah } from '~/utils/format'

const props = withDefaults(
  defineProps<{
    products: Product[]
    loading: boolean
    isSearching?: boolean
    isTrash?: boolean
  }>(),
  {
    isSearching: false,
    isTrash: false,
  },
)

const emit = defineEmits<{
  edit: [product: Product]
  delete: [id: number]
  restore: [id: number]
  viewStockMovements: [product: Product]
  manageVariants: [product: Product]
  resetFilters: []
}>()

const { categories, fetchCategories } = useCategories()

onMounted(() => {
  if (categories.value.length === 0) {
    fetchCategories().catch(() => {})
  }
})

const categoryLookup = computed(() => {
  const source = categories.value.length > 0 ? categories.value : CANONICAL_CATEGORIES
  const map = new Map<string, string>()
  for (const cat of source) {
    map.set(cat.id, cat.name)
    map.set(cat.slug, cat.name)
    map.set(cat.name.toLowerCase(), cat.name)
  }
  return map
})

const resolveCategory = (product: Product): string => {
  if (!product.category_id) return 'Umum'
  return (
    categoryLookup.value.get(product.category_id) ||
    categoryLookup.value.get(product.category_id.toLowerCase()) ||
    'Umum'
  )
}

const getStockBadge = (stock: number) => {
  if (stock <= 0) {
    return { label: 'Habis', variant: 'danger' as const }
  }
  if (stock < 5) {
    return { label: `Stok: ${stock}`, variant: 'warning' as const }
  }
  return { label: `Stok: ${stock}`, variant: 'success' as const }
}
</script>

<template>
  <div class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-3 p-4" aria-busy="true">
      <UiSkeleton v-for="i in 6" :key="i" height="h-12" />
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="p-6">
      <UiEmptyState
        :icon="isSearching ? 'pi-search' : isTrash ? 'pi-trash' : 'pi-box'"
        :title="
          isSearching
            ? 'Tidak ada produk ditemukan'
            : isTrash
              ? 'Keranjang sampah kosong'
              : 'Belum ada produk'
        "
        :description="
          isSearching
            ? 'Ubah kata kunci pencarian atau reset filter untuk melihat produk lain.'
            : isTrash
              ? 'Belum ada produk yang dihapus. Data arsip akan muncul di sini.'
              : 'Tambahkan produk pertama untuk mengisi katalog toko.'
        "
        :action-label="isSearching ? 'Reset Filter' : ''"
        @action="emit('resetFilters')"
      />
    </div>

    <!-- Compact Table View -->
    <div
      v-else
      tabindex="0"
      role="region"
      aria-label="Tabel daftar produk admin"
      class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
    >
      <table class="w-full border-collapse text-left text-xs">
        <thead>
          <tr
            class="border-b border-brand-hair bg-brand-canvas-soft text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
          >
            <th scope="col" class="px-2.5 py-2.5 min-w-[190px]">Produk</th>
            <th scope="col" class="px-2.5 py-2.5 whitespace-nowrap">Kategori</th>
            <th scope="col" class="px-2.5 py-2.5 text-right whitespace-nowrap">Harga</th>
            <th scope="col" class="px-2.5 py-2.5 whitespace-nowrap">Stok &amp; Terjual</th>
            <th scope="col" class="px-2.5 py-2.5 text-center whitespace-nowrap">Rating</th>
            <th scope="col" class="px-2.5 py-2.5 text-right whitespace-nowrap">Aksi</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-brand-hairsoft text-brand-ink">
          <tr
            v-for="product in products"
            :key="product.id"
            class="transition-colors hover:bg-brand-canvas-soft/60"
            data-testid="admin-product-table-row"
          >
            <!-- Produk -->
            <td class="px-2.5 py-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  class="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-brand-hair bg-brand-canvas-soft flex items-center justify-center"
                >
                  <img
                    v-if="product.image_url"
                    :src="product.image_url"
                    :alt="product.name"
                    width="36"
                    height="36"
                    loading="lazy"
                    class="h-full w-full object-cover"
                  />
                  <i v-else class="pi pi-image text-xs text-brand-faint" aria-hidden="true" />
                </div>

                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5 min-w-0">
                    <NuxtLink
                      :to="`/product/${product.slug || product.id}`"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="truncate max-w-[165px] font-semibold text-brand-ink no-underline hover:text-brand-accent-text hover:underline"
                    >
                      {{ product.name }}
                    </NuxtLink>
                    <UiBadge v-if="product.is_featured" label="Unggulan" variant="info" />
                  </div>
                  <p class="m-0 mt-0.5 text-[11px] text-brand-muted truncate max-w-[180px]">
                    {{ product.sku ? `SKU: ${product.sku}` : `#${product.id}` }}
                  </p>
                </div>
              </div>
            </td>

            <!-- Kategori -->
            <td class="px-2.5 py-2 whitespace-nowrap">
              <span
                class="inline-flex items-center rounded-md border border-brand-hair bg-brand-canvas-soft px-2 py-0.5 text-[11px] font-medium text-brand-ink"
              >
                {{ resolveCategory(product) }}
              </span>
            </td>

            <!-- Harga -->
            <td class="px-2.5 py-2 text-right whitespace-nowrap">
              <span class="font-display font-bold text-brand-ink tabular-nums">
                {{ formatRupiah(product.price) }}
              </span>
            </td>

            <!-- Stok & Terjual -->
            <td class="px-2.5 py-2 whitespace-nowrap">
              <div class="flex items-center gap-1.5">
                <UiBadge
                  :label="getStockBadge(product.stock).label"
                  :variant="getStockBadge(product.stock).variant"
                />
                <span
                  v-if="product.sold_count && product.sold_count > 0"
                  class="text-[11px] text-brand-muted tabular-nums"
                >
                  {{ product.sold_count }} terjual
                </span>
              </div>
            </td>

            <!-- Rating -->
            <td class="px-2.5 py-2 text-center whitespace-nowrap">
              <span
                v-if="product.rating && product.rating > 0"
                class="inline-flex items-center gap-1 font-semibold tabular-nums text-brand-ink"
              >
                <i class="pi pi-star-fill text-[10px] text-brand-warning" aria-hidden="true" />
                <span>{{ Number(product.rating).toFixed(1) }}</span>
              </span>
              <span v-else class="text-brand-faint">-</span>
            </td>

            <!-- Aksi -->
            <td class="px-2.5 py-2 text-right whitespace-nowrap">
              <div class="inline-flex items-center justify-end gap-0.5">
                <template v-if="isTrash">
                  <UiButton
                    size="xs"
                    variant="outline"
                    icon="pi-replay"
                    @click="emit('restore', product.id)"
                  >
                    Restore
                  </UiButton>
                </template>
                <template v-else>
                  <UiTooltip text="Kelola Varian" position="top">
                    <UiIconButton
                      icon="pi-sitemap"
                      label="Kelola Varian Produk"
                      size="sm"
                      @click="emit('manageVariants', product)"
                    />
                  </UiTooltip>
                  <UiTooltip text="Riwayat Mutasi Stok" position="top">
                    <UiIconButton
                      icon="pi-history"
                      label="Riwayat Mutasi Stok"
                      size="sm"
                      @click="emit('viewStockMovements', product)"
                    />
                  </UiTooltip>
                  <UiTooltip text="Ubah Produk" position="top">
                    <UiIconButton
                      icon="pi-pencil"
                      label="Ubah Produk"
                      size="sm"
                      @click="emit('edit', product)"
                    />
                  </UiTooltip>
                  <UiTooltip text="Hapus Produk" position="top" align="end">
                    <UiIconButton
                      icon="pi-trash"
                      label="Hapus Produk"
                      variant="danger"
                      size="sm"
                      @click="emit('delete', product.id)"
                    />
                  </UiTooltip>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
