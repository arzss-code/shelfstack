<template>
  <div class="min-h-screen bg-brand-canvas-soft/40 py-8 sm:py-12">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-brand-muted mb-6" aria-label="Breadcrumb">
        <NuxtLink to="/" class="hover:text-brand-ink transition-colors no-underline"
          >Beranda</NuxtLink
        >
        <span class="text-brand-hair">/</span>
        <span class="text-brand-ink font-semibold">Lacak Pesanan</span>
      </nav>

      <!-- Search Hero Card -->
      <div
        class="bg-brand-canvas border border-brand-hair rounded-card p-6 sm:p-8 mb-6 shadow-whisper text-center"
      >
        <div
          class="w-12 h-12 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3"
        >
          <i class="pi pi-compass text-xl" />
        </div>
        <h1 class="font-display text-xl sm:text-2xl font-bold text-brand-ink tracking-tight m-0">
          Lacak Pengiriman Pesanan
        </h1>
        <p class="text-xs sm:text-sm text-brand-muted mt-1.5 max-w-md mx-auto m-0 leading-relaxed">
          Masukkan nomor resi ekspedisi (misal:
          <code
            class="bg-brand-canvas-soft px-1.5 py-0.5 rounded text-brand-ink font-mono text-[11px]"
            >SS-JNE-xxx</code
          >) atau ID pesanan Anda untuk melihat linimasa perjalanan paket secara langsung.
        </p>

        <!-- Search Form -->
        <form class="mt-6 max-w-xl mx-auto flex items-center gap-2" @submit.prevent="handleSearch">
          <div class="relative flex-1">
            <i
              class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-sm"
            />
            <input
              v-model="searchQuery"
              type="text"
              class="w-full pl-10 pr-4 py-2.5 bg-brand-field rounded-full border border-brand-hair text-xs sm:text-sm text-brand-ink placeholder:text-brand-faint focus:outline-none focus:border-brand-ink focus:bg-brand-canvas transition-all shadow-inner"
              placeholder="Contoh: SS-JNE-123456 atau ID Pesanan..."
            />
          </div>
          <button
            type="submit"
            class="px-5 py-2.5 rounded-full bg-brand-ink hover:bg-brand-inkhover text-brand-onink text-xs sm:text-sm font-semibold transition-colors cursor-pointer inline-flex items-center gap-2 shrink-0 shadow-whisper"
            :disabled="isLoading"
          >
            <i v-if="isLoading" class="pi pi-spin pi-spinner text-xs" />
            <span>{{ isLoading ? 'Mencari...' : 'Lacak' }}</span>
          </button>
        </form>
      </div>

      <!-- Result View -->
      <div v-if="trackingData" class="space-y-6 animate-fadeIn">
        <!-- Masked Recipient Privacy Card -->
        <div
          class="bg-brand-canvas border border-brand-hair rounded-card p-4 sm:p-5 shadow-whisper flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-full bg-brand-canvas-soft text-brand-muted flex items-center justify-center shrink-0"
            >
              <i class="pi pi-shield text-base" />
            </div>
            <div>
              <span
                class="text-[10px] text-brand-muted uppercase tracking-wider block font-semibold"
              >
                Privasi Pelanggan Terlindungi
              </span>
              <p class="text-xs text-brand-ink font-medium m-0 mt-0.5">
                Penerima: <span class="font-bold">{{ trackingData.recipient_name_masked }}</span> ·
                Telp:
                <span class="font-mono text-brand-muted">{{
                  trackingData.recipient_phone_masked
                }}</span>
              </p>
            </div>
          </div>

          <div class="text-left sm:text-right">
            <span class="text-[10px] text-brand-muted uppercase tracking-wider block font-semibold"
              >Tujuan</span
            >
            <span class="text-xs font-bold text-brand-ink">{{
              trackingData.destination_city
            }}</span>
          </div>
        </div>

        <!-- Order Tracking Timeline Component -->
        <OrderTrackingTimeline
          :tracking-number="trackingData.tracking_number"
          :courier-name="trackingData.courier_name"
          :status="trackingData.status"
          :destination-city="trackingData.destination_city"
          :checkpoints="trackingData.checkpoints"
        />
      </div>

      <!-- Not Found Error State -->
      <div
        v-else-if="errorMessage"
        class="bg-brand-canvas border border-brand-danger-edge rounded-card p-8 text-center shadow-whisper animate-fadeIn"
      >
        <div
          class="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3"
        >
          <i class="pi pi-exclamation-circle text-xl" />
        </div>
        <h3 class="text-sm sm:text-base font-bold text-brand-ink m-0">Resi Tidak Ditemukan</h3>
        <p class="text-xs text-brand-muted mt-1.5 max-w-md mx-auto m-0 leading-relaxed">
          {{ errorMessage }}
        </p>
      </div>

      <!-- Help / FAQ Card -->
      <div
        class="mt-8 bg-brand-canvas-soft/60 border border-brand-hairsoft rounded-card p-5 sm:p-6 text-xs text-brand-muted space-y-3"
      >
        <h4 class="text-xs font-bold text-brand-ink m-0 flex items-center gap-2">
          <i class="pi pi-question-circle text-blue-600" />
          <span>Informasi Pengiriman ShelfStack</span>
        </h4>
        <ul class="list-disc pl-4 space-y-1.5 m-0 leading-relaxed">
          <li>
            Nomor resi diterbitkan segera setelah pesanan diserahkan ke pihak ekspedisi rekanan
            (JNE, SiCepat, J&amp;T, Anteraja, Pos Indonesia).
          </li>
          <li>
            Pembaruan data checkpoint ekspedisi memerlukan waktu sinkronisasi 15-30 menit setelah
            serah terima kurir di hub origin.
          </li>
          <li>
            Jika paket belum bergerak lebih dari 48 jam, silakan hubungi tim dukungan ShelfStack
            melalui Pusat Bantuan resmi.
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PublicTrackingResult } from '../../shared/schemas/shipping'
import OrderTrackingTimeline from '~/components/orders/OrderTrackingTimeline.vue'

useSeoMeta({
  title: 'Lacak Pengiriman Pesanan - ShelfStack',
  description:
    'Lacak nomor resi dan linimasa pengiriman kurir pesanan Anda secara langsung di ShelfStack.',
})

const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
const isLoading = ref(false)
const trackingData = ref<PublicTrackingResult | null>(null)
const errorMessage = ref('')

const executeTrackingSearch = async (queryStr: string) => {
  if (!queryStr || queryStr.trim().length < 3) return

  isLoading.value = true
  errorMessage.value = ''
  trackingData.value = null

  try {
    const res = await $fetch<{
      success: boolean
      data: PublicTrackingResult
      message?: string
    }>(`/api/tracking/search?q=${encodeURIComponent(queryStr.trim())}`)

    if (res?.data) {
      trackingData.value = res.data
    } else {
      errorMessage.value = 'Data pengiriman tidak ditemukan.'
    }
  } catch (err: unknown) {
    const errObj = err as { data?: { message?: string } } | null
    errorMessage.value =
      errObj?.data?.message ||
      'Nomor resi tidak ditemukan. Pastikan nomor resi atau ID pesanan yang Anda masukkan sudah sesuai.'
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.replace({ path: '/tracking', query: { q: searchQuery.value.trim() } })
    executeTrackingSearch(searchQuery.value.trim())
  }
}

// Deep linking support via ?q=xxx, ?order_id=xxx, or ?ref=xxx
onMounted(() => {
  const queryParam = ((route.query.q || route.query.order_id || route.query.ref) as string)?.trim()
  if (queryParam) {
    searchQuery.value = queryParam
    executeTrackingSearch(queryParam)
  }
})
</script>
