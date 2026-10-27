<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'

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
}>()

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return dateStr
  }
}

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'paid':
      return { variant: 'info' as const, label: 'Diproses' }
    case 'shipped':
      return { variant: 'info' as const, label: 'Dikirim' }
    case 'completed':
      return { variant: 'success' as const, label: 'Selesai' }
    case 'cancelled':
      return { variant: 'danger' as const, label: 'Dibatalkan' }
    case 'pending':
    default:
      return { variant: 'warning' as const, label: 'Menunggu Pembayaran' }
  }
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

const latestCheckpoint = computed(() => {
  if (!props.order.checkpoints || props.order.checkpoints.length === 0) return null
  return [...props.order.checkpoints].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0]
})

const currentLocationText = computed(() => {
  if (latestCheckpoint.value?.location) {
    return latestCheckpoint.value.location
  }
  if (props.order.status === 'completed') {
    return props.order.address?.city ? `Diterima di ${props.order.address.city}` : 'Telah Diterima'
  }
  if (props.order.status === 'shipped') {
    return props.order.address?.city ? `Menuju ${props.order.address.city}` : 'Dalam Pengiriman'
  }
  return null
})

const formatCheckpointTime = (dateStr?: string) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return dateStr
  }
}

const copiedResi = ref(false)
const copyResi = async (resi?: string | null) => {
  if (!resi || !import.meta.client) return
  try {
    await navigator.clipboard.writeText(resi)
    copiedResi.value = true
    setTimeout(() => {
      copiedResi.value = false
    }, 2000)
  } catch {
    // clipboard fallback
  }
}

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

    <!-- Logistics & Tracking Strip (Informasi kurir, nomor resi, dan lokasi terkini paket) -->
    <div
      v-if="order.tracking_number"
      class="bg-blue-50/40 border border-blue-100 rounded-field p-3 sm:p-3.5 text-xs space-y-2 transition-colors"
      @click.stop
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 shrink-0"
          >
            <i class="pi pi-truck text-[10px]" />
          </span>
          <span class="font-bold text-brand-ink uppercase text-[11px] tracking-wide">
            {{ order.courier_name || 'Kurir Ekspedisi' }}
          </span>
          <span class="text-brand-faint">·</span>
          <span
            class="font-mono text-brand-ink font-semibold text-[11px] bg-white px-2 py-0.5 rounded border border-blue-200/60"
          >
            {{ order.tracking_number }}
          </span>
          <button
            type="button"
            class="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 ml-1 transition-colors"
            :title="copiedResi ? 'Nomor resi tersalin!' : 'Salin nomor resi'"
            @click.stop="copyResi(order.tracking_number)"
          >
            <i
              :class="copiedResi ? 'pi pi-check text-emerald-600 text-xs' : 'pi pi-copy text-xs'"
            />
            <span class="text-[10px] font-semibold">{{ copiedResi ? 'Tersalin' : 'Salin' }}</span>
          </button>
        </div>

        <NuxtLink
          :to="`/tracking?q=${encodeURIComponent(order.tracking_number)}`"
          class="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline no-underline shrink-0"
          @click.stop
        >
          <i class="pi pi-compass text-[11px]" />
          <span>Lacak Detail</span>
        </NuxtLink>
      </div>

      <!-- Current Location & Checkpoint Status -->
      <div class="flex items-start gap-2 pt-1.5 border-t border-blue-100/70 text-[11px]">
        <i class="pi pi-map-marker text-blue-600 text-xs mt-0.5 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-brand-ink m-0">
            Lokasi:
            <span class="text-blue-900 font-bold">{{ currentLocationText }}</span>
            <span v-if="latestCheckpoint?.title" class="font-normal text-brand-muted">
              · {{ latestCheckpoint.title }}
            </span>
          </p>
          <p
            v-if="latestCheckpoint?.description"
            class="text-brand-muted text-[10px] m-0 mt-0.5 line-clamp-1"
          >
            {{ latestCheckpoint.description }}
          </p>
        </div>
        <span
          v-if="latestCheckpoint?.created_at"
          class="text-[10px] text-brand-faint tabular-nums shrink-0 self-center hidden sm:inline-block"
        >
          {{ formatCheckpointTime(latestCheckpoint.created_at) }}
        </span>
      </div>
    </div>

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
