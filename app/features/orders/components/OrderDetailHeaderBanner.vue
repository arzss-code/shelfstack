<script setup lang="ts">
import type { Order } from '~/types/order'

defineProps<{
  order: Order
  copiedHeaderResi: boolean
  statusBadge: {
    variant: 'default' | 'info' | 'warning' | 'success' | 'danger'
    label: string
  }
  formatDate: (dateString: string) => string
}>()

const emit = defineEmits<{
  copyResi: [resi: string]
}>()
</script>

<template>
  <div
    class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  >
    <div>
      <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <h1 class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0">
          Pesanan #{{ order.id.slice(0, 8).toUpperCase() }}
        </h1>
        <UiBadge :variant="statusBadge.variant" :label="statusBadge.label" class="shrink-0" />
      </div>
      <p class="font-body text-xs text-brand-muted m-0 mt-1">
        Dibuat pada {{ formatDate(order.created_at) }}
        <span v-if="order.paid_at"> · Dibayar pada {{ formatDate(order.paid_at) }}</span>
      </p>
    </div>

    <div v-if="order.tracking_number" class="flex flex-wrap items-center gap-2 sm:justify-end">
      <div
        class="inline-flex items-center gap-2 bg-brand-accent-tint border border-brand-accent-edge rounded-field px-3 py-1.5 text-xs"
      >
        <span
          class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-accent text-white shrink-0"
        >
          <i class="pi pi-truck text-[10px]" />
        </span>
        <span class="font-bold text-brand-ink uppercase text-[11px]">{{
          order.courier_name || 'Kurir'
        }}</span>
        <span class="text-brand-faint">·</span>
        <span class="font-semibold text-brand-ink text-[11px]">{{ order.tracking_number }}</span>
        <button
          type="button"
          class="text-[11px] text-brand-accent-text hover:text-brand-ink font-medium inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 ml-1 transition-colors"
          :title="copiedHeaderResi ? 'Tersalin!' : 'Salin Resi'"
          @click="emit('copyResi', order.tracking_number)"
        >
          <i
            :class="
              copiedHeaderResi
                ? 'pi pi-check text-brand-success-text text-xs'
                : 'pi pi-copy text-xs'
            "
          />
          <span class="text-[10px]">{{ copiedHeaderResi ? 'Tersalin' : 'Salin' }}</span>
        </button>
      </div>
      <UiButton
        :to="`/tracking?q=${encodeURIComponent(order.tracking_number)}`"
        variant="outline"
        size="sm"
        icon="pi-compass"
      >
        Lacak Publik
      </UiButton>
    </div>
  </div>
</template>
