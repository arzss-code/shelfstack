<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OrderCancelDialog from '~/features/orders/components/OrderCancelDialog.vue'
import OrderInvoiceModal from '~/features/orders/components/OrderInvoiceModal.vue'
import OrderTrackingTimeline from '~/components/orders/OrderTrackingTimeline.vue'
import ReviewFormModal from '~/components/product/ReviewFormModal.vue'
import OrderReturnModal from '~/components/orders/OrderReturnModal.vue'
import OrderReturnStatusCard from '~/components/orders/OrderReturnStatusCard.vue'
import OrderDetailProgressStepper from '~/features/orders/components/OrderDetailProgressStepper.vue'
import OrderDetailHeaderBanner from '~/features/orders/components/OrderDetailHeaderBanner.vue'
import OrderDetailItemsCard from '~/features/orders/components/OrderDetailItemsCard.vue'
import OrderDetailDeliveryCard from '~/features/orders/components/OrderDetailDeliveryCard.vue'
import OrderDetailPaymentCard from '~/features/orders/components/OrderDetailPaymentCard.vue'
import OrderPaidRefundModal from '~/components/orders/OrderPaidRefundModal.vue'
import { useReturnRequest } from '~/composables/useReturnRequest'
import { usePaidOrderRefundRequest } from '~/composables/usePaidOrderRefundRequest'
import { useOrderDetail } from '~/composables/useOrderDetail'
import { useUiConfirm } from '~/composables/useUiConfirm'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const orderId = route.params.id as string

const {
  order,
  loading,
  errorMsg,
  isPaying,
  isCancelling,
  isManualChecking,
  isConfirmingDelivery,
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
  handlePaymentExpired,
  handleCancelOrder,
  handleConfirmDelivery,
  handleReorder,
} = useOrderDetail(orderId)

const confirm = useUiConfirm()
const { ticket: returnTicket, eligibility: returnEligibility, fetchReturnData } = useReturnRequest()
const {
  refundRequest: paidRefundRequest,
  isSubmittingRefund,
  isModalOpen: isPaidRefundModalOpen,
  fetchRefundRequest,
  submitRefundRequest,
} = usePaidOrderRefundRequest()

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

const handleConfirmDeliveryClick = () => {
  confirm.require({
    header: 'Konfirmasi Penerimaan',
    message:
      'Apakah seluruh produk pesanan ini telah tiba dengan baik dan sesuai? Tindakan ini akan menyelesaikan pesanan dan mencairkan koin loyalitas Anda.',
    tone: 'success',
    acceptLabel: 'Ya, Pesanan Diterima',
    rejectLabel: 'Batal',
    accept: async () => {
      const ok = await handleConfirmDelivery()
      if (ok && order.value?.items?.[0]) openReviewModal(order.value.items[0])
    },
  })
}

const onConfirmCancel = async (reason: string) => {
  const success = await handleCancelOrder(reason)
  if (success) isCancelModalOpen.value = false
}

const onConfirmPaidRefund = async (reason: string) => {
  await submitRefundRequest(orderId, reason)
}

onMounted(() => {
  if (orderId) {
    fetchReturnData(orderId)
    fetchRefundRequest(orderId)
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
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
        >ShelfStack</NuxtLink
      >
      <span class="text-brand-faint">/</span>
      <NuxtLink
        to="/orders"
        class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
        >Pesanan Saya</NuxtLink
      >
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Detail Pesanan</span>
    </nav>

    <div
      v-if="errorMsg"
      class="text-center py-16 px-6 bg-red-50 border border-red-200 rounded-card max-w-lg mx-auto space-y-4"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-600" />
      <h2 class="font-display text-lg font-bold text-red-900 m-0">Gagal Memuat Pesanan</h2>
      <p class="text-xs text-red-700 m-0">{{ errorMsg }}</p>
      <UiButton to="/orders" variant="secondary" size="sm">Kembali ke Riwayat Pesanan</UiButton>
    </div>

    <div v-else-if="loading" class="space-y-6 animate-pulse">
      <div class="h-16 bg-brand-field rounded-card" />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 h-80 bg-brand-field rounded-card" />
        <div class="lg:col-span-4 h-60 bg-brand-field rounded-card" />
      </div>
    </div>

    <div v-else-if="order" class="space-y-6">
      <OrderDetailHeaderBanner
        :order="order"
        :copied-header-resi="copiedHeaderResi"
        :status-badge="getStatusBadge(order.status)"
        :format-date="formatDate"
        @copy-resi="copyHeaderResi"
      />

      <OrderReturnStatusCard
        v-if="returnTicket"
        :ticket="returnTicket"
        :order-id="order.id"
        @refetch="fetchReturnData(order.id)"
      />

      <OrderDetailProgressStepper
        :order="order"
        :order-steps="orderSteps"
        :get-segment-color="getSegmentColor"
        :format-date="formatDate"
      />

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

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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

        <OrderDetailPaymentCard
          class="lg:col-span-4"
          :order="order"
          :is-paying="isPaying"
          :is-cancelling="isCancelling"
          :is-manual-checking="isManualChecking"
          :is-confirming-delivery="isConfirmingDelivery"
          :get-payment-status-badge="getPaymentStatusBadge"
          :format-shipping-service-name="formatShippingServiceName"
          :return-eligibility="returnEligibility"
          :return-ticket="returnTicket"
          :paid-refund-request="paidRefundRequest"
          @pay="handlePayNow"
          @check-status="handleCheckPaymentStatus(false)"
          @open-cancel-modal="isCancelModalOpen = true"
          @open-paid-refund-modal="isPaidRefundModalOpen = true"
          @reorder="handleReorder"
          @confirm-delivery="handleConfirmDeliveryClick"
          @payment-expired="handlePaymentExpired"
          @open-return-modal="isReturnModalOpen = true"
          @open-invoice-modal="isInvoiceModalOpen = true"
        />
      </div>
    </div>

    <OrderCancelDialog
      v-model:visible="isCancelModalOpen"
      :loading="isCancelling"
      @confirm="onConfirmCancel"
    />
    <OrderPaidRefundModal
      v-model:visible="isPaidRefundModalOpen"
      :loading="isSubmittingRefund"
      @confirm="onConfirmPaidRefund"
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
