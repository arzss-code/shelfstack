<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '~/features/cart/stores/cart'
import type { UiTabItem } from '~/components/ui/UiTabs.vue'
import type { PromoCoupon } from '~/types/promo'
import PromoHeroBanner from '~/components/promo/PromoHeroBanner.vue'
import PromoFreeShippingCard from '~/components/promo/PromoFreeShippingCard.vue'
import PromoVoucherCard from '~/components/promo/PromoVoucherCard.vue'
import PromoTermsModal from '~/components/promo/PromoTermsModal.vue'

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

const fetchCoupons = async () => {
  loading.value = true
  errorMessage.value = null
  try {
    const res = await $fetch<{ status: string; data: PromoCoupon[] }>('/api/coupons')
    if (res?.data) coupons.value = res.data
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMessage.value =
      fetchErr?.data?.message || 'Gagal memuat daftar voucher promo. Silakan coba kembali.'
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
    if (selectedTab.value === 'percentage' && coupon.discount_type !== 'percentage') return false
    if (selectedTab.value === 'fixed' && coupon.discount_type !== 'fixed') return false
    if (query) {
      const matchCode = coupon.code.toLowerCase().includes(query)
      const matchName = coupon.name.toLowerCase().includes(query)
      const matchDesc = coupon.description
        ? coupon.description.toLowerCase().includes(query)
        : false
      if (!matchCode && !matchName && !matchDesc) return false
    }
    return true
  })
})

const showToast = (message: string) => {
  toast.show({ title: 'Voucher Promo', message, tone: 'success' })
}

const copyCouponCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    copiedCode.value = code
    showToast(`Kode voucher ${code} berhasil disalin ke papan klip.`)
    setTimeout(() => {
      if (copiedCode.value === code) copiedCode.value = null
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
      const res = await $fetch<{ status: string; data: PromoCoupon & { discount_cents: number } }>(
        '/api/coupons/validate',
        { method: 'POST', body: { code: coupon.code, subtotal_cents: cartStore.totalPriceCents } },
      )
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
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-xs text-brand-muted pt-2" aria-label="Breadcrumb">
      <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline"
        >Beranda</NuxtLink
      >
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Voucher &amp; Promo</span>
    </nav>

    <!-- Hero Banner with integrated search -->
    <PromoHeroBanner v-model="searchQuery" />

    <!-- Category Tabs -->
    <div class="overflow-x-auto pb-1 [scrollbar-width:none]">
      <UiTabs v-model="selectedTab" :items="tabItems" aria-label="Kategori Voucher" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="n in 4"
        :key="n"
        class="p-4 rounded-2xl border border-brand-hair bg-brand-canvas flex gap-4"
      >
        <UiSkeleton width="w-28" height="h-32" />
        <div class="flex-1 space-y-2 py-2">
          <UiSkeleton width="w-3/4" height="h-5" />
          <UiSkeleton width="w-1/2" height="h-4" />
          <UiSkeleton width="w-full" height="h-9" class="mt-4" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="p-2">
      <UiAlert tone="danger" title="Gagal Memuat Voucher">
        <p>{{ errorMessage }}</p>
        <div class="pt-2">
          <UiButton variant="outline" size="xs" @click="fetchCoupons">Coba Lagi</UiButton>
        </div>
      </UiAlert>
    </div>

    <!-- Voucher Cards Grid -->
    <main v-else class="space-y-4">
      <!-- Free Shipping Banner -->
      <PromoFreeShippingCard v-if="selectedTab === 'all' || selectedTab === 'shipping'" />

      <!-- Regular Voucher Grid -->
      <div
        v-if="selectedTab !== 'shipping'"
        class="grid grid-cols-1 md:grid-cols-2 items-start gap-4"
      >
        <PromoVoucherCard
          v-for="coupon in filteredCoupons"
          :key="coupon.id"
          :coupon="coupon"
          :is-copied="copiedCode === coupon.code"
          :is-claimed="claimedCodes.has(coupon.code)"
          @copy="copyCouponCode"
          @claim="claimOrUseCoupon"
          @open-terms="openTermsModal"
        />
      </div>

      <!-- Empty State -->
      <UiEmptyState
        v-if="filteredCoupons.length === 0 && selectedTab !== 'shipping'"
        icon="pi-ticket"
        title="Tidak ada voucher yang cocok"
        description="Coba ganti kata kunci pencarian atau pilih kategori voucher lainnya."
        action-label="Reset Filter"
        @action="resetFilters"
      />
    </main>

    <!-- Terms & Conditions Modal -->
    <PromoTermsModal
      v-model="isTermsModalOpen"
      :coupon="selectedTermsCoupon"
      :is-claimed="selectedTermsCoupon ? claimedCodes.has(selectedTermsCoupon.code) : false"
      @claim="claimOrUseCoupon"
    />
  </div>
</template>
