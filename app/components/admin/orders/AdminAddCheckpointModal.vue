<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  defaultCheckpointTemplates,
  type CheckpointStatus,
} from '~~/shared/schemas/shipping-checkpoint-input'

const props = defineProps<{
  visible: boolean
  orderId: string
  trackingNumber: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  checkpointAdded: []
}>()

const toast = useUiToast()
const submitting = ref(false)
const errorMessage = ref<string | null>(null)

const statusOptions: { label: string; value: CheckpointStatus }[] = [
  { label: 'In Transit (Dalam Perjalanan)', value: 'in_transit' },
  { label: 'Out for Delivery (Kurir Menuju Alamat)', value: 'out_for_delivery' },
  { label: 'Delivered (Telah Diterima)', value: 'delivered' },
  { label: 'Picked Up (Dijemput Kurir)', value: 'picked_up' },
  { label: 'Returned (Retur ke Gudang)', value: 'returned' },
]

const selectedStatus = ref<CheckpointStatus>('in_transit')
const location = ref('Hub Sortir Logistik')
const title = ref(defaultCheckpointTemplates.in_transit.defaultTitle)
const description = ref(defaultCheckpointTemplates.in_transit.defaultDescription)

watch(selectedStatus, (newStatus: CheckpointStatus) => {
  const template = defaultCheckpointTemplates[newStatus]
  if (template) {
    title.value = template.defaultTitle
    description.value = template.defaultDescription
  }
})

const handleClose = () => {
  emit('update:visible', false)
  errorMessage.value = null
}

const handleSubmit = async () => {
  if (!location.value.trim()) {
    errorMessage.value = 'Lokasi checkpoint wajib diisi.'
    return
  }

  submitting.value = true
  errorMessage.value = null

  try {
    await $fetch(`/api/admin/orders/${props.orderId}/checkpoints`, {
      method: 'POST',
      body: {
        status: selectedStatus.value,
        location: location.value.trim(),
        title: title.value.trim(),
        description: description.value.trim(),
      },
    })

    toast.show({
      title: 'Checkpoint Ditambahkan',
      message: `Status logistik ${selectedStatus.value} berhasil dicatat ke resi ${props.trackingNumber}.`,
      tone: 'success',
    })

    emit('checkpointAdded')
    handleClose()
  } catch (err: unknown) {
    errorMessage.value =
      err instanceof Error ? err.message : 'Gagal menambahkan checkpoint pengiriman'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UiModal
    :visible="visible"
    title="Simulasi & Tambah Checkpoint Kurir"
    size="sm"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <div class="rounded-xl bg-brand-canvas p-3 border border-brand-hair text-xs">
        <p class="m-0 text-brand-muted">
          Nomor Resi: <strong class="text-brand-ink tabular">{{ trackingNumber }}</strong>
        </p>
        <p class="m-0 mt-0.5 text-brand-muted">
          Checkpoint baru akan langsung dipublikasikan ke pelacakan pembeli secara real-time.
        </p>
      </div>

      <UiAlert v-if="errorMessage" variant="danger" title="Kesalahan Input" class="py-2">
        <p class="m-0 text-xs">{{ errorMessage }}</p>
      </UiAlert>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-brand-ink mb-1.5">Status Checkpoint</label>
          <UiSelect
            v-model="selectedStatus"
            :options="statusOptions"
            class="w-full"
            :disabled="submitting"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-brand-ink mb-1.5"
            >Lokasi Fasilitas Logistik</label
          >
          <UiInput
            v-model="location"
            placeholder="Contoh: Hub Transit Surabaya, DC Jakarta Barat"
            class="w-full"
            :disabled="submitting"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-brand-ink mb-1.5"
            >Judul Ringkas Checkpoint</label
          >
          <UiInput
            v-model="title"
            placeholder="Judul peristiwa logistik"
            class="w-full"
            :disabled="submitting"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-brand-ink mb-1.5"
            >Keterangan Pengiriman</label
          >
          <UiTextarea
            v-model="description"
            :rows="2"
            placeholder="Rincian proses pengiriman kurir"
            class="w-full"
            :disabled="submitting"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2.5 pt-3">
        <UiButton variant="ghost" size="sm" :disabled="submitting" @click="handleClose">
          Batal
        </UiButton>
        <UiButton variant="primary" size="sm" :loading="submitting" @click="handleSubmit">
          Kirim Checkpoint
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
