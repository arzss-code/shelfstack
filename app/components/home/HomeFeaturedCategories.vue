<script setup lang="ts">
// 5 Kategori Pilihan Utama
const featuredCategories = [
  {
    name: 'Tech & Gadget',
    category: 'tech',
    count: '420 Produk',
    desc: 'Audio resolusi tinggi, perangkat pintar nirkabel, keyboard mekanikal, dan adaptor daya presisi.',
    cta: 'Lihat Koleksi Tech',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCmvA8rTc663X0aMY0i5AsRtnJWHHEMBE15l26ff2OBzeQ4YDMUc2bIfeMkM1wTrGpE8S1YpwKD1VFVOTPX83GWEoIoe_Wa5MeCsuOmxDtwLGsMeIlQpoOx_MrCo-cewC9QSL9DbpyFqpGe5CRkiClgbq2Ky9rCJ0x0lVhK8dgvYyfzRf9uFB-43LAqvdnR3zkN9hNg27b6fzEk8dmLSQTX2fxG3PRKyc-Ag1IX7VVNaYXvISjMYLi4',
    spanTwo: true,
  },
  {
    name: 'Rumah & Dapur',
    category: 'home',
    count: '310 Produk',
    desc: 'Peralatan seduh kopi manual, gelas kaca borosilikat tahan panas, dan keramik meja makan minimalis.',
    cta: 'Lihat Koleksi Rumah',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDDdnlKb3T3WJuD42WKCuYWlCi4su1XSA6opLKqIdBufFf2I89pgRHDlMhA-UQF8FA_W3JOC97K0Q67vQxjw_-tNPtI8Emhlv4itv2QxeDnZLfXVHK1pvqKMf3q_32bMom_wtTevyGn9RDkAPGYTJQyVapwhGLWNqs0sM8vT8WYthdz-1U1PIzS4aiuVS1jCvjsJtrrE3FBMRl_xhjHgG0XQOOBR7eT595CX28mslcd4ewk9ikvHvjQ',
    spanTwo: false,
  },
  {
    name: 'Furnitur & Ruang Kerja',
    category: 'furniture',
    count: '180 Produk',
    desc: 'Kursi ergonomis, meja modular solid, dan sistem rak penyimpanan terorganisir untuk ruang kerja.',
    cta: 'Lihat Koleksi Furnitur',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBc4XLDPg-9mRKQs1TlWbx1Sb6XRiOWWni_U00DefHZgPir91Sh9rS7GKOm0M2z7-S_5MPydGZ4snKfV2T-45YtfmX164d7iygok6Xq5dDum6OvvemCbgkUxAQ5UejU182htov0POdSz3dv8rCbDOIL8RdpkpYwK8qlbeuhBv98GLCvxB8t7BKzw5Yw2aMy-fX1H5itwB8_gTE1ZqTCstf34P3WDCDvrtao2RT1FG0WniZroxgjAw0i',
    spanTwo: false,
  },
  {
    name: 'Pakaian & Aksesoris',
    category: 'lifestyle',
    count: '260 Produk',
    desc: 'Tas selempang harian, kaus katun organik combed, dan jam tangan fungsional berdaya tahan tinggi.',
    cta: 'Lihat Koleksi Pakaian',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAmK-nhltzS02RWfXj2Rx0Z8IvcV4TaPXHuYYeWMUhax_zC2LYbpNt--0RSd434mVakffTmk5s3va6NmCFXP32mL8xAUGwVx2oxYnYz_MI8jzlChs_vH53-QpQZQN9HgXIrNIxEUh-Gqko7SDdTs-v0pIb9qEn65QsCAFwAPLeEveKSsEmDVLW9YfSvaX7Q_HkhaHpfmUVv35TntI0JCNP3GnMk9WRyV4KVSnNZt_4xLlROZJMms7kg',
    spanTwo: false,
  },
  {
    name: 'Alat Tulis & Kerajinan',
    category: 'stationery',
    count: '150 Produk',
    desc: 'Pena presisi berbobot mantap, buku catatan bergaris halus, dan penggaris segitiga arsitektural.',
    cta: 'Lihat Koleksi Alat Tulis',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPUa0JzIOqwWaWZqIgu4I0PA1v7YbfFltproG-m3AwYxCiPhIouH_GwoAtPLqA3FnGnU-OMudyp3jajkJzdlcRAWIpVL0-paLzRvVRqx_L1jA73N31qDSXEo2y5pCl1pUeK734CTQrN5Eg_3ZGqZpnALspE46_3lMJDtkCoUBQC7202e3hqxG0XYEjKXtFPoKfZt_EtUzxp1sujWSSVRhcd1F4Kw9OTlD8ICNKKBY46ME_8Zpbu1K5',
    spanTwo: false,
  },
]
</script>

<template>
  <section class="w-full">
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
        v-for="cat in featuredCategories"
        :key="cat.name"
        :to="'/katalog?category=' + cat.category"
        :class="[
          'bg-brand-canvas-soft hover:bg-brand-field rounded-card overflow-hidden group transition-all border border-brand-hair shadow-whisper no-underline flex flex-col',
          cat.spanTwo ? 'lg:col-span-2 md:flex-row' : '',
        ]"
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
              <span class="text-xs font-medium text-brand-muted">{{ cat.count }}</span>
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
            <i class="pi pi-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
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
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
