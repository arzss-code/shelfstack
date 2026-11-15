<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  productId: number
}>()

const emit = defineEmits<{
  restocked: [newStock: number]
  cancel: []
}>()

const isRestocking = ref(false)
const restockQuantity = ref(10)
const restockNotes = ref('')

let toast: ReturnType<typeof useUiToast> | null = null
try {
  toast = useUiToast()
} catch {
  // Graceful fallback saat dijalankan di pengujian unit terisolasi
}

const handleQuickRestock = async () => {
  if (!props.productId || restockQuantity.value <= 0) return

  isRestocking.value = true
  try {
    const res = await $fetch<{
      status: string
      message: string
      data: { new_stock: number }
    }>(`/api/admin/products/${props.productId}/restock`, {
      method: 'POST',
      body: {
        quantity: Number(restockQuantity.value),
        notes: restockNotes.value.trim() || undefined,
      },
    })

    toast?.add({
      severity: 'success',
      summary: 'Restock Berhasil',
      detail: `Stok berhasil ditambah. Stok baru: ${res.data.new_stock} unit.`,
      life: 3000,
    })

    restockNotes.value = ''
    emit('restocked', res.data.new_stock)
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string }; message?: string }
    toast?.add({
      severity: 'error',
      summary: 'Gagal Restock',
      detail: fetchErr?.data?.message || fetchErr?.message || 'Gagal menambahkan stok produk.',
      life: 5000,
    })
  } finally {
    isRestocking.value = false
  }
}
</script>

<template>
  <div
    class="mb-3.5 p-3 rounded-card bg-brand-canvas-soft border border-brand-hair flex flex-col gap-2"
  >
    <div class="flex items-center justify-between text-xs">
      <span class="font-bold text-brand-ink flex items-center gap-1.5">
        <i class="pi pi-plus-circle text-brand-accent text-xs" />
        <span>Restock Cepat Gudang</span>
      </span>
      <button
        type="button"
        class="text-brand-muted hover:text-brand-ink cursor-pointer bg-transparent border-0 p-0 text-xs"
        @click="emit('cancel')"
      >
        Tutup
      </button>
    </div>
    <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
      <div class="w-28 shrink-0">
        <UiInput
          v-model.number="restockQuantity"
          type="number"
          :min="1"
          :max="10000"
          placeholder="Qty"
        />
      </div>
      <div class="flex-1 min-w-44">
        <UiInput
          v-model="restockNotes"
          placeholder="Catatan pengadaan (opsional)"
          maxlength="255"
        />
      </div>
      <UiButton variant="primary" size="sm" :loading="isRestocking" @click="handleQuickRestock">
        Simpan
      </UiButton>
    </div>
  </div>
</template>
