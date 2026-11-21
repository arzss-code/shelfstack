<template>
  <div class="bg-brand-canvas border border-brand-hair rounded-card p-5 sm:p-6 shadow-whisper">
    <!-- Header: Courier & Tracking Number -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-hairsoft"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full bg-brand-accent-tint text-brand-accent flex items-center justify-center shrink-0"
        >
          <i class="pi pi-truck text-lg" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-brand-ink uppercase tracking-wider">
              {{ courierName || 'Kurir Ekspedisi' }}
            </span>
            <span
              v-if="status"
              class="px-2 py-0.5 text-caption font-bold rounded-full uppercase"
              :class="getStatusBadgeClass(status)"
            >
              {{ getStatusLabel(status) }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xs text-brand-muted font-mono">{{ trackingNumber }}</span>
            <button
              v-if="trackingNumber"
              type="button"
              class="text-caption text-brand-accent hover:text-brand-accent-hover font-medium inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              @click="copyTrackingNumber"
            >
              <i :class="copied ? 'pi pi-check text-brand-success' : 'pi pi-copy text-xs'" />
              <span>{{ copied ? 'Tersalin' : 'Salin Resi' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Destination Summary -->
      <div v-if="destinationCity" class="text-left sm:text-right">
        <span class="text-[10px] text-brand-muted uppercase tracking-wider block"
          >Tujuan Pengiriman</span
        >
        <span
          class="text-xs font-semibold text-brand-ink flex items-center sm:justify-end gap-1 mt-0.5"
        >
          <i class="pi pi-map-marker text-[10px] text-brand-muted" />
          <span>{{ destinationCity }}</span>
        </span>
      </div>
    </div>

    <!-- Timeline Body -->
    <div class="pt-5">
      <div v-if="checkpoints && checkpoints.length > 0" class="relative pl-6 sm:pl-8 space-y-6">
        <!-- Connecting Line -->
        <div class="absolute left-2.5 sm:left-3.5 top-2.5 bottom-2.5 w-0.5 bg-brand-hairsoft" />

        <!-- Checkpoint Items -->
        <div v-for="(cp, idx) in checkpoints" :key="cp.id || idx" class="relative group">
          <!-- Node Icon / Dot -->
          <div
            class="absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-brand-canvas"
            :class="
              idx === 0
                ? 'bg-brand-accent text-white shadow-xs'
                : 'bg-brand-canvas-soft text-brand-muted border border-brand-hair'
            "
          >
            <i
              :class="
                idx === 0
                  ? 'pi pi-check text-[9px] font-bold'
                  : 'pi pi-circle-fill text-[6px] text-brand-faint'
              "
            />
          </div>

          <!-- Content Card -->
          <div
            class="rounded-lg p-3 transition-colors"
            :class="
              idx === 0
                ? 'bg-brand-accent-tint border border-brand-accent-edge'
                : 'hover:bg-brand-canvas-soft/40'
            "
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
              <h5
                class="text-xs sm:text-sm m-0"
                :class="idx === 0 ? 'font-bold text-brand-ink' : 'font-semibold text-brand-ink/80'"
              >
                {{ cp.title }}
              </h5>
              <span class="text-[10px] sm:text-[11px] text-brand-faint tabular-nums shrink-0">
                {{ formatDateTime(cp.created_at) }}
              </span>
            </div>

            <p class="text-xs text-brand-muted m-0 leading-relaxed">
              {{ cp.description }}
            </p>

            <div
              v-if="cp.location"
              class="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-brand-muted"
            >
              <i class="pi pi-compass text-[9px] text-brand-muted" />
              <span>Lokasi: {{ cp.location }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-8">
        <i class="pi pi-info-circle text-2xl text-brand-faint mb-2 block" />
        <p class="text-xs font-semibold text-brand-ink m-0">Linimasa Belum Tersedia</p>
        <p class="text-[11px] text-brand-muted mt-0.5 m-0">
          Paket baru saja diserahkan ke pihak ekspedisi. Checkpoint akan diperbarui secara bertahap.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CheckpointStatus, ShippingCheckpoint } from '../../../shared/schemas/shipping'

interface Props {
  orderId?: string
  trackingNumber: string
  courierName?: string
  status?: string
  destinationCity?: string
  checkpoints?: ShippingCheckpoint[]
}

const props = withDefaults(defineProps<Props>(), {
  orderId: '',
  courierName: 'JNE Express',
  status: 'shipped',
  destinationCity: '',
  checkpoints: () => [],
})

const copied = ref(false)

const copyTrackingNumber = async () => {
  if (!props.trackingNumber) return
  try {
    await navigator.clipboard.writeText(props.trackingNumber)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err: unknown) {
    if (import.meta.dev) console.error('Gagal menyalin nomor resi:', err)
  }
}

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'bg-brand-success-tint text-brand-success-text border border-brand-success-edge'
    case 'shipped':
    case 'in_transit':
      return 'bg-brand-accent-tint text-brand-accent-text border border-brand-accent-edge'
    case 'cancelled':
      return 'bg-brand-danger-tint text-brand-danger-text border border-brand-danger-edge'
    default:
      return 'bg-brand-canvas-soft text-brand-muted border border-brand-hair'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'completed':
    case 'delivered':
      return 'Terkirim'
    case 'shipped':
      return 'Dalam Pengiriman'
    case 'in_transit':
      return 'Transit'
    default:
      return status
  }
}

const formatDateTime = (isoString: string): string => {
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
</script>
