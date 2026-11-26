<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
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
      title="Kelola Kategori Katalog"
      subtitle="Atur urutan kategori etalase, deskripsi kurasi, dan visibilitas produk."
      :breadcrumbs="[{ label: 'Dashboard', to: '/admin' }, { label: 'Kelola Kategori' }]"
    >
      <template #actions>
        <a
          href="/katalog"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-1.5 rounded-full border border-brand-hair bg-brand-canvas px-4 py-2 text-xs font-semibold text-brand-ink no-underline transition-all hover:border-brand-ink hover:bg-brand-canvas-soft"
        >
          <i class="pi pi-external-link shrink-0 text-[11px]" aria-hidden="true" />
          <span>Buka Etalase</span>
        </a>
        <UiButton variant="primary" size="sm" icon="pi-plus" @click="isModalOpen = true">
          Kelola &amp; Tambah Kategori
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- Executive Metrics Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            Total Kategori
          </span>
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-accent-edge bg-brand-accent-tint text-brand-accent-text"
          >
            <i class="pi pi-tags text-xs" aria-hidden="true" />
          </span>
        </div>
        <div
          class="font-display mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular text-brand-ink"
        >
          {{ categories.length }}
        </div>
        <p class="mt-1 m-0 text-[11px] text-brand-muted">Kategori aktif pada storefront</p>
      </div>

      <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            Total Produk Terkatalog
          </span>
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-success-edge bg-brand-success-tint text-brand-success-text"
          >
            <i class="pi pi-box text-xs" aria-hidden="true" />
          </span>
        </div>
        <div
          class="font-display mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular text-brand-ink"
        >
          {{ totalProductsAcrossCategories }}
        </div>
        <p class="mt-1 m-0 text-[11px] text-brand-muted">Total inventaris aktif terdistribusi</p>
      </div>

      <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            Rata-rata Produk/Kategori
          </span>
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-accent-edge bg-brand-accent-tint text-brand-accent-text"
          >
            <i class="pi pi-chart-pie text-xs" aria-hidden="true" />
          </span>
        </div>
        <div
          class="font-display mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular text-brand-ink"
        >
          {{
            categories.length > 0
              ? (totalProductsAcrossCategories / categories.length).toFixed(1)
              : '0'
          }}
        </div>
        <p class="mt-1 m-0 text-[11px] text-brand-muted">Kerapatan kurasi produk</p>
      </div>
    </div>

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
              <th scope="col" class="py-2.5 px-3.5 text-center w-16">Urutan</th>
              <th scope="col" class="py-2.5 px-3.5">Nama Kategori &amp; Slug</th>
              <th scope="col" class="py-2.5 px-3.5">Deskripsi Kurasi</th>
              <th scope="col" class="py-2.5 px-3.5 text-center w-28">Produk Aktif</th>
              <th scope="col" class="py-2.5 px-3.5 text-right w-44">Tindakan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr
              v-for="cat in filteredCategories"
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
