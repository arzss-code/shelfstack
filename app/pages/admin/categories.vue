<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminCategoryMetrics from '~/components/admin/categories/AdminCategoryMetrics.vue'
import AdminCategoryManagerModal from '~/components/admin/products/AdminCategoryManagerModal.vue'
import { useCategories } from '~/composables/useCategories'
import { useClientTableSort } from '~/composables/useClientTableSort'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Kelola Kategori - ShelfStack Admin',
  description: 'Kelola hierarki taksonomi, urutan etalase, dan arsip kategori produk ShelfStack.',
})

const { categories, pending, fetchCategories } = useCategories()
const isModalOpen = ref(false)
const searchQuery = ref('')
const categoryCounts = ref<Record<string, number>>({})
const loadingCounts = ref(false)

const loadCategoryProductCounts = async () => {
  loadingCounts.value = true
  try {
    const res = await $fetch<{ facets?: { categoryCounts?: Record<string, number> } }>(
      '/api/products?limit=1',
    )
    if (res?.facets?.categoryCounts) {
      categoryCounts.value = res.facets.categoryCounts
    }
  } catch {
    categoryCounts.value = {}
  } finally {
    loadingCounts.value = false
  }
}

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter(
    (cat) => cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q),
  )
})

const totalProductsAcrossCategories = computed(() => {
  return Object.values(categoryCounts.value).reduce((acc, count) => acc + count, 0)
})

const categoryColumns = [
  {
    key: 'order',
    label: 'Urutan',
    ariaLabel: 'urutan',
    thClass: 'text-center w-20',
    align: 'center' as const,
  },
  {
    key: 'name',
    label: 'Nama Kategori & Slug',
    ariaLabel: 'nama kategori',
    thClass: '',
    align: 'left' as const,
  },
  {
    key: 'description',
    label: 'Deskripsi',
    ariaLabel: 'deskripsi',
    thClass: '',
    align: 'left' as const,
  },
  {
    key: 'count',
    label: 'Produk Aktif',
    ariaLabel: 'produk aktif',
    thClass: 'text-center w-32',
    align: 'center' as const,
  },
]

const {
  sortKey,
  sortDirection,
  sortedItems: sortedCategories,
  onSortChange,
  getAriaSort,
} = useClientTableSort(filteredCategories, {
  order: (cat) => cat.display_order ?? Number.MAX_SAFE_INTEGER,
  name: (cat) => cat.name,
  description: (cat) => cat.description || '',
  count: (cat) => categoryCounts.value[cat.id] ?? 0,
})

const handleCategoriesUpdated = async () => {
  await fetchCategories()
  await loadCategoryProductCounts()
}

onMounted(() => {
  fetchCategories()
  loadCategoryProductCounts()
})
</script>

<template>
  <div class="admin-categories-page space-y-5">
    <AdminPageHeader
      title="Kategori Produk"
      subtitle="Atur urutan tampilan, deskripsi, dan pengelompokan produk."
      :breadcrumbs="[{ label: 'Dashboard', to: '/admin' }, { label: 'Kategori' }]"
    >
      <template #actions>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="pending || loadingCounts"
          @click="handleCategoriesUpdated"
        >
          Muat Ulang
        </UiButton>
        <UiButton
          href="/katalog"
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          size="sm"
          icon="pi-external-link"
        >
          Buka Etalase
        </UiButton>
        <UiButton variant="primary" size="sm" icon="pi-plus" @click="isModalOpen = true">
          Atur Kategori
        </UiButton>
      </template>
    </AdminPageHeader>

    <AdminCategoryMetrics
      :category-count="categories.length"
      :total-products="totalProductsAcrossCategories"
      :average-per-category="
        categories.length > 0 ? (totalProductsAcrossCategories / categories.length).toFixed(1) : '0'
      "
    />

    <!-- Search & Filter Controls -->
    <div
      class="flex flex-col items-stretch justify-between gap-3 rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper sm:flex-row sm:items-center"
    >
      <div class="w-full sm:w-80">
        <label for="admin-categories-search" class="sr-only">Cari kategori atau slug</label>
        <UiInput
          id="admin-categories-search"
          v-model="searchQuery"
          size="sm"
          type="search"
          placeholder="Cari kategori atau slug..."
          left-icon="pi-search"
        />
      </div>
      <div class="text-xs text-brand-muted">
        Menampilkan
        <span class="font-semibold text-brand-ink tabular-nums">{{
          filteredCategories.length
        }}</span>
        dari {{ categories.length }} kategori
      </div>
    </div>

    <!-- Category Table Card -->
    <div
      class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper"
    >
      <div
        tabindex="0"
        role="region"
        aria-label="Tabel daftar kategori katalog"
        class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
      >
        <table class="w-full border-collapse text-left text-xs">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas-soft text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
            >
              <th
                v-for="col in categoryColumns"
                :key="col.key"
                scope="col"
                class="py-2.5 px-3.5"
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
              <th scope="col" class="py-2.5 px-3.5 text-right w-44">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr
              v-for="cat in sortedCategories"
              :key="cat.id"
              class="transition-colors hover:bg-brand-canvas-soft/40"
            >
              <td class="py-2.5 px-3.5 text-center font-mono font-medium text-brand-muted">
                {{ cat.display_order ?? '-' }}
              </td>
              <td class="py-2.5 px-3.5">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-brand-ink text-xs sm:text-sm">{{
                    cat.name
                  }}</span>
                  <span
                    class="rounded-md bg-brand-canvas-soft px-1.5 py-0.5 font-mono text-[11px] text-brand-muted border border-brand-hair"
                  >
                    /c/{{ cat.slug }}
                  </span>
                </div>
              </td>
              <td class="py-2.5 px-3.5 text-brand-muted max-w-xs truncate">
                {{ cat.description || '-' }}
              </td>
              <td class="py-2.5 px-3.5 text-center">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs bg-brand-success-tint text-brand-success-text"
                >
                  <i class="pi pi-box text-[10px]" aria-hidden="true" />
                  {{ categoryCounts[cat.id] ?? 0 }}
                </span>
              </td>
              <td class="py-2.5 px-3.5 text-right">
                <div class="flex items-center justify-end gap-2">
                  <a
                    :href="`/katalog?category=${cat.slug}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Lihat kategori di etalase"
                    title="Lihat di Etalase"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand-hair text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft transition-colors no-underline"
                  >
                    <i class="pi pi-eye text-[11px]" aria-hidden="true" />
                  </a>
                  <UiButton
                    size="xs"
                    variant="outline"
                    icon="pi-pencil"
                    @click="isModalOpen = true"
                  >
                    Ubah
                  </UiButton>
                </div>
              </td>
            </tr>

            <tr v-if="filteredCategories.length === 0 && !pending">
              <td colspan="5" class="py-8 text-center text-brand-muted">
                <div class="flex flex-col items-center justify-center gap-2">
                  <i class="pi pi-folder-open text-2xl text-brand-faint" />
                  <p class="text-xs">Tidak ada kategori yang cocok dengan pencarian.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Category Manager Modal -->
    <AdminCategoryManagerModal
      :show="isModalOpen"
      @close="isModalOpen = false"
      @updated="handleCategoriesUpdated"
    />
  </div>
</template>
