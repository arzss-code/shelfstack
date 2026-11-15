<script setup lang="ts">
import type { Order } from '~/types/order'
import { renderBarcodeSvg, renderQrCodeSvg } from '../utils/logistics-vector'
import UiModal from '~/components/ui/UiModal.vue'
import UiButton from '~/components/ui/UiButton.vue'

const props = defineProps<{
  visible: boolean
  order: Order
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const isOpen = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

const trackingNumber = computed(() => {
  return props.order.tracking_number || `SS-${props.order.id.slice(0, 8).toUpperCase()}`
})

const courierName = computed(() => {
  return props.order.courier_name || props.order.courier_code?.toUpperCase() || 'JNE Express'
})

const shippingServiceLabel = computed(() => {
  const service = (props.order.shipping_service || 'reguler').toLowerCase()
  switch (service) {
    case 'express':
    case 'next_day':
      return 'NEXT DAY'
    case 'instant':
      return 'INSTAN'
    case 'cargo':
      return 'KARGO'
    case 'reguler':
    default:
      return 'REGULER'
  }
})

const routingHubCode = computed(() => {
  const city = (props.order.address?.city || 'JAKARTA')
    .toUpperCase()
    .replace(/KOTA\s+|KABUPATEN\s+/g, '')
  return `JKT > ${city.slice(0, 12)}`
})

const barcodeSvg = computed(() => {
  return renderBarcodeSvg(trackingNumber.value, { height: 44, moduleWidth: 2, showText: true })
})

const quickScanQrSvg = computed(() => {
  let siteUrl = 'https://shelfstack.atsiilaarya.me'
  try {
    const config = useRuntimeConfig()
    if (config?.public?.siteUrl) siteUrl = String(config.public.siteUrl)
  } catch {
    // Fallback for isolated unit tests
  }
  siteUrl = siteUrl.replace(/\/+$/, '')
  return renderQrCodeSvg(`${siteUrl}/tracking?ref=${trackingNumber.value}`, {
    size: 68,
  })
})

const totalQuantity = computed(() => {
  return (props.order.items || []).reduce((sum, item) => sum + item.qty, 0)
})

const handlePrint = () => {
  if (import.meta.client) {
    window.print()
  }
}
</script>

<template>
  <UiModal v-model:visible="isOpen" :title="`Label Pengiriman #${order.id.slice(0, 8)}`" size="lg">
    <!-- Action Info Bar (No Print) -->
    <div
      class="no-print mb-4 flex items-center justify-between rounded-field border border-brand-hair bg-brand-canvas-soft px-4 py-3"
    >
      <div class="flex items-center gap-2 text-xs text-brand-muted">
        <i class="pi pi-print text-sm text-brand-ink" />
        <span
          >Format Standar Thermal Waybill A6 (100 &times; 150 mm). Siap tempel pada kardus
          paket.</span
        >
      </div>
      <UiButton variant="primary" size="sm" icon="pi-print" @click="handlePrint">
        Cetak Label Pengiriman
      </UiButton>
    </div>

    <!-- Thermal Label Preview Container -->
    <div class="flex justify-center bg-brand-field/40 p-4 sm:p-6">
      <div
        class="shipping-label-sheet w-full max-w-[400px] border border-black bg-white p-4 font-sans text-black shadow-whisper"
      >
        <!-- Top Section: Courier Brand & Service Routing -->
        <div class="flex items-center justify-between border-b-2 border-black pb-2.5">
          <div>
            <span class="block font-display text-lg font-black tracking-tight text-black">
              {{ courierName }}
            </span>
            <span class="font-mono text-[11px] font-bold tracking-wider text-black">
              {{ routingHubCode }}
            </span>
          </div>
          <div class="text-right">
            <span
              class="inline-block rounded border-2 border-black bg-black px-2 py-0.5 font-mono text-xs font-black text-white"
            >
              {{ shippingServiceLabel }}
            </span>
            <span class="mt-1 block font-mono text-[10px] font-bold text-black">
              NON-COD (LUNAS)
            </span>
          </div>
        </div>

        <!-- Barcode & Tracking Number -->
        <div class="border-b-2 border-black py-3 text-center">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="flex justify-center overflow-hidden" v-html="barcodeSvg" />
          <p class="m-0 mt-1 font-mono text-[10px] text-neutral-600">
            Nomor Pesanan: #{{ order.id.slice(0, 12).toUpperCase() }}
          </p>
        </div>

        <!-- Address Grid: Recipient and Sender -->
        <div class="grid grid-cols-1 gap-2.5 border-b-2 border-black py-2.5 text-xs">
          <!-- Penerima -->
          <div>
            <span class="block text-[9px] font-black uppercase tracking-wider text-neutral-500">
              PENERIMA:
            </span>
            <p class="m-0 font-bold leading-tight text-black">
              {{ order.address?.name || 'Pelanggan ShelfStack' }}
              <span class="font-normal text-neutral-700">({{ order.address?.phone || '-' }})</span>
            </p>
            <p class="m-0 mt-0.5 text-[11px] leading-snug text-neutral-800">
              {{ order.address?.street || '' }}, {{ order.address?.city || '' }}
              {{ order.address?.postal || '' }}
            </p>
          </div>

          <!-- Pengirim -->
          <div class="border-t border-dashed border-neutral-400 pt-2 text-[10.5px]">
            <span class="block text-[9px] font-black uppercase tracking-wider text-neutral-500">
              PENGIRIM:
            </span>
            <p class="m-0 font-bold leading-tight text-black">
              ShelfStack Logistics Hub
              <span class="font-normal text-neutral-700">(021-50987654)</span>
            </p>
            <p class="m-0 text-[10px] text-neutral-700">
              Menara Karya Lt. 18, Jakarta Selatan 12950
            </p>
          </div>
        </div>

        <!-- Customer Order Notes (Highlighted for Courier) -->
        <div v-if="order.address?.note" class="border-b-2 border-black bg-neutral-100 p-2 text-xs">
          <span class="block text-[9px] font-black uppercase text-neutral-700">
            CATATAN KURIR / INSTRUKSI PENGIRIMAN:
          </span>
          <p class="m-0 mt-0.5 font-semibold text-black">&ldquo;{{ order.address.note }}&rdquo;</p>
        </div>

        <!-- Packing Slip Summary & Validation -->
        <div class="pt-2 text-[10px]">
          <div class="mb-1 flex items-center justify-between font-bold">
            <span>ISI PAKET ({{ totalQuantity }} BARANG)</span>
            <span>PACKING CHECKLIST</span>
          </div>

          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-neutral-300 text-[9px] text-neutral-500">
                <th class="py-0.5 font-bold">Item</th>
                <th class="py-0.5 text-center font-bold">Qty</th>
                <th class="py-0.5 text-right font-bold">Cek</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200">
              <tr v-for="(item, idx) in (order.items || []).slice(0, 5)" :key="item.id">
                <td class="truncate py-1 font-medium text-black max-w-[200px]">
                  {{ idx + 1 }}. {{ item.product?.name || `Item #${item.id.slice(0, 6)}` }}
                </td>
                <td class="py-1 text-center font-bold text-black">{{ item.qty }}</td>
                <td class="py-1 text-right font-mono">[ &check; ]</td>
              </tr>
              <tr v-if="(order.items || []).length > 5">
                <td colspan="3" class="py-1 text-neutral-500 italic">
                  + {{ (order.items || []).length - 5 }} produk lainnya di dalam paket
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Footer Verification Code -->
          <div class="mt-3 flex items-center justify-between border-t border-black pt-2">
            <div class="flex items-center gap-2">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="shrink-0" v-html="quickScanQrSvg" />
              <div class="text-[9px] leading-tight text-neutral-600">
                <p class="m-0 font-bold text-black">Scan Resi Resmi</p>
                <p class="m-0">Validasi barcode &amp; linimasa kurir</p>
              </div>
            </div>
            <div class="text-right text-[9px] text-neutral-500">
              <p class="m-0 font-mono">PARCEL-ID</p>
              <p class="m-0 font-mono font-bold text-black">
                #{{ order.id.slice(0, 8).toUpperCase() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <UiButton variant="outline" size="sm" @click="isOpen = false"> Tutup </UiButton>
        <UiButton variant="primary" size="sm" icon="pi-print" @click="handlePrint">
          Cetak Label (A6)
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
