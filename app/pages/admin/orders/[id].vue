<script setup lang="ts">
import { formatRupiah } from '~/utils/format'
import OrderTrackingTimeline from '~/components/orders/OrderTrackingTimeline.vue'
import AdminOrderStatusModal from '~/features/orders/components/AdminOrderStatusModal.vue'
import AdminOrderCustomerCard from '~/features/orders/components/AdminOrderCustomerCard.vue'
import AdminShippingLabelModal from '~/features/orders/components/AdminShippingLabelModal.vue'
import OrderInvoiceModal from '~/features/orders/components/OrderInvoiceModal.vue'
import AdminEmailPreviewModal from '~/components/admin/AdminEmailPreviewModal.vue'
import AdminAddCheckpointModal from '~/components/admin/orders/AdminAddCheckpointModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const orderId = computed(() => route.params.id as string)

const isShippingLabelOpen = ref(false)
const isInvoiceModalOpen = ref(false)
const isEmailPreviewOpen = ref(false)
const isAddCheckpointOpen = ref(false)

const {
  order,
  loading,
  updating,
  simulatingTracking,
  handleSimulateTracking,
  errorMessage,
  isConfirmModalOpen,
  targetStatus,
  updateReason,
  selectedCourierCode,
  trackingNumberInput,
  adminCheckpoints,
  courierOptions,
  availableTransitions,
  confirmVariant,
  handleAutoGenerateTracking,
  fetchOrderDetail,
  openTransitionModal,
  confirmStatusChange,
  getStatusBadge,
  getTransitionLabel,
  getTransitionBtnVariant,
  formatDate,
} = useAdminOrderDetail(orderId.value)

useSeoMeta({
  title: computed(() => `Detail Pesanan #${orderId.value.slice(0, 8)} - Admin ShelfStack`),
})
</script>

<template>
  <div class="space-y-5">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-xs text-brand-muted">
      <NuxtLink
        to="/admin/orders"
        class="no-underline text-brand-muted hover:text-brand-ink font-medium transition-colors"
      >
        Kelola Pesanan
      </NuxtLink>
      <span>/</span>
      <span class="font-semibold text-brand-ink tabular"
        >#{{ orderId.slice(0, 8).toUpperCase() }}</span
      >
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="space-y-4 py-6">
      <div class="h-10 w-64 animate-pulse rounded bg-brand-hairsoft" />
      <div class="h-48 w-full animate-pulse rounded-card bg-brand-hairsoft" />
    </div>

    <!-- Error State -->
    <UiAlert
      v-else-if="errorMessage"
      variant="danger"
      title="Gagal Memuat Pesanan"
      class="mx-auto max-w-md"
    >
      <p class="m-0 font-medium">{{ errorMessage }}</p>
      <UiButton variant="secondary" size="sm" class="mt-3" @click="fetchOrderDetail">
        Coba Lagi
      </UiButton>
    </UiAlert>

    <!-- Content State -->
    <div v-else-if="order" class="space-y-5">
      <!-- Header Banner with Status & Actions -->
      <div
        class="flex flex-col gap-4 rounded-card border border-brand-hair bg-brand-canvas-soft p-5 shadow-whisper sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1
              class="m-0 font-display text-xl font-bold tracking-tight text-brand-ink sm:text-2xl"
            >
              Pesanan #{{ order.id.slice(0, 8).toUpperCase() }}
            </h1>
            <UiBadge
              :label="getStatusBadge(order.status).label"
              :variant="getStatusBadge(order.status).variant"
              class="shrink-0"
            />
          </div>
          <p class="text-xs text-brand-muted m-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span class="text-brand-faint">ID: {{ order.id }}</span>
            <span class="hidden sm:inline text-brand-hair">·</span>
            <span>Dibuat pada {{ formatDate(order.created_at) }}</span>
          </p>
        </div>

        <!-- State Machine & Document Action Buttons -->
        <div class="flex flex-wrap items-center gap-2">
          <UiButton
            v-if="['paid', 'shipped', 'completed'].includes(order.status)"
            variant="outline"
            size="sm"
            class="font-semibold"
            @click="isShippingLabelOpen = true"
          >
            <i class="pi pi-tag mr-1 text-xs" />
            Cetak Label Resi
          </UiButton>
          <UiButton
            v-if="['paid', 'shipped', 'completed'].includes(order.status)"
            variant="outline"
            size="sm"
            class="font-semibold"
            @click="isInvoiceModalOpen = true"
          >
            <i class="pi pi-print mr-1 text-xs" />
            Cetak Invoice
          </UiButton>
          <UiButton
            variant="outline"
            size="sm"
            class="font-semibold"
            @click="isEmailPreviewOpen = true"
          >
            <i class="pi pi-envelope mr-1 text-xs" />
            Pratinjau Email
          </UiButton>

          <template v-if="availableTransitions.length > 0">
            <UiButton
              v-for="target in availableTransitions"
              :key="target"
              :variant="getTransitionBtnVariant(target)"
              size="sm"
              class="font-semibold"
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

      <!-- Layout 2 Columns -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        <!-- Order Items List (2 cols) -->
        <div
          class="lg:col-span-2 rounded-card border border-brand-hair bg-brand-canvas-soft p-5 shadow-whisper space-y-4"
        >
          <h2 class="font-display text-base font-bold text-brand-ink m-0">Daftar Produk</h2>

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
        <AdminOrderCustomerCard :order="order" :format-date="formatDate" />
      </div>

      <!-- Tracking & Logistics Timeline Card (if shipped or completed) -->
      <div v-if="order.tracking_number" class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-display text-base font-bold text-brand-ink m-0">
            Linimasa Pengiriman &amp; Ekspedisi
          </h2>
          <div class="flex items-center gap-2">
            <UiButton
              v-if="order.status === 'shipped'"
              variant="outline"
              size="sm"
              :loading="simulatingTracking"
              @click="handleSimulateTracking"
            >
              <i class="pi pi-play text-xs mr-1" />
              Simulasi Kurir
            </UiButton>
            <UiButton variant="secondary" size="sm" @click="isAddCheckpointOpen = true">
              <i class="pi pi-plus text-xs mr-1.5" />
              Tambah Checkpoint
            </UiButton>
          </div>
        </div>
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
    <AdminOrderStatusModal
      v-model:visible="isConfirmModalOpen"
      v-model:selected-courier-code="selectedCourierCode"
      v-model:tracking-number-input="trackingNumberInput"
      v-model:update-reason="updateReason"
      :target-status="targetStatus"
      :courier-options="courierOptions"
      :updating="updating"
      :confirm-variant="confirmVariant"
      @auto-generate-tracking="handleAutoGenerateTracking"
      @confirm="confirmStatusChange"
    />

    <!-- Shipping Waybill & Invoice Modals -->
    <template v-if="order">
      <AdminShippingLabelModal v-model:visible="isShippingLabelOpen" :order="order" />
      <OrderInvoiceModal v-model:visible="isInvoiceModalOpen" :order="order" />
      <AdminEmailPreviewModal
        :show="isEmailPreviewOpen"
        :order="order"
        @close="isEmailPreviewOpen = false"
      />
      <AdminAddCheckpointModal
        v-if="order.tracking_number"
        v-model:visible="isAddCheckpointOpen"
        :order-id="order.id"
        :tracking-number="order.tracking_number"
        @checkpoint-added="fetchOrderDetail"
      />
    </template>
  </div>
</template>
