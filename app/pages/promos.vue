<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '~/features/cart/stores/cart'
import type { UiTabItem } from '~/components/ui/UiTabs.vue'

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
  title: 'Voucher & Promo Belanja - ShelfStack',
  description:
    'Klaim voucher promo resmi ShelfStack. Dapatkan potongan harga langsung untuk perlengkapan meja kerja dan audio pilihan.',
})

const cartStore = useCartStore()
const toast = useUiToast()

const coupons = ref<PromoCoupon[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const selectedTab = ref<'all' | 'percentage' | 'fixed' | 'shipping'>('all')
const searchQuery = ref('')
const copiedCode = ref<string | null>(null)
const claimedCodes = ref<Set<string>>(new Set())

// Modal S&K State (Pola Tokopedia / Shopee: tidak merusak grid)
const isTermsModalOpen = ref(false)
const selectedTermsCoupon = ref<PromoCoupon | null>(null)

const tabItems = computed<UiTabItem[]>(() => [
  { value: 'all', label: 'Semua Voucher', count: coupons.value.length },
  {
    value: 'percentage',
    label: 'Diskon Belanja (%)',
    count: coupons.value.filter((c) => c.discount_type === 'percentage').length,
  },
  {
    value: 'fixed',
    label: 'Potongan Langsung (Rp)',
    count: coupons.value.filter((c) => c.discount_type === 'fixed').length,
  },
  { value: 'shipping', label: 'Gratis Ongkir' },
])

const formatDiscountBadge = (coupon: PromoCoupon) => {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}%`
  }
  const thousands = Math.floor(coupon.discount_value / 100000)
  return `${thousands.toLocaleString('id-ID')}rb`
}

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
  if (cartStore.appliedCoupon) {
    claimedCodes.value.add(cartStore.appliedCoupon.code)
  }
})

const filteredCoupons = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return coupons.value.filter((coupon) => {
    if (selectedTab.value === 'percentage' && coupon.discount_type !== 'percentage') {
      return false
    }
    if (selectedTab.value === 'fixed' && coupon.discount_type !== 'fixed') {
      return false
    }

    if (query) {
      const matchCode = coupon.code.toLowerCase().includes(query)
      const matchName = coupon.name.toLowerCase().includes(query)
      const matchDesc = coupon.description
        ? coupon.description.toLowerCase().includes(query)
        : false
      if (!matchCode && !matchName && !matchDesc) {
        return false
      }
    }

    return true
  })
})

const showToast = (message: string) => {
  toast.add({
    severity: 'success',
    summary: 'Voucher Promo',
    detail: message,
    life: 3000,
  })
}

const copyCouponCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    showToast(`Kode voucher ${code} berhasil disalin ke papan klip.`)
    setTimeout(() => {
      if (copiedCode.value === code) {
        copiedCode.value = null
      }
    }, 2000)
  } catch {
    copiedCode.value = code
    showToast(`Kode voucher: ${code}`)
  }
}

const claimOrUseCoupon = async (coupon: PromoCoupon) => {
  if (claimedCodes.value.has(coupon.code)) {
    cartStore.openDrawer()
    showToast(`Voucher ${coupon.code} sudah aktif di keranjang belanja.`)
    return
  }

  claimedCodes.value.add(coupon.code)

  if (cartStore.totalPriceCents > 0) {
    try {
      const res = await $fetch<{ status: string; data: any }>('/api/coupons/validate', {
        method: 'POST',
        body: {
          code: coupon.code,
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
        cartStore.openDrawer()
        showToast(`Voucher ${coupon.code} berhasil diklaim dan diterapkan ke keranjang.`)
        return
      }
    } catch {
      // Nominal di bawah syarat minimal, voucher tetap dicatat di state
    }
  }

  cartStore.applyCoupon({
    code: coupon.code,
    name: coupon.name,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    max_discount_cents: coupon.max_discount_cents,
    min_purchase_cents: coupon.min_purchase_cents,
    discount_cents: 0,
    formatted_discount: coupon.formatted_discount,
  })

  showToast(`Voucher ${coupon.code} berhasil diklaim. Potongan aktif saat checkout.`)
}

const openTermsModal = (coupon: PromoCoupon) => {
  selectedTermsCoupon.value = coupon
  isTermsModalOpen.value = true
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedTab.value = 'all'
}
</script>

<template>
  <div class="promos-page pb-16 space-y-6 max-w-5xl mx-auto">
    <!-- BREADCRUMB -->
    <nav class="flex items-center gap-2 text-xs text-brand-muted pt-2" aria-label="Breadcrumb">
      <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline">
        Beranda
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Voucher &amp; Promo</span>
    </nav>

    <!-- HERO BANNER DENGAN BACKGROUND ANIMASI HALUS -->
    <header
      class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white p-6 sm:p-8 shadow-floating"
    >
      <!-- Background Ambient Mesh Gradients Beranimasi -->
      <div
        class="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl animate-pulse-slow"
      />
      <div
        class="pointer-events-none absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl animate-pulse-slower"
      />

      <!-- Subtle Dot Matrix Background Texture -->
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.06] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
      />

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Voucher &amp; Promo Belanja
          </h1>
          <p class="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Klaim voucher diskon dan nikmati potongan harga langsung saat checkout pesanan di
            ShelfStack.
          </p>
        </div>

        <!-- Integrated Search Bar di Banner Menggunakan UiInput -->
        <div class="w-full sm:w-72 lg:w-80 shrink-0">
          <div class="bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/15">
            <UiInput
              v-model="searchQuery"
              size="sm"
              placeholder="Cari voucher promo..."
              left-icon="pi-search"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- CATEGORY TABS (MENGGUNAKAN UiTabs RESMI) -->
    <div class="overflow-x-auto pb-1 [scrollbar-width:none]">
      <UiTabs v-model="selectedTab" :items="tabItems" aria-label="Kategori Voucher" />
    </div>

    <!-- LOADING STATE (MENGGUNAKAN UiSkeleton RESMI) -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="n in 4"
        :key="n"
        class="p-4 rounded-2xl border border-brand-hair bg-white flex gap-4"
      >
        <UiSkeleton width="w-28" height="h-32" />
        <div class="flex-1 space-y-2 py-2">
          <UiSkeleton width="w-3/4" height="h-5" />
          <UiSkeleton width="w-1/2" height="h-4" />
          <UiSkeleton width="w-full" height="h-9" class="mt-4" />
        </div>
      </div>
    </div>

    <!-- ERROR STATE (MENGGUNAKAN UiAlert RESMI) -->
    <div v-else-if="errorMessage" class="p-2">
      <UiAlert tone="danger" title="Gagal Memuat Voucher">
        <p>{{ errorMessage }}</p>
        <div class="pt-2">
          <UiButton variant="outline" size="xs" @click="fetchCoupons"> Coba Lagi </UiButton>
        </div>
      </UiAlert>
    </div>

    <!-- MAIN VOUCHER CARDS GRID (KOMPAK, SIMETRIS, TANPA CEKUNGAN) -->
    <main v-else class="space-y-4">
      <!-- Special Free Shipping Banner Card -->
      <article
        v-if="selectedTab === 'all' || selectedTab === 'shipping'"
        class="relative bg-white border border-brand-hair hover:border-amber-300 rounded-2xl shadow-whisper overflow-hidden transition-all duration-200 flex"
      >
        <!-- Left Badge Stub (Tanpa Cekungan, Tanpa Garis Tengah) -->
        <div
          class="w-24 sm:w-28 shrink-0 bg-amber-50/80 p-3 sm:p-3.5 flex flex-col justify-between items-center text-center"
        >
          <UiBadge label="Ekspedisi" variant="warning" />
          <div class="my-auto py-1">
            <p
              class="text-xl sm:text-2xl font-extrabold text-amber-800 tracking-tight leading-none whitespace-nowrap"
            >
              BEBAS
            </p>
            <p class="text-[10px] font-semibold text-amber-700 leading-tight mt-0.5">Ongkir</p>
          </div>
          <p
            class="text-[10px] font-medium text-brand-muted pt-1.5 border-t border-amber-200/50 w-full truncate"
          >
            Min. Rp 500rb
          </p>
        </div>

        <!-- Right Details -->
        <div class="flex-1 p-3 sm:p-3.5 flex flex-col justify-between space-y-2.5 min-w-0">
          <div>
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-xs sm:text-sm font-bold text-brand-ink truncate">
                Gratis Ongkos Kirim Seluruh Indonesia
              </h2>
              <UiBadge label="Otomatis" variant="warning" />
            </div>
            <p class="mt-1 text-xs text-brand-muted leading-relaxed line-clamp-2">
              Potongan ongkos kirim otomatis aktif saat belanja mencapai Rp 500.000 untuk kurir JNE,
              SiCepat, dan J&amp;T.
            </p>
          </div>

          <div class="flex items-center justify-between gap-3 pt-2 border-t border-brand-hairsoft">
            <span class="text-[11px] text-brand-muted">
              Terpotong otomatis di form pengiriman.
            </span>
            <UiButton to="/katalog" variant="accent" size="xs"> Belanja Sekarang </UiButton>
          </div>
        </div>
      </article>

      <!-- Grid of Regular Promo Vouchers (items-start: Menjamin Kartu Sebelah Tidak Pernah Molor) -->
      <div
        v-if="selectedTab !== 'shipping'"
        class="grid grid-cols-1 md:grid-cols-2 items-start gap-4"
      >
        <article
          v-for="coupon in filteredCoupons"
          :key="coupon.id"
          class="relative bg-white border border-brand-hair hover:border-brand-ink/40 rounded-2xl shadow-whisper overflow-hidden flex transition-all duration-200"
        >
          <!-- LEFT STUB: Nilai Diskon Kompak, Angka 1 Baris Tanpa Wrap, Bebas Cekungan -->
          <div
            class="w-24 sm:w-28 shrink-0 p-3 sm:p-3.5 flex flex-col justify-between items-center text-center"
            :class="coupon.discount_type === 'percentage' ? 'bg-blue-50/70' : 'bg-emerald-50/70'"
          >
            <UiBadge
              :label="coupon.discount_type === 'percentage' ? 'Diskon' : 'Potongan'"
              :variant="coupon.discount_type === 'percentage' ? 'info' : 'success'"
            />

            <div class="my-auto py-1">
              <p
                class="text-xl sm:text-2xl font-extrabold tracking-tight leading-none whitespace-nowrap"
                :class="
                  coupon.discount_type === 'percentage' ? 'text-brand-accent' : 'text-emerald-700'
                "
              >
                {{ formatDiscountBadge(coupon) }}
              </p>
            </div>

            <p
              class="text-[10px] font-medium text-brand-muted pt-1.5 border-t border-brand-hairsoft w-full truncate"
            >
              Min. {{ coupon.formatted_min_purchase }}
            </p>
          </div>

          <!-- RIGHT BODY: Detail, Aksi, & Tombol S&K (Format Tokopedia / Shopee) -->
          <div class="flex-1 p-3 sm:p-3.5 flex flex-col justify-between space-y-2 min-w-0">
            <div>
              <div class="flex items-center justify-between gap-2">
                <h2 class="text-xs sm:text-sm font-bold text-brand-ink truncate">
                  {{ coupon.name }}
                </h2>
                <span
                  class="shrink-0 font-mono text-[10px] font-bold bg-brand-canvas-soft text-brand-ink px-2 py-0.5 rounded border border-brand-hair"
                >
                  {{ coupon.code }}
                </span>
              </div>

              <!-- Baris Info Ringkas & Sejajar -->
              <div class="mt-1 flex items-center gap-1.5 text-[11px] text-brand-muted truncate">
                <span
                  v-if="coupon.formatted_max_discount"
                  class="font-medium text-brand-ink shrink-0"
                >
                  Maks. {{ coupon.formatted_max_discount }}
                </span>
                <span v-if="coupon.formatted_max_discount" class="text-brand-faint">•</span>
                <span class="inline-flex items-center gap-1 shrink-0">
                  <i class="pi pi-clock text-[10px]" />
                  <span>{{
                    coupon.expires_at
                      ? `Hingga ${new Date(coupon.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                      : 'Seterusnya'
                  }}</span>
                </span>
                <span v-if="coupon.remaining_quota != null" class="text-brand-faint">•</span>
                <span v-if="coupon.remaining_quota != null" class="shrink-0">
                  Sisa {{ coupon.remaining_quota }}
                </span>
              </div>
            </div>

            <!-- Action & S&K Row: S&K di kiri, tombol aksi di kanan -->
            <div
              class="flex items-center justify-between gap-2 pt-2 border-t border-brand-hairsoft"
            >
              <button
                type="button"
                class="text-[11px] font-semibold text-brand-muted hover:text-brand-ink flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0 transition-colors"
                title="Lihat Syarat &amp; Ketentuan Lengkap"
                @click="openTermsModal(coupon)"
              >
                <span>S&amp;K</span>
                <i class="pi pi-angle-right text-[10px]" />
              </button>

              <div class="flex items-center gap-1.5 shrink-0">
                <UiButton
                  variant="outline"
                  size="xs"
                  :icon="copiedCode === coupon.code ? 'pi-check' : 'pi-copy'"
                  @click="copyCouponCode(coupon.code)"
                >
                  {{ copiedCode === coupon.code ? 'Tersalin' : 'Salin' }}
                </UiButton>

                <UiButton
                  :variant="claimedCodes.has(coupon.code) ? 'primary' : 'accent'"
                  size="xs"
                  @click="claimOrUseCoupon(coupon)"
                >
                  {{ claimedCodes.has(coupon.code) ? 'Pakai' : 'Klaim' }}
                </UiButton>
              </div>
            </div>
          </div>
        </article>
      </div>

      <!-- EMPTY STATE MENGGUNAKAN UiEmptyState RESMI -->
      <UiEmptyState
        v-if="filteredCoupons.length === 0 && selectedTab !== 'shipping'"
        icon="pi-ticket"
        title="Tidak ada voucher yang cocok"
        description="Coba ganti kata kunci pencarian atau pilih kategori voucher lainnya."
        action-label="Reset Filter"
        @action="resetFilters"
      />
    </main>

    <!-- MODAL SYARAT & KETENTUAN (TERSTRUKTUR: BENTO TILES + KETENTUAN JELAS) -->
    <UiModal
      v-model:visible="isTermsModalOpen"
      size="sm"
      :title="selectedTermsCoupon ? `Syarat & Ketentuan` : 'Syarat & Ketentuan Voucher'"
    >
      <div v-if="selectedTermsCoupon" class="space-y-4">
        <!-- Header Info Voucher -->
        <div
          class="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-canvas-soft border border-brand-hair"
        >
          <div
            class="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0"
            :class="
              selectedTermsCoupon.discount_type === 'percentage'
                ? 'bg-blue-100 text-brand-accent'
                : 'bg-emerald-100 text-emerald-700'
            "
          >
            {{ formatDiscountBadge(selectedTermsCoupon) }}
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-sm text-brand-ink truncate">
              {{ selectedTermsCoupon.name }}
            </h3>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="font-mono text-[10px] font-bold bg-white text-brand-ink px-2 py-0.5 rounded border border-brand-hair"
              >
                {{ selectedTermsCoupon.code }}
              </span>
              <UiBadge
                :label="
                  selectedTermsCoupon.discount_type === 'percentage'
                    ? 'Diskon Belanja'
                    : 'Potongan Langsung'
                "
                :variant="selectedTermsCoupon.discount_type === 'percentage' ? 'info' : 'success'"
              />
            </div>
          </div>
        </div>

        <!-- Bento Grid Parameter Ringkas & Padat -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-2.5 rounded-xl bg-brand-canvas border border-brand-hair space-y-0.5">
            <p class="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
              Min. Belanja
            </p>
            <p class="font-bold text-brand-ink">
              {{ selectedTermsCoupon.formatted_min_purchase }}
            </p>
          </div>

          <div class="p-2.5 rounded-xl bg-brand-canvas border border-brand-hair space-y-0.5">
            <p class="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
              Maks. Diskon
            </p>
            <p class="font-bold text-brand-ink">
              {{ selectedTermsCoupon.formatted_max_discount || 'Tanpa Batas Pagu' }}
            </p>
          </div>

          <div class="p-2.5 rounded-xl bg-brand-canvas border border-brand-hair space-y-0.5">
            <p class="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
              Masa Berlaku
            </p>
            <p class="font-bold text-brand-ink">
              {{
                selectedTermsCoupon.expires_at
                  ? new Date(selectedTermsCoupon.expires_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Berlaku Seterusnya'
              }}
            </p>
          </div>

          <div class="p-2.5 rounded-xl bg-brand-canvas border border-brand-hair space-y-0.5">
            <p class="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
              Batas Kuota
            </p>
            <p class="font-bold text-brand-ink">
              {{
                selectedTermsCoupon.remaining_quota != null
                  ? `Sisa ${selectedTermsCoupon.remaining_quota} kuota`
                  : 'Kuota Tersedia'
              }}
            </p>
          </div>
        </div>

        <!-- Ketentuan Penggunaan Terstruktur dengan Nomor Rapi -->
        <div class="space-y-2 text-xs">
          <p class="font-semibold text-brand-ink text-xs">Ketentuan Penggunaan:</p>
          <div class="space-y-2 text-brand-muted leading-relaxed">
            <div class="flex items-start gap-2">
              <span
                class="w-4 h-4 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-[10px] font-bold text-brand-ink shrink-0 mt-0.5"
              >
                1
              </span>
              <span>
                Voucher berlaku untuk transaksi belanja dengan nilai minimal
                <strong class="text-brand-ink font-semibold">{{
                  selectedTermsCoupon.formatted_min_purchase
                }}</strong
                >.
              </span>
            </div>

            <div class="flex items-start gap-2">
              <span
                class="w-4 h-4 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-[10px] font-bold text-brand-ink shrink-0 mt-0.5"
              >
                2
              </span>
              <span>
                Potongan otomatis memotong total belanja pada saat proses checkout setelah syarat
                terpenuhi.
              </span>
            </div>

            <div class="flex items-start gap-2">
              <span
                class="w-4 h-4 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-[10px] font-bold text-brand-ink shrink-0 mt-0.5"
              >
                3
              </span>
              <span>
                Dapat digunakan hingga
                <strong class="text-brand-ink font-semibold"
                  >{{ selectedTermsCoupon.user_limit }} kali</strong
                >
                per akun pengguna terdaftar.
              </span>
            </div>

            <div class="flex items-start gap-2">
              <span
                class="w-4 h-4 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-[10px] font-bold text-brand-ink shrink-0 mt-0.5"
              >
                4
              </span>
              <span>
                Voucher tidak dapat diuangkan dan berlaku selama alokasi kuota promosi masih
                tersedia di ShelfStack.
              </span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <UiButton variant="outline" size="sm" @click="isTermsModalOpen = false"> Tutup </UiButton>
        <UiButton
          v-if="selectedTermsCoupon"
          :variant="claimedCodes.has(selectedTermsCoupon.code) ? 'primary' : 'accent'"
          size="sm"
          @click="
            () => {
              claimOrUseCoupon(selectedTermsCoupon!)
              isTermsModalOpen = false
            }
          "
        >
          {{
            claimedCodes.has(selectedTermsCoupon.code) ? 'Gunakan di Keranjang' : 'Klaim Voucher'
          }}
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>

<style scoped>
@keyframes pulse-slow {
  0%,
  100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.15) translate(-10px, 10px);
    opacity: 0.4;
  }
}

@keyframes pulse-slower {
  0%,
  100% {
    transform: scale(1) translate(0, 0);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.1) translate(15px, -15px);
    opacity: 0.35;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}

.animate-pulse-slower {
  animation: pulse-slower 12s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-pulse-slow,
  .animate-pulse-slower {
    animation: none;
  }
}
</style>
