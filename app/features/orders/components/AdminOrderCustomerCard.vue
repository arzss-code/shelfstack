<script setup lang="ts">
import { ref } from 'vue'
import type { Order } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import AdminCustomer360Drawer from '~/components/admin/users/AdminCustomer360Drawer.vue'

defineProps<{
  order: Order
  formatDate: (dateStr?: string | null) => string
}>()

const isCustomer360Open = ref(false)
</script>

<template>
  <div class="space-y-6">
    <!-- Delivery Address -->
    <div
      class="rounded-card border border-brand-hair bg-brand-canvas-soft p-5 shadow-whisper space-y-3"
    >
      <div class="flex items-center justify-between gap-2">
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Informasi Pengiriman</h2>
        <UiButton
          v-if="order.user_id"
          size="xs"
          variant="outline"
          icon="pi-user"
          @click="isCustomer360Open = true"
        >
          Detail Pelanggan
        </UiButton>
      </div>
      <div class="text-xs text-brand-ink space-y-1.5 pt-1">
        <p class="font-semibold m-0">{{ order.address.name }}</p>
        <p class="text-brand-muted m-0">{{ order.address.phone }}</p>
        <p class="m-0">{{ order.address.street }}</p>
        <p class="text-brand-muted m-0">{{ order.address.city }}, {{ order.address.postal }}</p>
        <p
          v-if="order.address.note"
          class="italic text-brand-muted mt-2 m-0 bg-brand-canvas p-2 rounded-lg"
        >
          "{{ order.address.note }}"
        </p>
      </div>
    </div>

    <!-- Payment Info -->
    <div
      class="rounded-card border border-brand-hair bg-brand-canvas-soft p-5 shadow-whisper space-y-3"
    >
      <h2 class="font-display text-base font-bold text-brand-ink m-0">Detail Pembayaran</h2>
      <div class="text-xs text-brand-muted space-y-2 pt-1">
        <div class="flex justify-between">
          <span>Metode:</span>
          <span class="font-medium text-brand-ink">{{
            order.payment_type || 'Midtrans Snap'
          }}</span>
        </div>
        <div v-if="order.subtotal_cents" class="flex justify-between">
          <span>Subtotal:</span>
          <span class="font-medium text-brand-ink">{{
            formatRupiah(order.subtotal_cents / 100)
          }}</span>
        </div>
        <div
          v-if="order.discount_cents && order.discount_cents > 0"
          class="flex justify-between text-brand-success-text font-semibold"
        >
          <span>Diskon Voucher ({{ order.coupon_code }}):</span>
          <span class="font-bold">-{{ formatRupiah(order.discount_cents / 100) }}</span>
        </div>
        <div class="flex justify-between">
          <span>Waktu Pembayaran:</span>
          <span class="font-medium text-brand-ink">{{ formatDate(order.paid_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Customer 360 Slide-Over Drawer -->
    <AdminCustomer360Drawer
      v-if="order.user_id"
      v-model:visible="isCustomer360Open"
      :user-id="order.user_id"
      :fallback-customer="null"
    />
  </div>
</template>
