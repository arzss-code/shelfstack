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
  <UiModal v-model:visible="visible" title="Batalkan Pesanan Ini?" size="sm">
    <div class="space-y-4 text-xs text-brand-muted">
      <UiAlert tone="warning">
        <p class="m-0 leading-relaxed">
          Tindakan ini akan membatalkan pesanan secara permanen dan mengembalikan stok produk ke
          etalase.
        </p>
      </UiAlert>

      <div class="space-y-2">
        <label class="block font-semibold text-brand-ink">Pilih Alasan Pembatalan:</label>
        <div class="space-y-1.5">
          <label
            v-for="r in reasons"
            :key="r"
            class="flex cursor-pointer items-center gap-2 rounded-field border border-transparent p-2 transition-colors hover:border-brand-hairsoft hover:bg-brand-canvas-soft"
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
        variant="danger"
        size="sm"
        :loading="loading"
        icon="pi-times-circle"
        @click="handleConfirm"
      >
        Ya, Batalkan Pesanan
      </UiButton>
    </template>
  </UiModal>
</template>
