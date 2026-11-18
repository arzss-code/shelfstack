<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'

useSeoMeta({
  title: 'ShelfStack - Perlengkapan Kerja & Ruang Hidup Modern',
  description:
    'ShelfStack: Toko online kebutuhan kerja, rumah tangga, audio studio, dan furnitur minimalis modern. Belanja aman, original, dan bergaransi.',
})

const productStore = useProductStore()
const toast = useUiToast()

const featured = computed(() => productStore.products.slice(0, 4))

onMounted(async () => {
  try {
    await productStore.fetchProducts()
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Memuat Produk',
      detail: error instanceof Error ? error.message : 'Gagal mengambil daftar produk.',
      life: 5000,
    })
  }
})
</script>

<template>
  <div class="space-y-16 sm:space-y-24">
    <HomeHero />
    <HomeAssurances />
    <HomeFeaturedCategories />
    <HomeFlashDeals />
    <HomeFeaturedProducts :products="featured" :loading="productStore.loading" />
    <HomeFeatures />
    <HomeReviews />
    <HomePromoCTA />
  </div>
</template>
