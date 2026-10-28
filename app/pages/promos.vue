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

const coupons = ref<PromoCoupon[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const selectedTab = ref<'all' | 'percentage' | 'fixed' | 'shipping'>('all')
const searchQuery = ref('')
const copiedCode = ref<string | null>(null)
const claimedCodes = ref<Set<string>>(new Set())
const expandedTerms = ref<Record<string, boolean>>({})
const toastMessage = ref<string | null>(null)

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
  toastMessage.value = message
  setTimeout(() => {
    if (toastMessage.value === message) {
      toastMessage.value = null
    }
  }, 3000)
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

const toggleTerms = (id: string) => {
  expandedTerms.value[id] = !expandedTerms.value[id]
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
          <div class="inline-flex">
            <UiBadge label="Voucher &amp; Promo Resmi" variant="info" />
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Voucher &amp; Promo Belanja
          </h1>
          <p class="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Klaim voucher diskon dan nikmati potongan harga langsung saat checkout pesanan di
            ShelfStack.
          </p>
        </div>

        <!-- Integrated Search Bar di Banner -->
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

    <!-- TOAST NOTIFICATION -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-50 bg-brand-ink text-white px-4 py-3 rounded-xl shadow-floating flex items-center gap-2.5 text-xs font-semibold"
      >
        <i class="pi pi-check-circle text-emerald-400 text-sm" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

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

    <!-- ERROR STATE (MENGGUNAKAN UiButton RESMI) -->
    <div
      v-else-if="errorMessage"
      class="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 text-center space-y-3"
    >
      <i class="pi pi-exclamation-circle text-2xl text-rose-600" />
      <h3 class="font-bold text-sm text-brand-ink">Gagal Memuat Voucher</h3>
      <p class="text-xs text-brand-muted">{{ errorMessage }}</p>
      <UiButton variant="primary" size="sm" @click="fetchCoupons"> Coba Lagi </UiButton>
    </div>

    <!-- MAIN VOUCHER CARDS GRID (KOMPAK, NON-REDUNDAN) -->
    <main v-else class="space-y-4">
      <!-- Special Free Shipping Banner Card -->
      <article
        v-if="selectedTab === 'all' || selectedTab === 'shipping'"
        class="relative bg-white border border-brand-hair hover:border-amber-300 rounded-2xl shadow-whisper overflow-hidden transition-colors"
      >
        <div class="flex flex-col sm:flex-row">
          <!-- Left Badge Stub -->
          <div
            class="w-full sm:w-28 shrink-0 bg-amber-50/70 p-3.5 flex flex-col justify-between items-center text-center border-b sm:border-b-0 sm:border-r border-dashed border-brand-hair"
          >
            <UiBadge label="Ekspedisi" variant="warning" />
            <div class="my-auto py-1">
              <p
                class="text-xl sm:text-2xl font-extrabold text-amber-800 tracking-tight leading-none"
              >
                BEBAS
              </p>
              <p class="text-[10px] font-semibold text-amber-700 leading-tight mt-0.5">Ongkir</p>
            </div>
            <p
              class="text-[10px] font-medium text-brand-muted pt-1.5 border-t border-amber-200/50 w-full"
            >
              Min. Rp 500.000
            </p>
          </div>

          <!-- Right Details -->
          <div class="flex-1 p-3.5 flex flex-col justify-between space-y-2.5">
            <div>
              <div class="flex items-center justify-between gap-2">
                <h2 class="text-xs sm:text-sm font-bold text-brand-ink">
                  Gratis Ongkos Kirim Seluruh Indonesia
                </h2>
                <span
                  class="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full"
                >
                  Otomatis
                </span>
              </div>
              <p class="mt-1 text-xs text-brand-muted leading-relaxed">
                Potongan ongkos kirim otomatis aktif saat total belanja mencapai Rp 500.000 untuk
                kurir JNE, SiCepat, dan J&amp;T.
              </p>
            </div>

            <div
              class="flex items-center justify-between gap-3 pt-2 border-t border-brand-hairsoft"
            >
              <span class="text-[11px] text-brand-muted">
                Langsung terpotong di formulir pengiriman.
              </span>
              <UiButton to="/katalog" variant="accent" size="xs"> Belanja Sekarang </UiButton>
            </div>
          </div>
        </div>
      </article>

      <!-- Grid of Regular Promo Vouchers (Kompak, Tanpa Duplikasi Teks) -->
      <div v-if="selectedTab !== 'shipping'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article
          v-for="coupon in filteredCoupons"
          :key="coupon.id"
          class="relative bg-white border border-brand-hair hover:border-brand-ink/40 rounded-2xl shadow-whisper overflow-hidden flex flex-col justify-between transition-colors"
        >
          <!-- Notch Top & Bottom -->
          <div
            class="hidden sm:block absolute -top-3 left-28 w-6 h-6 rounded-full bg-brand-canvas border-b border-brand-hair z-10"
          />
          <div
            class="hidden sm:block absolute -bottom-3 left-28 w-6 h-6 rounded-full bg-brand-canvas border-t border-brand-hair z-10"
          />

          <div class="flex flex-col sm:flex-row h-full">
            <!-- LEFT STUB: Nilai Diskon Kompak -->
            <div
              class="w-full sm:w-28 shrink-0 p-3.5 flex flex-col justify-between items-center text-center border-b sm:border-b-0 sm:border-r border-dashed border-brand-hair"
              :class="coupon.discount_type === 'percentage' ? 'bg-blue-50/60' : 'bg-emerald-50/60'"
            >
              <UiBadge
                :label="coupon.discount_type === 'percentage' ? 'Diskon' : 'Potongan'"
                :variant="coupon.discount_type === 'percentage' ? 'info' : 'success'"
              />

              <div class="my-auto py-1">
                <p
                  class="text-xl sm:text-2xl font-extrabold tracking-tight leading-none"
                  :class="
                    coupon.discount_type === 'percentage' ? 'text-brand-accent' : 'text-emerald-700'
                  "
                >
                  {{
                    coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}%`
                      : `Rp ${(coupon.discount_value / 100000).toLocaleString('id-ID')}rb`
                  }}
                </p>
              </div>

              <p
                class="text-[10px] font-medium text-brand-muted pt-1.5 border-t border-brand-hairsoft w-full"
              >
                Min. {{ coupon.formatted_min_purchase }}
              </p>
            </div>

            <!-- RIGHT BODY: Detail & Aksi (Bebas Redundansi Teks) -->
            <div class="flex-1 p-3.5 flex flex-col justify-between space-y-2.5">
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

                <!-- Baris Info Ringkas & Padat -->
                <div
                  class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-brand-muted"
                >
                  <span v-if="coupon.formatted_max_discount" class="font-medium text-brand-ink">
                    Maks. {{ coupon.formatted_max_discount }}
                  </span>
                  <span v-if="coupon.formatted_max_discount" class="text-brand-faint">•</span>
                  <span class="inline-flex items-center gap-1">
                    <i class="pi pi-clock text-[10px]" />
                    <span>{{
                      coupon.expires_at
                        ? `Hingga ${new Date(coupon.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Berlaku Seterusnya'
                    }}</span>
                  </span>
                  <span v-if="coupon.remaining_quota != null" class="text-brand-faint">•</span>
                  <span v-if="coupon.remaining_quota != null">
                    Sisa {{ coupon.remaining_quota }} kuota
                  </span>
                </div>
              </div>

              <!-- Action Buttons Menggunakan UiButton Resmi -->
              <div class="flex items-center gap-2 pt-1 border-t border-brand-hairsoft">
                <UiButton
                  variant="outline"
                  size="xs"
                  class="flex-1"
                  :icon="copiedCode === coupon.code ? 'pi-check' : 'pi-copy'"
                  @click="copyCouponCode(coupon.code)"
                >
                  {{ copiedCode === coupon.code ? 'Tersalin' : 'Salin Kode' }}
                </UiButton>

                <UiButton
                  :variant="claimedCodes.has(coupon.code) ? 'primary' : 'accent'"
                  size="xs"
                  class="flex-1"
                  @click="claimOrUseCoupon(coupon)"
                >
                  {{ claimedCodes.has(coupon.code) ? 'Pakai' : 'Klaim' }}
                </UiButton>
              </div>
            </div>
          </div>

          <!-- S&K DROPDOWN ACCORDION (Jujur & Bersih Tanpa Titik Hijau Palsu) -->
          <div
            class="border-t border-brand-hairsoft px-4 py-2 bg-brand-canvas-soft/60 flex items-center justify-between text-[11px]"
          >
            <button
              type="button"
              class="text-brand-muted hover:text-brand-ink font-medium flex items-center gap-1.5 cursor-pointer border-0 bg-transparent"
              @click="toggleTerms(coupon.id)"
            >
              <span>Syarat &amp; Ketentuan</span>
              <i
                class="pi pi-chevron-down text-[9px] transition-transform duration-200"
                :class="{ 'rotate-180': expandedTerms[coupon.id] }"
              />
            </button>
          </div>

          <!-- S&K Expanded Content -->
          <div
            v-if="expandedTerms[coupon.id]"
            class="px-4 py-3 bg-brand-canvas-soft text-xs text-brand-muted border-t border-brand-hairsoft space-y-1"
          >
            <p>1. Voucher berlaku dengan transaksi minimal {{ coupon.formatted_min_purchase }}.</p>
            <p v-if="coupon.formatted_max_discount">
              2. Batas maksimal potongan sebesar {{ coupon.formatted_max_discount }}.
            </p>
            <p>3. Voucher dapat digunakan {{ coupon.user_limit }} kali per akun pengguna.</p>
            <p>4. Potongan otomatis memotong total belanja saat pembayaran di checkout.</p>
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
