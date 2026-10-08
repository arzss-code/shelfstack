<script setup lang="ts">
import type { Order } from '~/types/order'
import { formatRupiah } from '~/utils/format'

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

const formatDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

const invoiceNumber = computed(() => {
  return `INV-${props.order.id.slice(0, 8).toUpperCase()}`
})

const handlePrint = () => {
  if (import.meta.client) {
    window.print()
  }
}
</script>

<template>
  <Dialog
    v-model:visible="isOpen"
    modal
    dismissable-mask
    :header="`Invoice #${order.id.slice(0, 8)}`"
    :style="{ width: '850px', maxWidth: '95vw' }"
    :pt="{
      root: {
        class:
          '!rounded-2xl !bg-white dark:!bg-brand-canvas-soft border !border-brand-hair shadow-whisper overflow-hidden',
      },
      header: { class: '!p-4 !border-b !border-brand-hair text-brand-ink no-print' },
      content: { class: '!p-0' },
    }"
  >
    <!-- Action Bar (No Print) -->
    <div
      class="no-print bg-brand-canvas/60 px-6 py-3 border-b border-brand-hair flex items-center justify-between"
    >
      <span class="text-xs text-brand-muted">
        Invoice resmi transaksi e-commerce ShelfStack Indonesia.
      </span>
      <div class="flex items-center gap-2">
        <UiButton variant="secondary" size="sm" icon="pi-print" @click="handlePrint">
          Cetak / Simpan PDF
        </UiButton>
      </div>
    </div>

    <!-- Printable Invoice Sheet -->
    <div class="invoice-sheet p-6 sm:p-10 font-sans text-brand-ink space-y-8 bg-white">
      <!-- Invoice Header -->
      <div
        class="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-brand-hair pb-6"
      >
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="font-display font-black text-xl tracking-tight text-brand-ink">
              SHELF<span class="text-brand-accent">STACK</span>
            </span>
          </div>
          <p class="text-xs text-brand-muted m-0 leading-relaxed">
            PT ShelfStack Niaga Digital<br />
            Menara Karya Lt. 18, Jakarta Selatan<br />
            NPWP: 01.234.567.8-012.000
          </p>
        </div>

        <div class="sm:text-right space-y-1">
          <div
            class="inline-block bg-brand-canvas px-3 py-1 rounded-full border border-brand-hair text-[11px] font-bold uppercase tracking-wider text-brand-ink"
          >
            FAKTUR PENJUALAN
          </div>
          <h2 class="font-mono text-base font-bold text-brand-ink m-0">
            {{ invoiceNumber }}
          </h2>
          <p class="text-xs text-brand-muted m-0">Tanggal: {{ formatDate(order.created_at) }}</p>
          <div v-if="order.paid_at" class="text-xs font-semibold text-emerald-600">
            LUNAS ({{ formatDate(order.paid_at) }})
          </div>
        </div>
      </div>

      <!-- Customer & Shipping Details -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-brand-hair pb-6">
        <div>
          <span
            class="font-semibold text-brand-muted uppercase text-[10px] tracking-wider block mb-1"
          >
            DITAGIHKAN KEPADA:
          </span>
          <div class="font-bold text-sm text-brand-ink mb-1">
            {{ order.address?.name || 'Pelanggan ShelfStack' }}
          </div>
          <p class="text-brand-muted m-0 leading-relaxed">
            No. Telepon: {{ order.address?.phone || '-' }}<br />
            Kota: {{ order.address?.city || '-' }}<br />
            {{ order.address?.street || '' }}
          </p>
        </div>

        <div class="sm:text-right">
          <span
            class="font-semibold text-brand-muted uppercase text-[10px] tracking-wider block mb-1"
          >
            STATUS & METODE BAYAR:
          </span>
          <p class="text-brand-muted m-0 leading-relaxed">
            Status: <span class="font-bold text-brand-ink uppercase">{{ order.status }}</span
            ><br />
            Metode:
            <span class="font-bold text-brand-ink uppercase">{{
              order.payment_type || 'Midtrans Payment Gateway'
            }}</span
            ><br />
            Pengiriman:
            <span class="text-emerald-600 font-semibold">Gratis Ongkir Se-Indonesia</span>
          </p>
        </div>
      </div>

      <!-- Items Table -->
      <div>
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
            >
              <th class="py-2.5 px-3 font-semibold">No</th>
              <th class="py-2.5 px-3 font-semibold">Deskripsi Produk</th>
              <th class="py-2.5 px-3 font-semibold text-center">Jumlah</th>
              <th class="py-2.5 px-3 font-semibold text-right">Harga Satuan</th>
              <th class="py-2.5 px-3 font-semibold text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr v-for="(item, idx) in order.items || []" :key="item.id">
              <td class="py-3 px-3 text-brand-muted font-mono">{{ idx + 1 }}</td>
              <td class="py-3 px-3 font-medium text-brand-ink">
                {{ item.product?.name || `Item #${item.id.slice(0, 8)}` }}
              </td>
              <td class="py-3 px-3 text-center text-brand-muted font-mono">{{ item.qty }}</td>
              <td class="py-3 px-3 text-right text-brand-muted">
                {{ formatRupiah(item.price_cents / 100) }}
              </td>
              <td class="py-3 px-3 text-right font-semibold text-brand-ink">
                {{ formatRupiah((item.price_cents * item.qty) / 100) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Financial Calculation Summary -->
      <div class="flex justify-end pt-4 border-t border-brand-hair">
        <div class="w-full sm:w-64 space-y-2 text-xs">
          <div class="flex justify-between text-brand-muted">
            <span>Biaya Pengiriman:</span>
            <span class="text-emerald-600 font-medium">Rp 0 (Gratis)</span>
          </div>
          <div class="flex justify-between text-brand-muted">
            <span>PPN 11%:</span>
            <span class="font-medium text-brand-ink">Termasuk</span>
          </div>
          <div
            class="flex justify-between items-center pt-2 border-t border-brand-hair font-bold text-sm text-brand-ink"
          >
            <span>Total Tagihan:</span>
            <span class="font-mono text-base">{{ formatRupiah(order.total_cents / 100) }}</span>
          </div>
        </div>
      </div>

      <!-- Invoice Footer Note -->
      <div
        class="pt-6 border-t border-brand-hairsoft text-center text-[10px] text-brand-muted space-y-1"
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
  </Dialog>
</template>

<style scoped>
@media print {
  /* Sembunyikan elemen non-invoice saat dialog print browser aktif */
  .no-print {
    display: none !important;
  }
  .invoice-sheet {
    padding: 0 !important;
    background: white !important;
  }
}
</style>
