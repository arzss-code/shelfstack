<script setup lang="ts">
import { useCheckoutOrder } from '~/composables/useCheckoutOrder'
import CheckoutAddressForm from '~/components/checkout/CheckoutAddressForm.vue'
import ShippingMethodSelector from '~/components/checkout/ShippingMethodSelector.vue'
import CheckoutCoinsToggle from '~/components/checkout/CheckoutCoinsToggle.vue'
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
  useCoins,
  balanceCoins,
  maxUsableCoins,
  displayItems,
  displayTotalItems,
  displayTotalPrice,
  displayDiscountAmount,
  displayCouponCode,
  displayCoinsDiscountAmount,
  displayCoinsUsed,
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
      class="flex flex-wrap items-center justify-between gap-2 border-b border-brand-hairsoft pb-3"
    >
      <nav
        aria-label="Breadcrumbs"
        class="flex items-center gap-2 text-xs font-medium text-brand-muted"
      >
        <NuxtLink
          to="/"
          class="text-brand-muted no-underline transition-colors hover:text-brand-ink"
        >
          ShelfStack
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <NuxtLink
          to="/cart"
          class="text-brand-muted no-underline transition-colors hover:text-brand-ink"
        >
          Keranjang
        </NuxtLink>
        <span class="text-brand-faint">/</span>
        <span class="font-semibold text-brand-ink">Checkout</span>
      </nav>

      <div class="flex items-center gap-1.5 text-[11px]">
        <span
          class="inline-flex items-center gap-1.5 rounded-full border border-brand-hair bg-brand-canvas px-2.5 py-0.5 font-semibold text-brand-ink shadow-2xs"
        >
          <i class="pi pi-check-circle text-xs text-brand-success" /> Checkout Aman
        </span>
        <span
          class="inline-flex items-center gap-1 rounded-full border border-brand-hair bg-brand-canvas-soft px-2 py-0.5 font-medium text-[10.5px] text-brand-muted"
        >
          <i class="pi pi-lock text-[10px]" /> Enkripsi Midtrans 256-Bit
        </span>
      </div>
    </div>

    <!-- Page Title -->
    <div>
      <h1 class="m-0 font-display font-bold text-2xl text-brand-ink sm:text-3xl">Checkout</h1>
      <p class="m-0 mt-1 font-body text-xs text-brand-muted sm:text-sm">
        Periksa alamat pengiriman dan opsi ekspedisi sebelum memproses pembayaran resmi Anda.
      </p>
    </div>

    <!-- Auth Guard Check -->
    <UiCard v-if="!user" class="mx-auto max-w-md space-y-4 p-8 text-center">
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-brand-ink"
      >
        <i class="pi pi-lock text-lg" />
      </div>
      <div>
        <h2 class="m-0 font-display font-bold text-base text-brand-ink">Login Diperlukan</h2>
        <p class="m-0 mt-1.5 font-body text-xs leading-relaxed text-brand-muted">
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
    </UiCard>

    <!-- Empty Cart Check -->
    <UiCard
      v-else-if="cartStore.isEmpty && !isOrderPlaced && !isSubmitting"
      class="mx-auto max-w-md space-y-4 px-6 py-16 text-center"
    >
      <div
        class="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-hair bg-brand-canvas-soft text-brand-muted"
      >
        <i class="pi pi-shopping-bag text-lg" />
      </div>
      <div>
        <h2 class="m-0 font-display font-bold text-base text-brand-ink">
          Keranjang Belanja Kosong
        </h2>
        <p class="m-0 mt-1 text-xs text-brand-muted">
          Tidak ada produk yang siap di-checkout. Silakan pilih barang dari etalase kurasi terlebih
          dahulu.
        </p>
      </div>
      <UiButton to="/katalog" variant="primary" size="sm" class="rounded-full px-5">
        Kembali ke Katalog
      </UiButton>
    </UiCard>

    <!-- Checkout Main Content -->
    <div v-else class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <!-- Left Column: Delivery Form, Shipping Option, Payment Gateway -->
      <section class="space-y-6 lg:col-span-7" aria-labelledby="shipping-heading">
        <!-- Error Alert -->
        <div
          v-if="generalError"
          class="flex items-start gap-3 rounded-card border border-red-200 bg-red-50 p-4 text-xs text-red-700 shadow-2xs"
        >
          <i class="pi pi-exclamation-circle mt-0.5 shrink-0 text-base text-red-600" />
          <span class="leading-relaxed">{{ generalError }}</span>
        </div>

        <!-- Payment Processing Banner -->
        <div
          v-if="isOrderPlaced && createdOrderId"
          class="flex flex-col items-start justify-between gap-3 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 shadow-2xs sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-3">
            <i class="pi pi-spin pi-spinner shrink-0 text-base text-emerald-600" />
            <span>Pesanan berhasil dibuat. Menyiapkan popup pembayaran resmi Midtrans...</span>
          </div>
          <NuxtLink
            :to="`/orders/${createdOrderId}`"
            class="shrink-0 font-semibold text-emerald-800 underline hover:text-emerald-950"
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

        <!-- Step 3: Tukarkan Koin Loyalitas -->
        <CheckoutCoinsToggle
          v-model="useCoins"
          :balance-coins="balanceCoins"
          :max-usable-coins="maxUsableCoins"
          :disabled="isSubmitting || isOrderPlaced"
        />

        <!-- Step 4: Payment Notice -->
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
          :coins-discount-amount="displayCoinsDiscountAmount"
          :coins-used="displayCoinsUsed"
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
