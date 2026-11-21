<script setup lang="ts">
import type { OrderStatus } from '~/types/order'
import type { CourierCode } from '~~/shared/schemas/shipping'

const props = defineProps<{
  visible: boolean
  targetStatus: OrderStatus | null
  selectedCourierCode: CourierCode
  trackingNumberInput: string
  courierOptions: { label: string; value: string }[]
  updateReason: string
  updating: boolean
  confirmVariant: 'danger' | 'accent' | 'primary'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:selectedCourierCode': [value: CourierCode]
  'update:trackingNumberInput': [value: string]
  'update:updateReason': [value: string]
  autoGenerateTracking: []
  confirm: []
}>()

function handleCourierSelect(value: string | number | null) {
  if (typeof value === 'string') {
    emit('update:selectedCourierCode', value as CourierCode)
    emit('autoGenerateTracking')
  }
}
</script>

<template>
  <UiModal
    :visible="visible"
    title="Konfirmasi Perubahan Status"
    size="sm"
    @update:visible="emit('update:visible', $event)"
  >
    <p class="m-0 text-xs leading-relaxed text-brand-muted">
      Ubah status pesanan ke
      <strong class="font-semibold uppercase text-brand-ink">{{ targetStatus }}</strong
      >? Aksi ini akan dicatat ke dalam audit log aktivitas admin.
    </p>

    <!-- Logistics Input (Only for 'shipped' target status) -->
    <div
      v-if="targetStatus === 'shipped'"
      class="mt-4 space-y-3 p-3.5 bg-brand-canvas rounded-xl border border-brand-hair text-left"
    >
      <div class="space-y-1">
        <label class="block text-xs font-semibold text-brand-ink">Pilih Ekspedisi Kurir</label>
        <UiSelect
          :model-value="selectedCourierCode"
          :options="courierOptions"
          @update:model-value="handleCourierSelect"
        />
      </div>

      <div class="space-y-1 pt-1">
        <label class="block text-xs font-semibold text-brand-ink">Nomor Resi Pengiriman</label>
        <div class="flex items-center gap-2">
          <input
            :value="trackingNumberInput"
            type="text"
            class="flex-1 px-3 py-2 text-xs font-mono bg-brand-canvas border border-brand-hair rounded-lg text-brand-ink focus:outline-none focus:border-brand-ink"
            placeholder="Contoh: SS-JNE-123456"
            @input="emit('update:trackingNumberInput', ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            class="px-3 py-2 text-xs font-semibold bg-brand-ink hover:bg-brand-inkhover text-white rounded-lg transition-colors cursor-pointer shrink-0 border-0"
            @click="emit('autoGenerateTracking')"
          >
            Resi Otomatis
          </button>
        </div>
      </div>
    </div>

    <UiTextarea
      :model-value="updateReason"
      class="mt-4"
      label="Catatan / Alasan (Opsional)"
      placeholder="Contoh: Paket telah diserahkan ke kurir / konfirmasi pembayaran..."
      :rows="2"
      @update:model-value="emit('update:updateReason', $event)"
    />

    <template #footer>
      <UiButton
        variant="secondary"
        size="sm"
        :disabled="updating"
        @click="emit('update:visible', false)"
      >
        Batal
      </UiButton>
      <UiButton :variant="confirmVariant" size="sm" :loading="updating" @click="emit('confirm')">
        Konfirmasi
      </UiButton>
    </template>
  </UiModal>
</template>
