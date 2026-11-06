<script setup lang="ts">
import UiModal from '~/components/ui/UiModal.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiTextarea from '~/components/ui/UiTextarea.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import type { ReturnRequestItem } from '~~/shared/schemas/return-request'
import { RETURN_REASON_LABELS, RETURN_SOLUTION_LABELS } from '~~/server/utils/return-request'
import { useAdminReturnReview } from '~/composables/useAdminReturnReview'

interface Props {
  modelValue: boolean
  ticket: ReturnRequestItem | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  reviewed: []
}>()

const {
  isSubmitting,
  modalError,
  adminNotes,
  restockInventory,
  replacementCourier,
  replacementTrackingNumber,
  statusMeta,
  handleActionSubmit,
} = useAdminReturnReview(() => props.ticket, {
  onReviewed: () => emit('reviewed'),
  onClose: () => emit('update:modelValue', false),
})
</script>

<template>
  <UiModal
    :model-value="modelValue"
    title="Tinjau Pengajuan Retur & Komplain"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="ticket" class="space-y-4 py-1 text-xs">
      <UiAlert v-if="modalError" tone="danger">
        {{ modalError }}
      </UiAlert>

      <!-- Ringkasan Tiket & Status -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-card border border-brand-hair bg-brand-canvas-soft p-3.5"
      >
        <div>
          <span class="block text-[11px] text-brand-muted">Nomor Pesanan</span>
          <span class="block font-bold text-brand-ink text-sm">{{ ticket.order_number }}</span>
          <span class="block text-[11px] text-brand-muted mt-1"
            >Pemohon: {{ ticket.customer_name }}</span
          >
        </div>

        <div class="flex flex-col sm:items-end justify-between gap-2">
          <UiBadge v-if="statusMeta" :label="statusMeta.label" :variant="statusMeta.tone" />
          <span class="text-[11px] font-semibold text-brand-ink">
            Solusi: {{ RETURN_SOLUTION_LABELS[ticket.solution_type] }}
          </span>
        </div>
      </div>

      <!-- Detail Kendala Pelanggan -->
      <div class="space-y-2">
        <h4 class="m-0 font-bold text-brand-ink">Informasi Keluhan Pelanggan</h4>
        <div
          class="rounded-card border border-brand-hair bg-brand-canvas p-3 space-y-1.5 leading-relaxed"
        >
          <p class="m-0 font-semibold text-brand-ink">
            Kategori: {{ RETURN_REASON_LABELS[ticket.reason_type] }}
          </p>
          <p class="m-0 text-brand-muted">"{{ ticket.customer_notes }}"</p>
          <p v-if="ticket.unboxing_video_url" class="m-0 pt-1 text-[11px]">
            <a
              :href="ticket.unboxing_video_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand-accent underline inline-flex items-center gap-1"
            >
              <i class="pi pi-external-link text-[10px]" />
              <span>Buka Tautan Video Unboxing</span>
            </a>
          </p>
        </div>
      </div>

      <!-- Galeri Foto Bukti -->
      <div v-if="ticket.proof_image_urls && ticket.proof_image_urls.length > 0" class="space-y-2">
        <h4 class="m-0 font-bold text-brand-ink">
          Lampiran Foto Bukti ({{ ticket.proof_image_urls.length }})
        </h4>
        <div class="flex flex-wrap gap-2.5">
          <a
            v-for="(url, idx) in ticket.proof_image_urls"
            :key="idx"
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="block h-24 w-24 overflow-hidden rounded-field border border-brand-hair hover:border-brand-ink transition-all group"
          >
            <img
              :src="url"
              alt="Bukti retur"
              class="h-full w-full object-cover group-hover:scale-105 transition-transform"
            />
          </a>
        </div>
      </div>

      <!-- Informasi Pengiriman Balik (Jika Disetujui) -->
      <div
        v-if="ticket.return_tracking_number"
        class="rounded-card border border-brand-hair bg-brand-canvas p-3 space-y-1"
      >
        <h4 class="m-0 font-bold text-brand-ink">Resi Pengiriman Balik Pelanggan</h4>
        <p class="m-0 font-mono font-bold text-brand-ink text-sm">
          {{ ticket.return_courier?.toUpperCase() }} - {{ ticket.return_tracking_number }}
        </p>
      </div>

      <!-- Panel Aksi Keputusan Admin -->
      <div class="space-y-3 pt-2 border-t border-brand-hairsoft">
        <h4 class="m-0 font-bold text-brand-ink">Tindakan Keputusan Admin</h4>

        <!-- Input Catatan Admin -->
        <div>
          <label
            for="admin-decision-notes"
            class="block font-medium text-brand-muted mb-1 text-[11px]"
          >
            Catatan Keputusan / Alasan Penolakan
          </label>
          <UiTextarea
            id="admin-decision-notes"
            v-model="adminNotes"
            :rows="2"
            placeholder="Tuliskan catatan inspeksi gudang atau penjelasan penolakan..."
          />
        </div>

        <!-- Field Ekstra untuk Penyelesaian (Completed) -->
        <div
          v-if="ticket.status === 'item_received'"
          class="space-y-2.5 rounded-card border border-brand-hair bg-brand-canvas-soft p-3"
        >
          <div
            v-if="ticket.solution_type === 'replacement'"
            class="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            <div>
              <label
                for="replace-courier"
                class="block text-[11px] font-medium text-brand-muted mb-1"
                >Kurir Pengganti</label
              >
              <UiInput
                id="replace-courier"
                v-model="replacementCourier"
                placeholder="JNE / SiCepat / J&T"
              />
            </div>
            <div>
              <label
                for="replace-tracking"
                class="block text-[11px] font-medium text-brand-muted mb-1"
                >Resi Unit Baru</label
              >
              <UiInput
                id="replace-tracking"
                v-model="replacementTrackingNumber"
                placeholder="Resi unit baru..."
              />
            </div>
          </div>

          <label class="flex items-center gap-2 cursor-pointer pt-1">
            <input
              v-model="restockInventory"
              type="checkbox"
              class="rounded border-brand-hair text-brand-ink"
            />
            <span class="text-xs font-semibold text-brand-ink"
              >Kembalikan stok produk ke inventaris (Restock Item)</span
            >
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
        <UiButton
          variant="ghost"
          :disabled="isSubmitting"
          @click="emit('update:modelValue', false)"
        >
          Tutup
        </UiButton>

        <!-- Aksi untuk Status: requested -->
        <template v-if="ticket?.status === 'requested'">
          <UiButton
            variant="danger"
            :loading="isSubmitting"
            @click="handleActionSubmit('rejected')"
          >
            Tolak Klaim
          </UiButton>
          <UiButton
            variant="primary"
            :loading="isSubmitting"
            @click="handleActionSubmit('approved')"
          >
            Setujui Pengajuan
          </UiButton>
        </template>

        <!-- Aksi untuk Status: approved -->
        <template v-else-if="ticket?.status === 'approved'">
          <UiButton
            variant="primary"
            :loading="isSubmitting"
            :disabled="!ticket.return_tracking_number"
            @click="handleActionSubmit('item_received')"
          >
            Konfirmasi Barang Tiba
          </UiButton>
        </template>

        <!-- Aksi untuk Status: item_received -->
        <template v-else-if="ticket?.status === 'item_received'">
          <UiButton
            variant="primary"
            :loading="isSubmitting"
            @click="handleActionSubmit('completed')"
          >
            Selesaikan Klaim Retur
          </UiButton>
        </template>
      </div>
    </template>
  </UiModal>
</template>
