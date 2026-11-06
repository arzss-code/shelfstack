<script setup lang="ts">
import type { Order } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'

defineProps<{
  order: Order
  isPaying: boolean
  isCancelling: boolean
  isManualChecking: boolean
  getPaymentStatusBadge: (order: Order) => {
    variant: 'default' | 'info' | 'warning' | 'success' | 'danger'
    label: string
  }
  formatShippingServiceName: (service?: string | null) => string
  returnEligibility?: { isEligible: boolean; remainingDays?: number; reason?: string } | null
  returnTicket?: unknown
}>()

defineEmits<{
  pay: []
  checkStatus: []
  openCancelModal: []
  reorder: []
  openReturnModal: []
  openInvoiceModal: []
}>()
</script>

<template>
  <aside
    class="lg:col-span-4 w-full bg-white border border-brand-hair rounded-card p-6 shadow-whisper space-y-5 sticky top-24"
  >
    <h2
      class="font-display text-base font-bold text-brand-ink m-0 pb-3 border-b border-brand-hairsoft"
    >
      Ringkasan Pembayaran
    </h2>

    <div class="space-y-3 text-xs text-brand-muted">
      <div class="flex items-center justify-between">
        <span>Status Pembayaran</span>
        <UiBadge
          :variant="getPaymentStatusBadge(order).variant"
          :label="getPaymentStatusBadge(order).label"
        />
      </div>
      <div v-if="order.payment_type" class="flex items-center justify-between">
        <span>Metode Pembayaran</span>
        <span class="font-semibold text-brand-ink uppercase">{{ order.payment_type }}</span>
      </div>
      <div v-if="order.subtotal_cents" class="flex items-center justify-between">
        <span>Subtotal Produk</span>
        <span class="font-semibold text-brand-ink tabular-nums">{{
          formatRupiah(order.subtotal_cents / 100)
        }}</span>
      </div>
      <div
        v-if="order.discount_cents && order.discount_cents > 0"
        class="flex items-center justify-between text-brand-success-text font-medium"
      >
        <span>Diskon Voucher {{ order.coupon_code ? '(' + order.coupon_code + ')' : '' }}</span>
        <span class="font-bold tabular-nums">
          -{{ formatRupiah(order.discount_cents / 100) }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span>
          Biaya Pengiriman
          <span v-if="order.shipping_service" class="text-brand-muted font-normal">
            ({{ formatShippingServiceName(order.shipping_service) }})
          </span>
        </span>
        <span
          :class="[
            (order.shipping_cost_cents ?? 0) === 0
              ? 'text-brand-success font-semibold'
              : 'font-semibold text-brand-ink tabular-nums',
          ]"
        >
          {{
            (order.shipping_cost_cents ?? 0) === 0
              ? 'Gratis Ongkir'
              : formatRupiah((order.shipping_cost_cents ?? 0) / 100)
          }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span>Pajak PPN (11%)</span>
        <span class="font-semibold text-brand-ink">Termasuk</span>
      </div>
    </div>

    <div class="pt-4 border-t border-brand-hairsoft flex items-center justify-between">
      <span class="font-display font-bold text-sm text-brand-ink">Total Tagihan</span>
      <span class="font-display text-xl font-bold text-brand-ink tabular-nums">
        {{ formatRupiah(order.total_cents / 100) }}
      </span>
    </div>

    <!-- Action Button if pending -->
    <div v-if="order.status === 'pending'" class="space-y-3 pt-2">
      <UiButton
        variant="primary"
        size="md"
        class="w-full justify-center"
        icon="pi-credit-card"
        :loading="isPaying"
        :disabled="isCancelling || isManualChecking"
        @click="$emit('pay')"
      >
        Bayar Sekarang (Midtrans)
      </UiButton>
      <UiButton
        variant="outline"
        size="md"
        class="w-full justify-center !text-brand-ink hover:!bg-brand-hairsoft font-semibold"
        icon="pi-sync"
        :loading="isManualChecking"
        :disabled="isPaying || isCancelling"
        @click="$emit('checkStatus')"
      >
        Cek Status Pembayaran
      </UiButton>
      <UiButton
        variant="outline"
        size="sm"
        class="w-full justify-center !text-red-600 hover:!text-red-700 hover:!border-red-300"
        icon="pi-times-circle"
        :disabled="isPaying || isCancelling || isManualChecking"
        @click="$emit('openCancelModal')"
      >
        Batalkan Pesanan
      </UiButton>
      <p class="text-[11px] text-brand-muted text-center m-0">
        Pembayaran diproses secara instan dan aman melalui jaringan Midtrans.
      </p>
    </div>

    <!-- Action Button if cancelled: Single primary CTA for reorder -->
    <div v-else-if="order.status === 'cancelled'" class="space-y-3 pt-2">
      <UiButton
        variant="primary"
        size="md"
        class="w-full justify-center"
        icon="pi-refresh"
        @click="$emit('reorder')"
      >
        Beli Lagi
      </UiButton>
    </div>

    <!-- Ajukan Komplain & Retur Produk (Hanya completed dalam 7 hari & belum ada tiket aktif) -->
    <UiButton
      v-if="order.status === 'completed' && returnEligibility?.isEligible && !returnTicket"
      variant="outline"
      size="sm"
      class="w-full justify-center text-xs border-brand-hair hover:border-brand-ink"
      icon="pi-replay"
      @click="$emit('openReturnModal')"
    >
      Ajukan Komplain &amp; Retur
    </UiButton>

    <!-- Invoice is only available for confirmed/paid/shipped/completed orders -->
    <UiButton
      v-if="['paid', 'shipped', 'completed'].includes(order.status)"
      variant="outline"
      size="sm"
      class="w-full justify-center text-xs"
      icon="pi-print"
      @click="$emit('openInvoiceModal')"
    >
      Cetak Invoice Resmi
    </UiButton>

    <UiButton
      to="/orders"
      variant="secondary"
      size="sm"
      class="w-full justify-center text-xs"
      icon="pi-arrow-left"
    >
      Kembali ke Daftar Pesanan
    </UiButton>
  </aside>
</template>
