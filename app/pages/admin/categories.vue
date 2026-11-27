<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminCategoryMetrics from '~/components/admin/categories/AdminCategoryMetrics.vue'
import AdminCategoryTable from '~/components/admin/categories/AdminCategoryTable.vue'
import AdminCategoryManagerModal from '~/components/admin/products/AdminCategoryManagerModal.vue'
import { useCategories } from '~/composables/useCategories'

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
      <div v-if="searchQuery.trim()" class="flex items-center gap-2">
        <span
          class="inline-flex items-center rounded-full border border-brand-hair bg-brand-canvas-soft px-2.5 py-1 text-[11px] font-medium text-brand-muted tabular"
        >
          Filter: {{ filteredCategories.length }} dari {{ categories.length }} kategori
        </span>
        <UiButton variant="ghost" size="xs" @click="searchQuery = ''">Reset</UiButton>
      </div>
    </div>

    <!-- Category Table Card -->
    <AdminCategoryTable
      :categories="filteredCategories"
      :category-counts="categoryCounts"
      :pending="pending"
      @edit="isModalOpen = true"
    />

    <!-- Category Manager Modal -->
    <AdminCategoryManagerModal
      :show="isModalOpen"
      @close="isModalOpen = false"
      @updated="handleCategoriesUpdated"
    />
  </div>
</template>
