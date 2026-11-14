<script setup lang="ts">
import type { Order } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import {
  formatInvoiceDate as formatDate,
  formatInvoiceNumber,
  getInvoiceShippingServiceName,
  getInvoiceShippingFeeDisplay,
} from '../utils/order-invoice'
import { renderQrCodeSvg } from '../utils/logistics-vector'

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

const invoiceNumber = computed(() => formatInvoiceNumber(props.order.id))
const shippingServiceName = computed(() =>
  getInvoiceShippingServiceName(props.order.shipping_service),
)
const shippingFeeDisplay = computed(() =>
  getInvoiceShippingFeeDisplay(props.order.shipping_cost_cents),
)
const verificationQrSvg = computed(() =>
  renderQrCodeSvg(`https://shelfstack.co.id/tracking?order_id=${props.order.id}`, { size: 54 }),
)

const handlePrint = () => {
  if (import.meta.client) {
    window.print()
  }
}
</script>

<template>
  <UiModal v-model:visible="isOpen" :title="`Invoice #${order.id.slice(0, 8)}`" size="lg">
    <!-- Action Bar (No Print) -->
    <div
      class="no-print mb-5 flex items-center justify-between gap-3 rounded-field border border-brand-hair bg-brand-canvas-soft px-4 py-3"
    >
      <span class="text-xs text-brand-muted">
        Invoice resmi transaksi e-commerce ShelfStack Indonesia.
      </span>
    </div>

    <!-- Printable Invoice Sheet -->
    <div class="invoice-sheet space-y-8 bg-white p-6 font-sans text-brand-ink sm:p-10">
      <!-- Invoice Header -->
      <div
        class="flex flex-col justify-between gap-6 border-b border-brand-hair pb-6 sm:flex-row sm:items-start"
      >
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span class="font-display text-xl font-black tracking-tight text-brand-ink">
              SHELF<span class="text-brand-accent">STACK</span>
            </span>
          </div>
          <p class="m-0 text-xs leading-relaxed text-brand-muted">
            PT ShelfStack Niaga Digital<br />
            Menara Karya Lt. 18, Jakarta Selatan<br />
            NPWP: 01.234.567.8-012.000
          </p>
        </div>

        <div class="space-y-1 sm:text-right">
          <div
            class="inline-block rounded-full border border-brand-hair bg-brand-canvas px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-ink"
          >
            FAKTUR PENJUALAN
          </div>
          <h2 class="m-0 font-mono text-base font-bold tabular text-brand-ink">
            {{ invoiceNumber }}
          </h2>
          <p class="m-0 text-xs text-brand-muted">Tanggal: {{ formatDate(order.created_at) }}</p>
          <div v-if="order.paid_at" class="text-xs font-semibold text-brand-success-text">
            LUNAS ({{ formatDate(order.paid_at) }})
          </div>
        </div>
      </div>

      <!-- Customer & Shipping Details -->
      <div class="grid grid-cols-1 gap-6 border-b border-brand-hair pb-6 text-xs sm:grid-cols-2">
        <div>
          <span
            class="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-muted"
          >
            DITAGIHKAN KEPADA:
          </span>
          <div class="mb-1 text-sm font-bold text-brand-ink">
            {{ order.address?.name || 'Pelanggan ShelfStack' }}
          </div>
          <p class="m-0 leading-relaxed text-brand-muted">
            No. Telepon: {{ order.address?.phone || '-' }}<br />
            Kota: {{ order.address?.city || '-' }}<br />
            {{ order.address?.street || '' }}
          </p>
        </div>

        <div class="sm:text-right">
          <span
            class="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-brand-muted"
          >
            STATUS & METODE BAYAR:
          </span>
          <p class="m-0 leading-relaxed text-brand-muted">
            Status: <span class="font-bold uppercase text-brand-ink">{{ order.status }}</span
            ><br />
            Metode:
            <span class="font-bold uppercase text-brand-ink">{{
              order.payment_type || 'Midtrans Payment Gateway'
            }}</span
            ><br />
            Pengiriman:
            <span class="font-semibold text-brand-ink">
              {{ shippingServiceName }}
              <template v-if="order.courier_name">({{ order.courier_name }})</template>
              <template v-if="(order.shipping_cost_cents ?? 0) === 0"> · Bebas Ongkir</template>
            </span>
          </p>
        </div>
      </div>

      <!-- Items Table -->
      <div>
        <table class="w-full border-collapse text-left text-xs">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas/60 text-[11px] uppercase tracking-wider text-brand-muted"
            >
              <th class="px-3 py-2.5 font-semibold">No</th>
              <th class="px-3 py-2.5 font-semibold">Deskripsi Produk</th>
              <th class="px-3 py-2.5 text-center font-semibold">Jumlah</th>
              <th class="px-3 py-2.5 text-right font-semibold">Harga Satuan</th>
              <th class="px-3 py-2.5 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr v-for="(item, idx) in order.items || []" :key="item.id">
              <td class="px-3 py-3 font-mono text-brand-muted tabular">{{ idx + 1 }}</td>
              <td class="px-3 py-3 font-medium text-brand-ink">
                {{ item.product?.name || `Item #${item.id.slice(0, 8)}` }}
              </td>
              <td class="px-3 py-3 text-center font-mono tabular text-brand-muted">
                {{ item.qty }}
              </td>
              <td class="px-3 py-3 text-right tabular text-brand-muted">
                {{ formatRupiah(item.price_cents / 100) }}
              </td>
              <td class="px-3 py-3 text-right font-semibold tabular text-brand-ink">
                {{ formatRupiah((item.price_cents * item.qty) / 100) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Financial Calculation Summary & Verification QR -->
      <div
        class="flex flex-col-reverse items-start justify-between gap-6 border-t border-brand-hair pt-4 sm:flex-row"
      >
        <div
          class="flex items-center gap-3 rounded-lg border border-brand-hair bg-brand-canvas p-2.5"
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="shrink-0" v-html="verificationQrSvg" />
          <div class="text-[10px] leading-tight text-brand-muted">
            <p class="m-0 font-bold text-brand-ink">Verifikasi Dokumen</p>
            <p class="m-0 mt-0.5 text-brand-faint">
              Pindai kode QR untuk memvalidasi keaslian transaksi digital ini.
            </p>
            <p class="m-0 mt-1 font-mono text-[9px] text-brand-muted">
              REF: {{ order.id.slice(0, 8).toUpperCase() }}
            </p>
          </div>
        </div>

        <div class="w-full space-y-2 text-xs sm:w-64">
          <div v-if="order.subtotal_cents" class="flex justify-between text-brand-muted">
            <span>Subtotal Produk:</span>
            <span class="font-medium tabular text-brand-ink">
              {{ formatRupiah(order.subtotal_cents / 100) }}
            </span>
          </div>
          <div
            v-if="order.discount_cents && order.discount_cents > 0"
            class="flex justify-between font-medium text-brand-success-text"
          >
            <span>Diskon Voucher{{ order.coupon_code ? ` (${order.coupon_code})` : '' }}:</span>
            <span class="font-bold tabular"> -{{ formatRupiah(order.discount_cents / 100) }} </span>
          </div>
          <div
            v-if="
              (order.coins_discount_cents && order.coins_discount_cents > 0) ||
              (order.coins_used && order.coins_used > 0)
            "
            class="flex justify-between font-medium text-amber-700 dark:text-amber-400"
          >
            <span
              >Potongan Koin{{
                order.coins_used
                  ? ` (${new Intl.NumberFormat('id-ID').format(order.coins_used)} Koin)`
                  : ''
              }}:</span
            >
            <span class="font-bold tabular">
              -{{
                formatRupiah(
                  (order.coins_discount_cents ?? (order.coins_used ? order.coins_used * 100 : 0)) /
                    100,
                )
              }}
            </span>
          </div>
          <div class="flex justify-between text-brand-muted">
            <span>Biaya Pengiriman ({{ shippingServiceName }}):</span>
            <span
              :class="[
                (order.shipping_cost_cents ?? 0) === 0
                  ? 'font-medium tabular text-brand-success-text'
                  : 'font-medium tabular text-brand-ink',
              ]"
            >
              {{ shippingFeeDisplay }}
            </span>
          </div>
          <div class="flex justify-between text-brand-muted">
            <span>PPN 11%:</span>
            <span class="font-medium text-brand-ink">Termasuk</span>
          </div>
          <div
            class="flex items-center justify-between border-t border-brand-hair pt-2 text-sm font-bold text-brand-ink"
          >
            <span>Total Tagihan:</span>
            <span class="font-mono text-base tabular">{{
              formatRupiah(order.total_cents / 100)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Footer Note -->
      <div
        class="space-y-1 border-t border-brand-hairsoft pt-6 text-center text-[10px] text-brand-muted"
      >
        <p class="m-0">
          Terima kasih telah berbelanja di ShelfStack. Bukti pembayaran ini sah dan diterbitkan
          secara elektronik oleh sistem.
        </p>
        <p class="m-0 text-brand-faint">
          Butuh bantuan transaksi? Hubungi support@shelfstack.co.id atau CS 24/7.
        </p>
      </div>
    </div>

    <template #footer>
      <UiButton variant="secondary" size="sm" class="no-print" icon="pi-print" @click="handlePrint">
        Cetak / Simpan PDF
      </UiButton>
    </template>
  </UiModal>
</template>
