<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { UiTabItem } from '~/components/ui/UiTabs.vue'
import { faqs } from '~/data/faqs'
import HelpFaqItem from '~/components/help/HelpFaqItem.vue'
import HelpSupportFooter from '~/components/help/HelpSupportFooter.vue'

useSeoMeta({
  title: 'Pusat Bantuan & Kebijakan - ShelfStack',
  description:
    'Temukan panduan lengkap pemesanan, pembayaran Midtrans, kurir logistik, ketentuan garansi 2 tahun, dan kebijakan retur di ShelfStack.',
})

const route = useRoute()

const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const openItemIds = ref<string[]>([])

const categoryTabs = computed<UiTabItem[]>(() => [
  { value: 'all', label: 'Semua', count: faqs.length },
  {
    value: 'pemesanan',
    label: 'Pemesanan',
    count: faqs.filter((f) => f.category === 'pemesanan').length,
  },
  {
    value: 'pembayaran',
    label: 'Pembayaran',
    count: faqs.filter((f) => f.category === 'pembayaran').length,
  },
  {
    value: 'pengiriman',
    label: 'Pengiriman',
    count: faqs.filter((f) => f.category === 'pengiriman').length,
  },
  {
    value: 'garansi',
    label: 'Garansi',
    count: faqs.filter((f) => f.category === 'garansi').length,
  },
  {
    value: 'pengembalian',
    label: 'Pengembalian',
    count: faqs.filter((f) => f.category === 'pengembalian').length,
  },
])

const validCategories = ['pemesanan', 'pembayaran', 'pengiriman', 'garansi', 'pengembalian']

const syncCategoryFromHash = () => {
  const hash = route?.hash ? route.hash.replace(/^#/, '').toLowerCase().trim() : ''
  if (!hash) return

  if (hash === 'semua' || hash === 'all') {
    selectedCategory.value = 'all'
  } else if (validCategories.includes(hash)) {
    selectedCategory.value = hash
  }
}

onMounted(() => {
  syncCategoryFromHash()
})

watch(
  () => route?.hash,
  () => {
    syncCategoryFromHash()
  },
)

watch(selectedCategory, (newCat) => {
  if (typeof window !== 'undefined' && window.location) {
    try {
      const targetHash = newCat === 'all' ? '' : `#${newCat}`
      if (window.location.hash !== targetHash) {
        if (targetHash) {
          window.history.replaceState(null, '', `${window.location.pathname}${targetHash}`)
        } else {
          window.history.replaceState(null, '', window.location.pathname)
        }
      }
    } catch {
      // Abaikan jika lingkungan eksekusi membatasi replaceState
    }
  }
})

const filteredFaqs = computed(() => {
  let list = faqs
  if (selectedCategory.value !== 'all') {
    list = list.filter((item) => item.category === selectedCategory.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return list

  return list.filter(
    (item) =>
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.categoryLabel.toLowerCase().includes(query),
  )
})

const isOpen = (id: string) => openItemIds.value.includes(id)

const toggleItem = (id: string) => {
  const index = openItemIds.value.indexOf(id)
  if (index > -1) {
    openItemIds.value.splice(index, 1)
  } else {
    openItemIds.value.push(id)
  }
}

const expandAll = () => {
  openItemIds.value = filteredFaqs.value.map((item) => item.id)
}

const collapseAll = () => {
  openItemIds.value = []
}

const resetSearch = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-16">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs text-brand-muted mb-6" aria-label="Breadcrumb">
      <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline">
        Beranda
      </NuxtLink>
      <span class="text-brand-hair">/</span>
      <span class="text-brand-ink font-semibold">Pusat Bantuan</span>
    </nav>

    <!-- Hero Header Section -->
    <header class="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
      <div class="inline-flex mb-3">
        <UiBadge label="Pusat Bantuan & Kebijakan" variant="info" />
      </div>
      <h1 class="font-display text-2xl sm:text-4xl font-bold text-brand-ink tracking-tight m-0">
        Ada yang Bisa Kami Bantu?
      </h1>
      <p class="text-xs sm:text-sm text-brand-muted mt-2 m-0 leading-relaxed">
        Temukan panduan lengkap seputar pemesanan, pembayaran Midtrans, kurir logistik, klaim
        garansi 2 tahun, dan ketentuan retur produk.
      </p>

      <!-- Search Bar -->
      <div class="mt-6 max-w-xl mx-auto">
        <UiInput
          v-model="searchQuery"
          placeholder="Cari kendala atau topik bantuan (contoh: resi, QRIS, retur)..."
          left-icon="pi-search"
          size="md"
          data-testid="help-search-input"
          aria-label="Cari topik bantuan"
        />
      </div>
    </header>

    <!-- Category Tabs Navigation -->
    <section class="mb-6 sm:mb-8" aria-label="Kategori Bantuan">
      <div class="overflow-x-auto pb-1 [scrollbar-width:none]">
        <UiTabs
          v-model="selectedCategory"
          :items="categoryTabs"
          aria-label="Kategori Pertanyaan"
          full-width
        />
      </div>
    </section>

    <!-- Results Count Bar & Controls -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs text-brand-muted">
      <div class="flex items-center gap-1.5">
        <span v-if="searchQuery">
          Hasil pencarian "<strong class="text-brand-ink">{{ searchQuery }}</strong
          >":
        </span>
        <span class="font-medium text-brand-ink">
          {{ filteredFaqs.length }} pertanyaan ditampilkan
        </span>
      </div>

      <div class="flex items-center gap-3">
        <button
          v-if="searchQuery"
          type="button"
          class="text-brand-ink hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs font-semibold"
          data-testid="btn-reset-search"
          @click="resetSearch"
        >
          Reset Pencarian
        </button>
        <div v-if="filteredFaqs.length > 0" class="flex items-center gap-2">
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink cursor-pointer bg-transparent border-0 p-0 text-xs transition-colors"
            data-testid="btn-expand-all"
            @click="expandAll"
          >
            Buka Semua
          </button>
          <span class="text-brand-hair">|</span>
          <button
            type="button"
            class="text-brand-muted hover:text-brand-ink cursor-pointer bg-transparent border-0 p-0 text-xs transition-colors"
            data-testid="btn-collapse-all"
            @click="collapseAll"
          >
            Tutup Semua
          </button>
        </div>
      </div>
    </div>

    <!-- FAQ Accordion List -->
    <div v-if="filteredFaqs.length > 0" class="space-y-3" role="list">
      <HelpFaqItem
        v-for="item in filteredFaqs"
        :key="item.id"
        :item="item"
        :is-open="isOpen(item.id)"
        @toggle="toggleItem"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="my-6">
      <UiEmptyState
        icon="pi-search"
        title="Pertanyaan Tidak Ditemukan"
        :description="`Tidak ada jawaban yang sesuai dengan pencarian '${searchQuery}'. Coba gunakan kata kunci lain atau tampilkan seluruh kategori.`"
        action-label="Reset Filter & Tampilkan Semua"
        @action="resetSearch"
      />
    </div>

    <!-- Quick Support Banner -->
    <HelpSupportFooter />
  </div>
</template>
