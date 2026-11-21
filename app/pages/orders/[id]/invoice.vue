<script setup lang="ts">
import type { Order } from '~/types/order'
import InvoiceItemsTable from '~/features/orders/components/InvoiceItemsTable.vue'
import InvoiceSummaryFooter from '~/features/orders/components/InvoiceSummaryFooter.vue'
import {
  formatInvoiceDate,
  formatInvoiceNumber,
  getInvoiceShippingServiceName,
  getInvoiceShippingFeeDisplay,
} from '~/features/orders/utils/order-invoice'
import { renderQrCodeSvg } from '~/features/orders/utils/logistics-vector'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const orderId = computed(() => route.params.id as string)

const order = ref<Order | null>(null)
const loading = ref(true)
const errorMsg = ref('')

const fetchOrder = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await $fetch<{ status: string; data: Order }>(`/api/orders/${orderId.value}`)
    order.value = res.data
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMsg.value = fetchErr.data?.message || 'Pesanan tidak ditemukan atau akses ditolak.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrder()
})

const invoiceNumber = computed(() => (order.value ? formatInvoiceNumber(order.value.id) : ''))
const shippingServiceName = computed(() =>
  order.value ? getInvoiceShippingServiceName(order.value.shipping_service) : '',
)
const shippingFeeDisplay = computed(() =>
  order.value ? getInvoiceShippingFeeDisplay(order.value.shipping_cost_cents) : '',
)
const verificationQrSvg = computed(() => {
  let siteUrl = 'https://shelfstack.atsiilaarya.me'
  try {
    const config = useRuntimeConfig()
    if (config?.public?.siteUrl) siteUrl = String(config.public.siteUrl)
  } catch {
    // fallback
  }
  siteUrl = siteUrl.replace(/\/+$/, '')
  return renderQrCodeSvg(`${siteUrl}/tracking?q=${encodeURIComponent(orderId.value)}`, { size: 56 })
})

const handlePrint = () => {
  if (import.meta.client) {
    window.print()
  }
}

useSeoMeta({
  title: computed(() => `Faktur Penjualan #${orderId.value.slice(0, 8)} - ShelfStack`),
  description: 'Dokumen faktur penjualan resmi transaksi ShelfStack Indonesia.',
})
</script>

<template>
  <div class="min-h-screen bg-brand-canvas py-8 px-4 sm:px-6 lg:px-8">
    <!-- Non-printable Top Bar -->
    <div class="no-print max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
      <NuxtLink
        :to="`/orders/${orderId}`"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-ink no-underline transition-colors"
      >
        <i class="pi pi-arrow-left text-[11px]" />
        <span>Kembali ke Detail Pesanan</span>
      </NuxtLink>

      <div class="flex items-center gap-2.5">
        <UiButton
          :to="`/orders/${orderId}/waybill`"
          variant="outline"
          size="sm"
          class="font-semibold"
        >
          <i class="pi pi-tag mr-1 text-xs" />
          Lihat Surat Jalan A6
        </UiButton>
        <UiButton variant="primary" size="sm" class="font-semibold" @click="handlePrint">
          <i class="pi pi-print mr-1 text-xs" />
          Cetak Faktur (PDF)
        </UiButton>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="max-w-4xl mx-auto p-12 bg-brand-canvas rounded-card border border-brand-hair text-center"
    >
      <i class="pi pi-spin pi-spinner text-2xl text-brand-accent mb-3 block" />
      <p class="text-xs text-brand-muted m-0">Memuat faktur penjualan resmi...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="errorMsg"
      class="max-w-md mx-auto p-8 bg-red-50 border border-red-200 rounded-card text-center space-y-3"
    >
      <i class="pi pi-exclamation-circle text-2xl text-red-600" />
      <h3 class="text-sm font-bold text-red-900 m-0">Gagal Membuka Faktur</h3>
      <p class="text-xs text-red-700 m-0">{{ errorMsg }}</p>
      <UiButton :to="`/orders/${orderId}`" variant="secondary" size="sm">Kembali</UiButton>
    </div>

    <!-- Printable Invoice Paper Sheet -->
    <article
      v-else-if="order"
      class="invoice-sheet max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-card border border-brand-hair shadow-whisper space-y-8 font-sans text-brand-ink"
    >
      <!-- Invoice Header -->
      <header
        class="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-brand-hair pb-6"
      >
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="font-display text-2xl font-black tracking-tight text-brand-ink">
              SHELF<span class="text-brand-accent">STACK</span>
            </span>
          </div>
          <p class="m-0 text-xs leading-relaxed text-brand-muted">
            PT ShelfStack Niaga Digital (Simulasi Portofolio)<br />
            Menara Karya Lt. 18, Jakarta Selatan<br />
            NPWP: 01.234.567.8-012.000
          </p>
        </div>

        <div class="space-y-1 sm:text-right">
          <div
            class="inline-block px-3 py-1 bg-brand-canvas border border-brand-hair rounded-full text-[11px] font-bold uppercase tracking-wider text-brand-ink"
          >
            FAKTUR PENJUALAN
          </div>
          <h2 class="m-0 font-mono text-base font-bold tabular text-brand-ink">
            {{ invoiceNumber }}
          </h2>
          <p class="m-0 text-xs text-brand-muted">
            Tanggal Terbit: {{ formatInvoiceDate(order.created_at) }}
          </p>
          <div v-if="order.paid_at" class="text-xs font-semibold text-brand-success-text">
            STATUS: LUNAS ({{ formatInvoiceDate(order.paid_at) }})
          </div>
        </div>
      </header>

      <!-- Customer & Shipping Details -->
      <section
        class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-brand-hair pb-6"
      >
        <div>
          <span
            class="text-brand-muted block font-semibold uppercase tracking-wider text-[10px] mb-1"
          >
            Diterbitkan Untuk:
          </span>
          <p class="m-0 font-bold text-brand-ink text-sm">
            {{ order.address?.name || 'Pelanggan ShelfStack' }}
          </p>
          <p class="m-0 text-brand-muted mt-0.5">
            {{ order.address?.phone || '-' }}
          </p>
          <p class="m-0 text-brand-muted leading-relaxed mt-1">
            {{ order.address?.street || 'Alamat tidak tercantum' }}<br />
            {{ order.address?.city }}, {{ order.address?.postal }}
          </p>
        </div>

        <div class="sm:text-right space-y-1">
          <span
            class="text-brand-muted block font-semibold uppercase tracking-wider text-[10px] mb-1"
          >
            Pengiriman &amp; Ekspedisi:
          </span>
          <p class="m-0 font-bold text-brand-ink">
            {{ order.courier_name || 'JNE Express' }} ({{ shippingServiceName }})
          </p>
          <p v-if="order.tracking_number" class="m-0 font-mono text-brand-ink font-semibold">
            No Resi: {{ order.tracking_number }}
          </p>
          <p v-else class="m-0 text-brand-muted italic">Nomor resi belum diterbitkan</p>
        </div>
      </section>

      <!-- Items Table -->
      <InvoiceItemsTable :items="order.items" />

      <!-- Financial Calculation Summary -->
      <InvoiceSummaryFooter
        :order="order"
        :shipping-fee-display="shippingFeeDisplay"
        :verification-qr-svg="verificationQrSvg"
      />
    </article>
  </div>
</template>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
  body,
  .min-h-screen {
    background-color: #ffffff !important;
    padding: 0 !important;
  }
  .invoice-sheet {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    max-width: 100% !important;
  }
}
</style>
