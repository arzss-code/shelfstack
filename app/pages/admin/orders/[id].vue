<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import { getAvailableAdminTransitions } from '~~/shared/constants/order-transitions'
import {
  supportedCouriers,
  type CourierCode,
  type ShippingCheckpoint,
} from '~~/shared/schemas/shipping'
import OrderTrackingTimeline from '~/components/orders/OrderTrackingTimeline.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const toast = useUiToast()

const orderId = computed(() => route.params.id as string)

const order = ref<Order | null>(null)
const loading = ref(true)
const updating = ref(false)
const errorMessage = ref('')

const isConfirmModalOpen = ref(false)
const targetStatus = ref<OrderStatus | null>(null)
const updateReason = ref('')

// State Pengiriman untuk Status 'shipped'
const selectedCourierCode = ref<CourierCode>('jne')
const trackingNumberInput = ref('')
const adminCheckpoints = ref<ShippingCheckpoint[]>([])

const courierOptions = supportedCouriers.map((c) => ({
  label: c.name,
  value: c.code,
}))

const selectedCourierName = computed(() => {
  return supportedCouriers.find((c) => c.code === selectedCourierCode.value)?.name || 'JNE Express'
})

const handleAutoGenerateTracking = () => {
  const prefix =
    {
      jne: 'SS-JNE',
      sicepat: 'SS-SCP',
      jnt: 'SS-JNT',
      anteraja: 'SS-ANTR',
      pos: 'SS-POS',
    }[selectedCourierCode.value] || 'SS-LOG'

  const timestampPart = Date.now().toString().slice(-6)
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString()
  trackingNumberInput.value = `${prefix}-${timestampPart}${randomPart}`
}

useSeoMeta({
  title: computed(() => `Detail Pesanan #${orderId.value.slice(0, 8)} - Admin ShelfStack`),
})

const fetchAdminTracking = async () => {
  if (!order.value?.tracking_number) {
    adminCheckpoints.value = []
    return
  }
  try {
    const res = await $fetch<{ success: boolean; data: { checkpoints: ShippingCheckpoint[] } }>(
      `/api/orders/${orderId.value}/tracking`,
    )
    if (res?.data?.checkpoints) {
      adminCheckpoints.value = res.data.checkpoints
    }
  } catch {
    adminCheckpoints.value = []
  }
}

const fetchOrderDetail = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch<{ status: string; data: Order }>(`/api/orders/${orderId.value}`)
    order.value = res.data
    await fetchAdminTracking()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMessage.value = fetchErr.data?.message || 'Gagal memuat detail pesanan.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrderDetail()
})

const availableTransitions = computed<OrderStatus[]>(() => {
  if (!order.value) return []
  return getAvailableAdminTransitions(order.value.status)
})

const openTransitionModal = (status: OrderStatus) => {
  targetStatus.value = status
  updateReason.value = ''
  if (status === 'shipped') {
    selectedCourierCode.value = (order.value?.courier_code as CourierCode) || 'jne'
    trackingNumberInput.value = order.value?.tracking_number || ''
    if (!trackingNumberInput.value) {
      handleAutoGenerateTracking()
    }
  }
  isConfirmModalOpen.value = true
}

const confirmStatusChange = async () => {
  if (!targetStatus.value) return

  updating.value = true
  try {
    if (targetStatus.value === 'refunded') {
      await $fetch(`/api/orders/${orderId.value}/refund`, {
        method: 'POST',
        body: {
          reason: updateReason.value || undefined,
        },
      })
    } else {
      await $fetch(`/api/orders/${orderId.value}/status`, {
        method: 'PUT',
        body: {
          status: targetStatus.value,
          reason: updateReason.value || undefined,
          courier_code: targetStatus.value === 'shipped' ? selectedCourierCode.value : undefined,
          courier_name: targetStatus.value === 'shipped' ? selectedCourierName.value : undefined,
          tracking_number:
            targetStatus.value === 'shipped' ? trackingNumberInput.value.trim() : undefined,
        },
      })
    }

    toast.add({
      severity: 'success',
      summary: 'Status Diperbarui',
      detail: `Status pesanan berhasil diubah menjadi ${targetStatus.value}.`,
      life: 4000,
    })

    isConfirmModalOpen.value = false
    await fetchOrderDetail()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    toast.add({
      severity: 'error',
      summary: 'Gagal Memperbarui',
      detail: fetchErr.data?.message || 'Terjadi kesalahan sistem saat memperbarui status.',
      life: 5000,
    })
  } finally {
    updating.value = false
  }
}

const getStatusBadge = (status: OrderStatus) => {
  switch (status) {
    case 'paid':
      return { variant: 'info' as const, label: 'Lunas' }
    case 'shipped':
      return { variant: 'info' as const, label: 'Dikirim' }
    case 'completed':
      return { variant: 'success' as const, label: 'Selesai' }
    case 'cancelled':
      return { variant: 'danger' as const, label: 'Dibatalkan' }
    case 'refunded':
      return { variant: 'danger' as const, label: 'Dikembalikan (Refund)' }
    case 'pending':
    default:
      return { variant: 'warning' as const, label: 'Menunggu' }
  }
}

const getTransitionBtnVariant = (status: OrderStatus) => {
  switch (status) {
    case 'paid':
    case 'completed':
      return 'primary' as const
    case 'shipped':
      return 'accent' as const
    case 'cancelled':
    case 'refunded':
      return 'danger' as const
    default:
      return 'secondary' as const
  }
}

const confirmVariant = computed(() => {
  if (targetStatus.value === 'cancelled' || targetStatus.value === 'refunded') {
    return 'danger' as const
  }
  if (targetStatus.value === 'shipped') {
    return 'accent' as const
  }
  return 'primary' as const
})

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back Button & Breadcrumbs -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UiButton
          variant="secondary"
          size="sm"
          class="!p-2 rounded-full"
          aria-label="Kembali ke daftar pesanan"
          @click="router.push('/admin/orders')"
        >
          <i class="pi pi-arrow-left text-xs" />
        </UiButton>
        <div>
          <h1 class="font-display text-xl font-bold tracking-tight text-brand-ink sm:text-2xl m-0">
            Pesanan #{{ orderId.slice(0, 8) }}
          </h1>
          <p class="text-xs text-brand-muted m-0 mt-0.5">
            Dibuat pada {{ formatDate(order?.created_at) }}
          </p>
        </div>
      </div>

      <!-- Current Status Badge -->
      <UiBadge
        v-if="order"
        :label="getStatusBadge(order.status).label"
        :variant="getStatusBadge(order.status).variant"
        class="capitalize font-semibold"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4">
      <UiSkeleton height="120px" class="w-full rounded-2xl" />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UiSkeleton height="200px" class="col-span-2 rounded-2xl" />
        <UiSkeleton height="200px" class="col-span-1 rounded-2xl" />
      </div>
    </div>

    <!-- Error State -->
    <UiAlert v-else-if="errorMessage" variant="danger" title="Gagal Memuat Pesanan">
      {{ errorMessage }}
    </UiAlert>

    <!-- Content State -->
    <div v-else-if="order" class="space-y-6">
      <!-- Transition Actions Card -->
      <div
        v-if="availableTransitions.length > 0"
        class="rounded-2xl border border-brand-hair bg-brand-canvas-soft p-5 shadow-whisper"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="font-display text-sm font-bold text-brand-ink m-0">Tindakan Admin</h2>
            <p class="text-xs text-brand-muted m-0 mt-0.5">
              Ubah status pesanan ke tahap alur selanjutnya sesuai dengan SLA operasional.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UiButton
              v-for="status in availableTransitions"
              :key="status"
              :variant="getTransitionBtnVariant(status)"
              size="sm"
              class="capitalize font-semibold"
              @click="openTransitionModal(status)"
            >
              Ubah ke {{ status }}
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Layout 2 Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <!-- Order Items List (2 cols) -->
        <div
          class="lg:col-span-2 rounded-2xl border border-brand-hair bg-brand-canvas-soft p-6 shadow-whisper space-y-4"
        >
          <h2 class="font-display text-base font-bold text-brand-ink m-0">
            Item Pesanan ({{ order.items?.length || 0 }})
          </h2>

          <div class="divide-y divide-brand-hairsoft border-t border-b border-brand-hairsoft">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center justify-between py-4 gap-4"
            >
              <div class="flex items-center gap-3 min-w-0">
                <img
                  v-if="item.product?.image_url"
                  :src="item.product.image_url"
                  :alt="item.product?.name || 'Produk'"
                  class="w-12 h-12 rounded-lg object-cover border border-brand-hair shrink-0"
                />
                <div
                  v-else
                  class="w-12 h-12 rounded-lg bg-brand-canvas border border-brand-hair flex items-center justify-center text-brand-muted shrink-0"
                >
                  <i class="pi pi-box text-sm" />
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-xs text-brand-ink truncate m-0 sm:text-sm">
                    {{ item.product?.name || `Produk #${item.product_id}` }}
                  </p>
                  <p class="text-xs text-brand-muted m-0 mt-0.5">
                    {{ item.qty }} x {{ formatRupiah(item.price_cents / 100) }}
                  </p>
                </div>
              </div>
              <p
                class="m-0 whitespace-nowrap text-xs font-semibold tabular text-brand-ink sm:text-sm"
              >
                {{ formatRupiah((item.price_cents * item.qty) / 100) }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2">
            <span class="text-xs font-medium text-brand-muted">Total Pembayaran</span>
            <span class="text-lg font-bold tabular text-brand-ink">
              {{ formatRupiah(order.total_cents / 100) }}
            </span>
          </div>
        </div>

        <!-- Customer & Delivery Info (1 col) -->
        <div class="space-y-6">
          <!-- Delivery Address -->
          <div
            class="rounded-2xl border border-brand-hair bg-brand-canvas-soft p-6 shadow-whisper space-y-3"
          >
            <h2 class="font-display text-base font-bold text-brand-ink m-0">Informasi Penerima</h2>
            <div class="text-xs text-brand-ink space-y-1.5 pt-1">
              <p class="font-semibold m-0">{{ order.address.name }}</p>
              <p class="text-brand-muted m-0">{{ order.address.phone }}</p>
              <p class="m-0">{{ order.address.street }}</p>
              <p class="text-brand-muted m-0">
                {{ order.address.city }}, {{ order.address.postal }}
              </p>
              <p
                v-if="order.address.note"
                class="italic text-brand-muted mt-2 m-0 bg-brand-canvas p-2 rounded-lg"
              >
                "{{ order.address.note }}"
              </p>
            </div>
          </div>

          <!-- Payment Info -->
          <div
            class="rounded-2xl border border-brand-hair bg-brand-canvas-soft p-6 shadow-whisper space-y-3"
          >
            <h2 class="font-display text-base font-bold text-brand-ink m-0">Detail Pembayaran</h2>
            <div class="text-xs text-brand-muted space-y-2 pt-1">
              <div class="flex justify-between">
                <span>Metode:</span>
                <span class="font-medium text-brand-ink">{{
                  order.payment_type || 'Midtrans Snap'
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>Waktu Pembayaran:</span>
                <span class="font-medium text-brand-ink">{{ formatDate(order.paid_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tracking & Logistics Timeline Card (if shipped or completed) -->
      <div v-if="order.tracking_number" class="space-y-3">
        <h2 class="font-display text-base font-bold text-brand-ink m-0">
          Linimasa Pengiriman &amp; Ekspedisi
        </h2>
        <OrderTrackingTimeline
          :tracking-number="order.tracking_number"
          :courier-name="order.courier_name || 'JNE Express'"
          :status="order.status"
          :destination-city="order.address?.city"
          :checkpoints="adminCheckpoints"
        />
      </div>
    </div>

    <!-- Confirm Transition Modal -->
    <UiModal v-model:visible="isConfirmModalOpen" title="Konfirmasi Perubahan Status" size="sm">
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
            v-model="selectedCourierCode"
            :options="courierOptions"
            @update:model-value="handleAutoGenerateTracking"
          />
        </div>

        <div class="space-y-1 pt-1">
          <label class="block text-xs font-semibold text-brand-ink">Nomor Resi Pengiriman</label>
          <div class="flex items-center gap-2">
            <input
              v-model="trackingNumberInput"
              type="text"
              class="flex-1 px-3 py-2 text-xs font-mono bg-white border border-brand-hair rounded-lg text-brand-ink focus:outline-none focus:border-brand-ink"
              placeholder="Contoh: SS-JNE-123456"
            />
            <button
              type="button"
              class="px-3 py-2 text-xs font-semibold bg-brand-ink hover:bg-brand-inkhover text-white rounded-lg transition-colors cursor-pointer shrink-0 border-0"
              @click="handleAutoGenerateTracking"
            >
              Resi Otomatis
            </button>
          </div>
        </div>
      </div>

      <UiTextarea
        v-model="updateReason"
        class="mt-4"
        label="Catatan / Alasan (Opsional)"
        placeholder="Contoh: Paket telah diserahkan ke kurir / konfirmasi pembayaran..."
        :rows="2"
      />

      <template #footer>
        <UiButton
          variant="secondary"
          size="sm"
          :disabled="updating"
          @click="isConfirmModalOpen = false"
        >
          Batal
        </UiButton>
        <UiButton
          :variant="confirmVariant"
          size="sm"
          :loading="updating"
          @click="confirmStatusChange"
        >
          Konfirmasi
        </UiButton>
      </template>
    </UiModal>
  </div>
</template>
