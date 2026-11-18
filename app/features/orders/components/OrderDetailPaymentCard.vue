<script setup lang="ts">
import { ref } from 'vue'
import type { Order } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'
import OrderPaymentCountdownCard from './OrderPaymentCountdownCard.vue'
import type { PaidRefundRequestState } from '~/composables/usePaidOrderRefundRequest'

defineProps<{
  order: Order
  isPaying: boolean
  isCancelling: boolean
  isManualChecking: boolean
  isConfirmingDelivery?: boolean
  getPaymentStatusBadge: (order: Order) => {
    variant: 'default' | 'info' | 'warning' | 'success' | 'danger'
    label: string
  }
  formatShippingServiceName: (service?: string | null) => string
  returnEligibility?: { isEligible: boolean; remainingDays?: number; reason?: string } | null
  returnTicket?: unknown
  paidRefundRequest?: PaidRefundRequestState | null
}>()

const emit = defineEmits<{
  pay: []
  checkStatus: []
  openCancelModal: []
  openPaidRefundModal: []
  reorder: []
  openReturnModal: []
  openInvoiceModal: []
  confirmDelivery: []
  paymentExpired: []
}>()

const isPaymentExpired = ref(false)

const onPaymentExpired = () => {
  isPaymentExpired.value = true
  emit('paymentExpired')
}
</script>

<template>
  <aside
    class="lg:col-span-4 w-full bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-5 sticky top-24"
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
          :variant="
            isPaymentExpired && order.status === 'pending'
              ? 'danger'
              : getPaymentStatusBadge(order).variant
          "
          :label="
            isPaymentExpired && order.status === 'pending'
              ? 'Waktu Habis'
              : getPaymentStatusBadge(order).label
          "
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
      <div
        v-if="
          (order.coins_discount_cents && order.coins_discount_cents > 0) ||
          (order.coins_used && order.coins_used > 0)
        "
        class="flex items-center justify-between font-medium text-brand-warning-text"
      >
        <span class="flex items-center gap-1.5 truncate">
          <span>Potongan Koin</span>
          <span
            v-if="order.coins_used"
            class="rounded border border-brand-warning-edge bg-brand-warning-tint px-1.5 py-0.5 tabular-nums text-[10px] text-brand-warning-text"
          >
            {{ new Intl.NumberFormat('id-ID').format(order.coins_used) }} Koin
          </span>
        </span>
        <span class="font-bold tabular-nums">
          -{{
            formatRupiah(
              (order.coins_discount_cents ?? (order.coins_used ? order.coins_used * 100 : 0)) / 100,
            )
          }}
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
    <div v-if="order.status === 'pending' && !isPaymentExpired" class="space-y-3 pt-2">
      <OrderPaymentCountdownCard :created-at="order.created_at" @expired="onPaymentExpired" />
      <UiButton
        variant="primary"
        size="md"
        class="w-full justify-center"
        icon="pi-credit-card"
        :loading="isPaying"
        :disabled="isCancelling || isManualChecking || isPaymentExpired"
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
        class="w-full justify-center !text-brand-danger-text hover:!border-brand-danger-edge hover:!bg-brand-danger-tint"
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

    <!-- Paid & Unshipped: Customer Pre-Shipment Refund Request -->
    <div v-else-if="order.status === 'paid' && !order.tracking_number" class="space-y-2 pt-2">
      <div
        v-if="paidRefundRequest?.status === 'pending'"
        class="rounded-card border border-brand-warning-edge bg-brand-warning-tint px-3.5 py-2.5 text-xs font-medium text-brand-warning-text"
      >
        Pengajuan Pembatalan &amp; Refund Sedang Ditinjau Admin
      </div>
      <UiButton
        v-else
        variant="outline"
        size="sm"
        class="w-full justify-center text-xs !text-brand-danger-text !border-brand-danger-edge hover:!bg-brand-danger-tint"
        icon="pi-times-circle"
        @click="$emit('openPaidRefundModal')"
      >
        Ajukan Pembatalan &amp; Refund
      </UiButton>
    </div>

    <!-- Action Button if shipped: Konfirmasi Pesanan Diterima -->
    <div v-else-if="order.status === 'shipped'" class="space-y-2 pt-2">
      <UiButton
        variant="primary"
        size="md"
        class="w-full justify-center !bg-brand-success hover:!bg-brand-success-text !text-white font-semibold"
        icon="pi-check-circle"
        :loading="isConfirmingDelivery"
        @click="$emit('confirmDelivery')"
      >
        Konfirmasi Pesanan Diterima
      </UiButton>
      <p class="text-[11px] text-brand-muted text-center m-0">
        Pastikan seluruh paket telah tiba dan sesuai sebelum menyelesaikan pesanan.
      </p>
    </div>

    <!-- Action Button if cancelled or expired: Single primary CTA for reorder -->
    <div v-else-if="order.status === 'cancelled' || isPaymentExpired" class="space-y-3 pt-2">
      <OrderPaymentCountdownCard
        v-if="isPaymentExpired"
        :created-at="order.created_at"
        @expired="onPaymentExpired"
      />
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
