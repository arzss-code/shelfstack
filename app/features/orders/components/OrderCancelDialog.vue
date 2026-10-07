<script setup lang="ts">
const visible = defineModel<boolean>('visible', { default: false })

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  confirm: [reason: string]
}>()

const reason = ref('Perubahan rencana belanja')

const reasons = [
  'Perubahan rencana belanja',
  'Ingin mengubah alamat pengiriman',
  'Ingin mengganti metode pembayaran',
  'Menemukan penawaran lain',
  'Lainnya',
]

const handleConfirm = () => {
  emit('confirm', reason.value)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="Batalkan Pesanan Ini?"
    :style="{ width: '92vw', maxWidth: '440px' }"
    :pt="{
      root: { class: 'bg-white rounded-card shadow-floating border border-brand-hair p-6' },
      header: { class: 'flex items-center justify-between pb-3 border-b border-brand-hairsoft' },
      title: { class: 'font-display font-bold text-base text-brand-ink m-0' },
      content: { class: 'pt-4 space-y-4' },
      footer: { class: 'pt-4 border-t border-brand-hairsoft flex justify-end gap-2' },
    }"
  >
    <div class="space-y-4 text-xs text-brand-muted">
      <div
        class="p-3 bg-red-50 border border-red-200 rounded-field flex items-start gap-2.5 text-red-700"
      >
        <i class="pi pi-exclamation-triangle text-base mt-0.5 shrink-0" />
        <p class="m-0 leading-relaxed">
          Tindakan ini akan membatalkan pesanan secara permanen dan mengembalikan stok produk ke
          etalase.
        </p>
      </div>

      <div class="space-y-2">
        <label class="font-semibold text-brand-ink block"> Pilih Alasan Pembatalan: </label>
        <div class="space-y-1.5">
          <label
            v-for="r in reasons"
            :key="r"
            class="flex items-center gap-2 p-2 rounded-field hover:bg-brand-canvas-soft transition-colors cursor-pointer border border-transparent hover:border-brand-hairsoft"
          >
            <input
              v-model="reason"
              type="radio"
              :value="r"
              class="text-brand-accent focus:ring-brand-accent"
            />
            <span class="text-brand-ink">{{ r }}</span>
          </label>
        </div>
      </div>
    </div>

    <template #footer>
      <UiButton variant="secondary" size="sm" :disabled="loading" @click="visible = false">
        Tutup
      </UiButton>
      <UiButton
        variant="primary"
        size="sm"
        class="!bg-red-600 hover:!bg-red-700 !border-red-600 text-white"
        :loading="loading"
        icon="pi-times-circle"
        @click="handleConfirm"
      >
        Ya, Batalkan Pesanan
      </UiButton>
    </template>
  </Dialog>
</template>
