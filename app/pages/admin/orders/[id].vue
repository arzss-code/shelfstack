<script setup lang="ts">
import type { Order, OrderStatus } from '~/types/order'
import { formatRupiah } from '~/utils/format'
import { getAvailableAdminTransitions } from '~~/shared/constants/order-transitions'

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

useSeoMeta({
  title: computed(() => `Detail Pesanan #${orderId.value.slice(0, 8)} - Admin ShelfStack`),
})

const fetchOrderDetail = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const res = await $fetch<{ status: string; data: Order }>(`/api/orders/${orderId.value}`)
    order.value = res.data
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

const getTransitionLabel = (status: OrderStatus) => {
  switch (status) {
    case 'paid':
      return 'Tandai Lunas'
    case 'shipped':
      return 'Kirim Pesanan'
    case 'completed':
      return 'Selesaikan Pesanan'
    case 'cancelled':
      return 'Batalkan Pesanan'
    case 'refunded':
      return 'Refund Pesanan'
    default:
      return status
  }
}

const confirmVariant = computed<'danger' | 'primary'>(() =>
  targetStatus.value === 'cancelled' || targetStatus.value === 'refunded' ? 'danger' : 'primary',
)

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs text-brand-muted">
      <NuxtLink to="/admin/orders" class="no-underline text-brand-muted hover:text-brand-ink">
        Kelola Pesanan
      </NuxtLink>
      <span>/</span>
      <span class="font-mono text-brand-ink tabular">#{{ orderId.slice(0, 8) }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4 py-8">
      <div class="h-10 w-64 animate-pulse rounded bg-brand-hairsoft" />
      <div class="h-48 w-full animate-pulse rounded-2xl bg-brand-hairsoft" />
    </div>

    <!-- Error State -->
    <UiAlert v-else-if="errorMessage" tone="danger" class="mx-auto max-w-md">
      <p class="m-0 font-medium">{{ errorMessage }}</p>
      <UiButton variant="secondary" size="sm" class="mt-3" @click="fetchOrderDetail">
        Coba Lagi
      </UiButton>
    </UiAlert>

    <!-- Main Content -->
    <div v-else-if="order" class="space-y-6">
      <!-- Header Banner with Status & Actions -->
      <div
        class="flex flex-col gap-4 rounded-2xl border border-brand-hair bg-brand-canvas-soft p-6 shadow-whisper sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-3">
            <h1 class="m-0 font-mono text-xl font-bold tabular text-brand-ink sm:text-2xl">
              #{{ order.id }}
            </h1>
            <UiBadge
              :label="getStatusBadge(order.status).label"
              :variant="getStatusBadge(order.status).variant"
            />
          </div>
          <p class="text-xs text-brand-muted m-0">Dibuat pada {{ formatDate(order.created_at) }}</p>
        </div>

        <!-- State Machine Action Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="availableTransitions.length > 0">
            <UiButton
              v-for="target in availableTransitions"
              :key="target"
              :variant="target === 'cancelled' || target === 'refunded' ? 'secondary' : 'primary'"
              size="sm"
              @click="openTransitionModal(target)"
            >
              {{ getTransitionLabel(target) }}
            </UiButton>
          </template>
          <span v-else class="text-xs font-medium text-brand-muted italic">
            Status Final (Tidak dapat diubah)
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Order Items Table (2 cols) -->
        <div
          class="lg:col-span-2 overflow-hidden rounded-2xl border border-brand-hair bg-brand-canvas-soft p-6 shadow-whisper space-y-4"
        >
          <h2 class="font-display text-base font-bold text-brand-ink m-0">Daftar Produk</h2>

          <div class="divide-y divide-brand-hairsoft border-t border-b border-brand-hairsoft">
            <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4 py-4">
              <img
                :src="item.product?.image_url || '/placeholder.png'"
                :alt="item.product?.name || 'Produk'"
                class="h-14 w-14 rounded-xl object-cover border border-brand-hair bg-brand-canvas"
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-xs sm:text-sm text-brand-ink m-0 truncate">
                  {{ item.product?.name || `Produk #${item.product_id}` }}
                </p>
                <p class="m-0 mt-0.5 text-[11px] tabular text-brand-muted">
                  {{ item.qty }} x {{ formatRupiah(item.price_cents / 100) }}
                </p>
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
          <div
            class="rounded-2xl border border-brand-hair bg-brand-canvas-soft p-6 shadow-whisper space-y-3"
          >
            <h2 class="font-display text-base font-bold text-brand-ink m-0">
              Informasi Pengiriman
            </h2>
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
    </div>

    <!-- Confirm Transition Modal -->
    <UiModal v-model:visible="isConfirmModalOpen" title="Konfirmasi Perubahan Status" size="sm">
      <p class="m-0 text-xs leading-relaxed text-brand-muted">
        Ubah status pesanan ke
        <strong class="font-semibold uppercase text-brand-ink">{{ targetStatus }}</strong
        >? Aksi ini akan dicatat ke dalam audit log aktivitas admin.
      </p>

      <UiTextarea
        v-model="updateReason"
        class="mt-4"
        label="Catatan / Alasan (Opsional)"
        placeholder="Contoh: No resi pengiriman / konfirmasi transfer manual..."
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
