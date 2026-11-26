<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
  <div class="admin-categories-page space-y-6">
    <!-- Header Section -->
    <div
      class="flex flex-col justify-between gap-4 border-b border-brand-hair pb-4 sm:flex-row sm:items-center"
    >
      <div>
        <div class="mb-1 flex items-center gap-2 text-xs text-brand-muted">
          <NuxtLink to="/admin" class="no-underline hover:text-brand-ink"> Dashboard </NuxtLink>
          <span class="text-brand-faint">/</span>
          <span class="font-semibold text-brand-ink">Kelola Kategori</span>
        </div>
        <h1 class="font-display text-2xl font-bold tracking-tight text-brand-ink sm:text-3xl">
          Kelola Kategori Katalog
        </h1>
        <p class="mt-0.5 text-xs text-brand-muted sm:text-sm">
          Atur struktur taksonomi, urutan tampilan etalase, dan arsip kategori produk.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <NuxtLink
          to="/katalog"
          target="_blank"
          class="inline-flex items-center gap-1.5 rounded-full border border-brand-hair bg-brand-canvas px-3.5 py-1.5 text-xs font-medium text-brand-ink no-underline transition-colors hover:bg-brand-canvas-soft"
        >
          <i class="pi pi-external-link text-xs" />
          <span>Buka Etalase</span>
        </NuxtLink>
        <UiButton variant="primary" size="sm" icon="pi-plus" @click="isModalOpen = true">
          Kelola & Tambah Kategori
        </UiButton>
      </div>
    </div>

    <!-- Executive Metrics Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-brand-muted uppercase tracking-wider">
            Total Kategori
          </span>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent-tint text-brand-accent-text"
          >
            <i class="pi pi-tags text-sm" />
          </span>
        </div>
        <div class="mt-2 text-2xl font-bold text-brand-ink">
          {{ categories.length }}
        </div>
        <p class="mt-1 text-xs text-brand-muted">Kategori aktif pada storefront</p>
      </div>

      <div class="rounded-2xl border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-brand-muted uppercase tracking-wider">
            Total Produk Terkatalog
          </span>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-success-tint text-brand-success-text"
          >
            <i class="pi pi-box text-sm" />
          </span>
        </div>
        <div class="mt-2 text-2xl font-bold text-brand-ink">
          {{ totalProductsAcrossCategories }}
        </div>
        <p class="mt-1 text-xs text-brand-muted">Total inventaris aktif terdistribusi</p>
      </div>

      <div class="rounded-2xl border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-brand-muted uppercase tracking-wider">
            Rata-rata Produk/Kategori
          </span>
          <span
            class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent-tint text-brand-accent-text"
          >
            <i class="pi pi-chart-pie text-sm" />
          </span>
        </div>
        <div class="mt-2 text-2xl font-bold text-brand-ink">
          {{
            categories.length > 0
              ? (totalProductsAcrossCategories / categories.length).toFixed(1)
              : '0'
          }}
        </div>
        <p class="mt-1 text-xs text-brand-muted">Kerapatan kurasi produk</p>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div
      class="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-brand-hair bg-brand-canvas p-3 shadow-whisper sm:flex-row sm:items-center"
    >
      <div class="w-full sm:w-80">
        <UiInput
          v-model="searchQuery"
          size="sm"
          placeholder="Cari kategori atau slug..."
          left-icon="pi-search"
        />
      </div>
      <div class="text-xs text-brand-muted">
        Menampilkan
        <span class="font-semibold text-brand-ink">{{ filteredCategories.length }}</span>
        dari {{ categories.length }} kategori
      </div>
    </div>

    <!-- Category Table Card -->
    <div
      class="overflow-hidden rounded-2xl border border-brand-hair bg-brand-canvas shadow-whisper"
    >
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs">
          <thead>
            <tr class="border-b border-brand-hair bg-brand-canvas-soft/75 text-brand-muted">
              <th class="py-3 px-4 font-semibold text-center w-16">Urutan</th>
              <th class="py-3 px-4 font-semibold">Nama Kategori & Slug</th>
              <th class="py-3 px-4 font-semibold">Deskripsi Kurasi</th>
              <th class="py-3 px-4 font-semibold text-center w-28">Produk Aktif</th>
              <th class="py-3 px-4 font-semibold text-right w-44">Tindakan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr
              v-for="cat in filteredCategories"
              :key="cat.id"
              class="transition-colors hover:bg-brand-canvas-soft/40"
            >
              <td class="py-3 px-4 text-center font-mono font-medium text-brand-muted">
                {{ cat.display_order ?? '-' }}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-brand-ink text-sm">{{ cat.name }}</span>
                  <span
                    class="rounded-md bg-brand-canvas-soft px-1.5 py-0.5 font-mono text-[11px] text-brand-muted border border-brand-hair"
                  >
                    /c/{{ cat.slug }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 text-brand-muted max-w-xs truncate">
                {{ cat.description || '-' }}
              </td>
              <td class="py-3 px-4 text-center">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs bg-brand-success-tint text-brand-success-text"
                >
                  <i class="pi pi-box text-[10px]" />
                  {{ categoryCounts[cat.id] ?? 0 }}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <NuxtLink
                    :to="`/katalog?category=${cat.slug}`"
                    target="_blank"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-hair text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft transition-colors"
                    title="Lihat di Etalase"
                  >
                    <i class="pi pi-eye text-xs" />
                  </NuxtLink>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-full border border-brand-hair bg-transparent px-3 py-1 text-xs font-medium text-brand-ink transition-colors hover:bg-brand-canvas-soft"
                    @click="isModalOpen = true"
                  >
                    <i class="pi pi-pencil text-[11px]" />
                    <span>Ubah</span>
                  </button>
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
