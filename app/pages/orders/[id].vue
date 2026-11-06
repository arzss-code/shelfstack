<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OrderCancelDialog from '~/features/orders/components/OrderCancelDialog.vue'
import OrderInvoiceModal from '~/features/orders/components/OrderInvoiceModal.vue'
import OrderTrackingTimeline from '~/components/orders/OrderTrackingTimeline.vue'
import ReviewFormModal from '~/components/product/ReviewFormModal.vue'
import OrderReturnModal from '~/components/orders/OrderReturnModal.vue'
import OrderReturnStatusCard from '~/components/orders/OrderReturnStatusCard.vue'
import OrderDetailProgressStepper from '~/features/orders/components/OrderDetailProgressStepper.vue'
import OrderDetailItemsCard from '~/features/orders/components/OrderDetailItemsCard.vue'
import OrderDetailDeliveryCard from '~/features/orders/components/OrderDetailDeliveryCard.vue'
import OrderDetailPaymentCard from '~/features/orders/components/OrderDetailPaymentCard.vue'
import { useReturnRequest } from '~/composables/useReturnRequest'
import { useOrderDetail } from '~/composables/useOrderDetail'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const orderId = route.params.id as string

const {
  order,
  loading,
  errorMsg,
  isPaying,
  isCancelling,
  isManualChecking,
  copiedHeaderResi,
  activeCheckpoints,
  activeLatestCheckpointLocation,
  activeLatestCheckpointTitle,
  orderSteps,
  copyHeaderResi,
  formatDate,
  formatShippingServiceName,
  getSegmentColor,
  getStatusBadge,
  getPaymentStatusBadge,
  handlePayNow,
  handleCheckPaymentStatus,
  handleCancelOrder,
  handleReorder,
} = useOrderDetail(orderId)

const { ticket: returnTicket, eligibility: returnEligibility, fetchReturnData } = useReturnRequest()

const isCancelModalOpen = ref(false)
const isInvoiceModalOpen = ref(false)
const isReviewModalOpen = ref(false)
const selectedReviewProduct = ref<{ id: number | string; name: string } | null>(null)
const isReturnModalOpen = ref(false)

const openReviewModal = (item: {
  product_id: number | string
  product?: { name?: string } | null
}) => {
  selectedReviewProduct.value = {
    id: item.product_id,
    name: item.product?.name || `Produk #${item.product_id}`,
  }
  isReviewModalOpen.value = true
}

const onConfirmCancel = async (reason: string) => {
  const success = await handleCancelOrder(reason)
  if (success) {
    isCancelModalOpen.value = false
  }
}

onMounted(async () => {
  if (orderId) {
    await fetchReturnData(orderId)
  }
})

useSeoMeta({
  title: () =>
    order.value
      ? `Pesanan #${order.value.id.slice(0, 8)} - ShelfStack`
      : 'Detail Pesanan - ShelfStack',
  description: 'Detail informasi dan status pemesanan produk resmi di ShelfStack.',
})
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <NuxtLink
        to="/orders"
        class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
      >
        Pesanan Saya
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Detail Pesanan</span>
    </nav>

    <!-- Error State -->
    <div
      v-if="errorMsg"
      class="text-center py-16 px-6 bg-red-50 border border-red-200 rounded-card max-w-lg mx-auto space-y-4"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-600" />
      <h2 class="font-display text-lg font-bold text-red-900 m-0">Gagal Memuat Pesanan</h2>
      <p class="text-xs text-red-700 m-0">{{ errorMsg }}</p>
      <UiButton to="/orders" variant="secondary" size="sm">Kembali ke Riwayat Pesanan</UiButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-else-if="loading" class="space-y-6 animate-pulse">
      <div class="h-16 bg-brand-field rounded-card" />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 h-80 bg-brand-field rounded-card" />
        <div class="lg:col-span-4 h-60 bg-brand-field rounded-card" />
      </div>
    </div>

    <!-- Order Detail View -->
    <div v-else-if="order" class="space-y-6">
      <!-- Top Order Header -->
      <div
        class="bg-white border border-brand-hair rounded-card p-6 shadow-whisper flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div class="flex items-center gap-3">
            <h1 class="font-display text-xl sm:text-2xl font-bold text-brand-ink m-0">
              Pesanan #{{ order.id.slice(0, 8) }}
            </h1>
            <UiBadge
              :variant="getStatusBadge(order.status).variant"
              :label="getStatusBadge(order.status).label"
            />
          </div>
          <p class="font-body text-xs text-brand-muted m-0 mt-1">
            Dibuat pada {{ formatDate(order.created_at) }}
            <span v-if="order.paid_at"> · Dibayar pada {{ formatDate(order.paid_at) }}</span>
          </p>
        </div>

        <div v-if="order.tracking_number" class="flex flex-wrap items-center gap-2 sm:justify-end">
          <div
            class="inline-flex items-center gap-2 bg-blue-50/70 border border-blue-200/80 rounded-field px-3 py-1.5 text-xs"
          >
            <span
              class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white shrink-0"
            >
              <i class="pi pi-truck text-[10px]" />
            </span>
            <span class="font-bold text-brand-ink uppercase text-[11px]">{{
              order.courier_name || 'Kurir'
            }}</span>
            <span class="text-brand-faint">·</span>
            <span class="font-mono font-semibold text-brand-ink text-[11px]">{{
              order.tracking_number
            }}</span>
            <button
              type="button"
              class="text-[11px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 ml-1 transition-colors"
              :title="copiedHeaderResi ? 'Tersalin!' : 'Salin Resi'"
              @click="copyHeaderResi(order.tracking_number)"
            >
              <i
                :class="
                  copiedHeaderResi ? 'pi pi-check text-emerald-600 text-xs' : 'pi pi-copy text-xs'
                "
              />
              <span class="text-[10px]">{{ copiedHeaderResi ? 'Tersalin' : 'Salin' }}</span>
            </button>
          </div>
          <UiButton
            :to="`/tracking?q=${encodeURIComponent(order.tracking_number)}`"
            variant="outline"
            size="sm"
            icon="pi-compass"
          >
            Lacak Publik
          </UiButton>
        </div>
      </div>

      <!-- Kartu Status Retur / Garansi Pelanggan -->
      <OrderReturnStatusCard
        v-if="returnTicket"
        :ticket="returnTicket"
        :order-id="order.id"
        @refetch="fetchReturnData(order.id)"
      />

      <!-- Timeline Status Progress (Modular Stepper) -->
      <OrderDetailProgressStepper
        :order="order"
        :order-steps="orderSteps"
        :get-segment-color="getSegmentColor"
        :format-date="formatDate"
      />

      <!-- Real-time Logistics & Courier Tracking Timeline -->
      <OrderTrackingTimeline
        v-if="order.tracking_number"
        class="mb-8"
        :order-id="order.id"
        :tracking-number="order.tracking_number"
        :courier-name="order.courier_name || 'JNE Express'"
        :status="order.status"
        :destination-city="order.address?.city"
        :checkpoints="activeCheckpoints"
      />

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left Column: Items List & Delivery Address -->
        <div class="lg:col-span-8 space-y-6">
          <OrderDetailItemsCard
            :items="order.items"
            :order-status="order.status"
            @review="openReviewModal"
          />

          <OrderDetailDeliveryCard
            :order="order"
            :copied-header-resi="copiedHeaderResi"
            :active-latest-checkpoint-location="activeLatestCheckpointLocation"
            :active-latest-checkpoint-title="activeLatestCheckpointTitle"
            @copy-resi="copyHeaderResi"
          />
        </div>

        <!-- Right Column: Payment & Bill Summary (Modular Aside) -->
        <OrderDetailPaymentCard
          class="lg:col-span-4"
          :order="order"
          :is-paying="isPaying"
          :is-cancelling="isCancelling"
          :is-manual-checking="isManualChecking"
          :get-payment-status-badge="getPaymentStatusBadge"
          :format-shipping-service-name="formatShippingServiceName"
          :return-eligibility="returnEligibility"
          :return-ticket="returnTicket"
          @pay="handlePayNow"
          @check-status="handleCheckPaymentStatus(false)"
          @open-cancel-modal="isCancelModalOpen = true"
          @reorder="handleReorder"
          @open-return-modal="isReturnModalOpen = true"
          @open-invoice-modal="isInvoiceModalOpen = true"
        />
      </div>
    </div>

    <!-- Modals -->
    <OrderCancelDialog
      v-model:visible="isCancelModalOpen"
      :loading="isCancelling"
      @confirm="onConfirmCancel"
    />

    <OrderInvoiceModal v-if="order" v-model:visible="isInvoiceModalOpen" :order="order" />

    <OrderReturnModal
      v-if="order"
      v-model="isReturnModalOpen"
      :order-id="order.id"
      :order-number="`ORD-${order.id.slice(0, 8).toUpperCase()}`"
      :remaining-days="returnEligibility?.remainingDays || 7"
      @success="fetchReturnData(order.id)"
    />

    <ReviewFormModal
      v-if="selectedReviewProduct"
      v-model="isReviewModalOpen"
      :product-id="selectedReviewProduct.id"
      :product-name="selectedReviewProduct.name"
      :order-id="order?.id || orderId"
    />
  </div>
</template>
