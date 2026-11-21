<script setup lang="ts">
import { computed } from 'vue'

export interface ChatOrderData {
  id: string
  order_number?: string | null
  total_cents: number
  status: string
}

interface Props {
  order: ChatOrderData
}

const props = defineProps<Props>()

const displayOrderNumber = computed(() => {
  if (props.order.order_number) return props.order.order_number
  return `ORD-${props.order.id.slice(0, 8).toUpperCase()}`
})

const formattedPrice = computed(() => {
  const rupiah = Math.round(props.order.total_cents / 100).toLocaleString('id-ID')
  return `Rp ${rupiah}`
})

const statusBadgeClass = computed(() => {
  switch (props.order.status) {
    case 'completed':
      return 'bg-brand-success-tint text-brand-success-text border-brand-success-edge'
    case 'paid':
    case 'shipped':
    case 'processing':
      return 'bg-brand-accent-tint text-brand-accent-text border-brand-accent-edge'
    case 'pending':
      return 'bg-brand-warning-tint text-brand-warning-text border-brand-warning-edge'
    case 'cancelled':
    case 'refunded':
      return 'bg-brand-danger-tint text-brand-danger-text border-brand-danger-edge'
    default:
      return 'bg-brand-canvas-soft text-brand-muted border-brand-hair'
  }
})
</script>

<template>
  <div
    class="chat-order-snippet rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper text-brand-ink"
  >
    <div class="flex items-center justify-between gap-2">
      <span class="order-number font-semibold text-xs text-brand-ink truncate">
        {{ displayOrderNumber }}
      </span>
      <span
        class="order-status-badge inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        :class="statusBadgeClass"
        :data-status="order.status"
      >
        {{ order.status }}
      </span>
    </div>
    <div class="order-price mt-1 text-xs font-bold text-brand-ink">
      {{ formattedPrice }}
    </div>
    <a
      :href="`/orders/${order.id}`"
      class="order-link mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-accent hover:underline no-underline"
    >
      <span>Lihat Detail Pesanan</span>
      <i class="pi pi-arrow-right text-[9px]" aria-hidden="true" />
    </a>
  </div>
</template>
