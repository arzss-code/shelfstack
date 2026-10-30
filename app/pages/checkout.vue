<script setup lang="ts">
import { useCheckoutOrder } from '~/composables/useCheckoutOrder'
import CheckoutAddressForm from '~/components/checkout/CheckoutAddressForm.vue'
import ShippingMethodSelector from '~/components/checkout/ShippingMethodSelector.vue'
import CheckoutOrderSummary from '~/components/checkout/CheckoutOrderSummary.vue'
import CheckoutPaymentNotice from '~/components/checkout/CheckoutPaymentNotice.vue'

useSeoMeta({
  title: 'Checkout - ShelfStack',
  description:
    'Selesaikan pemesanan produk pilihan Anda dengan aman melalui gateway resmi Midtrans.',
})

const {
  user,
  cartStore,
  address,
  errors,
  isSubmitting,
  isOrderPlaced,
  createdOrderId,
  generalError,
  selectedShippingService,
  selectedCourierCode,
  selectedSavedAddressId,
  saveAddressForNextOrder,
  displayItems,
  displayTotalItems,
  displayTotalPrice,
  displayDiscountAmount,
  displayCouponCode,
  displayShippingFeeFormatted,
  displayIsFreeShipping,
  displayFinalPrice,
  submitButtonLabel,
  handleSelectSavedAddress,
  handleCreateOrder,
} = useCheckoutOrder()
</script>

<template>
  <div class="space-y-6 pb-20">
    <!-- Breadcrumbs & Trust Badge Header -->
    <div
      class="flex items-center justify-between pb-3 border-b border-brand-hairsoft flex-wrap gap-2"
    >
      <nav
        aria-label="Breadcrumbs"
        class="flex items-center gap-2 text-xs font-medium text-brand-muted"
      >
        <NuxtLink
          to="/"
          class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
        >
          ShelfStack
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <NuxtLink
          to="/cart"
          class="hover:text-brand-ink no-underline text-brand-muted transition-colors"
        >
          Keranjang
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <span class="text-brand-ink font-semibold">Checkout</span>
      </nav>

      <div class="flex items-center gap-2 text-[11px] text-brand-muted">
        <span class="inline-flex items-center gap-1 font-semibold text-brand-ink">
          <i class="pi pi-check-circle text-xs text-brand-ink" /> Checkout Aman
        </span>
        <span>·</span>
        <span>Enkripsi Midtrans 256-Bit</span>
      </div>
    </div>

    <!-- Page Title -->
    <div>
      <h1 class="font-display text-2xl sm:text-3xl font-bold text-brand-ink m-0">Checkout</h1>
      <p class="font-body text-xs sm:text-sm text-brand-muted m-0 mt-1">
        Periksa alamat pengiriman dan opsi ekspedisi sebelum memproses pembayaran resmi Anda.
      </p>
    </div>

    <!-- Auth Guard Check -->
    <div
      v-if="!user"
      class="bg-brand-canvas border border-brand-hair rounded-card p-8 text-center max-w-md mx-auto space-y-4 shadow-whisper"
    >
      <div
        class="w-12 h-12 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center mx-auto text-brand-ink"
      >
        <i class="pi pi-lock text-lg" />
      </div>
      <div>
        <h2 class="font-display font-bold text-base text-brand-ink m-0">Login Diperlukan</h2>
        <p class="font-body text-xs text-brand-muted m-0 mt-1.5 leading-relaxed">
          Silakan masuk ke akun Anda untuk memastikan alamat pengiriman tersimpan aman dan riwayat
          pesanan dapat dipantau langsung.
        </p>
      </div>
      <UiButton
        to="/auth/login?redirect=/checkout"
        variant="primary"
        size="sm"
        class="w-full justify-center rounded-full py-2.5"
      >
        Masuk ke Akun
      </UiButton>
    </div>

    <!-- Empty Cart Check -->
    <div
      v-else-if="cartStore.isEmpty && !isOrderPlaced && !isSubmitting"
      class="text-center py-16 px-6 bg-brand-canvas border border-brand-hair rounded-card max-w-md mx-auto space-y-4 shadow-whisper"
    >
      <div
        class="w-12 h-12 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center mx-auto text-brand-muted"
      >
        <i class="pi pi-shopping-bag text-lg" />
      </div>
      <div>
        <h2 class="font-display text-base font-bold text-brand-ink m-0">
          Keranjang Belanja Kosong
        </h2>
        <p class="text-xs text-brand-muted m-0 mt-1">
          Tidak ada produk yang siap di-checkout. Silakan pilih barang dari etalase kurasi terlebih
          dahulu.
        </p>
      </div>
      <UiButton to="/katalog" variant="primary" size="sm" class="rounded-full px-5">
        Kembali ke Katalog
      </UiButton>
    </div>

    <!-- Checkout Main Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Left Column: Delivery Form, Shipping Option, Payment Gateway -->
      <section class="lg:col-span-7 space-y-6" aria-labelledby="shipping-heading">
        <!-- Error Alert -->
        <div
          v-if="generalError"
          class="p-4 bg-red-50 border border-red-200 rounded-card flex items-start gap-3 text-red-700 text-xs shadow-2xs"
        >
          <i class="pi pi-exclamation-circle text-base shrink-0 mt-0.5 text-red-600" />
          <span class="leading-relaxed">{{ generalError }}</span>
        </div>

        <!-- Payment Processing Banner -->
        <div
          v-if="isOrderPlaced && createdOrderId"
          class="p-4 bg-emerald-50 border border-emerald-200 rounded-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-800 text-xs shadow-2xs"
        >
          <div class="flex items-center gap-3">
            <i class="pi pi-spin pi-spinner text-base shrink-0 text-emerald-600" />
            <span>Pesanan berhasil dibuat. Menyiapkan popup pembayaran resmi Midtrans...</span>
          </div>
          <NuxtLink
            :to="`/orders/${createdOrderId}`"
            class="font-semibold text-emerald-800 hover:text-emerald-950 underline shrink-0"
          >
            Buka Pesanan &rarr;
          </NuxtLink>
        </div>

        <!-- Step 1: Delivery Address Form (Modular Component) -->
        <CheckoutAddressForm
          v-model="address"
          v-model:save-address-for-next-order="saveAddressForNextOrder"
          :errors="errors"
          :disabled="isSubmitting || isOrderPlaced"
          :is-logged-in="Boolean(user)"
          :selected-saved-address-id="selectedSavedAddressId"
          @select-saved="handleSelectSavedAddress"
        />

        <!-- Step 2: Shipping Method Selector -->
        <ShippingMethodSelector
          v-model="selectedShippingService"
          v-model:selected-courier="selectedCourierCode"
          :subtotal-cents="cartStore.totalPriceCents"
          :disabled="isSubmitting || isOrderPlaced"
        />

        <!-- Step 3: Payment Notice -->
        <CheckoutPaymentNotice />
      </section>

      <!-- Right Column: Order Summary & Bill (Modular Component) -->
      <section class="lg:col-span-5" aria-labelledby="summary-heading">
        <CheckoutOrderSummary
          :items="displayItems"
          :total-items="displayTotalItems"
          :total-price="displayTotalPrice"
          :discount-amount="displayDiscountAmount"
          :coupon-code="displayCouponCode"
          :shipping-fee-formatted="displayShippingFeeFormatted"
          :is-free-shipping="displayIsFreeShipping"
          :final-price="displayFinalPrice"
          :is-submitting="isSubmitting"
          :is-order-placed="isOrderPlaced"
          :submit-button-label="submitButtonLabel"
          @submit="handleCreateOrder"
        />
      </section>
    </div>
  </div>
</template>
