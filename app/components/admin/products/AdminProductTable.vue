<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Product } from '~/types/product'
import { useCategories, CANONICAL_CATEGORIES } from '~/composables/useCategories'
import { useClientTableSort } from '~/composables/useClientTableSort'
import { useClientPagination } from '~/composables/useClientPagination'
import UiPagination from '~/components/ui/UiPagination.vue'
import AdminProductRowActions from './AdminProductRowActions.vue'
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

const productColumns = [
  {
    key: 'name',
    label: 'Produk',
    ariaLabel: 'nama produk',
    thClass: 'min-w-[190px]',
    align: 'left' as const,
  },
  {
    key: 'category',
    label: 'Kategori',
    ariaLabel: 'kategori',
    thClass: 'whitespace-nowrap',
    align: 'left' as const,
  },
  {
    key: 'price',
    label: 'Harga',
    ariaLabel: 'harga',
    thClass: 'text-right whitespace-nowrap',
    align: 'right' as const,
  },
  {
    key: 'stock',
    label: 'Stok & Terjual',
    ariaLabel: 'stok produk',
    thClass: 'whitespace-nowrap',
    align: 'left' as const,
  },
  {
    key: 'rating',
    label: 'Rating',
    ariaLabel: 'rating produk',
    thClass: 'text-center whitespace-nowrap',
    align: 'center' as const,
  },
]

const {
  sortKey,
  sortDirection,
  sortedItems: sortedProducts,
  onSortChange,
  getAriaSort,
} = useClientTableSort(() => props.products, {
  name: (p) => p.name,
  category: (p) => resolveCategory(p),
  price: (p) => p.price_cents ?? p.price * 100,
  stock: (p) => p.stock,
  rating: (p) => p.rating ?? 0,
})

const {
  page,
  pageSize,
  totalCount,
  totalPages,
  paginatedItems: paginatedProducts,
} = useClientPagination(sortedProducts, 12)
</script>

<template>
  <div class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
    <div v-if="loading" class="space-y-3 p-4" aria-busy="true">
      <UiSkeleton v-for="i in 6" :key="i" height="h-12" />
    </div>

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
            <th
              v-for="col in productColumns"
              :key="col.key"
              scope="col"
              class="px-2.5 py-2.5"
              :class="col.thClass"
              :aria-sort="getAriaSort(col.key)"
            >
              <UiSortHeader
                :sort-key="col.key"
                :label="col.label"
                :align="col.align"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="onSortChange"
              >
                {{ col.label }}
              </UiSortHeader>
            </th>
            <th scope="col" class="px-2.5 py-2.5 text-right whitespace-nowrap">Aksi</th>
          </tr>
        </thead>

        <tbody class="divide-y divide-brand-hairsoft text-brand-ink">
          <tr
            v-for="product in paginatedProducts"
            :key="product.id"
            class="transition-colors hover:bg-brand-canvas-soft/60"
            data-testid="admin-product-table-row"
          >
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

            <td class="px-2.5 py-2 whitespace-nowrap">
              <span
                class="inline-flex items-center rounded-md border border-brand-hair bg-brand-canvas-soft px-2 py-0.5 text-[11px] font-medium text-brand-ink"
              >
                {{ resolveCategory(product) }}
              </span>
            </td>
            <td class="px-2.5 py-2 text-right whitespace-nowrap">
              <span class="font-display font-bold text-brand-ink tabular-nums">
                {{ formatRupiah(product.price) }}
              </span>
            </td>
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
            <td class="px-2.5 py-2 text-right whitespace-nowrap">
              <AdminProductRowActions
                :product="product"
                :is-trash="isTrash"
                @edit="emit('edit', $event)"
                @delete="emit('delete', $event)"
                @restore="emit('restore', $event)"
                @view-stock-movements="emit('viewStockMovements', $event)"
                @manage-variants="emit('manageVariants', $event)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiPagination
      v-if="!loading && products.length > 0"
      v-model="page"
      :total-pages="totalPages"
      :total-count="totalCount"
      :page-size="pageSize"
      :loading="loading"
      item-name="produk"
      compact
    />
  </div>
</template>
