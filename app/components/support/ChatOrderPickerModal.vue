<script setup lang="ts">
import { ref, watch } from 'vue'

export interface OrderPickerItem {
  id: string
  order_number?: string | null
  total_cents: number
  status: string
  created_at?: string
}

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectOrder: [order: OrderPickerItem]
  close: []
}>()

const orders = ref<OrderPickerItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const fetchOrders = async () => {
  isLoading.value = true
  error.value = null
  try {
    const res = await $fetch<{
      status: string
      data?: { orders: OrderPickerItem[] } | OrderPickerItem[]
    }>('/api/orders')
    if (Array.isArray(res)) {
      orders.value = res
    } else if (res?.data) {
      orders.value = Array.isArray(res.data) ? res.data : res.data.orders || []
    }
  } catch (err: unknown) {
    const errorObj = err as { data?: { message?: string } } | undefined
    error.value = errorObj?.data?.message || 'Gagal memuat daftar pesanan Anda.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && orders.value.length === 0) {
      fetchOrders()
    }
  },
)

const formatRupiah = (cents: number): string => {
  return `Rp ${Math.round(cents / 100).toLocaleString('id-ID')}`
}

const getOrderNumber = (ord: OrderPickerItem): string => {
  if (ord.order_number) return ord.order_number
  return `ORD-${ord.id.slice(0, 8).toUpperCase()}`
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click="emit('close')"
  >
    <div
      class="w-full max-w-md rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-floating"
      @click.stop
    >
      <div class="flex items-center justify-between pb-3 border-b border-brand-hair">
        <div class="flex items-center gap-2">
          <i class="pi pi-receipt text-brand-accent text-sm" />
          <h3 class="text-sm font-bold text-brand-ink m-0">Pilih Pesanan untuk Dilampirkan</h3>
        </div>
        <button
          type="button"
          class="text-brand-muted hover:text-brand-ink text-xs p-1"
          aria-label="Tutup pemilih pesanan"
          @click="emit('close')"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <div class="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
        <div
          v-if="isLoading"
          class="p-6 text-center text-xs text-brand-muted flex flex-col items-center gap-2"
        >
          <i class="pi pi-spin pi-spinner text-base text-brand-accent" />
          <span>Memuat riwayat pesanan...</span>
        </div>

        <div v-else-if="error" class="p-4 text-center text-xs text-red-600">
          {{ error }}
        </div>

        <div v-else-if="orders.length === 0" class="p-6 text-center text-xs text-brand-muted">
          Belum ada riwayat pesanan yang ditemukan.
        </div>

        <button
          v-for="ord in orders"
          v-else
          :key="ord.id"
          type="button"
          class="w-full rounded-field border border-brand-hair p-2.5 text-left transition-colors hover:border-brand-ink hover:bg-brand-canvas-soft flex items-center justify-between gap-3 group"
          @click="emit('selectOrder', ord)"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span
                class="text-xs font-bold text-brand-ink group-hover:text-brand-accent transition-colors"
              >
                {{ getOrderNumber(ord) }}
              </span>
              <span
                class="text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded bg-brand-canvas border border-brand-hair text-brand-muted"
              >
                {{ ord.status }}
              </span>
            </div>
            <div class="text-xs font-semibold text-brand-ink mt-1">
              {{ formatRupiah(ord.total_cents) }}
            </div>
          </div>
          <span class="text-[11px] font-medium text-brand-accent shrink-0">Pilih</span>
        </button>
      </div>
    </div>
  </div>
</template>
