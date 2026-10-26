<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Product } from '~/types/product'

interface StockMovement {
  id: number
  product_id: number
  delta: number
  reason: string
  order_id: string | null
  created_at: string
  order?: {
    id: string
    status: string
    total_cents: number
  } | null
}

interface ApiResponse {
  product: {
    id: number
    name: string
    sku: string
    current_stock: number
  }
  movements: StockMovement[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const props = defineProps<{
  show: boolean
  product: Product | null
}>()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const movements = ref<StockMovement[]>([])
const totalMovements = ref(0)
const selectedReason = ref('all')

/* Jembatan kontrak lama (`show` + emit `close`) ke v-model milik UiModal. */
const isVisible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) emit('close')
  },
})

const reasonOptions = [
  { value: 'all', label: 'Semua Alasan' },
  { value: 'order_fulfillment', label: 'Pesanan Masuk (-)' },
  { value: 'order_cancelled_restock', label: 'Batal & Restock (+)' },
  { value: 'manual_adjustment', label: 'Penyesuaian Manual' },
]

const formatDateTime = (isoString: string) => {
  try {
    const d = new Date(isoString)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return isoString
  }
}

const getReasonLabel = (reason: string) => {
  switch (reason) {
    case 'order_fulfillment':
      return 'Pesanan Diproses'
    case 'order_cancelled_restock':
      return 'Restock Pembatalan'
    case 'manual_adjustment':
      return 'Penyesuaian Admin'
    default:
      return reason.replace(/_/g, ' ')
  }
}

const fetchMovements = async () => {
  if (!props.product?.id) return

  loading.value = true
  error.value = null

  try {
    const params: Record<string, string> = {}
    if (selectedReason.value !== 'all') {
      params.reason = selectedReason.value
    }

    const res = await $fetch<{ status: string; data: ApiResponse }>(
      `/api/admin/products/${props.product.id}/stock-movements`,
      { params },
    )

    if (res?.data) {
      movements.value = res.data.movements || []
      totalMovements.value = res.data.meta?.total || 0
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string }; message?: string }
    error.value = fetchErr?.data?.message || fetchErr?.message || 'Gagal memuat mutasi stok'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.show, props.product?.id, selectedReason.value],
  ([isShown, productId]) => {
    if (isShown && productId) {
      fetchMovements()
    } else {
      movements.value = []
      error.value = null
    }
  },
  { immediate: true },
)
</script>

<template>
  <UiModal v-model:visible="isVisible" title="Audit Mutasi Stok" size="lg">
    <template #header>
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-hair bg-brand-field text-brand-ink"
        >
          <i class="pi pi-history text-base" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="m-0 font-display text-base font-bold text-brand-ink">Audit Mutasi Stok</h3>
            <span
              class="rounded border border-brand-hairsoft bg-brand-field px-2 py-0.5 font-mono text-xs text-brand-muted"
            >
              {{ product?.sku || 'SKU-N/A' }}
            </span>
          </div>
          <p class="mt-0.5 text-xs text-brand-muted">
            {{ product?.name }} &bull; Stok Saat Ini:
            <span class="font-bold tabular text-brand-ink">{{ product?.stock }} unit</span>
          </p>
        </div>
      </div>
    </template>

    <!-- Filter Bar -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <UiTabs v-model="selectedReason" :items="reasonOptions" aria-label="Filter alasan mutasi" />
      <span class="whitespace-nowrap text-xs text-brand-muted">
        Total: <strong class="tabular">{{ totalMovements }}</strong> catatan
      </span>
    </div>

    <!-- Modal Body Content -->
    <div class="space-y-3">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center gap-2 py-12 text-brand-muted"
      >
        <i class="pi pi-spin pi-spinner text-2xl text-brand-accent" />
        <span class="text-xs">Memuat riwayat mutasi stok dari database...</span>
      </div>

      <!-- Error State -->
      <UiAlert v-else-if="error" tone="danger">
        {{ error }}
      </UiAlert>

      <!-- Empty State -->
      <UiEmptyState
        v-else-if="movements.length === 0"
        icon="pi-inbox"
        title="Belum Ada Catatan Mutasi"
        description="Produk ini belum memiliki riwayat perubahan stok melalui pesanan, pembatalan, atau penyesuaian manual."
      />

      <!-- Table of Movements -->
      <div v-else class="overflow-auto rounded-card border border-brand-hairsoft max-h-[55vh]">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas/60 text-brand-muted uppercase tracking-wider text-[11px]"
            >
              <th class="py-3 px-4 font-semibold">Waktu</th>
              <th class="py-3 px-4 font-semibold">Perubahan</th>
              <th class="py-3 px-4 font-semibold">Alasan</th>
              <th class="py-3 px-4 font-semibold">Ref. Pesanan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft text-brand-ink">
            <tr
              v-for="item in movements"
              :key="item.id"
              class="hover:bg-brand-canvas transition-colors"
            >
              <td class="py-3.5 px-4 whitespace-nowrap text-[11px] tabular text-brand-muted">
                {{ formatDateTime(item.created_at) }}
              </td>
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular"
                  :class="
                    item.delta > 0
                      ? 'border-brand-success-edge bg-brand-success-tint text-brand-success-text'
                      : 'border-brand-danger-edge bg-brand-danger-tint text-brand-danger-text'
                  "
                >
                  <i
                    :class="item.delta > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"
                    class="text-[9px]"
                    aria-hidden="true"
                  />
                  {{ item.delta > 0 ? `+${item.delta}` : item.delta }}
                </span>
              </td>
              <td class="py-3.5 px-4">
                <span class="font-medium capitalize text-brand-ink">
                  {{ getReasonLabel(item.reason) }}
                </span>
              </td>
              <td class="py-3.5 px-4 whitespace-nowrap">
                <span
                  v-if="item.order_id"
                  class="cursor-default font-mono text-[11px] tabular text-brand-accent hover:underline"
                >
                  #{{ item.order_id.slice(0, 8) }}
                </span>
                <span v-else class="text-[11px] tabular text-brand-faint">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <UiButton variant="secondary" size="sm" @click="emit('close')">Tutup</UiButton>
    </template>
  </UiModal>
</template>
