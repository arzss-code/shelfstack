<script setup lang="ts">
import type { Order } from '~/types/order'
import { renderBarcodeSvg, renderQrCodeSvg } from '~/features/orders/utils/logistics-vector'

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

const trackingNumber = computed(() => {
  if (!order.value) return ''
  return order.value.tracking_number || `SS-${order.value.id.slice(0, 8).toUpperCase()}`
})

const courierName = computed(() => {
  if (!order.value) return 'JNE Express'
  return order.value.courier_name || order.value.courier_code?.toUpperCase() || 'JNE Express'
})

const shippingServiceLabel = computed(() => {
  const service = (order.value?.shipping_service || 'reguler').toLowerCase()
  switch (service) {
    case 'express':
    case 'next_day':
      return 'NEXT DAY'
    case 'instant':
      return 'INSTAN'
    case 'cargo':
      return 'KARGO'
    default:
      return 'REGULER'
  }
})

const routingHubCode = computed(() => {
  const city = (order.value?.address?.city || 'JAKARTA')
    .toUpperCase()
    .replace(/KOTA\s+|KABUPATEN\s+/g, '')
  return `JKT > ${city.slice(0, 14)}`
})

const barcodeSvg = computed(() => {
  if (!trackingNumber.value) return ''
  return renderBarcodeSvg(trackingNumber.value, { height: 44, moduleWidth: 2, showText: true })
})

const quickScanQrSvg = computed(() => {
  let siteUrl = 'https://shelfstack.atsiilaarya.me'
  try {
    const config = useRuntimeConfig()
    if (config?.public?.siteUrl) siteUrl = String(config.public.siteUrl)
  } catch {
    // fallback
  }
  siteUrl = siteUrl.replace(/\/+$/, '')
  return renderQrCodeSvg(`${siteUrl}/tracking?q=${encodeURIComponent(trackingNumber.value)}`, {
    size: 48,
  })
})

const handlePrint = () => {
  if (import.meta.client) {
    window.print()
  }
}

useSeoMeta({
  title: computed(() => `Surat Jalan A6 #${orderId.value.slice(0, 8)} - ShelfStack`),
  description: 'Label resi pengiriman termal resmi standar ekspedisi logistik.',
})
</script>

<template>
  <div class="min-h-screen bg-brand-canvas py-8 px-4 flex flex-col items-center">
    <!-- Non-printable Actions -->
    <div class="no-print w-full max-w-[420px] mb-4 flex items-center justify-between gap-3">
      <NuxtLink
        :to="`/orders/${orderId}`"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-ink no-underline transition-colors"
      >
        <i class="pi pi-arrow-left text-[11px]" />
        <span>Kembali</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <UiButton
          :to="`/orders/${orderId}/invoice`"
          variant="outline"
          size="sm"
          class="font-semibold"
        >
          Invoice
        </UiButton>
        <UiButton variant="primary" size="sm" class="font-semibold" @click="handlePrint">
          <i class="pi pi-print mr-1 text-xs" />
          Cetak A6
        </UiButton>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="w-full max-w-[420px] p-12 bg-brand-canvas rounded-card border border-brand-hair text-center"
    >
      <i class="pi pi-spin pi-spinner text-2xl text-brand-accent mb-3 block" />
      <p class="text-xs text-brand-muted m-0">Memuat label pengiriman...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="errorMsg"
      class="w-full max-w-sm p-8 bg-red-50 border border-red-200 rounded-card text-center space-y-3"
    >
      <i class="pi pi-exclamation-circle text-2xl text-red-600" />
      <p class="text-xs text-red-700 m-0">{{ errorMsg }}</p>
      <UiButton :to="`/orders/${orderId}`" variant="secondary" size="sm">Kembali</UiButton>
    </div>

    <!-- A6 Thermal Shipping Label Sheet (100mm x 150mm) -->
    <article
      v-else-if="order"
      class="shipping-label-sheet w-full max-w-[420px] bg-white border-2 border-black p-4 font-mono text-black text-xs space-y-3 shadow-floating"
    >
      <!-- Top Carrier Header -->
      <header class="flex items-center justify-between border-b-2 border-black pb-2.5">
        <div>
          <span class="block font-black text-lg tracking-wider">{{ courierName }}</span>
          <span class="text-[10px] font-sans font-bold uppercase text-zinc-600">
            Layanan: {{ shippingServiceLabel }}
          </span>
        </div>
        <div class="text-right">
          <span class="block text-[9px] text-zinc-500 uppercase">Routing Hub</span>
          <span class="font-black text-xs tracking-tight">{{ routingHubCode }}</span>
        </div>
      </header>

      <!-- Barcode Vector Rendering -->
      <section class="text-center py-1 border-b-2 border-black flex flex-col items-center">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="overflow-x-auto max-w-full flex justify-center" v-html="barcodeSvg" />
      </section>

      <!-- Sender & Recipient Information -->
      <section class="grid grid-cols-2 gap-3 text-[11px] border-b-2 border-black pb-2.5">
        <div>
          <span class="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">PENGIRIM:</span>
          <p class="m-0 font-bold">ShelfStack Fulfillment</p>
          <p class="m-0 text-[10px] text-zinc-700 leading-tight">
            Jakarta Selatan<br />
            0812-9988-7766
          </p>
        </div>

        <div>
          <span class="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">PENERIMA:</span>
          <p class="m-0 font-bold truncate">{{ order.address?.name || 'Pelanggan' }}</p>
          <p class="m-0 text-[10px] text-zinc-700 leading-tight">
            {{ order.address?.phone || '-' }}<br />
            {{ order.address?.street }}<br />
            <strong class="text-black"
              >{{ order.address?.city }}, {{ order.address?.postal }}</strong
            >
          </p>
        </div>
      </section>

      <!-- Goods Content Summary -->
      <section class="text-[10px] border-b-2 border-black pb-2 space-y-1">
        <div class="flex justify-between font-bold">
          <span>ISI PAKET ({{ order.items?.length || 1 }} JENIS)</span>
          <span>NON-COD</span>
        </div>
        <ul class="m-0 p-0 list-none space-y-0.5">
          <li
            v-for="item in (order.items || []).slice(0, 3)"
            :key="item.id"
            class="truncate text-zinc-700"
          >
            • {{ item.product?.name || `Produk #${item.product_id}` }} ({{ item.qty }}x)
          </li>
          <li v-if="(order.items?.length || 0) > 3" class="text-zinc-500 italic">
            + {{ order.items!.length - 3 }} produk lainnya
          </li>
        </ul>
      </section>

      <!-- Footer Quick Scan QR -->
      <footer class="flex items-center justify-between pt-1">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="shrink-0 p-0.5 border border-black bg-white" v-html="quickScanQrSvg" />
        <div class="text-right text-[9px] text-zinc-600 leading-tight">
          <span class="font-bold text-black block text-[10px]">VERIFIKASI RESI</span>
          Pindai QR untuk melacak paket resmi secara live di portal ShelfStack.
        </div>
      </footer>
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
  .shipping-label-sheet {
    box-shadow: none !important;
    border: 2px solid black !important;
    max-width: 100mm !important;
    width: 100mm !important;
    height: 145mm !important;
    margin: 0 auto !important;
    page-break-inside: avoid !important;
  }
}
</style>
