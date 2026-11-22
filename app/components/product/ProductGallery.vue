<script setup lang="ts">
import type { Product } from '~/types/product'
import { detectProductCategorySlug } from '~/utils/product-specs'
import ProductSpecsTable from './ProductSpecsTable.vue'

const props = withDefaults(
  defineProps<{
    product: Product
    activeImageOverride?: string | null
  }>(),
  {
    activeImageOverride: null,
  },
)

const categorySlug = computed(() => detectProductCategorySlug(props.product))

const activeImage = ref(props.activeImageOverride || props.product.image_url || '')
const imageFailed = ref(false)
const mainImgEl = ref<HTMLImageElement | null>(null)

watch(
  () => props.product.image_url,
  (newUrl) => {
    if (newUrl && !props.activeImageOverride) activeImage.value = newUrl
  },
  { immediate: true },
)

watch(
  () => props.activeImageOverride,
  (newOverride) => {
    if (newOverride) {
      activeImage.value = newOverride
    }
  },
)

watch(activeImage, () => {
  imageFailed.value = false
})

onMounted(() => {
  if (mainImgEl.value && mainImgEl.value.complete && mainImgEl.value.naturalWidth === 0) {
    imageFailed.value = true
  }
})

const galleryImages = computed(() => {
  const list: string[] = []
  if (props.product.image_url) {
    list.push(props.product.image_url)
  }
  if (props.product.variants && Array.isArray(props.product.variants)) {
    for (const v of props.product.variants) {
      const vUrl = (v.attributes as Record<string, string>)?.image_url
      if (vUrl && !list.includes(vUrl)) {
        list.push(vUrl)
      }
    }
  }
  if (props.product.gallery_urls && Array.isArray(props.product.gallery_urls)) {
    for (const url of props.product.gallery_urls) {
      if (url && !list.includes(url)) {
        list.push(url)
      }
    }
  }
  return list
})

const warrantyBadge = computed(() => {
  switch (categorySlug.value) {
    case 'furniture':
      return { value: '5 Tahun', label: 'Garansi Rangka' }
    case 'tech':
      return { value: '2 Tahun', label: 'Garansi Resmi' }
    case 'lifestyle':
      return { value: '1 Tahun', label: 'Garansi Bahan & Zip' }
    case 'home':
      return { value: 'Food-Safe', label: 'Bebas BPA & Toksin' }
    case 'stationery':
    default:
      return { value: '100% Presisi', label: 'Jaminan Kepuasan' }
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Main Media Container -->
    <div
      class="relative w-full aspect-[4/3] rounded-card bg-brand-field border border-brand-hair overflow-hidden flex items-center justify-center p-6 shadow-whisper group"
    >
      <img
        v-if="activeImage && !imageFailed"
        ref="mainImgEl"
        :src="activeImage"
        :alt="product.name"
        width="800"
        height="600"
        fetchpriority="high"
        decoding="async"
        class="w-full h-full object-contain mix-blend-multiply transition-all duration-300 group-hover:scale-105"
        @error="imageFailed = true"
      />
      <div v-else class="flex flex-col items-center justify-center text-brand-faint">
        <i class="pi pi-image text-5xl mb-2" aria-hidden="true" />
        <span class="text-xs font-medium">Gambar Produk Belum Tersedia</span>
      </div>

      <!-- Architectural Badge -->
      <div
        class="absolute bottom-4 right-4 bg-brand-ink text-brand-onink text-xs font-medium px-3 py-1 rounded-full shadow-whisper"
      >
        ShelfStack Original
      </div>
    </div>

    <!-- Multi-Angle Thumbnail Switcher (Stitch Prototype Spec) -->
    <div
      v-if="galleryImages.length > 1"
      class="flex items-center gap-2.5 overflow-x-auto py-1"
      aria-label="Sudut Foto Produk"
    >
      <button
        v-for="(img, idx) in galleryImages"
        :key="idx"
        type="button"
        class="w-16 h-16 rounded-field border p-1 bg-brand-field shrink-0 transition-all cursor-pointer overflow-hidden focus:outline-none"
        :class="[
          activeImage === img
            ? 'border-brand-ink ring-2 ring-brand-ink/20 shadow-whisper scale-105'
            : 'border-brand-hair hover:border-brand-muted opacity-70 hover:opacity-100',
        ]"
        :aria-label="`Pilih sudut gambar ${idx + 1}`"
        @click="activeImage = img"
      >
        <img
          :src="img"
          :alt="`${product.name} thumbnail ${idx + 1}`"
          width="64"
          height="64"
          loading="lazy"
          decoding="async"
          class="w-full h-full object-contain mix-blend-multiply"
        />
      </button>
    </div>

    <!-- Micro-Showcase Spec Grid (3 Triad Boxes) -->
    <div class="grid grid-cols-3 gap-3 pt-2">
      <div
        class="bg-brand-canvas-soft border border-brand-hairsoft p-3.5 rounded-field flex flex-col items-center justify-center text-center shadow-whisper"
      >
        <i class="pi pi-shield text-brand-ink text-lg mb-1" />
        <span class="font-display font-bold text-sm text-brand-ink">{{ warrantyBadge.value }}</span>
        <span class="text-[11px] text-brand-muted">{{ warrantyBadge.label }}</span>
      </div>
      <div
        class="bg-brand-canvas-soft border border-brand-hairsoft p-3.5 rounded-field flex flex-col items-center justify-center text-center shadow-whisper"
      >
        <i class="pi pi-check-circle text-brand-accent text-lg mb-1" />
        <span class="font-display font-bold text-sm text-brand-ink">100% Asli</span>
        <span class="text-[11px] text-brand-muted">Terverifikasi</span>
      </div>
      <div
        class="bg-brand-canvas-soft border border-brand-hairsoft p-3.5 rounded-field flex flex-col items-center justify-center text-center shadow-whisper"
      >
        <i class="pi pi-box text-brand-ink text-lg mb-1" />
        <span class="font-display font-bold text-sm text-brand-ink">Kemasan Aman</span>
        <span class="text-[11px] text-brand-muted">Proteksi Ekstra</span>
      </div>
    </div>

    <!-- Description & Information -->
    <UiCard :padded="true" class="mt-2 space-y-4">
      <h2 class="font-display text-lg font-bold text-brand-ink m-0">
        Deskripsi &amp; Informasi Produk
      </h2>
      <p
        class="font-body text-sm sm:text-base leading-relaxed text-brand-muted m-0 whitespace-pre-wrap"
      >
        {{ product.description || 'Tidak ada deskripsi rinci untuk produk ini.' }}
      </p>

      <div v-if="product.link" class="pt-2">
        <a
          :href="product.link"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-canvas-soft hover:bg-brand-ink hover:text-brand-onink text-brand-ink border border-brand-hair text-xs font-semibold no-underline transition-colors shadow-whisper"
        >
          <span>Kunjungi Halaman Referensi Asli</span>
          <i class="pi pi-external-link text-xs" />
        </a>
      </div>
    </UiCard>

    <!-- Dynamic Specification Table (FR-3.2) -->
    <ProductSpecsTable :product="product" class="mt-2" />
  </div>
</template>
