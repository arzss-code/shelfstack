<script setup lang="ts">
// Flash deals mockup data (statis saat ini, siap dihubungkan ke backend database)
const flashDeals = [
  {
    id: 'deal-1',
    name: 'Headphone Nirkabel Studio ANC',
    category: 'Audio',
    discount: 'HEMAT 20%',
    rating: '4.9',
    reviews: '320',
    price: 2790000,
    originalPrice: 3490000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAynKifeGh812agpR-N5vrbzYrObnMBGBpKqOt5BuB8nzQSr3hRM2QiC8Es4mJ6TZryn6kp3D-34nzApSaNKo6bZiB1f6-2uwYTAANz5M1-ozj1kzcmJc4MPgN0GOYc-xyMkK-fmzpQWwrqxTtJ2DgOso0KwutBsnXS4ij7LnjLtCruiTCVDHWkH-Wj2tQ5i-SDX1dj3rI3HRyzpGuAkJFRvs8Ssem43I8fz-D6nOJbVH8zBxp0Hs7I',
  },
  {
    id: 'deal-2',
    name: 'Teko Leher Angsa Presisi Matte',
    category: 'Dapur',
    discount: 'HEMAT 15%',
    rating: '4.8',
    reviews: '194',
    price: 1390000,
    originalPrice: 1650000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAlVHdoo0TBYH_29rzh60ZaJN1zAp3FM5XY4LsF_uNFymSb0KJeLCCj39PwJuAOs0hWip88VsrQrMxHOYqDiy1DFtpIPoN8S1wcV33KEpPivlgegL1rCYjxgfVfYEGvufmoAzyXKuW42Jg9tjaU4rxf4PETHL2D2nquOW83Mch-6pil3L49VlyYuf1L1HXHO5f0o7iRYqG750DfVR0svuzT0Ad2czpMhRObhAtfeWjLbf7hROElsBRl',
  },
  {
    id: 'deal-3',
    name: 'Tas Ransel Komuter Tahan Air',
    category: 'Aksesoris',
    discount: 'HEMAT 25%',
    rating: '5.0',
    reviews: '142',
    price: 2150000,
    originalPrice: 2850000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCadIIQO11giIAUD132e7ZegJ34KKp0iYv606GF2tsBOjKa0pr_kzvpQNQn7xyuWLhuceoyYjmGzTQBfSqWlR3LKlXZ3LWlitc_jnvtlV6UWKNjOftbu32cotcD4v-MfNIBqAeY1-CvkM53Q86F-kLP-8jxcmrcJO5PWZQ15FpNfLMpX8ElpBV85rYw9rG7OkCXFjbPCb9O3szD7-mk3ZCDsQKHPojIrXgxR3E_-89VhZ_vYXSgVJLD',
  },
  {
    id: 'deal-4',
    name: 'Pena Presisi Titanium & Kuningan',
    category: 'Alat Tulis',
    discount: 'HEMAT 30%',
    rating: '4.8',
    reviews: '96',
    price: 720000,
    originalPrice: 1050000,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCtGtrTCVBPJytnec8yoiKZ2iY9yzFgcAGMVbDl8vffvV6ZEoNZFfgeDAQvYGDQ9PHSAAxfVK2j8hKUAZ8b8VxmoAnLrSjVNR8ihTPjQ6pP4gUAImGZd2tG7Lzf12mjzZ9daMM6X8wl7uLjiCTNo0sgJqsJX1aqeuE6NGKVIOcdjxjMbFEaL7kqquFVa0SMIXQWDpPCysw4-xUBBBhXrgB7_alEgVQ5G1N_PIViWD7Wd3vqGT2JE6cr',
  },
]
</script>

<template>
  <section class="w-full bg-brand-ink text-white rounded-card p-6 sm:p-10 shadow-floating">
    <div
      class="flex flex-col lg:flex-row lg:items-center justify-between pb-8 gap-4 border-b border-white/10"
    >
      <div>
        <div class="flex items-center gap-2 mb-1.5 text-brand-accent">
          <i class="pi pi-bolt text-base" />
          <span class="text-xs font-bold tracking-wide uppercase">Penawaran Spesial Hari Ini</span>
        </div>
        <h2 class="font-display text-2xl sm:text-3xl font-bold text-white m-0">
          Penawaran Terbatas
        </h2>
        <p class="text-xs sm:text-sm text-white/70 m-0 mt-1">
          Potongan harga eksklusif untuk produk pilihan dengan alokasi stok terbatas.
        </p>
      </div>

      <!-- Countdown Unit -->
      <div
        class="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-card border border-white/10 shrink-0"
      >
        <span class="text-xs text-white/70">Berakhir dalam</span>
        <span class="text-base font-bold text-white tracking-widest">07 : 42 : 08</span>
      </div>
    </div>

    <!-- 4 Deal Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-8">
      <div
        v-for="deal in flashDeals"
        :key="deal.id"
        class="bg-white text-brand-ink rounded-card p-4 flex flex-col justify-between gap-3 shadow-whisper"
      >
        <div
          class="relative aspect-square rounded-media overflow-hidden bg-brand-canvas-soft border border-brand-hair"
        >
          <img :src="deal.image" :alt="deal.name" class="w-full h-full object-cover" />
          <span
            class="absolute top-2 left-2 bg-brand-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
          >
            {{ deal.discount }}
          </span>
        </div>

        <div>
          <div class="flex items-center gap-1 text-[11px] text-brand-muted mb-1">
            <i class="pi pi-star-fill text-[10px] text-brand-warning" />
            <span class="font-bold text-brand-ink">{{ deal.rating }}</span>
            <span>({{ deal.reviews }})</span>
          </div>
          <h4 class="font-display text-sm font-bold text-brand-ink m-0 line-clamp-1">
            {{ deal.name }}
          </h4>
          <div class="flex items-baseline gap-2 mt-1.5">
            <span class="text-base font-bold text-brand-ink"
              >Rp {{ deal.price.toLocaleString('id-ID') }}</span
            >
            <span class="text-xs text-brand-faint line-through"
              >Rp {{ deal.originalPrice.toLocaleString('id-ID') }}</span
            >
          </div>
        </div>

        <NuxtLink
          to="/katalog"
          class="w-full bg-brand-accent hover:bg-brand-accent-hover text-white text-xs font-semibold py-2.5 rounded-full text-center no-underline transition-colors shadow-whisper"
        >
          Lihat Produk
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
