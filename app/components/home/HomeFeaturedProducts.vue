<script setup lang="ts">
import ProductList from '~/features/products/components/ProductList.vue'
import type { Product } from '~/types/product'

defineProps<{
  products: Product[]
  loading: boolean
}>()
</script>

<template>
  <section>
    <div class="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold text-brand-ink">
          Produk Unggulan
        </h2>
        <p class="font-body m-0 mt-1 text-sm sm:text-base text-brand-muted">
          Pilihan terlaris minggu ini, langsung dari katalog ShelfStack.
        </p>
      </div>
      <NuxtLink
        to="/katalog"
        class="text-sm font-semibold text-brand-accent hover:underline inline-flex items-center gap-1 no-underline shrink-0"
      >
        <span>Semua Katalog</span>
        <i class="pi pi-arrow-right text-xs" />
      </NuxtLink>
    </div>

    <ProductList :products="products" :loading="loading" hide-actions />
  </section>
</template>
