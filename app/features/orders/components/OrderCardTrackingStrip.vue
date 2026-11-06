<script setup lang="ts">
import type { Order } from '~/types/order'

const props = defineProps<{
  order: Order
}>()

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
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
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
    // Ignore clipboard fallback
  }
}
</script>

<template>
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
          <i :class="copiedResi ? 'pi pi-check text-emerald-600 text-xs' : 'pi pi-copy text-xs'" />
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
</template>
