<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import { useToast } from 'primevue/usetoast'
import ProductList from '~/features/products/components/ProductList.vue'

useSeoMeta({
  title: 'ShelfStack — Toko Produk Esensial & Perlengkapan Modern',
  description:
    'ShelfStack: Toko online kebutuhan kerja, rumah tangga, audio studio, dan furnitur minimalis modern. Belanja aman, original, dan bergaransi.',
})

interface Category {
  id: string
  name: string
  slug: string
}

const productStore = useProductStore()
const toast = useToast()

const categories = ref<Category[]>([])
const selectedFilter = ref('Semua')

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
    name: 'Furnitur & Meja Kerja',
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

// Customer Testimonials
const reviews = [
  {
    quote:
      'Headphone studio dan meja kerja yang saya pesan tiba dengan kondisi sempurna. Kualitas materialnya benar-benar terasa kokoh dan memuaskan.',
    author: 'Hendra Setiawan',
    role: 'Kreator Konten & Audio',
    city: 'Jakarta',
    tag: 'Tech & Gadget',
  },
  {
    quote:
      'Teko gooseneck dan cangkir keramiknya sangat presisi untuk seduh kopi harian. Pengemasan sangat rapi dan protektif.',
    author: 'Sarah Lestari',
    role: 'Penggemar Kopi Manual',
    city: 'Bandung',
    tag: 'Rumah & Dapur',
  },
  {
    quote:
      'Katalognya sangat tertata dan estetik. Pengalaman belanja online paling memuaskan untuk merapikan setup meja kerja di rumah.',
    author: 'Budi Kurniawan',
    role: 'Desainer Produk',
    city: 'Surabaya',
    tag: 'Furnitur & Meja',
  },
]

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

  try {
    const res = await $fetch<{ status: string; data: Category[] }>('/api/categories')
    categories.value = res.data ?? []
  } catch {
    categories.value = []
  }
})
</script>

<template>
  <div class="space-y-16 sm:space-y-24">
    <!-- SECTION 1: HERO MULTI-DEPARTMENT SHOWCASE -->
    <section class="w-full pt-2">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <!-- Left Column: Editorial Statement & Actions -->
        <div class="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div class="space-y-4">
            <!-- Headline Utama (Mempertahankan teks verifikasi E2E Test) -->
            <h1
              class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-brand-ink leading-[1.08] text-balance m-0"
            >
              Etalase rapi di depan, operasional tertib di belakang.
            </h1>

            <p class="font-body text-base sm:text-lg text-brand-muted max-w-xl leading-relaxed m-0">
              ShelfStack mengkurasi perlengkapan harian berkualitas tinggi untuk kebutuhan kerja,
              rumah tangga, dan gaya hidup modern. Didesain dengan keandalan maksimal, daya tahan
              kuat, dan estetika minimalis.
            </p>
          </div>

          <!-- Call to Action Buttons -->
          <div class="flex flex-wrap items-center gap-3 pt-1">
            <NuxtLink
              to="/katalog"
              class="bg-brand-ink text-white font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-brand-inkhover transition-all flex items-center gap-2 no-underline shadow-whisper"
            >
              <span>Lihat Katalog</span>
              <i class="pi pi-arrow-right text-xs" />
            </NuxtLink>

            <NuxtLink
              to="/auth/login"
              class="bg-brand-canvas-soft hover:bg-brand-field text-brand-ink font-semibold text-sm px-6 py-3.5 rounded-full transition-all border border-brand-hair flex items-center gap-2 no-underline shadow-whisper"
            >
              <span>Masuk</span>
            </NuxtLink>
          </div>

          <!-- Informative Store Credibility Highlights -->
          <div class="pt-5 border-t border-brand-hair/60 grid grid-cols-3 gap-4 max-w-md">
            <div>
              <p
                class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tracking-tight"
              >
                1.300+
              </p>
              <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">
                Produk Pilihan
              </p>
            </div>
            <div>
              <p
                class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tracking-tight"
              >
                5 Kategori
              </p>
              <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">
                Kerja &amp; Rumah
              </p>
            </div>
            <div>
              <p
                class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0 tracking-tight flex items-center gap-1"
              >
                <span>4.9</span>
                <i class="pi pi-star-fill text-xs text-brand-warning" />
              </p>
              <p class="font-body text-xs text-brand-muted m-0 mt-0.5 font-medium">18rb+ Ulasan</p>
            </div>
          </div>
        </div>

        <!-- Right Column: Curatorial Showcase Mosaic -->
        <div class="lg:col-span-6 relative">
          <div class="grid grid-cols-12 gap-3">
            <!-- Main Hero Tile: Wireless Headphones -->
            <div
              class="col-span-8 bg-brand-canvas-soft rounded-card overflow-hidden relative group border border-brand-hair shadow-whisper"
            >
              <img
                class="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwVY6_XJIJ--I5tlVeVHvg6ErT_oBXt2avwd8dlAuTVukdzmLAppAhyNQAGXm3rQFEX1mHUEJ1GZ0wxvknebBIyNihYqTnXUswGHZuBSXpTUJrW6irkYFSwJUdz3lXaf3SIaU32wSKZaVrV6lC7Krf-diQ9YtZ80tMZPN0gDm7158w3dT3TGRm9DJY3Zr0K4RKBXS_5cVnFyD0hA50xpvdjViEWoa2fQmCh6xzjHcub1jp-D9HREja"
                alt="Headphone Nirkabel Studio"
              />
              <div
                class="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-full px-4 py-2 flex items-center justify-between border border-brand-hair shadow-whisper"
              >
                <div>
                  <p class="text-xs font-bold text-brand-ink m-0 leading-tight">
                    Headphone Studio ANC
                  </p>
                  <p class="text-[11px] text-brand-muted m-0">Koleksi Terlaris</p>
                </div>
                <span class="text-xs font-bold text-brand-accent">Rp2.680.000</span>
              </div>
            </div>

            <!-- Secondary Hero Mosaic Stack -->
            <div class="col-span-4 flex flex-col gap-3">
              <div
                class="bg-brand-canvas-soft rounded-card overflow-hidden h-40 sm:h-46 relative group border border-brand-hair shadow-whisper"
              >
                <img
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhuBSFbEmAvUs-dIR2YRW-AgUpd_FXgqc62yOMrFXAqiJxphILJy3g73g9zMSiczWs5C_QAJAN1CjOVg_pzST382d0uUBGS5pFhsCPOFK1nOrZaHe-97eQ5JqcvSwsi3UzEkT3yFNe2vkYGKvByoxn2fF4xlojiv56WR8B1rwrUZFxLT-WZVzHWHvp1T17Fqfe44ym_WRhnIIM_2T_g3dkxEIvLv9oyO86-o48wqWDKZfPrK2obggw"
                  alt="Lampu Meja Kerja"
                />
                <span
                  class="absolute top-2 right-2 bg-brand-ink text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold"
                >
                  Lampu Meja
                </span>
              </div>

              <div
                class="bg-brand-canvas-soft rounded-card overflow-hidden h-40 sm:h-46 relative group border border-brand-hair shadow-whisper"
              >
                <img
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaW1aKJlLR-zy1At4XWYvwZTHyVzcedxmF5czH_xXSLAw5u-HsTZgUrlfag8Lcz8Wy41SeSwYS-HeeyVsHZK3HIKWSVxEmb50sDQgwEwzPqy8Tk7DfzdvdVw4uC3VyiWSo8w_SV806yxW6xxj4tygQ5PGNzL4_0kdeany5eVB7SlX4r2_9T2mzzvz4Eqy6YNr5Hqd0-C230EfZJntIcrv_ptSdiTpKbYG9ESr-91MiSkickFdwXSq7"
                  alt="Tas Komuter Multifungsi"
                />
                <span
                  class="absolute bottom-2 left-2 bg-white text-brand-ink text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-whisper border border-brand-hair"
                >
                  Tas EDC
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: 4 SHOPPING ASSURANCES (Bilah Kebijakan Belanja Terpercaya) -->
    <section
      class="w-full bg-white border border-brand-hair rounded-card p-5 sm:p-6 shadow-whisper"
    >
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-brand-hairsoft"
      >
        <div class="flex items-center gap-3.5 sm:px-3">
          <div
            class="w-11 h-11 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center shrink-0 text-brand-accent shadow-whisper"
          >
            <i class="pi pi-verified text-lg" />
          </div>
          <div>
            <h4 class="font-display m-0 text-sm font-bold text-brand-ink">100% Produk Original</h4>
            <p class="font-body m-0 text-xs text-brand-muted mt-0.5">
              Jaminan keaslian resmi langsung dari produsen
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-3">
          <div
            class="w-11 h-11 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center shrink-0 text-brand-ink shadow-whisper"
          >
            <i class="pi pi-truck text-lg" />
          </div>
          <div>
            <h4 class="font-display m-0 text-sm font-bold text-brand-ink">
              Gratis Ongkir Se-Indonesia
            </h4>
            <p class="font-body m-0 text-xs text-brand-muted mt-0.5">
              Bebas ongkos kirim min. belanja Rp500.000
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-3">
          <div
            class="w-11 h-11 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center shrink-0 text-brand-ink shadow-whisper"
          >
            <i class="pi pi-replay text-lg" />
          </div>
          <div>
            <h4 class="font-display m-0 text-sm font-bold text-brand-ink">Garansi Retur 30 Hari</h4>
            <p class="font-body m-0 text-xs text-brand-muted mt-0.5">
              Jaminan tukar baru jika barang cacat atau tidak sesuai
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3.5 pt-4 sm:pt-0 sm:px-3">
          <div
            class="w-11 h-11 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center shrink-0 text-brand-accent shadow-whisper"
          >
            <i class="pi pi-comments text-lg" />
          </div>
          <div>
            <h4 class="font-display m-0 text-sm font-bold text-brand-ink">Layanan Bantuan 24/7</h4>
            <p class="font-body m-0 text-xs text-brand-muted mt-0.5">
              Respon cepat untuk konsultasi dan lacak pesanan
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 3: KATEGORI PILIHAN -->
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

    <!-- SECTION 4: FLASH DEALS -->
    <section class="w-full bg-brand-ink text-white rounded-card p-6 sm:p-10 shadow-floating">
      <div
        class="flex flex-col lg:flex-row lg:items-center justify-between pb-8 gap-4 border-b border-white/10"
      >
        <div>
          <div class="flex items-center gap-2 mb-1.5 text-brand-accent">
            <i class="pi pi-bolt text-base" />
            <span class="text-xs font-bold tracking-wide uppercase"
              >Penawaran Spesial Hari Ini</span
            >
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

    <!-- SECTION 5: PRODUK UNGGULAN -->
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

      <ProductList :products="featured" :loading="productStore.loading" hide-actions />
    </section>

    <!-- SECTION 6: KENAPA SHELFSTACK -->
    <section class="bg-brand-canvas-soft border border-brand-hair rounded-card p-6 sm:p-10">
      <div class="max-w-2xl mb-8">
        <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold text-brand-ink">
          Kenapa ShelfStack
        </h2>
        <p class="font-body m-0 mt-2 text-sm sm:text-base text-brand-muted">
          Komitmen kami untuk memberikan pengalaman belanja kebutuhan kerja dan rumah yang paling
          memuaskan.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="bg-white border border-brand-hairsoft rounded-card p-6 flex flex-col gap-3 shadow-whisper"
        >
          <div
            class="w-10 h-10 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-ink"
          >
            <i class="pi pi-check text-base text-brand-accent" />
          </div>
          <h3 class="font-display m-0 text-lg font-bold text-brand-ink">
            Kurasi Kualitas Terpilih
          </h3>
          <p class="font-body m-0 text-xs sm:text-sm leading-relaxed text-brand-muted">
            Setiap produk melalui uji fungsi dan daya tahan sebelum masuk katalog. Kami hanya
            menjual barang yang kami bangga gunakan sendiri.
          </p>
        </div>

        <div
          class="bg-white border border-brand-hairsoft rounded-card p-6 flex flex-col gap-3 shadow-whisper"
        >
          <div
            class="w-10 h-10 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-ink"
          >
            <i class="pi pi-lock text-base text-brand-ink" />
          </div>
          <h3 class="font-display m-0 text-lg font-bold text-brand-ink">
            Transaksi Aman &amp; Terlindungi
          </h3>
          <p class="font-body m-0 text-xs sm:text-sm leading-relaxed text-brand-muted">
            Sistem pembayaran terenkripsi dan jaminan uang kembali jika pesanan tidak sampai atau
            tidak sesuai deskripsi.
          </p>
        </div>

        <div
          class="bg-white border border-brand-hairsoft rounded-card p-6 flex flex-col gap-3 shadow-whisper"
        >
          <div
            class="w-10 h-10 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-ink"
          >
            <i class="pi pi-send text-base text-brand-ink" />
          </div>
          <h3 class="font-display m-0 text-lg font-bold text-brand-ink">
            Pengiriman Cepat &amp; Lacak Realtime
          </h3>
          <p class="font-body m-0 text-xs sm:text-sm leading-relaxed text-brand-muted">
            Pesanan diproses langsung dari gudang logistik dan nomor resi dapat dipantau setiap saat
            hingga tiba di depan pintu Anda.
          </p>
        </div>
      </div>
    </section>

    <!-- SECTION 7: ULASAN PEMBELI TERVERIFIKASI -->
    <section class="w-full">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold text-brand-ink">
            Ulasan Pembeli Terverifikasi
          </h2>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-brand-muted">
          <div class="flex text-brand-warning">
            <i class="pi pi-star-fill text-xs" />
            <i class="pi pi-star-fill text-xs" />
            <i class="pi pi-star-fill text-xs" />
            <i class="pi pi-star-fill text-xs" />
            <i class="pi pi-star-fill text-xs" />
          </div>
          <span class="font-bold text-brand-ink">4.92 / 5.0</span>
          <span>dari 18.400+ pesanan terkirim</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="rev in reviews"
          :key="rev.author"
          class="bg-brand-canvas-soft border border-brand-hair rounded-card p-6 flex flex-col justify-between gap-4 shadow-whisper"
        >
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex text-brand-warning text-xs">
                <i class="pi pi-star-fill" />
                <i class="pi pi-star-fill" />
                <i class="pi pi-star-fill" />
                <i class="pi pi-star-fill" />
                <i class="pi pi-star-fill" />
              </div>
              <span
                class="bg-white border border-brand-hair px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-brand-muted"
              >
                {{ rev.tag }}
              </span>
            </div>
            <p class="font-body text-xs sm:text-sm text-brand-ink leading-relaxed m-0">
              "{{ rev.quote }}"
            </p>
          </div>

          <div class="flex items-center gap-3 pt-3 border-t border-brand-hairsoft">
            <div
              class="w-8 h-8 rounded-full bg-brand-ink text-white text-xs font-bold flex items-center justify-center"
            >
              {{ rev.author.charAt(0) }}
            </div>
            <div>
              <p class="text-xs font-bold text-brand-ink m-0">{{ rev.author }}</p>
              <p class="text-[11px] text-brand-muted m-0">{{ rev.role }} · {{ rev.city }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 8: STRIP PROMO / ADMIN GATEWAY -->
    <section class="rounded-card bg-brand-ink text-white p-8 sm:p-12 shadow-floating">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div class="max-w-xl">
          <h2 class="font-display m-0 text-2xl sm:text-4xl font-bold leading-tight text-white mb-2">
            Kelola katalogmu sendiri
          </h2>
          <p class="font-body m-0 text-sm sm:text-base leading-relaxed text-white/80">
            Masuk sebagai pemilik toko untuk menambah produk baru, mengatur persediaan stok, dan
            memantau pesanan dari satu dashboard terpadu.
          </p>
        </div>

        <NuxtLink
          to="/auth/login"
          class="shrink-0 rounded-full bg-white text-brand-ink px-8 py-3.5 text-sm font-bold no-underline hover:bg-white/90 transition-colors shadow-whisper inline-flex items-center justify-center"
        >
          Masuk
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
