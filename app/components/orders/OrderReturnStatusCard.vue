<script setup lang="ts">
import { ref } from 'vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiSelect from '~/components/ui/UiSelect.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import type { ReturnRequestItem } from '~~/shared/schemas/return-request'
import {
  RETURN_REASON_LABELS,
  RETURN_SOLUTION_LABELS,
  RETURN_STATUS_MAP,
  SHELFSTACK_WAREHOUSE_DESTINATION,
} from '~~/server/utils/return-request'
import { useReturnRequest } from '~/composables/useReturnRequest'

interface Props {
  ticket: ReturnRequestItem
  orderId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  refetch: []
}>()

const { isSubmitting, submitReturnTracking } = useReturnRequest()

const returnCourier = ref('jne')
const returnTrackingNumber = ref('')
const trackingFormError = ref<string | null>(null)

const courierOptions = [
  { label: 'JNE Express', value: 'jne' },
  { label: 'SiCepat Ekspres', value: 'sicepat' },
  { label: 'J&T Express', value: 'jnt' },
  { label: 'Anteraja', value: 'anteraja' },
  { label: 'Pos Indonesia', value: 'pos' },
  { label: 'Kurir Lainnya', value: 'other' },
]

const statusMeta = computed(() => RETURN_STATUS_MAP[props.ticket.status])

const handleSaveTracking = async () => {
  trackingFormError.value = null
  const courier = returnCourier.value.trim()
  const tracking = returnTrackingNumber.value.trim()

  if (!tracking || tracking.length < 5) {
    trackingFormError.value = 'Nomor resi minimal 5 karakter.'
    return
  }

  const success = await submitReturnTracking(props.orderId, {
    return_courier: courier,
    return_tracking_number: tracking,
  })

  if (success) {
    emit('refetch')
  }
}
</script>

<template>
  <UiCard class="border-brand-hair bg-brand-canvas p-4 sm:p-5">
    <!-- Header: Status & Solusi -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 border-b border-brand-hairsoft pb-3.5"
    >
      <div class="flex items-center gap-2">
        <span
          class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-canvas-soft text-brand-ink text-sm"
        >
          <i class="pi pi-replay" />
        </span>
        <div>
          <h3 class="m-0 text-sm font-bold text-brand-ink">Status Klaim Garansi & Retur</h3>
          <p class="m-0 text-[11px] text-brand-muted">
            Tiket #{{ ticket.id.slice(0, 8).toUpperCase() }} •
            {{ RETURN_SOLUTION_LABELS[ticket.solution_type] }}
          </p>
        </div>
      </div>

      <UiBadge v-if="statusMeta" :label="statusMeta.label" :variant="statusMeta.tone" />
    </div>

    <!-- Stepper 4 Tahap (Jika bukan rejected/cancelled) -->
    <div
      v-if="ticket.status !== 'rejected' && ticket.status !== 'cancelled'"
      class="py-4 border-b border-brand-hairsoft"
    >
      <div class="grid grid-cols-4 gap-2 text-center">
        <!-- Step 1 -->
        <div class="flex flex-col items-center gap-1.5">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
            :class="
              statusMeta.step >= 1
                ? 'bg-brand-ink text-brand-onink'
                : 'bg-brand-field text-brand-muted'
            "
          >
            <i v-if="statusMeta.step > 1" class="pi pi-check text-[10px]" />
            <span v-else>1</span>
          </div>
          <span class="text-[10px] font-medium leading-tight text-brand-ink">Diajukan</span>
        </div>

        <!-- Step 2 -->
        <div class="flex flex-col items-center gap-1.5">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
            :class="
              statusMeta.step >= 2
                ? 'bg-brand-ink text-brand-onink'
                : 'bg-brand-field text-brand-muted'
            "
          >
            <i v-if="statusMeta.step > 2" class="pi pi-check text-[10px]" />
            <span v-else>2</span>
          </div>
          <span class="text-[10px] font-medium leading-tight text-brand-ink">Disetujui</span>
        </div>

        <!-- Step 3 -->
        <div class="flex flex-col items-center gap-1.5">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
            :class="
              statusMeta.step >= 3
                ? 'bg-brand-ink text-brand-onink'
                : 'bg-brand-field text-brand-muted'
            "
          >
            <i v-if="statusMeta.step > 3" class="pi pi-check text-[10px]" />
            <span v-else>3</span>
          </div>
          <span class="text-[10px] font-medium leading-tight text-brand-ink">Inspeksi Gudang</span>
        </div>

        <!-- Step 4 -->
        <div class="flex flex-col items-center gap-1.5">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
            :class="
              statusMeta.step >= 4
                ? 'bg-brand-success text-white'
                : 'bg-brand-field text-brand-muted'
            "
          >
            <i v-if="statusMeta.step === 4" class="pi pi-check text-[10px]" />
            <span v-else>4</span>
          </div>
          <span class="text-[10px] font-medium leading-tight text-brand-ink">Selesai</span>
        </div>
      </div>
    </div>

    <!-- Informasi Detail Tiket -->
    <div class="space-y-3.5 pt-3.5 text-xs text-brand-ink">
      <div class="rounded-card bg-brand-canvas-soft p-3 leading-relaxed">
        <p class="m-0 font-medium text-brand-muted text-[11px]">Kendala yang Dilaporkan:</p>
        <p class="m-0 mt-0.5 font-semibold text-brand-ink">
          {{ RETURN_REASON_LABELS[ticket.reason_type] }}
        </p>
        <p class="m-0 mt-1 text-brand-muted">"{{ ticket.customer_notes }}"</p>
      </div>

      <!-- Jika Status: Rejected -->
      <UiAlert
        v-if="ticket.status === 'rejected'"
        tone="danger"
        title="Klaim Tidak Dapat Disetujui"
      >
        <p class="m-0 text-xs">
          {{
            ticket.admin_notes ||
            'Pengajuan garansi retur tidak memenuhi syarat inspeksi administratif.'
          }}
        </p>
      </UiAlert>

      <!-- Jika Status: Item Received -->
      <UiAlert v-if="ticket.status === 'item_received'" tone="info" title="Unit Tiba di Gudang">
        <p class="m-0 text-xs">
          Paket pengembalian Anda telah sampai di gudang sentral Semarang dan sedang melewati
          pemeriksaan teknisi.
        </p>
      </UiAlert>

      <!-- Jika Status: Completed -->
      <UiAlert v-if="ticket.status === 'completed'" tone="success" title="Resolusi Tuntas">
        <div class="space-y-1 text-xs">
          <p class="m-0">Klaim garansi Anda telah selesai diproses dengan sukses.</p>
          <p v-if="ticket.replacement_tracking_number" class="m-0 font-medium">
            Pengiriman unit pengganti:
            <span class="font-bold">{{
              ticket.replacement_courier?.toUpperCase() || 'KURIR'
            }}</span>
            (Resi: <span class="font-mono font-bold">{{ ticket.replacement_tracking_number }}</span
            >)
          </p>
        </div>
      </UiAlert>

      <!-- Jika Status: Approved -> Tampilkan Petunjuk Gudang & Form Resi Balik -->
      <div v-if="ticket.status === 'approved'" class="space-y-4 pt-1">
        <!-- Alamat Gudang -->
        <div
          class="rounded-card border border-brand-accent/20 bg-brand-accent-tint p-3.5 leading-relaxed"
        >
          <div class="flex items-center gap-2 font-bold text-brand-accent mb-1">
            <i class="pi pi-map-marker text-xs" />
            <span>Alamat Pengiriman Balik ke Gudang</span>
          </div>
          <p class="m-0 font-semibold text-brand-ink">
            {{ SHELFSTACK_WAREHOUSE_DESTINATION.facility_name }}
          </p>
          <p class="m-0 text-brand-muted text-[11px]">
            {{ SHELFSTACK_WAREHOUSE_DESTINATION.recipient_name }} ({{
              SHELFSTACK_WAREHOUSE_DESTINATION.contact_phone
            }})
          </p>
          <p class="m-0 text-brand-muted text-[11px]">
            {{ SHELFSTACK_WAREHOUSE_DESTINATION.street_address }},
            {{ SHELFSTACK_WAREHOUSE_DESTINATION.city }},
            {{ SHELFSTACK_WAREHOUSE_DESTINATION.province }}
            {{ SHELFSTACK_WAREHOUSE_DESTINATION.postal_code }}
          </p>
        </div>

        <!-- Jika Resi Sudah Ada -->
        <div
          v-if="ticket.return_tracking_number"
          class="rounded-card border border-brand-hair bg-brand-canvas-soft p-3"
        >
          <p class="m-0 text-[11px] font-medium text-brand-muted">Resi Pengiriman Balik Anda:</p>
          <p class="m-0 mt-0.5 font-bold text-brand-ink font-mono">
            {{ ticket.return_courier?.toUpperCase() }} - {{ ticket.return_tracking_number }}
          </p>
          <p class="m-0 mt-1 text-[11px] text-brand-muted">
            Paket sedang dalam perjalanan. Sistem akan otomatis memperbarui status saat paket sampai
            di gudang.
          </p>
        </div>

        <!-- Jika Resi Belum Diinput: Form Input Resi -->
        <div v-else class="space-y-3 rounded-card border border-brand-hair p-3.5">
          <div class="flex items-center justify-between">
            <h4 class="m-0 text-xs font-bold text-brand-ink">Konfirmasi Nomor Resi Pengiriman</h4>
            <span class="text-[10px] text-brand-muted">Wajib diisi setelah paket dikirim</span>
          </div>

          <UiAlert v-if="trackingFormError" tone="danger">
            {{ trackingFormError }}
          </UiAlert>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                for="return-courier-select"
                class="block text-[11px] font-medium text-brand-muted mb-1"
              >
                Pilih Ekspedisi Kurir
              </label>
              <UiSelect
                id="return-courier-select"
                v-model="returnCourier"
                :options="courierOptions"
              />
            </div>

            <div>
              <label
                for="return-tracking-input"
                class="block text-[11px] font-medium text-brand-muted mb-1"
              >
                Nomor Resi Paket
              </label>
              <UiInput
                id="return-tracking-input"
                v-model="returnTrackingNumber"
                placeholder="Contoh: JNE0123456789"
              />
            </div>
          </div>

          <div class="flex justify-end pt-1">
            <UiButton
              size="sm"
              variant="primary"
              :loading="isSubmitting"
              :disabled="!returnTrackingNumber || returnTrackingNumber.length < 5"
              @click="handleSaveTracking"
            >
              Simpan Nomor Resi
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </UiCard>
</template>
