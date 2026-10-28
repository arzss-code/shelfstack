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
  title: 'Kupon & Promo Belanja - ShelfStack',
  description:
    'Klaim kupon promo resmi ShelfStack. Nikmati potongan harga langsung untuk perlengkapan meja kerja dan audio pilihan Anda.',
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
      err?.data?.message || 'Gagal memuat daftar kupon promo. Silakan coba kembali.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCoupons()
  // Check if coupon is already applied in cart
  if (cartStore.appliedCoupon) {
    claimedCodes.value.add(cartStore.appliedCoupon.code)
  }
})

const filteredCoupons = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return coupons.value.filter((coupon) => {
    // 1. Tab filter
    if (selectedTab.value === 'percentage' && coupon.discount_type !== 'percentage') {
      return false
    }
    if (selectedTab.value === 'fixed' && coupon.discount_type !== 'fixed') {
      return false
    }

    // 2. Search query filter
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
    showToast(`Kode ${code} berhasil disalin ke papan klip.`)
    setTimeout(() => {
      if (copiedCode.value === code) {
        copiedCode.value = null
      }
    }, 2000)
  } catch {
    copiedCode.value = code
    showToast(`Kode kupon: ${code}`)
  }
}

const claimOrUseCoupon = async (coupon: PromoCoupon) => {
  // If already claimed, open cart drawer to use it
  if (claimedCodes.value.has(coupon.code)) {
    cartStore.openDrawer()
    showToast(`Kupon ${coupon.code} sudah aktif di keranjang belanja.`)
    return
  }

  // Claim coupon: apply to cart store if cart has items
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
        showToast(`Kupon ${coupon.code} berhasil diklaim dan diterapkan ke keranjang.`)
        return
      }
    } catch {
      // Subtotal might be lower than min purchase, still mark as claimed
    }
  }

  // Pre-apply to cart store so it activates when products are added
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

  showToast(`Kupon ${coupon.code} berhasil diklaim. Potongan aktif saat checkout.`)
}

const toggleTerms = (id: string) => {
  expandedTerms.value[id] = !expandedTerms.value[id]
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
      <span class="text-brand-ink font-semibold">Kupon &amp; Promo</span>
    </nav>

    <!-- HEADER SECTION (Tokopedia & Shopee Clean E-Commerce Standard) -->
    <header
      class="bg-white border border-brand-hair rounded-2xl p-5 sm:p-6 shadow-whisper flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-brand-accent" />
          <h1 class="text-xl sm:text-2xl font-bold text-brand-ink tracking-tight">
            Kupon &amp; Promo Belanja
          </h1>
        </div>
        <p class="text-xs sm:text-sm text-brand-muted leading-relaxed">
          Klaim kupon promo dan gunakan saat checkout pesanan untuk mendapatkan potongan harga
          langsung.
        </p>
      </div>

      <!-- Quick Search Bar -->
      <div class="relative w-full sm:w-64 shrink-0">
        <i
          class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-brand-muted"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari kupon promo..."
          class="w-full pl-9 pr-3 py-2 text-xs rounded-full border border-brand-hair bg-brand-canvas-soft focus:bg-white focus:outline-none focus:border-brand-ink transition-colors"
        />
      </div>
    </header>

    <!-- CATEGORY TABS (Tokopedia & Shopee Style Ribbon) -->
    <nav
      class="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
      aria-label="Kategori Kupon"
    >
      <button
        type="button"
        class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors border"
        :class="
          selectedTab === 'all'
            ? 'bg-brand-ink text-white border-brand-ink shadow-whisper'
            : 'bg-white border-brand-hair text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
        "
        @click="selectedTab = 'all'"
      >
        Semua Kupon ({{ coupons.length }})
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors border"
        :class="
          selectedTab === 'percentage'
            ? 'bg-brand-ink text-white border-brand-ink shadow-whisper'
            : 'bg-white border-brand-hair text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
        "
        @click="selectedTab = 'percentage'"
      >
        Diskon Belanja (%)
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors border"
        :class="
          selectedTab === 'fixed'
            ? 'bg-brand-ink text-white border-brand-ink shadow-whisper'
            : 'bg-white border-brand-hair text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
        "
        @click="selectedTab = 'fixed'"
      >
        Potongan Langsung (Rp)
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors border"
        :class="
          selectedTab === 'shipping'
            ? 'bg-brand-ink text-white border-brand-ink shadow-whisper'
            : 'bg-white border-brand-hair text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft'
        "
        @click="selectedTab = 'shipping'"
      >
        Gratis Ongkir
      </button>
    </nav>

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
        class="fixed bottom-6 right-6 z-50 bg-brand-ink text-white px-4 py-3 rounded-xl shadow-floating flex items-center gap-3 text-xs font-semibold"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-400" />
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- LOADING STATE -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="n in 3"
        :key="n"
        class="h-44 rounded-2xl border border-brand-hair bg-white animate-pulse p-4 flex gap-4"
      >
        <div class="w-28 bg-brand-canvas-soft rounded-xl" />
        <div class="flex-1 space-y-3 py-2">
          <div class="w-3/4 h-5 bg-brand-canvas-soft rounded" />
          <div class="w-1/2 h-4 bg-brand-canvas-soft rounded" />
          <div class="w-full h-8 bg-brand-canvas-soft rounded mt-4" />
        </div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div
      v-else-if="errorMessage"
      class="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 text-center space-y-3"
    >
      <i class="pi pi-exclamation-circle text-2xl text-rose-600" />
      <h3 class="font-bold text-sm text-brand-ink">Gagal Memuat Kupon</h3>
      <p class="text-xs text-brand-muted">{{ errorMessage }}</p>
      <button
        type="button"
        class="px-4 py-2 rounded-full bg-brand-ink text-white text-xs font-semibold hover:bg-brand-inkhover transition-colors cursor-pointer"
        @click="fetchCoupons"
      >
        Coba Lagi
      </button>
    </div>

    <!-- MAIN VOUCHER CARDS GRID (Tokopedia & Shopee 2-Column Responsive Layout) -->
    <main v-else class="space-y-4">
      <!-- Special Free Shipping Banner Card (When tab is All or Shipping) -->
      <article
        v-if="selectedTab === 'all' || selectedTab === 'shipping'"
        class="relative bg-white border border-brand-hair hover:border-amber-400 rounded-2xl shadow-whisper overflow-hidden transition-colors"
      >
        <div class="flex flex-col sm:flex-row">
          <!-- Left Badge Stub -->
          <div
            class="w-full sm:w-32 shrink-0 bg-amber-50/70 p-4 flex flex-col justify-between items-center text-center border-b sm:border-b-0 sm:border-r border-dashed border-brand-hair"
          >
            <div class="space-y-1">
              <span
                class="inline-block px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider"
              >
                Ekspedisi
              </span>
              <p
                class="text-xl sm:text-2xl font-extrabold text-amber-800 tracking-tight leading-none pt-2"
              >
                BEBAS
              </p>
              <p class="text-[11px] font-semibold text-amber-700 leading-tight">Ongkos Kirim</p>
            </div>
            <div
              class="text-[11px] font-medium text-brand-muted pt-2 border-t border-amber-200/50 w-full mt-2"
            >
              Min. Rp 500.000
            </div>
          </div>

          <!-- Right Details -->
          <div class="flex-1 p-4 sm:p-5 flex flex-col justify-between space-y-3">
            <div class="space-y-1">
              <div class="flex items-start justify-between gap-2">
                <h2 class="text-sm sm:text-base font-bold text-brand-ink">
                  Gratis Ongkos Kirim Seluruh Indonesia
                </h2>
                <span
                  class="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full"
                >
                  Otomatis
                </span>
              </div>
              <p class="text-xs text-brand-muted leading-relaxed">
                Potongan ongkir otomatis berlaku saat total belanja mencapai Rp 500.000 untuk kurir
                JNE, SiCepat, dan J&amp;T.
              </p>
            </div>

            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-brand-hairsoft"
            >
              <span class="text-xs text-brand-muted">
                Tanpa perlu klaim kode, langsung terpotong pada formulir pengiriman.
              </span>
              <NuxtLink
                to="/katalog"
                class="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold text-center no-underline transition-colors shrink-0"
              >
                Belanja Sekarang
              </NuxtLink>
            </div>
          </div>
        </div>
      </article>

      <!-- Grid of Regular Promo Coupons -->
      <div v-if="selectedTab !== 'shipping'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article
          v-for="coupon in filteredCoupons"
          :key="coupon.id"
          class="relative bg-white border border-brand-hair hover:border-brand-ink/50 rounded-2xl shadow-whisper overflow-hidden flex flex-col justify-between transition-colors"
        >
          <!-- Notch Top & Bottom -->
          <div
            class="hidden sm:block absolute -top-2.5 left-28 w-5 h-5 rounded-full bg-brand-canvas border-b border-brand-hair z-10"
          />
          <div
            class="hidden sm:block absolute -bottom-2.5 left-28 w-5 h-5 rounded-full bg-brand-canvas border-t border-brand-hair z-10"
          />

          <div class="flex flex-col sm:flex-row h-full">
            <!-- LEFT STUB: Discount Badge -->
            <div
              class="w-full sm:w-28 shrink-0 p-4 flex flex-col justify-between items-center text-center border-b sm:border-b-0 sm:border-r border-dashed border-brand-hair"
              :class="coupon.discount_type === 'percentage' ? 'bg-blue-50/70' : 'bg-emerald-50/70'"
            >
              <div class="space-y-1">
                <span
                  class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  :class="
                    coupon.discount_type === 'percentage'
                      ? 'bg-brand-accent text-white'
                      : 'bg-emerald-600 text-white'
                  "
                >
                  {{ coupon.discount_type === 'percentage' ? 'Diskon' : 'Potongan' }}
                </span>

                <p
                  class="text-xl sm:text-2xl font-extrabold tracking-tight leading-none pt-2"
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

                <p
                  v-if="coupon.formatted_max_discount"
                  class="text-[10px] font-semibold text-brand-muted leading-tight"
                >
                  Maks. {{ coupon.formatted_max_discount }}
                </p>
              </div>

              <div
                class="text-[10px] font-medium text-brand-muted pt-2 border-t border-brand-hairsoft w-full mt-2"
              >
                Min. {{ coupon.formatted_min_purchase }}
              </div>
            </div>

            <!-- RIGHT BODY: Details & Actions -->
            <div class="flex-1 p-4 flex flex-col justify-between space-y-3">
              <div class="space-y-1">
                <div class="flex items-start justify-between gap-2">
                  <h2 class="text-xs sm:text-sm font-bold text-brand-ink leading-snug">
                    {{ coupon.name }}
                  </h2>
                  <span
                    class="shrink-0 font-mono text-[11px] font-bold bg-brand-canvas-soft text-brand-ink px-2 py-0.5 rounded border border-brand-hair"
                  >
                    {{ coupon.code }}
                  </span>
                </div>

                <p class="text-xs text-brand-muted leading-relaxed line-clamp-2">
                  {{
                    coupon.description ||
                    `Gunakan kode ${coupon.code} saat checkout untuk mendapatkan potongan harga.`
                  }}
                </p>
              </div>

              <!-- Expiry & Action Buttons -->
              <div class="space-y-2 pt-1 border-t border-brand-hairsoft">
                <div class="flex items-center justify-between text-[11px] text-brand-muted">
                  <span class="flex items-center gap-1">
                    <i class="pi pi-clock text-[10px]" />
                    <span>{{
                      coupon.expires_at
                        ? `Hingga ${new Date(coupon.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Berlaku Seterusnya'
                    }}</span>
                  </span>
                  <span v-if="coupon.remaining_quota != null" class="font-medium text-brand-ink">
                    Sisa {{ coupon.remaining_quota }} kuota
                  </span>
                </div>

                <!-- Action Buttons: Salin Kode & Klaim -->
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer text-center"
                    :class="
                      copiedCode === coupon.code
                        ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                        : 'border-brand-hair hover:border-brand-ink text-brand-ink bg-white'
                    "
                    @click="copyCouponCode(coupon.code)"
                  >
                    {{ copiedCode === coupon.code ? 'Tersalin' : 'Salin Kode' }}
                  </button>

                  <button
                    type="button"
                    class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center shadow-whisper"
                    :class="
                      claimedCodes.has(coupon.code)
                        ? 'bg-brand-ink hover:bg-brand-inkhover text-white'
                        : 'bg-brand-accent hover:bg-blue-700 text-white'
                    "
                    @click="claimOrUseCoupon(coupon)"
                  >
                    {{ claimedCodes.has(coupon.code) ? 'Pakai' : 'Klaim' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- S&K DROPDOWN ACCORDION (Tokopedia & Shopee Standard) -->
          <div
            class="border-t border-brand-hairsoft px-4 py-2 bg-brand-canvas-soft/60 flex items-center justify-between text-[11px]"
          >
            <button
              type="button"
              class="text-brand-muted hover:text-brand-ink font-medium flex items-center gap-1 cursor-pointer border-0 bg-transparent"
              @click="toggleTerms(coupon.id)"
            >
              <span>Syarat &amp; Ketentuan</span>
              <i
                class="pi pi-chevron-down text-[9px] transition-transform duration-200"
                :class="{ 'rotate-180': expandedTerms[coupon.id] }"
              />
            </button>
            <span class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Terverifikasi</span>
            </span>
          </div>

          <!-- S&K Expanded Content -->
          <div
            v-if="expandedTerms[coupon.id]"
            class="px-4 py-3 bg-brand-canvas-soft text-xs text-brand-muted border-t border-brand-hairsoft space-y-1"
          >
            <p>1. Kupon berlaku dengan transaksi minimal {{ coupon.formatted_min_purchase }}.</p>
            <p v-if="coupon.formatted_max_discount">
              2. Batas maksimal potongan sebesar {{ coupon.formatted_max_discount }}.
            </p>
            <p>3. Kupon hanya dapat digunakan {{ coupon.user_limit }} kali per akun pengguna.</p>
            <p>4. Potongan otomatis memotong total tagihan saat pembayaran di checkout.</p>
          </div>
        </article>
      </div>

      <!-- EMPTY STATE IF SEARCH YIELDS NOTHING -->
      <div
        v-if="filteredCoupons.length === 0 && selectedTab !== 'shipping'"
        class="p-12 text-center rounded-2xl border border-dashed border-brand-hair bg-white space-y-3"
      >
        <i class="pi pi-ticket text-3xl text-brand-muted" />
        <h3 class="font-bold text-sm text-brand-ink">Tidak ada kupon yang cocok</h3>
        <p class="text-xs text-brand-muted max-w-sm mx-auto">
          Coba ganti kata kunci pencarian atau pilih tab kategori kupon lainnya.
        </p>
        <button
          type="button"
          class="px-4 py-1.5 rounded-full bg-brand-ink text-white text-xs font-semibold hover:bg-brand-inkhover transition-colors cursor-pointer"
          @click="
            searchQuery = ''
            selectedTab = 'all'
          "
        >
          Reset Filter
        </button>
      </div>
    </main>
  </div>
</template>
