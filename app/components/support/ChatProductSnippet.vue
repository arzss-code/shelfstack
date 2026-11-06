<script setup lang="ts">
import { computed } from 'vue'

export interface ChatProductData {
  id: number
  title: string
  price_cents: number
  image_url?: string | null
}

interface Props {
  product: ChatProductData
}

const props = defineProps<Props>()

const formattedPrice = computed(() => {
  const rupiah = Math.round(props.product.price_cents / 100).toLocaleString('id-ID')
  return `Rp ${rupiah}`
})
</script>

<template>
  <div
    class="chat-product-snippet rounded-card border border-brand-hair bg-white p-2.5 shadow-whisper text-brand-ink flex items-center gap-2.5 max-w-sm"
  >
    <div
      class="h-12 w-12 shrink-0 rounded border border-brand-hair bg-brand-canvas-soft overflow-hidden flex items-center justify-center"
    >
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.title"
        class="h-full w-full object-cover"
      />
      <i v-else class="pi pi-box text-base text-brand-muted" aria-hidden="true" />
    </div>
    <div class="min-w-0 flex-1">
      <h4 class="product-title truncate text-xs font-semibold text-brand-ink m-0">
        {{ product.title }}
      </h4>
      <div class="product-price mt-0.5 text-xs font-bold text-brand-ink">
        {{ formattedPrice }}
      </div>
      <a
        :href="`/products/${product.id}`"
        target="_blank"
        rel="noopener noreferrer"
        class="product-link mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-brand-accent hover:underline no-underline"
      >
        <span>Lihat Produk</span>
        <i class="pi pi-arrow-right text-[8px]" aria-hidden="true" />
      </a>
    </div>
  </div>
</template>
