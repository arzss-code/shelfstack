<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import type { Product } from '~/types/product'
import { useToast } from 'primevue/usetoast'

const product = ref<Product | null>(null)

useSeoMeta({
  title: () =>
    product.value ? `${product.value.name} — ShelfStack Archival Hub` : 'Detail Produk',
})

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const toast = useToast()

const loading = ref(true)
const quantity = ref(1)
const selectedColor = ref('Matte Obsidian')
const selectedMaterial = ref('Anodized 6063 Alloy')

const colors = [
  { name: 'Matte Obsidian', class: 'bg-[#141414]' },
  { name: 'Silver Frost', class: 'bg-[#e2e2e2]' },
  { name: 'Space Gray', class: 'bg-[#525252]' },
]

const materials = [
  { name: 'Anodized 6063 Alloy', note: 'Standard Aerospace' },
  { name: 'Solid Walnut Wood', note: 'Hand-oiled finish' },
  { name: 'Merino Wool Felt', note: 'High acoustic absorption' },
]

onMounted(async () => {
  const id = Number(route.params.id)
  if (!isNaN(id)) {
    try {
      product.value = await productStore.fetchProductById(id)
    } catch (error: unknown) {
      toast.add({
        severity: 'error',
        summary: 'Gagal Memuat Produk',
        detail: error instanceof Error ? error.message : 'Terjadi kesalahan sistem.',
        life: 5000,
      })
    }
  }
  loading.value = false
})

const goBack = () => {
  router.push('/katalog')
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val)
}

const incrementQty = () => {
  quantity.value++
}

const decrementQty = () => {
  if (quantity.value > 1) quantity.value--
}

const addToBag = () => {
  toast.add({
    severity: 'success',
    summary: 'Ditambahkan ke Bag',
    detail: `${product.value?.name} (${quantity.value}x) berhasil dimasukkan.`,
    life: 3000,
  })
}
</script>

<template>
  <div class="space-y-8 pb-16 pt-2">
    <!-- Breadcrumbs & Status Bar -->
    <section
      class="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-brand-hairsoft"
    >
      <nav
        aria-label="Breadcrumbs"
        class="flex items-center gap-2 text-xs font-medium text-brand-muted overflow-x-auto py-1"
      >
        <NuxtLink
          to="/"
          class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
        >
          ShelfStack
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <NuxtLink
          to="/katalog"
          class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
        >
          Katalog
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <span v-if="product" class="text-brand-ink font-semibold truncate max-w-56">
          {{ product.name }}
        </span>
      </nav>

      <!-- Department & Inventory Chips -->
      <div v-if="product" class="flex items-center gap-2 flex-wrap text-xs">
        <span
          class="bg-brand-canvas-soft border border-brand-hair px-2.5 py-1 rounded-full font-medium text-brand-muted"
        >
          SKU: SS-MOD-0{{ product.id }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 bg-brand-canvas-soft border border-brand-hair text-brand-success font-semibold px-3 py-1 rounded-full"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse" />
          <span>Tersedia · Siap Kirim</span>
        </span>
      </div>
    </section>

    <!-- Kembali Button -->
    <div class="flex items-center">
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-canvas-soft hover:bg-brand-canvas border border-brand-hair text-xs font-semibold text-brand-ink transition-colors shadow-whisper cursor-pointer"
        @click="goBack"
      >
        <i class="pi pi-arrow-left text-xs" />
        <span>Kembali ke Katalog</span>
      </button>
    </div>

    <!-- Loading Skeleton View -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-pulse">
      <div class="lg:col-span-7 aspect-[4/3] bg-brand-field rounded-card" />
      <div class="lg:col-span-5 space-y-4">
        <div class="h-4 w-32 bg-brand-field rounded-full" />
        <div class="h-8 w-3/4 bg-brand-field rounded-full" />
        <div class="h-6 w-1/3 bg-brand-field rounded-full" />
        <div class="h-24 w-full bg-brand-field rounded-card" />
        <div class="h-12 w-full bg-brand-field rounded-full" />
      </div>
    </div>

    <!-- Product Detail Hub -->
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      <!-- LEFT: Modernist Gallery Stage (7 Cols) -->
      <div class="lg:col-span-7 flex flex-col gap-4">
        <!-- Main Media Container -->
        <div
          class="relative w-full aspect-[4/3] rounded-card bg-brand-field border border-brand-hair overflow-hidden flex items-center justify-center p-6 shadow-whisper group"
        >
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name"
            class="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
          />
          <div v-else class="flex flex-col items-center justify-center text-brand-faint">
            <i class="pi pi-image text-5xl mb-2" />
            <span class="text-xs font-medium">Gambar Produk Belum Tersedia</span>
          </div>

          <!-- Top Overlay Feature Chips -->
          <div class="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none">
            <span
              class="bg-brand-canvas/90 backdrop-blur-sm text-brand-ink border border-brand-hair text-xs font-semibold px-3 py-1 rounded-full shadow-whisper"
            >
              Precision Hardware
            </span>
            <span
              class="bg-brand-canvas/90 backdrop-blur-sm text-brand-ink border border-brand-hair text-xs font-semibold px-3 py-1 rounded-full shadow-whisper"
            >
              Modular Series
            </span>
          </div>

          <!-- Bottom Right Architectural Tag -->
          <div
            class="absolute bottom-4 right-4 bg-brand-ink text-brand-onink text-xs font-medium px-3 py-1 rounded-full shadow-whisper"
          >
            ShelfStack Original
          </div>
        </div>

        <!-- Micro-Showcase Spec Grid (3 Triad Boxes) -->
        <div class="grid grid-cols-3 gap-3 pt-2">
          <div
            class="bg-brand-canvas-soft border border-brand-hairsoft p-3.5 rounded-field flex flex-col items-center justify-center text-center shadow-whisper"
          >
            <i class="pi pi-shield text-brand-ink text-lg mb-1" />
            <span class="font-display font-bold text-sm text-brand-ink">2 Tahun</span>
            <span class="text-[11px] text-brand-muted">Garansi Resmi</span>
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

        <!-- Description & Technical Scope -->
        <div
          class="bg-brand-canvas border border-brand-hairsoft rounded-card p-6 sm:p-8 mt-2 space-y-4"
        >
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
        </div>
      </div>

      <!-- RIGHT: Multi-Variant Configurator & Commerce (5 Cols) -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        <!-- Title & Series Lockup -->
        <div>
          <h1
            class="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-ink leading-tight m-0 mb-3"
          >
            {{ product.name }}
          </h1>

          <!-- Reviews Social Proof -->
          <div class="flex items-center gap-3 text-xs text-brand-muted">
            <div
              class="inline-flex items-center gap-1 bg-brand-canvas-soft border border-brand-hair px-2.5 py-1 rounded-full"
            >
              <div class="flex text-brand-warning">
                <i class="pi pi-star-fill text-[11px]" />
                <i class="pi pi-star-fill text-[11px]" />
                <i class="pi pi-star-fill text-[11px]" />
                <i class="pi pi-star-fill text-[11px]" />
                <i class="pi pi-star-fill text-[11px]" />
              </div>
              <span class="font-bold text-brand-ink ml-1">4.94</span>
            </div>
            <span>486 ulasan terverifikasi</span>
          </div>
        </div>

        <!-- Pricing Card Container -->
        <div class="bg-brand-canvas-soft border border-brand-hair rounded-card p-5 space-y-2">
          <div class="flex items-baseline gap-3">
            <span class="font-display text-3xl font-bold text-brand-ink">
              {{ formatRupiah(product.price) }}
            </span>
            <span
              class="bg-brand-accent text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            >
              Best Value
            </span>
          </div>
          <p class="font-body text-xs text-brand-muted m-0">
            Dapat dicicil dengan bunga 0% untuk tenor 3–6 bulan. Pajak dan biaya administrasi sudah
            termasuk.
          </p>
        </div>

        <!-- Configurator 1: Colorways -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="uppercase tracking-wider font-semibold text-brand-muted">
              Pilihan Warna
            </span>
            <span class="font-bold text-brand-ink">{{ selectedColor }}</span>
          </div>
          <div class="flex items-center gap-2.5">
            <button
              v-for="c in colors"
              :key="c.name"
              type="button"
              :title="c.name"
              :class="[
                'w-9 h-9 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center',
                c.class,
                selectedColor === c.name
                  ? 'border-brand-accent ring-2 ring-brand-accent/30 scale-105'
                  : 'border-brand-hair hover:scale-105',
              ]"
              @click="selectedColor = c.name"
            >
              <i v-if="selectedColor === c.name" class="pi pi-check text-xs text-white" />
            </button>
          </div>
        </div>

        <!-- Configurator 2: Material Finish -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="uppercase tracking-wider font-semibold text-brand-muted">
              Pilihan Material
            </span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              v-for="m in materials"
              :key="m.name"
              type="button"
              :class="[
                'p-3 rounded-field text-left border transition-all cursor-pointer flex flex-col justify-between gap-1',
                selectedMaterial === m.name
                  ? 'bg-brand-ink text-brand-onink border-brand-ink shadow-whisper'
                  : 'bg-brand-canvas border-brand-hair text-brand-ink hover:bg-brand-canvas-soft',
              ]"
              @click="selectedMaterial = m.name"
            >
              <span class="text-xs font-bold">{{ m.name }}</span>
              <span
                :class="selectedMaterial === m.name ? 'text-brand-muted' : 'text-brand-faint'"
                class="text-[10px]"
              >
                {{ m.note }}
              </span>
            </button>
          </div>
        </div>

        <!-- Quantity Stepper & Add to Bag -->
        <div class="space-y-3 pt-2">
          <div class="flex items-center gap-3">
            <!-- Stepper Pill -->
            <div
              class="flex items-center bg-brand-field border border-brand-hair rounded-full p-1 shrink-0"
            >
              <button
                type="button"
                aria-label="Kurangi jumlah"
                class="w-8 h-8 rounded-full bg-brand-canvas text-brand-ink flex items-center justify-center hover:bg-brand-canvas-soft transition-colors cursor-pointer border-0"
                @click="decrementQty"
              >
                <i class="pi pi-minus text-xs" />
              </button>
              <span
                class="w-10 text-center font-display font-bold text-sm text-brand-ink tabular-nums"
              >
                {{ quantity }}
              </span>
              <button
                type="button"
                aria-label="Tambah jumlah"
                class="w-8 h-8 rounded-full bg-brand-canvas text-brand-ink flex items-center justify-center hover:bg-brand-canvas-soft transition-colors cursor-pointer border-0"
                @click="incrementQty"
              >
                <i class="pi pi-plus text-xs" />
              </button>
            </div>

            <!-- Primary Add to Bag Pill CTA -->
            <button
              type="button"
              class="flex-1 h-12 bg-brand-ink text-brand-onink hover:bg-brand-inkhover text-xs sm:text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-2 shadow-whisper cursor-pointer border-0"
              @click="addToBag"
            >
              <i class="pi pi-shopping-bag text-sm" />
              <span>Tambah ke Bag — {{ formatRupiah(product.price * quantity) }}</span>
            </button>
          </div>

          <!-- Instant 1-Click Buy Action -->
          <button
            type="button"
            class="w-full h-12 bg-brand-accent hover:bg-brand-accent-hover text-white text-xs sm:text-sm font-semibold rounded-full transition-all flex items-center justify-center gap-2 shadow-whisper cursor-pointer border-0"
            @click="addToBag"
          >
            <i class="pi pi-bolt text-sm" />
            <span>Pesan Cepat 1-Klik</span>
          </button>
        </div>

        <!-- Reassurance Triad -->
        <div
          class="pt-2 border-t border-brand-hairsoft grid grid-cols-3 gap-2 text-center text-xs text-brand-muted"
        >
          <div>
            <span class="block font-bold text-brand-ink">Gratis Ongkir</span>
            <span class="text-[11px] text-brand-faint">Pesanan &gt; Rp 200rb</span>
          </div>
          <div>
            <span class="block font-bold text-brand-ink">30 Hari Garansi</span>
            <span class="text-[11px] text-brand-faint">Retur mudah tanpa ribet</span>
          </div>
          <div>
            <span class="block font-bold text-brand-ink">100% Original</span>
            <span class="text-[11px] text-brand-faint">Jaminan kurasi resmi</span>
          </div>
        </div>
      </div>
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
      <NuxtLink
        to="/katalog"
        class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-ink text-brand-onink text-xs font-semibold no-underline hover:bg-brand-inkhover transition-colors shadow-whisper"
      >
        <span>Kembali ke Katalog</span>
        <i class="pi pi-arrow-right text-xs" />
      </NuxtLink>
    </div>
  </div>
</template>
