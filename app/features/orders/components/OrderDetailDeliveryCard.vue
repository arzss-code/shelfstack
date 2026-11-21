<script setup lang="ts">
import type { Order } from '~/types/order'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'

defineProps<{
  order: Order
  copiedHeaderResi: boolean
  activeLatestCheckpointLocation: string
  activeLatestCheckpointTitle: string
}>()

defineEmits<{
  copyResi: [resi?: string | null]
}>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Address Card -->
    <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-3">
      <div class="flex items-center gap-2 pb-3 border-b border-brand-hairsoft">
        <i class="pi pi-map-marker text-brand-accent text-base" />
        <h2 class="font-display text-base font-bold text-brand-ink m-0">Tujuan Pengiriman</h2>
      </div>

      <div v-if="order.address" class="text-xs text-brand-muted space-y-1">
        <p class="font-bold text-brand-ink m-0">
          {{ order.address.name }} ({{ order.address.phone }})
        </p>
        <p class="m-0 leading-relaxed">
          {{ order.address.street }}, {{ order.address.city }} {{ order.address.postal }}
        </p>
        <p v-if="order.address.note" class="italic text-[11px] text-brand-muted pt-1 m-0">
          Catatan: "{{ order.address.note }}"
        </p>
      </div>
    </div>

    <!-- Shipping Logistics Card -->
    <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-3">
      <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
        <div class="flex items-center gap-2">
          <i class="pi pi-truck text-brand-accent text-base" />
          <h2 class="font-display text-base font-bold text-brand-ink m-0">Ekspedisi &amp; Resi</h2>
        </div>
        <UiBadge
          v-if="order.tracking_number"
          variant="info"
          :label="order.courier_name || 'Kurir'"
        />
      </div>

      <div v-if="order.tracking_number" class="text-xs text-brand-muted space-y-2.5">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[11px] text-brand-muted">Nomor Resi</span>
          <div class="flex items-center gap-1.5">
            <span
              class="font-mono font-bold text-brand-ink bg-brand-canvas-soft px-2 py-0.5 rounded border border-brand-hairsoft"
            >
              {{ order.tracking_number }}
            </span>
            <button
              type="button"
              class="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 transition-colors"
              :title="copiedHeaderResi ? 'Tersalin!' : 'Salin Resi'"
              @click="$emit('copyResi', order.tracking_number)"
            >
              <i
                :class="
                  copiedHeaderResi ? 'pi pi-check text-emerald-600 text-xs' : 'pi pi-copy text-xs'
                "
              />
              <span>{{ copiedHeaderResi ? 'Tersalin' : 'Salin' }}</span>
            </button>
          </div>
        </div>

        <div class="pt-2 border-t border-brand-hairsoft/70 space-y-1">
          <div class="flex items-start gap-1.5">
            <i class="pi pi-compass text-blue-600 text-xs mt-0.5 shrink-0" />
            <div>
              <p class="font-semibold text-brand-ink m-0">
                Lokasi Terkini:
                <span class="text-blue-900 font-bold">{{ activeLatestCheckpointLocation }}</span>
              </p>
              <p v-if="activeLatestCheckpointTitle" class="text-[11px] text-brand-muted m-0 mt-0.5">
                {{ activeLatestCheckpointTitle }}
              </p>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <UiButton
            :to="`/tracking?q=${encodeURIComponent(order.tracking_number)}`"
            variant="outline"
            size="sm"
            class="w-full justify-center text-xs"
            icon="pi-external-link"
            icon-pos="right"
          >
            Buka Halaman Lacak
          </UiButton>
        </div>
      </div>

      <div v-else class="text-xs text-brand-muted py-2 space-y-1">
        <p class="font-medium text-brand-ink m-0">Pengiriman Reguler ShelfStack</p>
        <p class="text-[11px] text-brand-muted m-0">
          {{
            order.status === 'pending'
              ? 'Nomor resi akan diterbitkan setelah pembayaran berhasil terverifikasi.'
              : 'Pesanan sedang dipersiapkan di gudang ShelfStack.'
          }}
        </p>
      </div>
    </div>
  </div>
</template>
