<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface TrustCommitment {
  title: string
  tag: string
  icon: string
  description: string
  metric: string
}

export interface FeaturedReview {
  id: string
  product_id: number
  product_name: string
  product_slug: string | null
  product_image_url: string | null
  rating: number
  review_text: string
  reviewer_name: string
  created_at: string
}

const props = withDefaults(
  defineProps<{
    initialReviews?: FeaturedReview[]
  }>(),
  {
    initialReviews: () => [],
  },
)

const commitments: TrustCommitment[] = [
  {
    title: 'Kurasi Fisik 100% Asli',
    tag: 'Keaslian Terjamin',
    icon: 'pi pi-shield',
    description:
      'Setiap unit produk melewati pemeriksaan fisik dan inspeksi kualitas langsung sebelum diarsipkan ke inventaris resmi ShelfStack.',
    metric: 'Inspeksi Fisik Mandiri',
  },
  {
    title: 'Jaminan Pengembalian 7 Hari',
    tag: 'Garansi Resmi',
    icon: 'pi pi-refresh',
    description:
      'Kebijakan purna jual transparan. Dapatkan penggantian unit atau pengembalian dana penuh jika produk cacat produksi dalam 7 hari.',
    metric: 'Garansi Purna Jual',
  },
  {
    title: 'Pengemasan Tahan Benturan',
    tag: 'Standar Logistik',
    icon: 'pi pi-box',
    description:
      'Protokol proteksi ganda dengan bantalan berdensitas tinggi dan segel keamanan untuk menjaga keutuhan produk hingga alamat tujuan.',
    metric: 'Proteksi Berlapis',
  },
  {
    title: 'Layanan Pelanggan Responsif',
    tag: 'Dukungan Langsung',
    icon: 'pi pi-headphones',
    description:
      'Dukungan operasional langsung oleh tim ShelfStack untuk bantuan pesanan, konfirmasi pembayaran, dan informasi teknis produk.',
    metric: 'Dukungan Operasional',
  },
]

const reviews = ref<FeaturedReview[]>(props.initialReviews)

// Ambil ulasan nyata pembeli terverifikasi dari backend API secara aman
try {
  const { data: reviewsResponse } = useFetch<{
    data: FeaturedReview[]
  }>('/api/reviews/featured', {
    lazy: true,
    server: true,
  })

  watch(
    () => reviewsResponse.value?.data,
    (newData) => {
      if (newData && newData.length > 0) {
        reviews.value = newData
      }
    },
    { immediate: true },
  )
} catch {
  // Fallback aman untuk lingkungan unit test tanpa instance NuxtApp aktif
}

const featuredReviews = computed<FeaturedReview[]>(() => reviews.value)
</script>

<template>
  <section class="w-full space-y-12" data-testid="customer-trust-section">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5 text-brand-accent">
          <i class="pi pi-verified text-base" aria-hidden="true" />
          <span class="text-xs font-bold tracking-wide uppercase"
            >Jaminan &amp; Integritas Produk</span
          >
        </div>
        <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold text-brand-ink">
          Standar Kualitas &amp; Kepuasan Pelanggan ShelfStack
        </h2>
        <p class="font-body text-sm sm:text-base text-brand-muted max-w-2xl m-0 mt-2">
          Komitmen transparansi tanpa rekayasa. Setiap pesanan dilindungi kurasi ketat, garansi
          resmi, dan perlindungan purna jual terpercaya.
        </p>
      </div>

      <div
        class="flex items-center gap-2 bg-brand-canvas-soft border border-brand-hair px-4 py-2 rounded-card text-xs text-brand-ink shrink-0 shadow-whisper"
      >
        <i class="pi pi-check-circle text-brand-success text-sm" aria-hidden="true" />
        <span class="font-semibold">Standar Operasional Terverifikasi</span>
      </div>
    </div>

    <!-- Verified Customer Reviews Showcase (Real Database Backed) -->
    <div v-if="featuredReviews.length > 0" class="space-y-4" data-testid="featured-reviews-block">
      <div class="flex items-center justify-between">
        <h3
          class="font-display text-lg sm:text-xl font-bold text-brand-ink m-0 flex items-center gap-2"
        >
          <i class="pi pi-comments text-brand-accent text-sm" aria-hidden="true" />
          <span>Ulasan Pembeli Terverifikasi</span>
        </h3>
        <span class="text-xs text-brand-muted font-medium">Berdasarkan Pesanan Selesai</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="review in featuredReviews"
          :key="review.id"
          class="bg-brand-canvas border border-brand-hair rounded-card p-6 flex flex-col justify-between gap-5 shadow-whisper transition-all hover:border-brand-accent/40"
          data-testid="featured-review-card"
        >
          <div class="space-y-3">
            <!-- Reviewer Info & Rating -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  class="w-9 h-9 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center font-display font-bold text-xs text-brand-ink shrink-0"
                >
                  {{ review.reviewer_name.charAt(0).toUpperCase() }}
                </div>
                <div class="min-w-0">
                  <p class="font-display text-xs sm:text-sm font-bold text-brand-ink m-0 truncate">
                    {{ review.reviewer_name }}
                  </p>
                  <p
                    class="font-body text-[10px] text-brand-success-text m-0 flex items-center gap-1"
                  >
                    <i class="pi pi-verified text-[10px]" aria-hidden="true" />
                    <span>Pembeli Terverifikasi</span>
                  </p>
                </div>
              </div>

              <!-- Rating Stars -->
              <div
                role="img"
                class="flex items-center gap-1 text-brand-warning shrink-0"
                :aria-label="`Rating ${review.rating} dari 5 bintang`"
              >
                <i
                  v-for="star in 5"
                  :key="star"
                  class="text-xs"
                  :class="star <= review.rating ? 'pi pi-star-fill' : 'pi pi-star'"
                  aria-hidden="true"
                />
              </div>
            </div>

            <!-- Review Text -->
            <blockquote
              class="font-body text-xs sm:text-sm text-brand-muted leading-relaxed m-0 italic"
            >
              "{{ review.review_text }}"
            </blockquote>
          </div>

          <!-- Product Context Link Pill -->
          <NuxtLink
            :to="`/product/${review.product_slug || review.product_id}`"
            class="pt-3 border-t border-brand-hairsoft flex items-center justify-between gap-3 no-underline group/link min-h-[44px]"
            :aria-label="`Buka detail produk ${review.product_name}`"
          >
            <div class="flex items-center gap-2 min-w-0">
              <img
                v-if="review.product_image_url"
                :src="review.product_image_url"
                :alt="review.product_name"
                width="32"
                height="32"
                class="w-8 h-8 rounded object-cover border border-brand-hair shrink-0"
                loading="lazy"
                decoding="async"
              />
              <div
                v-else
                class="w-8 h-8 rounded bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-muted shrink-0"
              >
                <i class="pi pi-box text-xs" aria-hidden="true" />
              </div>
              <span
                class="text-xs font-semibold text-brand-ink group-hover/link:text-brand-accent transition-colors truncate"
              >
                {{ review.product_name }}
              </span>
            </div>
            <i
              class="pi pi-arrow-right text-[10px] text-brand-muted group-hover/link:text-brand-accent transition-colors shrink-0"
              aria-hidden="true"
            />
          </NuxtLink>
        </article>
      </div>
    </div>

    <!-- 4 Core Trust Commitments Grid -->
    <div class="space-y-4">
      <h3 class="font-display text-lg sm:text-xl font-bold text-brand-ink m-0">
        Empat Komitmen Layanan Resmi
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="item in commitments"
          :key="item.title"
          class="bg-brand-canvas border border-brand-hair rounded-card p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-whisper transition-all hover:border-brand-accent/40"
          data-testid="trust-commitment-card"
        >
          <div>
            <div class="flex items-center justify-between mb-2.5">
              <div
                class="w-9 h-9 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0"
              >
                <i :class="[item.icon, 'text-sm']" aria-hidden="true" />
              </div>
              <span
                class="bg-brand-canvas-soft border border-brand-hair px-2 py-0.5 rounded-full text-[10px] font-semibold text-brand-muted"
              >
                {{ item.tag }}
              </span>
            </div>

            <h4 class="font-display text-sm font-bold text-brand-ink m-0 mb-1">
              {{ item.title }}
            </h4>

            <p class="font-body text-xs text-brand-muted leading-relaxed m-0">
              {{ item.description }}
            </p>
          </div>

          <div
            class="pt-2.5 border-t border-brand-hairsoft flex items-center justify-between text-caption text-brand-muted"
          >
            <span class="font-medium">{{ item.metric }}</span>
            <i class="pi pi-check text-brand-accent text-xs" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
