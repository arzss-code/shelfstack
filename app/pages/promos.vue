<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '~/features/cart/stores/cart'

interface PromoCoupon {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  formatted_discount: string
  max_discount_cents: number | null
  formatted_max_discount: string | null
  min_purchase_cents: number
  formatted_min_purchase: string
  usage_limit: number | null
  usage_count: number
  remaining_quota: number | null
  user_limit: number
  starts_at: string | null
  expires_at: string | null
  is_expired: boolean
  is_available: boolean
}

useSeoMeta({
  title: 'Pusat Promo & Voucher Resmi - ShelfStack',
  description:
    'Temukan kode kupon promo dan voucher diskon resmi ShelfStack. Nikmati potongan harga hingga 20% untuk berbagai produk pilihan.',
})

const cartStore = useCartStore()

const coupons = ref<PromoCoupon[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const selectedFilter = ref<'all' | 'percentage' | 'fixed'>('all')
const copiedCode = ref<string | null>(null)
const appliedNotification = ref<string | null>(null)

const fetchCoupons = async () => {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<{ status: string; data: PromoCoupon[] }>('/api/coupons')
    if (res?.data) {
      coupons.value = res.data
    }
  } catch (err: any) {
    errorMessage.value =
      err?.data?.message || 'Gagal memuat daftar voucher promo. Silakan coba kembali.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCoupons()
})

const filteredCoupons = computed(() => {
  return coupons.value.filter((coupon) => {
    if (selectedFilter.value === 'percentage') {
      return coupon.discount_type === 'percentage'
    }
    if (selectedFilter.value === 'fixed') {
      return coupon.discount_type === 'fixed'
    }
    return true
  })
})

const copyCouponCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    setTimeout(() => {
      if (copiedCode.value === code) {
        copiedCode.value = null
      }
    }, 2500)
  } catch {
    // Fallback if clipboard API is restricted
    copiedCode.value = code
  }
}

const applyToCartAndOpen = async (code: string) => {
  await copyCouponCode(code)

  if (cartStore.totalPriceCents > 0) {
    try {
      const res = await $fetch<{ status: string; data: any }>('/api/coupons/validate', {
        method: 'POST',
        body: {
          code,
          subtotal_cents: cartStore.totalPriceCents,
        },
      })
      if (res?.data) {
        cartStore.applyCoupon({
          code: res.data.code,
          name: res.data.name,
          description: res.data.description,
          discount_type: res.data.discount_type,
          discount_value: res.data.discount_value,
          max_discount_cents: res.data.max_discount_cents,
          min_purchase_cents: res.data.min_purchase_cents,
          discount_cents: res.data.discount_cents,
          formatted_discount: res.data.formatted_discount,
        })
        appliedNotification.value = `Voucher ${code} berhasil diterapkan ke keranjang!`
      }
    } catch {
      appliedNotification.value = `Kode ${code} disalin! Periksa syarat kupon di keranjang.`
    }
  } else {
    appliedNotification.value = `Voucher ${code} disalin! Tambahkan produk untuk menggunakannya.`
  }

  // Open cart drawer
  cartStore.openDrawer()

  setTimeout(() => {
    appliedNotification.value = null
  }, 3500)
}
</script>

<template>
  <div class="promos-page pb-16 space-y-10">
    <!-- HERO SECTION (Editorial Archival Modernist) -->
    <section class="relative pt-4 pb-2">
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-xs text-brand-muted mb-6" aria-label="Breadcrumb">
        <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline">
          Beranda
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <span class="text-brand-ink font-semibold">Voucher &amp; Promo</span>
      </nav>

      <div
        class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-brand-hair"
      >
        <div class="max-w-2xl space-y-3">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-accent text-xs font-semibold"
          >
            <span class="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span>Klaim Penghematan Belanja</span>
          </div>
          <h1
            class="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-brand-ink leading-tight"
          >
            Pusat Voucher &amp; Promo Resmi
          </h1>
          <p class="text-sm sm:text-base text-brand-muted leading-relaxed max-w-xl">
            Gunakan kode kupon resmi ShelfStack saat checkout. Salin kode promo di bawah atau klik
            terapkan langsung ke keranjang belanja Anda.
          </p>
        </div>

        <!-- Live Metrics Chips -->
        <div class="flex flex-wrap items-center gap-2.5">
          <div
            class="px-3.5 py-2 rounded-2xl bg-brand-canvas-soft border border-brand-hair flex items-center gap-2 text-xs font-semibold text-brand-ink"
          >
            <i class="pi pi-ticket text-brand-accent" />
            <span>{{ coupons.length }} Voucher Aktif</span>
          </div>
          <div
            class="px-3.5 py-2 rounded-2xl bg-brand-canvas-soft border border-brand-hair flex items-center gap-2 text-xs font-semibold text-brand-ink"
          >
            <i class="pi pi-percentage text-emerald-600" />
            <span>Hemat hingga 20%</span>
          </div>
          <div
            class="px-3.5 py-2 rounded-2xl bg-brand-canvas-soft border border-brand-hair flex items-center gap-2 text-xs font-semibold text-brand-ink"
          >
            <i class="pi pi-truck text-amber-600" />
            <span>Bebas Ongkir min. Rp500rb</span>
          </div>
        </div>
      </div>
    </section>

    <!-- FLOATING TOAST NOTIFICATION -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="appliedNotification"
        class="fixed bottom-6 right-6 z-50 bg-brand-ink text-white px-4 py-3 rounded-2xl shadow-floating flex items-center gap-3 text-xs font-semibold"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-400" />
        <span>{{ appliedNotification }}</span>
      </div>
    </Transition>

    <!-- FILTER SEGMENT BAR -->
    <section class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div
        class="flex items-center gap-1.5 p-1 bg-brand-canvas-soft border border-brand-hair rounded-full w-fit"
      >
        <button
          type="button"
          class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-0"
          :class="
            selectedFilter === 'all'
              ? 'bg-brand-ink text-white shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink'
          "
          @click="selectedFilter = 'all'"
        >
          Semua Voucher ({{ coupons.length }})
        </button>
        <button
          type="button"
          class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-0"
          :class="
            selectedFilter === 'percentage'
              ? 'bg-brand-ink text-white shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink'
          "
          @click="selectedFilter = 'percentage'"
        >
          Diskon Persen (%)
        </button>
        <button
          type="button"
          class="px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-0"
          :class="
            selectedFilter === 'fixed'
              ? 'bg-brand-ink text-white shadow-whisper'
              : 'bg-transparent text-brand-muted hover:text-brand-ink'
          "
          @click="selectedFilter = 'fixed'"
        >
          Potongan Flat (Rp)
        </button>
      </div>

      <div class="text-xs text-brand-muted flex items-center gap-1.5">
        <i class="pi pi-shield-check text-emerald-600" />
        <span>Kupon terverifikasi resmi oleh sistem ShelfStack</span>
      </div>
    </section>

    <!-- LOADING STATE -->
    <section v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="n in 3"
        :key="n"
        class="h-64 rounded-2xl border border-brand-hair bg-brand-canvas-soft animate-pulse p-6 flex flex-col justify-between"
      >
        <div class="space-y-3">
          <div class="w-24 h-6 rounded-full bg-brand-hair" />
          <div class="w-3/4 h-8 rounded-lg bg-brand-hair" />
          <div class="w-full h-4 rounded bg-brand-hair" />
        </div>
        <div class="w-full h-10 rounded-full bg-brand-hair" />
      </div>
    </section>

    <!-- ERROR STATE -->
    <section
      v-else-if="errorMessage"
      class="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 text-center space-y-4 max-w-lg mx-auto"
    >
      <i class="pi pi-exclamation-triangle text-2xl text-rose-600" />
      <div class="space-y-1">
        <h3 class="font-bold text-sm text-brand-ink">Gagal Memuat Kupon</h3>
        <p class="text-xs text-brand-muted">{{ errorMessage }}</p>
      </div>
      <button
        type="button"
        class="px-5 py-2 rounded-full bg-brand-ink text-white text-xs font-semibold hover:bg-brand-inkhover transition-colors cursor-pointer"
        @click="fetchCoupons"
      >
        Coba Lagi
      </button>
    </section>

    <!-- EMPTY STATE -->
    <section
      v-else-if="filteredCoupons.length === 0"
      class="py-16 text-center rounded-2xl border border-dashed border-brand-hair bg-brand-canvas-soft space-y-3"
    >
      <i class="pi pi-ticket text-3xl text-brand-muted" />
      <h3 class="font-bold text-base text-brand-ink">Tidak Ada Voucher pada Kategori Ini</h3>
      <p class="text-xs text-brand-muted max-w-sm mx-auto">
        Silakan pilih kategori filter lain atau pantau kembali halaman promo untuk penawaran
        terbaru.
      </p>
      <button
        type="button"
        class="mt-2 px-4 py-2 rounded-full bg-brand-ink text-white text-xs font-semibold hover:bg-brand-inkhover transition-colors cursor-pointer"
        @click="selectedFilter = 'all'"
      >
        Tampilkan Semua Voucher
      </button>
    </section>

    <!-- VOUCHER TICKET CARDS GRID (Tactile Notch Geometry) -->
    <section v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        v-for="coupon in filteredCoupons"
        :key="coupon.id"
        class="group relative bg-white border border-brand-hair hover:border-brand-ink/40 rounded-2xl p-5 shadow-whisper transition-all duration-200 flex flex-col justify-between overflow-hidden"
      >
        <!-- Top Badge & Discount Header -->
        <div class="space-y-3">
          <div class="flex items-start justify-between gap-3">
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight uppercase"
              :class="
                coupon.discount_type === 'percentage'
                  ? 'bg-blue-50 text-brand-accent border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              "
            >
              <i
                :class="coupon.discount_type === 'percentage' ? 'pi pi-percentage' : 'pi pi-tag'"
                class="text-[10px]"
              />
              <span>{{
                coupon.discount_type === 'percentage' ? 'Diskon Persen' : 'Potongan Flat'
              }}</span>
            </span>

            <span
              class="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Tersedia</span>
            </span>
          </div>

          <!-- Big Discount Number -->
          <div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink">
              {{ coupon.formatted_discount }}
            </h2>
            <p class="font-semibold text-xs text-brand-muted mt-0.5">
              {{ coupon.name }}
            </p>
          </div>

          <!-- Description if any -->
          <p
            v-if="coupon.description"
            class="text-xs text-brand-muted leading-relaxed line-clamp-2"
          >
            {{ coupon.description }}
          </p>

          <!-- Criteria Badges -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            <span
              class="px-2.5 py-1 rounded-lg bg-brand-canvas-soft border border-brand-hair text-[11px] text-brand-muted font-medium"
            >
              Min. Belanja {{ coupon.formatted_min_purchase }}
            </span>
            <span
              v-if="coupon.formatted_max_discount"
              class="px-2.5 py-1 rounded-lg bg-brand-canvas-soft border border-brand-hair text-[11px] text-brand-muted font-medium"
            >
              Maks. Potongan {{ coupon.formatted_max_discount }}
            </span>
          </div>
        </div>

        <!-- Perforated Line with Side Notches (Tactile Ticket Feel) -->
        <div class="relative my-4 flex items-center">
          <div
            class="absolute -left-7 w-4 h-4 rounded-full bg-brand-canvas border border-brand-hair shadow-inner"
          />
          <div class="w-full border-b border-dashed border-brand-hair" />
          <div
            class="absolute -right-7 w-4 h-4 rounded-full bg-brand-canvas border border-brand-hair shadow-inner"
          />
        </div>

        <!-- Bottom Actions & Code Copy -->
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <!-- Code Badge with Selectable Mono Text -->
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-canvas-soft border border-dashed border-brand-hair"
            >
              <span class="text-[10px] font-semibold text-brand-muted uppercase">Kode:</span>
              <span class="font-mono text-xs font-bold text-brand-ink tracking-wider">
                {{ coupon.code }}
              </span>
            </div>

            <!-- Quick Copy Button -->
            <button
              type="button"
              class="px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              :class="
                copiedCode === coupon.code
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-brand-hair text-brand-ink hover:bg-brand-canvas-soft active:scale-95'
              "
              @click="copyCouponCode(coupon.code)"
            >
              <i
                :class="
                  copiedCode === coupon.code ? 'pi pi-check text-[10px]' : 'pi pi-copy text-[10px]'
                "
              />
              <span>{{ copiedCode === coupon.code ? 'Tersalin' : 'Salin' }}</span>
            </button>
          </div>

          <!-- Primary CTA Button (Apply to Cart & Open Drawer) -->
          <button
            type="button"
            class="w-full py-2.5 px-4 rounded-full bg-brand-ink text-white hover:bg-brand-inkhover active:scale-[0.98] transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-whisper"
            @click="applyToCartAndOpen(coupon.code)"
          >
            <i class="pi pi-shopping-bag text-xs" />
            <span>Gunakan di Keranjang</span>
          </button>
        </div>
      </article>
    </section>

    <!-- SECTION CARA MENGGUNAKAN VOUCHER (Transparent, Anti-slop) -->
    <section class="mt-14 pt-10 border-t border-brand-hair space-y-6">
      <div class="max-w-xl space-y-2">
        <h2 class="font-display text-xl sm:text-2xl font-bold tracking-tight text-brand-ink">
          Cara Menggunakan Voucher Belanja
        </h2>
        <p class="text-xs sm:text-sm text-brand-muted leading-relaxed">
          Ikuti empat langkah mudah untuk menikmati potongan diskon di ShelfStack.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-5 rounded-2xl bg-white border border-brand-hair space-y-3">
          <div
            class="w-8 h-8 rounded-full bg-brand-ink text-white text-xs font-bold flex items-center justify-center font-display"
          >
            1
          </div>
          <h3 class="font-bold text-xs sm:text-sm text-brand-ink">Pilih Voucher</h3>
          <p class="text-xs text-brand-muted leading-relaxed">
            Pilih voucher yang sesuai dengan nominal belanja atau kategori produk yang ingin Anda
            beli.
          </p>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-brand-hair space-y-3">
          <div
            class="w-8 h-8 rounded-full bg-brand-ink text-white text-xs font-bold flex items-center justify-center font-display"
          >
            2
          </div>
          <h3 class="font-bold text-xs sm:text-sm text-brand-ink">Salin atau Terapkan</h3>
          <p class="text-xs text-brand-muted leading-relaxed">
            Klik tombol "Salin" atau tombol "Gunakan di Keranjang" untuk langsung mengaktifkan kupon
            di keranjang.
          </p>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-brand-hair space-y-3">
          <div
            class="w-8 h-8 rounded-full bg-brand-ink text-white text-xs font-bold flex items-center justify-center font-display"
          >
            3
          </div>
          <h3 class="font-bold text-xs sm:text-sm text-brand-ink">Periksa Diskon</h3>
          <p class="text-xs text-brand-muted leading-relaxed">
            Pada ringkasan pesanan, periksa rincian potongan kupon sebelum melanjutkan proses
            checkout.
          </p>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-brand-hair space-y-3">
          <div
            class="w-8 h-8 rounded-full bg-brand-ink text-white text-xs font-bold flex items-center justify-center font-display"
          >
            4
          </div>
          <h3 class="font-bold text-xs sm:text-sm text-brand-ink">Bayar Tagihan Bersih</h3>
          <p class="text-xs text-brand-muted leading-relaxed">
            Selesaikan pembayaran melalui Midtrans Snap sesuai nominal akhir setelah potongan
            diskon.
          </p>
        </div>
      </div>
    </section>

    <!-- EXPLORE CATALOG CALLOUT BANNER -->
    <section
      class="mt-8 p-6 sm:p-8 rounded-3xl bg-brand-canvas-soft border border-brand-hair flex flex-col sm:flex-row items-center justify-between gap-6"
    >
      <div class="space-y-1 text-center sm:text-left">
        <h3 class="font-display text-lg sm:text-xl font-bold text-brand-ink">
          Siap Memulai Belanja?
        </h3>
        <p class="text-xs sm:text-sm text-brand-muted">
          Jelajahi koleksi produk pilihan dan gunakan voucher promo Anda sekarang.
        </p>
      </div>

      <NuxtLink
        to="/katalog"
        class="px-6 py-3 rounded-full bg-brand-ink text-white hover:bg-brand-inkhover transition-all text-xs font-semibold flex items-center gap-2 no-underline active:scale-95 shadow-whisper shrink-0"
      >
        <span>Jelajahi Katalog Lengkap</span>
        <i class="pi pi-arrow-right text-xs" />
      </NuxtLink>
    </section>
  </div>
</template>
