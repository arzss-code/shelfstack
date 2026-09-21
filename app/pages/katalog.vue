<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import { useToast } from 'primevue/usetoast'
import ProductList from '~/features/products/components/ProductList.vue'

useSeoMeta({
  title: 'Katalog Produk — ShelfStack',
  description:
    'Jelajahi etalase ShelfStack: peralatan presisi, koleksi meja kerja, furnitur, dan perkakas terkurasi berkualitas tinggi.',
})

const productStore = useProductStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const searchQuery = ref((route.query.q as string) || '')
const selectedCategory = ref((route.query.category as string) || 'all')
const selectedPriceRange = ref('all')
const selectedSort = ref('featured')
const gridDensity = ref<'compact' | 'spacious'>('compact')
const showMobileFilterModal = ref(false)

const categories = [
  { id: 'all', label: 'Semua Kategori', keywords: [] },
  {
    id: 'tech',
    label: 'Teknologi & Gadget',
    keywords: [
      'keyboard',
      'audio',
      'charge',
      'usb',
      'monitor',
      'stand',
      'dock',
      'hub',
      'kabel',
      'mouse',
      'sound',
      'gadget',
    ],
  },
  {
    id: 'home',
    label: 'Dekorasi & Rumah',
    keywords: ['organizer', 'tray', 'pot', 'vas', 'dekorasi', 'mat', 'lampu', 'home', 'rumah'],
  },
  {
    id: 'furniture',
    label: 'Furnitur & Meja',
    keywords: ['meja', 'kursi', 'desk', 'chair', 'rak', 'shelf', 'furnitur', 'bangku'],
  },
  {
    id: 'lifestyle',
    label: 'Pakaian & Gaya Hidup',
    keywords: ['tas', 'case', 'dompet', 'jaket', 'sleeve', 'edc', 'lifestyle'],
  },
  {
    id: 'stationery',
    label: 'Alat Tulis & Kantor',
    keywords: ['pen', 'notebook', 'buku', 'planner', 'pad', 'tulis', 'kantor'],
  },
]

const sortOptions = [
  { id: 'featured', label: 'Pilihan Kurator' },
  { id: 'price-low', label: 'Harga: Rendah ke Tinggi' },
  { id: 'price-high', label: 'Harga: Tinggi ke Rendah' },
  { id: 'name-asc', label: 'Nama: A — Z' },
]

const priceRanges = [
  { id: 'all', label: 'Semua Harga' },
  { id: 'under500k', label: 'Di bawah Rp 500rb' },
  { id: '500k-2m', label: 'Rp 500rb – Rp 2jt' },
  { id: 'above2m', label: 'Di atas Rp 2jt' },
]

onMounted(async () => {
  try {
    await productStore.fetchProducts()
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Memuat Katalog',
      detail: error instanceof Error ? error.message : 'Gagal mengambil daftar produk.',
      life: 5000,
    })
  }
})

// Sync query params when route changes
watch(
  () => route.query.q,
  (newQ) => {
    if (typeof newQ === 'string') searchQuery.value = newQ
  },
)

const filteredProducts = computed(() => {
  let list = [...productStore.products]

  // 1. Text Search Filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    )
  }

  // 2. Category Filter
  if (selectedCategory.value !== 'all') {
    const cat = categories.find((c) => c.id === selectedCategory.value)
    if (cat && cat.keywords.length > 0) {
      list = list.filter((p) => {
        const text = `${p.name} ${p.description || ''}`.toLowerCase()
        return cat.keywords.some((kw) => text.includes(kw))
      })
    }
  }

  // 3. Price Range Filter
  if (selectedPriceRange.value === 'under500k') {
    list = list.filter((p) => p.price < 500000)
  } else if (selectedPriceRange.value === '500k-2m') {
    list = list.filter((p) => p.price >= 500000 && p.price <= 2000000)
  } else if (selectedPriceRange.value === 'above2m') {
    list = list.filter((p) => p.price > 2000000)
  }

  // 4. Sorting
  if (selectedSort.value === 'price-low') {
    list.sort((a, b) => a.price - b.price)
  } else if (selectedSort.value === 'price-high') {
    list.sort((a, b) => b.price - a.price)
  } else if (selectedSort.value === 'name-asc') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  return list
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (searchQuery.value.trim()) count++
  if (selectedCategory.value !== 'all') count++
  if (selectedPriceRange.value !== 'all') count++
  if (selectedSort.value !== 'featured') count++
  return count
})

const clearSearch = () => {
  searchQuery.value = ''
  if (route.query.q) {
    const query = { ...route.query }
    delete query.q
    router.replace({ query })
  }
}

const resetAllFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  selectedPriceRange.value = 'all'
  selectedSort.value = 'featured'
  router.replace({ query: {} })
}

const selectCategory = (catId: string) => {
  selectedCategory.value = catId
  const query = { ...route.query }
  if (catId === 'all') {
    delete query.category
  } else {
    query.category = catId
  }
  router.replace({ query })
}
</script>

<template>
  <div class="space-y-8 pb-16 pt-2">
    <!-- Breadcrumbs & Category Header -->
    <section>
      <nav
        aria-label="Breadcrumb"
        class="flex items-center gap-2 text-xs font-medium text-brand-muted mb-4"
      >
        <NuxtLink
          to="/"
          class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
        >
          ShelfStack
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <span class="text-brand-ink font-semibold">Katalog Produk</span>
      </nav>

      <!-- Headline & Subtext -->
      <div
        class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-brand-hairsoft"
      >
        <div class="max-w-2xl space-y-2">
          <h1
            class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-brand-ink leading-tight m-0"
          >
            Katalog
          </h1>

          <p class="font-body text-xs sm:text-sm md:text-base text-brand-muted leading-relaxed m-0">
            Semua produk ShelfStack dalam satu etalase terpadu. Klik kartu untuk melihat detail
            spesifikasi, varian material, dan jaminan resmi.
          </p>
        </div>

        <!-- Metric summary pill -->
        <div
          class="flex items-center gap-3 bg-brand-canvas-soft border border-brand-hair px-4 py-2 rounded-full text-xs text-brand-muted shadow-whisper shrink-0 self-start lg:self-auto"
        >
          <span class="font-bold text-brand-ink"
            >{{ filteredProducts.length }} Produk Tersedia</span
          >
          <span class="text-brand-faint">•</span>
          <span>Garansi 2 Tahun</span>
          <span class="text-brand-faint">•</span>
          <span class="text-brand-success font-semibold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-success" />
            Siap Kirim
          </span>
        </div>
      </div>

      <!-- Department Category Pills Strip -->
      <div class="flex items-center gap-2 overflow-x-auto pt-4 pb-1 [scrollbar-width:none]">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          :class="[
            'px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-whisper shrink-0 cursor-pointer border',
            selectedCategory === cat.id
              ? 'bg-brand-ink text-brand-onink border-brand-ink'
              : 'bg-brand-canvas-soft border-brand-hair text-brand-muted hover:text-brand-ink hover:bg-brand-canvas',
          ]"
          @click="selectCategory(cat.id)"
        >
          {{ cat.label }}
        </button>
      </div>
    </section>

    <!-- TOOLBAR UTILITY ROW: Search & Sort Controls -->
    <section
      class="sticky top-20 z-20 bg-brand-canvas/95 backdrop-blur-md py-3 px-4 rounded-2xl border border-brand-hairsoft shadow-whisper flex flex-wrap items-center justify-between gap-3"
    >
      <!-- Search Input Field -->
      <div class="relative w-full sm:w-80">
        <i
          class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-brand-faint"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari produk..."
          aria-label="Cari produk..."
          class="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-brand-field text-brand-ink placeholder:text-brand-faint rounded-full border border-transparent outline-none focus:border-brand-hair focus:bg-brand-canvas focus:ring-2 focus:ring-brand-ink transition-all"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-brand-hair flex items-center justify-center text-[10px] text-brand-ink hover:bg-brand-muted hover:text-white transition-colors cursor-pointer"
          title="Hapus pencarian"
          @click="clearSearch"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <!-- Controls Right: Mobile Filter Button, Sort Dropdown & Density Toggle -->
      <div
        class="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-between sm:justify-end"
      >
        <!-- Mobile Filter Button (lg:hidden) -->
        <button
          type="button"
          class="lg:hidden inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-xs font-semibold text-brand-ink cursor-pointer"
          @click="showMobileFilterModal = true"
        >
          <i class="pi pi-filter text-xs" />
          <span>Filter</span>
          <span
            v-if="activeFiltersCount > 0"
            class="w-4 h-4 rounded-full bg-brand-accent text-white text-[10px] flex items-center justify-center font-bold"
          >
            {{ activeFiltersCount }}
          </span>
        </button>

        <!-- Sort Select -->
        <div
          class="flex items-center gap-2 bg-brand-field border border-transparent focus-within:border-brand-hair rounded-full px-3 h-10 text-xs text-brand-ink"
        >
          <span
            class="text-brand-muted text-[11px] uppercase tracking-wider font-semibold hidden md:inline"
            >Urutkan:</span
          >
          <select
            v-model="selectedSort"
            class="bg-transparent border-0 outline-none text-xs font-medium text-brand-ink cursor-pointer pr-1"
          >
            <option v-for="s in sortOptions" :key="s.id" :value="s.id">
              {{ s.label }}
            </option>
          </select>
        </div>

        <!-- Grid Density Switcher (Desktop only) -->
        <div
          class="hidden sm:flex items-center bg-brand-field p-1 rounded-full border border-brand-hairsoft"
        >
          <button
            type="button"
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer',
              gridDensity === 'compact'
                ? 'bg-brand-canvas text-brand-ink shadow-whisper'
                : 'text-brand-muted hover:text-brand-ink',
            ]"
            title="Tampilan 4 Kolom"
            @click="gridDensity = 'compact'"
          >
            <i class="pi pi-th-large text-xs" />
          </button>
          <button
            type="button"
            :class="[
              'w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors cursor-pointer',
              gridDensity === 'spacious'
                ? 'bg-brand-canvas text-brand-ink shadow-whisper'
                : 'text-brand-muted hover:text-brand-ink',
            ]"
            title="Tampilan 3 Kolom"
            @click="gridDensity = 'spacious'"
          >
            <i class="pi pi-table text-xs" />
          </button>
        </div>
      </div>
    </section>

    <!-- Active Filters Tag Strip -->
    <div v-if="activeFiltersCount > 0" class="flex items-center flex-wrap gap-2 pt-1">
      <span class="text-xs font-semibold text-brand-muted">Filter Aktif:</span>

      <span
        v-if="searchQuery.trim()"
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink"
      >
        <span>Kata Kunci: "{{ searchQuery }}"</span>
        <button type="button" class="hover:text-red-500 cursor-pointer" @click="clearSearch">
          <i class="pi pi-times text-[10px]" />
        </button>
      </span>

      <span
        v-if="selectedCategory !== 'all'"
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink"
      >
        <span>Kategori: {{ categories.find((c) => c.id === selectedCategory)?.label }}</span>
        <button
          type="button"
          class="hover:text-red-500 cursor-pointer"
          @click="selectCategory('all')"
        >
          <i class="pi pi-times text-[10px]" />
        </button>
      </span>

      <span
        v-if="selectedPriceRange !== 'all'"
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-field text-xs text-brand-ink"
      >
        <span>Harga: {{ priceRanges.find((p) => p.id === selectedPriceRange)?.label }}</span>
        <button
          type="button"
          class="hover:text-red-500 cursor-pointer"
          @click="selectedPriceRange = 'all'"
        >
          <i class="pi pi-times text-[10px]" />
        </button>
      </span>

      <button
        type="button"
        class="text-xs font-semibold text-brand-accent hover:underline cursor-pointer ml-1"
        @click="resetAllFilters"
      >
        Hapus Semua Filter
      </button>
    </div>

    <!-- MAIN BODY: Faceted Sidebar + Product Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- LEFT SIDEBAR FACETED PANEL (Desktop Only) -->
      <aside class="hidden lg:flex lg:col-span-3 flex-col gap-6 sticky top-40">
        <div
          class="bg-brand-canvas border border-brand-hair rounded-2xl p-5 space-y-6 shadow-whisper"
        >
          <!-- Filter Header -->
          <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
            <div class="flex items-center gap-2">
              <i class="pi pi-sliders-h text-sm text-brand-ink" />
              <h2 class="font-display text-sm font-bold text-brand-ink m-0">Filter Produk</h2>
            </div>
            <button
              type="button"
              class="text-xs text-brand-muted hover:text-brand-ink transition-colors cursor-pointer"
              @click="resetAllFilters"
            >
              Reset
            </button>
          </div>

          <!-- Price Range Filter -->
          <div class="space-y-3">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-brand-muted m-0">
              Rentang Harga
            </h3>
            <div class="flex flex-col gap-1.5">
              <button
                v-for="range in priceRanges"
                :key="range.id"
                type="button"
                :class="[
                  'text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer',
                  selectedPriceRange === range.id
                    ? 'bg-brand-ink text-brand-onink'
                    : 'text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink',
                ]"
                @click="selectedPriceRange = range.id"
              >
                {{ range.label }}
              </button>
            </div>
          </div>

          <!-- Service Reassurance -->
          <div class="pt-4 border-t border-brand-hairsoft space-y-3">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-brand-muted m-0">
              Jaminan ShelfStack
            </h3>
            <div class="space-y-2 text-xs text-brand-muted">
              <div class="flex items-center gap-2">
                <i class="pi pi-check-circle text-brand-success text-xs" />
                <span>100% Produk Original</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-shield text-brand-accent text-xs" />
                <span>Garansi Resmi 2 Tahun</span>
              </div>
              <div class="flex items-center gap-2">
                <i class="pi pi-truck text-brand-ink text-xs" />
                <span>Gratis Ongkir &gt; Rp 200rb</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- RIGHT COLUMN: PRODUCT LISTING GRID -->
      <section class="lg:col-span-9 space-y-6">
        <ProductList
          :products="filteredProducts"
          :loading="productStore.loading"
          :is-searching="
            searchQuery.trim().length > 0 ||
            selectedCategory !== 'all' ||
            selectedPriceRange !== 'all'
          "
          :density="gridDensity"
          hide-actions
        />

        <!-- Load More Action -->
        <div
          v-if="
            productStore.hasMore &&
            !searchQuery.trim() &&
            selectedCategory === 'all' &&
            selectedPriceRange === 'all'
          "
          class="flex justify-center pt-6"
        >
          <button
            type="button"
            :disabled="productStore.loading"
            class="inline-flex items-center gap-2 h-11 px-8 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-ink border border-brand-hair text-xs sm:text-sm font-semibold transition-all shadow-whisper cursor-pointer disabled:opacity-50"
            @click="productStore.fetchProducts(true)"
          >
            <i v-if="productStore.loading" class="pi pi-spin pi-spinner text-xs" />
            <i v-else class="pi pi-sync text-xs" />
            <span>Muat Lebih Banyak</span>
          </button>
        </div>
      </section>
    </div>

    <!-- Mobile Filter Modal Sheet (lg:hidden) -->
    <div
      v-if="showMobileFilterModal"
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 lg:hidden"
      @click.self="showMobileFilterModal = false"
    >
      <div
        class="w-full sm:max-w-md bg-brand-canvas rounded-t-3xl sm:rounded-3xl p-6 space-y-5 max-h-[80vh] overflow-y-auto shadow-floating"
      >
        <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
          <h2 class="font-display text-base font-bold text-brand-ink m-0">Filter Katalog</h2>
          <button
            type="button"
            class="w-8 h-8 rounded-full bg-brand-field flex items-center justify-center text-brand-muted hover:text-brand-ink cursor-pointer"
            @click="showMobileFilterModal = false"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>

        <!-- Mobile Price Filter -->
        <div class="space-y-2">
          <label class="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Rentang Harga
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="range in priceRanges"
              :key="range.id"
              type="button"
              :class="[
                'p-2.5 rounded-xl text-xs font-medium border text-center transition-colors cursor-pointer',
                selectedPriceRange === range.id
                  ? 'bg-brand-ink text-brand-onink border-brand-ink'
                  : 'bg-brand-canvas border-brand-hair text-brand-muted',
              ]"
              @click="selectedPriceRange = range.id"
            >
              {{ range.label }}
            </button>
          </div>
        </div>

        <!-- Mobile Actions -->
        <div class="pt-4 border-t border-brand-hairsoft flex items-center gap-3">
          <button
            type="button"
            class="flex-1 h-11 rounded-full bg-brand-canvas-soft border border-brand-hair text-xs font-semibold text-brand-ink cursor-pointer"
            @click="resetAllFilters"
          >
            Reset Filter
          </button>
          <button
            type="button"
            class="flex-1 h-11 rounded-full bg-brand-ink text-brand-onink text-xs font-semibold cursor-pointer"
            @click="showMobileFilterModal = false"
          >
            Terapkan ({{ filteredProducts.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
