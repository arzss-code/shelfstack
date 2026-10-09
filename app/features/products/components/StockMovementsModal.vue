<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Product } from '~/types/product'
import { formatRupiah } from '~/utils/format'

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
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-3xl bg-brand-canvas border border-brand-hair rounded-2xl shadow-floating flex flex-col max-h-[85vh] overflow-hidden"
      >
        <!-- Modal Header -->
        <div
          class="p-5 border-b border-brand-hairsoft flex items-center justify-between bg-brand-canvas-soft"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-brand-field border border-brand-hair flex items-center justify-center text-brand-ink"
            >
              <i class="pi pi-history text-base" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-display font-bold text-base text-brand-ink m-0">
                  Audit Mutasi Stok
                </h3>
                <span
                  class="text-xs font-mono px-2 py-0.5 rounded bg-brand-field text-brand-muted border border-brand-hairsoft"
                >
                  {{ product?.sku || 'SKU-N/A' }}
                </span>
              </div>
              <p class="text-xs text-brand-muted m-0 mt-0.5">
                {{ product?.name }} &bull; Stok Saat Ini:
                <span class="font-bold text-brand-ink">{{ product?.stock }} unit</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            class="w-8 h-8 rounded-full border border-brand-hair flex items-center justify-center text-brand-muted hover:text-brand-ink hover:bg-brand-canvas transition-colors cursor-pointer"
            aria-label="Tutup modal"
            @click="emit('close')"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>

        <!-- Filter Bar -->
        <div
          class="px-5 py-3 border-b border-brand-hairsoft flex items-center justify-between gap-3 bg-brand-canvas"
        >
          <div class="flex items-center gap-2 overflow-x-auto py-1">
            <button
              v-for="opt in reasonOptions"
              :key="opt.value"
              type="button"
              class="px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap"
              :class="[
                selectedReason === opt.value
                  ? 'bg-brand-ink text-brand-onink border-brand-ink shadow-whisper'
                  : 'bg-brand-canvas-soft text-brand-muted border-brand-hair hover:text-brand-ink hover:bg-brand-canvas',
              ]"
              @click="selectedReason = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
          <span class="text-xs text-brand-muted whitespace-nowrap">
            Total: <strong>{{ totalMovements }}</strong> catatan
          </span>
        </div>

        <!-- Modal Body Content -->
        <div class="p-5 flex-1 overflow-y-auto space-y-3">
          <!-- Loading State -->
          <div
            v-if="loading"
            class="py-12 flex flex-col items-center justify-center gap-2 text-brand-muted"
          >
            <i class="pi pi-spin pi-spinner text-2xl text-brand-accent" />
            <span class="text-xs">Memuat riwayat mutasi stok dari database...</span>
          </div>

          <!-- Error State -->
          <div
            v-else-if="error"
            class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2"
          >
            <i class="pi pi-exclamation-circle text-base" />
            <span>{{ error }}</span>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="movements.length === 0"
            class="py-12 text-center text-brand-muted flex flex-col items-center justify-center gap-2"
          >
            <div
              class="w-12 h-12 rounded-full bg-brand-canvas-soft border border-dashed border-brand-hair flex items-center justify-center text-brand-faint"
            >
              <i class="pi pi-inbox text-xl" />
            </div>
            <p class="text-sm font-semibold text-brand-ink m-0">Belum Ada Catatan Mutasi</p>
            <p class="text-xs text-brand-muted m-0 max-w-sm">
              Produk ini belum memiliki riwayat perubahan stok melalui pesanan, pembatalan, atau
              penyesuaian manual.
            </p>
          </div>

          <!-- Table of Movements -->
          <div v-else class="border border-brand-hairsoft rounded-xl overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead
                class="bg-brand-canvas-soft border-b border-brand-hairsoft text-brand-muted uppercase font-semibold text-[10px] tracking-wider"
              >
                <tr>
                  <th class="py-2.5 px-3">Waktu</th>
                  <th class="py-2.5 px-3">Perubahan</th>
                  <th class="py-2.5 px-3">Alasan</th>
                  <th class="py-2.5 px-3">Ref. Pesanan</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-hairsoft text-brand-ink">
                <tr
                  v-for="item in movements"
                  :key="item.id"
                  class="hover:bg-brand-canvas-soft/50 transition-colors"
                >
                  <td class="py-2.5 px-3 whitespace-nowrap text-brand-muted text-[11px]">
                    {{ formatDateTime(item.created_at) }}
                  </td>
                  <td class="py-2.5 px-3 whitespace-nowrap font-mono font-bold">
                    <span
                      class="px-2 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1"
                      :class="[
                        item.delta > 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
                      ]"
                    >
                      <i
                        :class="item.delta > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'"
                        class="text-[9px]"
                      />
                      {{ item.delta > 0 ? `+${item.delta}` : item.delta }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3">
                    <span class="font-medium capitalize text-brand-ink">
                      {{ getReasonLabel(item.reason) }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 whitespace-nowrap">
                    <span
                      v-if="item.order_id"
                      class="font-mono text-[11px] text-brand-accent hover:underline cursor-default"
                    >
                      #{{ item.order_id.slice(0, 8) }}
                    </span>
                    <span v-else class="text-brand-faint text-[11px]">&mdash;</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="p-4 border-t border-brand-hairsoft bg-brand-canvas-soft flex justify-end">
          <UiButton variant="secondary" size="sm" @click="emit('close')"> Tutup </UiButton>
        </div>
      </div>
    </div>
  </Transition>
</template>
