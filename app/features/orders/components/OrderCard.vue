<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import OrderCardTrackingStrip from './OrderCardTrackingStrip.vue'

const props = withDefaults(
  defineProps<{
    order: Order
    isPaying?: boolean
  }>(),
  {
    isPaying: false,
  },
)

const emit = defineEmits<{
  select: [order: Order]
  pay: [order: Order]
  review: [order: Order]
}>()

const formatDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

const getStatusBadge = (status: OrderStatus) => {
  const map: Record<
    OrderStatus,
    { variant: 'info' | 'success' | 'danger' | 'warning'; label: string }
  > = {
    paid: { variant: 'info', label: 'Diproses' },
    shipped: { variant: 'info', label: 'Dikirim' },
    completed: { variant: 'success', label: 'Selesai' },
    cancelled: { variant: 'danger', label: 'Dibatalkan' },
    refunded: { variant: 'danger', label: 'Dikembalikan' },
    pending: { variant: 'warning', label: 'Menunggu Pembayaran' },
  }
  return map[status] || map.pending
}

const totalItemsCount = computed(() => {
  if (!props.order.items || props.order.items.length === 0) return 1
  return props.order.items.reduce((sum, item) => sum + (item.qty || 1), 0)
})

const primaryItem = computed(() => {
  if (!props.order.items || props.order.items.length === 0) return null
  return props.order.items[0]
})

const extraItemsCount = computed(() => {
  if (!props.order.items) return 0
  return Math.max(0, props.order.items.length - 1)
})

const handleCardClick = () => {
  emit('select', props.order)
}
</script>

<template>
  <article
    class="bg-white border border-brand-hair rounded-card p-5 sm:p-6 shadow-whisper hover:border-brand-ink/25 transition-all cursor-pointer space-y-4"
    @click="handleCardClick"
  >
    <!-- Top Metadata Header -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-brand-hairsoft"
    >
      <div class="flex items-center gap-2 sm:gap-3 text-xs">
        <span class="inline-flex items-center gap-1.5 font-bold text-brand-ink">
          <i class="pi pi-shopping-bag text-brand-muted text-[13px]" aria-hidden="true" />
          <span>Pesanan #{{ order.id.slice(0, 8).toUpperCase() }}</span>
        </span>
        <span class="text-brand-faint">·</span>
        <span class="text-brand-muted text-[11px] sm:text-xs">
          {{ formatDate(order.created_at) }}
        </span>
      </div>

      <UiBadge
        :variant="getStatusBadge(order.status).variant"
        :label="getStatusBadge(order.status).label"
      />
    </div>

    <!-- Product Item Preview -->
    <div class="space-y-3">
      <!-- Primary Item Row -->
      <div v-if="primaryItem" class="flex items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div
            class="w-16 h-16 sm:w-20 sm:h-20 rounded-media bg-brand-canvas-soft border border-brand-hairsoft overflow-hidden shrink-0 flex items-center justify-center"
          >
            <img
              v-if="primaryItem.product?.image_url"
              :src="primaryItem.product.image_url"
              :alt="primaryItem.product?.name || 'Produk Pesanan'"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <i v-else class="pi pi-box text-brand-faint text-2xl" aria-hidden="true" />
          </div>

          <div class="min-w-0">
            <h3
              class="font-display font-semibold text-xs sm:text-sm text-brand-ink m-0 line-clamp-1"
            >
              {{ primaryItem.product?.name || `Produk #${primaryItem.product_id}` }}
            </h3>
            <p class="font-body text-xs text-brand-muted m-0 mt-1">
              {{ primaryItem.qty }} barang x {{ formatRupiah(primaryItem.price_cents / 100) }}
            </p>
          </div>
        </div>

        <div class="text-right shrink-0">
          <span class="font-display font-semibold text-xs sm:text-sm text-brand-ink tabular-nums">
            {{ formatRupiah((primaryItem.price_cents * primaryItem.qty) / 100) }}
          </span>
        </div>
      </div>

      <!-- Fallback when items relation is empty -->
      <div v-else class="flex items-center gap-3 text-xs text-brand-muted py-2">
        <div
          class="w-12 h-12 rounded-media bg-brand-canvas-soft border border-brand-hairsoft flex items-center justify-center shrink-0"
        >
          <i class="pi pi-receipt text-brand-muted text-lg" aria-hidden="true" />
        </div>
        <div>
          <p class="font-semibold text-brand-ink m-0">Rincian Transaksi</p>
          <p class="text-[11px] text-brand-muted m-0">Informasi pesanan siap dilihat.</p>
        </div>
      </div>

      <!-- Extra items indicator -->
      <div v-if="extraItemsCount > 0" class="pt-1">
        <span
          class="inline-flex items-center gap-1 text-[11px] font-medium text-brand-muted bg-brand-canvas-soft px-2.5 py-1 rounded-full border border-brand-hairsoft"
        >
          <i class="pi pi-plus text-[9px]" aria-hidden="true" />
          <span>{{ extraItemsCount }} produk lainnya dalam pesanan ini</span>
        </span>
      </div>
    </div>

    <!-- Logistics & Tracking Strip -->
    <OrderCardTrackingStrip :order="order" />

    <!-- Bottom Summary & Action Controls -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-brand-hairsoft"
    >
      <div class="text-xs text-brand-muted space-y-0.5">
        <div class="flex items-center gap-1.5">
          <i class="pi pi-map-marker text-brand-muted text-[11px]" aria-hidden="true" />
          <span class="text-[11px] text-brand-muted truncate max-w-xs sm:max-w-md">
            Tujuan: <strong class="text-brand-ink">{{ order.address?.name || 'Pelanggan' }}</strong>
            <template v-if="order.address?.city"> · {{ order.address.city }} </template>
          </span>
        </div>
      </div>

      <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-5">
        <div class="text-left sm:text-right">
          <span class="text-[11px] text-brand-muted block">
            Total Belanja ({{ totalItemsCount }} barang)
          </span>
          <span class="font-display text-sm sm:text-base font-bold text-brand-ink tabular-nums">
            {{ formatRupiah(order.total_cents / 100) }}
          </span>
        </div>

        <div class="flex items-center gap-2" @click.stop>
          <UiButton
            v-if="order.status === 'pending'"
            variant="primary"
            size="sm"
            icon="pi-wallet"
            :loading="isPaying"
            @click="emit('pay', order)"
          >
            Bayar
          </UiButton>

          <UiButton
            v-if="order.tracking_number"
            :to="`/tracking?q=${encodeURIComponent(order.tracking_number)}`"
            variant="outline"
            size="sm"
            icon="pi-compass"
          >
            Lacak
          </UiButton>

          <UiButton
            v-if="order.status === 'completed'"
            variant="outline"
            size="sm"
            icon="pi-star"
            @click="emit('review', order)"
          >
            Beri Ulasan
          </UiButton>

          <UiButton
            :to="`/orders/${order.id}`"
            variant="secondary"
            size="sm"
            icon="pi-chevron-right"
            icon-pos="right"
          >
            Detail
          </UiButton>
        </div>
      </div>
    </div>
  </article>
</template>
