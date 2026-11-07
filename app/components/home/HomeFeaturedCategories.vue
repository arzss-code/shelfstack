<script setup lang="ts">
import { useCategories, CANONICAL_CATEGORIES, type CategoryItem } from '~/composables/useCategories'
import { useProductStore } from '~/features/products/stores/product'

const props = defineProps<{
  customCategories?: Array<{
    id: string
    name: string
    slug: string
    description?: string | null
    image_url?: string | null
  }>
}>()

let categoriesRef = ref<CategoryItem[]>(CANONICAL_CATEGORIES)
let fetchCategoriesFn: () => Promise<void> = async () => {}

try {
  const { categories, fetchCategories } = useCategories()
  categoriesRef = categories
  fetchCategoriesFn = fetchCategories
} catch {
  // Graceful fallback saat di luar konteks Nuxt runtime (misal unit tests)
  categoriesRef = ref<CategoryItem[]>(CANONICAL_CATEGORIES)
}

let productStore: ReturnType<typeof useProductStore> | null = null
try {
  productStore = useProductStore()
} catch {
  productStore = null
}

onMounted(async () => {
  if (categoriesRef.value.length === 0) {
    await fetchCategoriesFn()
  }
})

// Hitung jumlah produk dari database / store nyata tanpa angka fabrikasi
const getCategoryCountLabel = (categoryId: string): string => {
  const products = productStore?.products
  if (!products || products.length === 0) {
    return 'Koleksi Terkurasi'
  }
  const matching = products.filter((p) => p.category_id === categoryId && !p.deleted_at)
  if (matching.length > 0) {
    return `${matching.length} Produk Tersedia`
  }
  return 'Koleksi Terkurasi'
}

const displayCategories = computed(() => {
  const source = props.customCategories ?? categoriesRef.value
  return source.slice(0, 5).map((cat, index) => {
    const firstName = cat.name.split(' ')[0] || cat.name
    return {
      id: cat.id,
      name: cat.name,
      category: cat.slug,
      count: getCategoryCountLabel(cat.id),
      desc:
        cat.description ||
        'Koleksi kebutuhan harian terstandarisasi untuk kenyamanan dan produktivitas.',
      cta: `Lihat Koleksi ${firstName}`,
      image:
        cat.image_url ||
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      spanTwo: index === 0,
    }
  })
})
</script>

<template>
  <section class="w-full" data-testid="featured-categories-section">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
      <div>
        <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold text-brand-ink">
          Kategori Pilihan
        </h2>
        <p class="font-body text-sm sm:text-base text-brand-muted max-w-md m-0 mt-1">
          Koleksi terkurasi untuk memenuhi kebutuhan kerja, rumah tangga, dan gaya hidup Anda.
        </p>
      </div>
      <NuxtLink
        to="/katalog"
        class="text-sm font-semibold text-brand-accent hover:underline inline-flex items-center gap-1 no-underline shrink-0"
      >
        <span>Lihat Semua Kategori</span>
        <i class="pi pi-arrow-right text-xs" />
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="cat in displayCategories"
        :key="cat.name"
        :to="'/katalog?category=' + cat.category"
        :class="[
          'bg-brand-canvas-soft hover:bg-brand-field rounded-card overflow-hidden group transition-all border border-brand-hair shadow-whisper no-underline flex flex-col',
          cat.spanTwo ? 'lg:col-span-2 md:flex-row' : '',
        ]"
        data-testid="featured-category-card"
      >
        <div
          :class="
            cat.spanTwo
              ? 'md:w-1/2 p-6 sm:p-8 flex flex-col justify-between order-2 md:order-1'
              : 'p-6 flex-1 flex flex-col justify-between order-2'
          "
        >
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-medium text-brand-muted" data-testid="category-badge">
                {{ cat.count }}
              </span>
            </div>
            <h3
              class="font-display m-0 text-xl font-bold text-brand-ink group-hover:text-brand-accent transition-colors mb-2"
            >
              {{ cat.name }}
            </h3>
            <p class="font-body m-0 text-xs sm:text-sm text-brand-muted leading-relaxed">
              {{ cat.desc }}
            </p>
          </div>
          <div class="flex items-center gap-2 text-xs font-bold text-brand-ink pt-6">
            <span>{{ cat.cta }}</span>
            <i
              class="pi pi-arrow-right text-xs group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </div>
        </div>
        <div
          :class="
            cat.spanTwo
              ? 'md:w-1/2 h-56 sm:h-auto min-h-[220px] overflow-hidden order-1 md:order-2'
              : 'h-52 overflow-hidden order-1'
          "
        >
          <img
            :src="cat.image"
            :alt="cat.name"
            width="600"
            height="400"
            decoding="async"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
