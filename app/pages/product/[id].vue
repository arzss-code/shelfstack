<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import { useCartStore } from '~/features/cart/stores/cart'
import type { Product } from '~/types/product'
import type { ProductSelectionPayload } from '~/composables/useProductConfigurator'
import ProductGallery from '~/components/product/ProductGallery.vue'
import ProductConfigurator from '~/components/product/ProductConfigurator.vue'
import ProductReviewsSection from '~/components/product/ProductReviewsSection.vue'
import ProductRelatedSection from '~/components/product/ProductRelatedSection.vue'
import ProductRecentlyViewedSection from '~/components/product/ProductRecentlyViewedSection.vue'
import ProductFlashSaleBanner from '~/components/promotions/ProductFlashSaleBanner.vue'
import ProductShippingEstimator from '~/components/product/ProductShippingEstimator.vue'
import { useRecentlyViewed } from '~/composables/useRecentlyViewed'
import { useFlashSale } from '~/composables/useFlashSale'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()
const toast = useUiToast()
const recentlyViewed = useRecentlyViewed()

const product = ref<Product | null>(null)
const selectedVariantImage = ref<string | null>(null)
const loading = ref(true)

const { getDealForProduct, formattedTimer, isCampaignActive } = useFlashSale()
const activeFlashDeal = computed(() => {
  if (!product.value || !isCampaignActive.value) return null
  return getDealForProduct(product.value.id)
})

useSeoMeta({
  title: () =>
    product.value ? `${product.value.name} - ShelfStack` : 'Detail Produk - ShelfStack',
  description: () =>
    product.value?.description || 'Beli produk berkualitas tinggi terkurasi resmi di ShelfStack.',
  ogTitle: () => (product.value ? `${product.value.name} - ShelfStack` : 'Detail Produk'),
  ogDescription: () =>
    product.value?.description || 'Beli produk berkualitas tinggi terkurasi resmi di ShelfStack.',
  ogImage: () => product.value?.image_url || undefined,
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() => {
        if (!product.value) return ''
        const schema = {
          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: product.value.name,
          image: product.value.image_url ? [product.value.image_url] : [],
          description: product.value.description || 'Produk terkurasi resmi ShelfStack.',
          sku: `SKU-${product.value.id}`,
          brand: {
            '@type': 'Brand',
            name: 'ShelfStack',
          },
          offers: {
            '@type': 'Offer',
            url: `https://shelfstack.atsiilaarya.me/product/${product.value.slug || product.value.id}`,
            priceCurrency: 'IDR',
            price: product.value.price,
            availability:
              product.value.stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
          },
          ...(product.value.rating
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: product.value.rating,
                  reviewCount: product.value.review_count || 1,
                  bestRating: 5,
                  worstRating: 1,
                },
              }
            : {}),
        }
        return JSON.stringify(schema)
      }),
    },
  ],
})

const param = computed(
  () => (route.params.id || (route.params as Record<string, string>).slug) as string,
)

const { data: asyncProduct } = await useAsyncData(
  `product-${param.value}`,
  async () => {
    if (!param.value) return null
    return await productStore.fetchProductById(param.value)
  },
  {
    default: () =>
      productStore.products.find((p) => p.slug === param.value || String(p.id) === param.value) ||
      null,
  },
)

if (asyncProduct.value) {
  product.value = asyncProduct.value
  loading.value = false
}

watch(
  asyncProduct,
  (val) => {
    if (val) {
      product.value = val
      loading.value = false
      selectedVariantImage.value = null
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (product.value) {
    recentlyViewed.addItem({
      id: product.value.id,
      name: product.value.name,
      slug: product.value.slug,
      price: product.value.price,
      imageUrl: product.value.image_url,
      category: product.value.category_id || undefined,
      stock: product.value.stock,
    })

    if (/^\d+$/.test(param.value) && product.value.slug) {
      router.replace({ path: `/product/${product.value.slug}` })
    }
  } else if (!asyncProduct.value) {
    loading.value = false
  }
})

const createCartPayload = (payload: ProductSelectionPayload, openCartDrawer: boolean) => {
  if (!product.value) return null
  const originalPriceCents = product.value.price_cents || Math.round(product.value.price * 100)
  const isPromo = Boolean(
    activeFlashDeal.value && activeFlashDeal.value.promo_price_cents < originalPriceCents,
  )

  return {
    productId: product.value.id,
    slug: product.value.slug,
    name: product.value.name,
    price: payload.price || product.value.price,
    priceCents: Math.round((payload.price || product.value.price) * 100),
    originalPriceCents: isPromo ? originalPriceCents : null,
    imageUrl: product.value.image_url,
    quantity: payload.quantity,
    stock: product.value.stock,
    color: payload.color,
    material: payload.material,
    variantId: payload.variantId,
    variantName: payload.variantName,
    openCartDrawer,
  }
}

const onAddToBag = (payload: ProductSelectionPayload) => {
  const item = createCartPayload(payload, true)
  if (!item || !product.value) return

  cartStore.addItem(item)
  toast.add({
    severity: 'success',
    summary: 'Ditambahkan ke Bag',
    detail: `${product.value.name} (${payload.quantity}x) berhasil dimasukkan.`,
    life: 3000,
  })
}

const onBuyNow = (payload: ProductSelectionPayload) => {
  const item = createCartPayload(payload, false)
  if (!item) return

  cartStore.addItem(item)
  router.push('/checkout')
}
</script>

<template>
  <div class="space-y-8 pb-16 pt-2">
    <!-- Breadcrumbs with Responsive Container Ellipsis -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center text-xs font-medium text-brand-muted pb-2 border-b border-brand-hairsoft min-w-0"
    >
      <ol class="flex items-center gap-2 m-0 p-0 list-none min-w-0 flex-1">
        <li class="shrink-0 flex items-center gap-2">
          <NuxtLink
            to="/"
            class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
          >
            ShelfStack
          </NuxtLink>
          <span class="text-brand-faint" aria-hidden="true">/</span>
        </li>
        <li class="shrink-0 flex items-center gap-2">
          <NuxtLink
            to="/katalog"
            class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
          >
            Katalog
          </NuxtLink>
          <span class="text-brand-faint" aria-hidden="true">/</span>
        </li>
        <li v-if="product" class="min-w-0 flex-1 truncate">
          <span
            class="text-brand-ink font-semibold truncate block"
            :title="product.name"
            aria-current="page"
          >
            {{ product.name }}
          </span>
        </li>
      </ol>
    </nav>

    <!-- Loading Skeleton View -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 animate-pulse">
      <div class="lg:col-span-5 aspect-square w-full bg-brand-field rounded-card" />
      <div class="lg:col-span-7 space-y-4">
        <div class="h-4 w-32 bg-brand-field rounded-full" />
        <div class="h-8 w-3/4 bg-brand-field rounded-full" />
        <div class="h-6 w-1/3 bg-brand-field rounded-full" />
        <div class="h-24 w-full bg-brand-field rounded-card" />
        <div class="h-12 w-full bg-brand-field rounded-full" />
      </div>
    </div>

    <!-- Product Detail Hub -->
    <div v-else-if="product" class="space-y-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div class="lg:col-span-5">
          <ProductGallery :product="product" :active-image-override="selectedVariantImage" />
        </div>
        <div class="lg:col-span-7 space-y-6 lg:sticky lg:top-24">
          <ProductFlashSaleBanner
            v-if="activeFlashDeal"
            :deal="activeFlashDeal"
            :timer-text="formattedTimer"
          />
          <ProductConfigurator
            :product="product"
            :flash-price="activeFlashDeal ? activeFlashDeal.promo_price_cents / 100 : null"
            @change-variant-image="selectedVariantImage = $event"
            @add-to-bag="onAddToBag"
            @buy-now="onBuyNow"
          />
          <ProductShippingEstimator :product-price="product.price" />
        </div>
      </div>

      <!-- Product Reviews Section -->
      <ProductReviewsSection :product-id="product.id" :product-name="product.name" />

      <!-- Product Related Recommendations Section (Backlog C-03) -->
      <ProductRelatedSection :product="product" />

      <!-- Recently Viewed Products Section -->
      <ProductRecentlyViewedSection :current-product-id="product.id" />
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
