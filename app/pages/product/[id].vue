<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import type { Product } from '~/types/product'
import { useToast } from 'primevue/usetoast'
import ProductGallery from '~/components/product/ProductGallery.vue'
import ProductConfigurator from '~/components/product/ProductConfigurator.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const toast = useToast()

const product = ref<Product | null>(null)
const loading = ref(true)

useSeoMeta({
  title: () =>
    product.value ? `${product.value.name} — ShelfStack` : 'Detail Produk — ShelfStack',
  description: () =>
    product.value?.description || 'Beli produk berkualitas tinggi terkurasi resmi di ShelfStack.',
  ogTitle: () => (product.value ? `${product.value.name} — ShelfStack` : 'Detail Produk'),
  ogDescription: () =>
    product.value?.description || 'Beli produk berkualitas tinggi terkurasi resmi di ShelfStack.',
  ogImage: () => product.value?.image_url || undefined,
})

onMounted(async () => {
  const id = Number(route.params.id)
  if (!isNaN(id)) {
    try {
      product.value = await productStore.fetchProductById(id)
    } catch (error: unknown) {
      toast.add({
        severity: 'error',
        summary: 'Gagal Memuat Produk',
        detail: error instanceof Error ? error.message : 'Terjadi kesalahan sistem.',
        life: 5000,
      })
    }
  }
  loading.value = false
})

const onAddToBag = (payload: { quantity: number; color: string; material: string }) => {
  toast.add({
    severity: 'success',
    summary: 'Ditambahkan ke Bag',
    detail: `${product.value?.name} (${payload.quantity}x) berhasil dimasukkan.`,
    life: 3000,
  })
}

const onBuyNow = (payload: { quantity: number; color: string; material: string }) => {
  onAddToBag(payload)
  router.push('/katalog')
}
</script>

<template>
  <div class="space-y-8 pb-16 pt-2">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 border-b border-brand-hairsoft overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <NuxtLink
        to="/katalog"
        class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
      >
        Katalog
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span v-if="product" class="text-brand-ink font-semibold truncate max-w-56">
        {{ product.name }}
      </span>
    </nav>

    <!-- Back Action -->
    <div class="flex items-center">
      <UiButton to="/katalog" variant="secondary" size="sm" icon="pi-arrow-left">
        Kembali ke Katalog
      </UiButton>
    </div>

    <!-- Loading Skeleton View -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-pulse">
      <div class="lg:col-span-7 aspect-[4/3] bg-brand-field rounded-card" />
      <div class="lg:col-span-5 space-y-4">
        <div class="h-4 w-32 bg-brand-field rounded-full" />
        <div class="h-8 w-3/4 bg-brand-field rounded-full" />
        <div class="h-6 w-1/3 bg-brand-field rounded-full" />
        <div class="h-24 w-full bg-brand-field rounded-card" />
        <div class="h-12 w-full bg-brand-field rounded-full" />
      </div>
    </div>

    <!-- Product Detail Hub -->
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <div class="lg:col-span-7">
        <ProductGallery :product="product" />
      </div>
      <div class="lg:col-span-5">
        <ProductConfigurator :product="product" @add-to-bag="onAddToBag" @buy-now="onBuyNow" />
      </div>
    </div>

    <!-- Product Not Found View -->
    <div
      v-else
      class="text-center py-20 px-6 bg-brand-canvas-soft border border-dashed border-brand-hair rounded-card max-w-xl mx-auto space-y-4"
    >
      <div
        class="w-14 h-14 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center mx-auto text-brand-muted shadow-whisper"
      >
        <i class="pi pi-exclamation-triangle text-2xl" />
      </div>
      <h2 class="font-display text-2xl font-bold text-brand-ink m-0">Produk Tidak Ditemukan</h2>
      <p class="font-body text-sm text-brand-muted m-0">
        Produk yang Anda cari mungkin telah dihapus atau ID tidak valid dalam database katalog.
      </p>
      <UiButton to="/katalog" variant="primary" icon="pi-arrow-right" icon-pos="right">
        Kembali ke Katalog
      </UiButton>
    </div>
  </div>
</template>
