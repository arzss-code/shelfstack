<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import { useToast } from 'primevue/usetoast'
import ProductList from '~/features/products/components/ProductList.vue'

useSeoMeta({
  title: 'Katalog',
  description: 'Jelajahi etalase ShelfStack: kopi, makanan, dan merch pilihan.',
})

const productStore = useProductStore()
const toast = useToast()

const searchQuery = ref('')

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return productStore.products
  const query = searchQuery.value.toLowerCase()
  return productStore.products.filter((p) => p.name.toLowerCase().includes(query))
})

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
</script>

<template>
  <div>
    <div class="flex justify-between items-end mb-2 flex-wrap gap-6">
      <div>
        <h1
          class="m-0 mb-2 text-5xl font-medium leading-[1.17] text-brand-ink md:text-[64px] md:leading-[1.16]"
        >
          Katalog
        </h1>
        <p class="m-0 text-lg leading-[1.44] text-brand-body">
          Semua produk ShelfStack dalam satu etalase. Klik kartu untuk detail.
        </p>
      </div>
    </div>

    <div
      class="sticky top-16 z-10 -mx-1 mb-8 flex flex-wrap items-center gap-4 bg-brand-canvas px-1 py-3"
    >
      <IconField icon-position="left" class="min-w-60 flex-1 sm:max-w-sm">
        <InputIcon class="pi pi-search text-brand-faint" />
        <InputText
          v-model="searchQuery"
          placeholder="Cari produk..."
          class="w-full !rounded-full !border-brand-hair !bg-brand-soft"
          aria-label="Cari produk"
        />
      </IconField>
      <span class="text-sm tabular-nums text-brand-muted" aria-live="polite">
        {{ filteredProducts.length }} produk
      </span>
    </div>

    <ProductList
      :products="filteredProducts"
      :loading="productStore.loading"
      :is-searching="searchQuery.trim().length > 0"
      hide-actions
    />

    <div v-if="productStore.hasMore && !searchQuery.trim()" class="flex justify-center mt-8 mb-4">
      <Button
        label="Muat Lebih Banyak"
        icon="pi pi-sync"
        :loading="productStore.loading"
        severity="secondary"
        rounded
        @click="productStore.fetchProducts(true)"
      />
    </div>
  </div>
</template>
