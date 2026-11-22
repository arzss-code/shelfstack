<script setup lang="ts">
import { watch } from 'vue'
import { useCartStore, type AppliedCoupon } from '~/features/cart/stores/cart'
import { useVoucherSelection, type AvailableCoupon } from '~/composables/useVoucherSelection'
import VoucherSelectCard from './VoucherSelectCard.vue'
import VoucherSelectEmpty from './VoucherSelectEmpty.vue'
import VoucherSelectFooter from './VoucherSelectFooter.vue'

export type { AvailableCoupon }

const visible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
  applied: [coupon: AppliedCoupon]
  removed: []
}>()

const cartStore = useCartStore()

const {
  activeTab,
  walletCoupons,
  availableCoupons,
  currentTabCoupons,
  eligibleCoupons,
  ineligibleCoupons,
  bestDiscountCode,
  selectedCode,
  selectedCoupon,
  selectedDiscountCents,
  isLoadingCoupons,
  couponsError,
  isClaimingCode,
  manualCode,
  isManualValidating,
  manualError,
  manualSuccessMessage,
  isLoggedIn,
  initModal,
  fetchCoupons,
  toggleSelectCoupon,
  handleClaimAndApply,
  handleApplyManual,
  handleConfirm,
  handleCancel,
} = useVoucherSelection({
  onApplied: (c) => emit('applied', c),
  onRemoved: () => emit('removed'),
  onClose: () => {
    visible.value = false
  },
})

watch(
  visible,
  (isOpen) => {
    if (isOpen) initModal()
  },
  { immediate: true },
)
</script>

<template>
  <UiModal
    v-model:visible="visible"
    title="Pilih Voucher &amp; Promo"
    description="Gunakan voucher promo untuk mendapatkan potongan harga belanja."
    size="md"
    @closed="handleCancel"
  >
    <div class="space-y-3.5">
      <!-- Tab Navigation -->
      <div class="flex items-center gap-1 border-b border-brand-hair pb-1.5">
        <button
          type="button"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-0',
            activeTab === 'wallet'
              ? 'bg-brand-ink text-brand-onink shadow-whisper'
              : 'text-brand-muted hover:text-brand-ink bg-transparent hover:bg-brand-canvas-soft',
          ]"
          @click="activeTab = 'wallet'"
        >
          <i class="pi pi-wallet text-[11px]" />
          <span>Voucher Saya</span>
          <span
            v-if="walletCoupons.length > 0"
            :class="[
              'rounded-full px-1.5 py-0.2 text-[9.5px]',
              activeTab === 'wallet'
                ? 'bg-brand-onink/20 text-brand-onink'
                : 'bg-brand-hairsoft text-brand-ink',
            ]"
          >
            {{ walletCoupons.length }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-0',
            activeTab === 'public'
              ? 'bg-brand-ink text-brand-onink shadow-whisper'
              : 'text-brand-muted hover:text-brand-ink bg-transparent hover:bg-brand-canvas-soft',
          ]"
          @click="activeTab = 'public'"
        >
          <i class="pi pi-ticket text-[11px]" />
          <span>Promo Tersedia</span>
          <span
            v-if="availableCoupons.length > 0"
            :class="[
              'rounded-full px-1.5 py-0.2 text-[9.5px]',
              activeTab === 'public'
                ? 'bg-brand-onink/20 text-brand-onink'
                : 'bg-brand-hairsoft text-brand-ink',
            ]"
          >
            {{ availableCoupons.length }}
          </span>
        </button>
      </div>

      <!-- Manual Code Input -->
      <div class="space-y-1.5">
        <div class="flex items-start gap-2">
          <div class="flex-1">
            <UiInput
              v-model="manualCode"
              placeholder="Punya kode promo? Masukkan di sini"
              size="sm"
              left-icon="pi-ticket"
              :disabled="isManualValidating"
              :error="manualError"
              @keydown.enter.prevent="handleApplyManual"
            />
          </div>

          <UiButton
            variant="secondary"
            size="sm"
            class="shrink-0 font-semibold"
            :loading="isManualValidating"
            :disabled="!manualCode.trim() || isManualValidating"
            @click="handleApplyManual"
          >
            Terapkan
          </UiButton>
        </div>

        <p
          v-if="manualSuccessMessage"
          class="m-0 text-[11px] font-medium text-brand-success-text flex items-center gap-1.5"
        >
          <i class="pi pi-check-circle text-[10px]" />
          <span>{{ manualSuccessMessage }}</span>
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingCoupons" class="space-y-2">
        <div
          v-for="idx in 3"
          :key="idx"
          class="h-16 rounded-xl border border-brand-hairsoft bg-brand-canvas-soft animate-pulse"
        />
      </div>

      <!-- Error State -->
      <UiAlert v-else-if="couponsError" tone="danger" title="Terjadi Kesalahan">
        <div class="space-y-2">
          <p class="m-0">{{ couponsError }}</p>
          <UiButton variant="outline" size="xs" @click="fetchCoupons"> Coba Lagi </UiButton>
        </div>
      </UiAlert>

      <!-- Empty State -->
      <VoucherSelectEmpty
        v-else-if="currentTabCoupons.length === 0"
        :tab="activeTab"
        :is-logged-in="isLoggedIn"
        @switch-tab="(tab) => (activeTab = tab)"
      />

      <!-- Coupon Lists -->
      <div v-else class="space-y-3.5">
        <!-- Eligible Coupons -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs pt-0.5">
            <div class="flex items-center gap-1.5">
              <h3 class="m-0 text-[11px] font-bold uppercase tracking-wider text-brand-ink">
                Voucher Yang Bisa Digunakan
              </h3>
              <span
                class="rounded bg-brand-canvas-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-muted border border-brand-hairsoft"
              >
                {{ eligibleCoupons.length }}
              </span>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-[11px] text-brand-muted">
                Total Belanja:
                <strong class="font-bold text-brand-ink tabular">{{
                  cartStore.formattedTotalPrice
                }}</strong>
              </span>
              <button
                v-if="selectedCode"
                type="button"
                class="text-[11px] font-semibold text-brand-muted hover:text-brand-danger transition-colors cursor-pointer border-0 bg-transparent p-0"
                @click="selectedCode = ''"
              >
                Lepas
              </button>
            </div>
          </div>

          <div
            v-if="eligibleCoupons.length === 0"
            class="rounded-xl border border-dashed border-brand-hair p-3.5 text-center"
          >
            <p class="m-0 text-xs text-brand-muted">
              Belum ada voucher yang memenuhi nilai belanja saat ini. Tambah barang belanjaan Anda
              untuk menggunakan voucher promo.
            </p>
          </div>

          <div v-else class="space-y-2">
            <VoucherSelectCard
              v-for="coupon in eligibleCoupons"
              :key="coupon.code"
              :coupon="coupon"
              :selected="selectedCode.toUpperCase() === coupon.code.toUpperCase()"
              :is-best-discount="bestDiscountCode.toUpperCase() === coupon.code.toUpperCase()"
              :subtotal-cents="cartStore.totalPriceCents"
              :mode="activeTab"
              :is-claiming="isClaimingCode === coupon.code"
              @select="toggleSelectCoupon"
              @claim-and-apply="handleClaimAndApply"
            />
          </div>
        </div>

        <!-- Ineligible Coupons -->
        <div
          v-if="ineligibleCoupons.length > 0"
          class="space-y-2 pt-2 border-t border-brand-hairsoft"
        >
          <div class="flex items-center gap-1.5 text-xs">
            <h3 class="m-0 text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Belum Memenuhi Syarat
            </h3>
            <span
              class="rounded bg-brand-canvas-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand-muted border border-brand-hairsoft"
            >
              {{ ineligibleCoupons.length }}
            </span>
          </div>

          <div class="space-y-2">
            <VoucherSelectCard
              v-for="coupon in ineligibleCoupons"
              :key="coupon.code"
              :coupon="coupon"
              :selected="false"
              :subtotal-cents="cartStore.totalPriceCents"
              :mode="activeTab"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <VoucherSelectFooter
        :selected-coupon="selectedCoupon"
        :selected-discount-cents="selectedDiscountCents"
        @cancel="handleCancel"
        @confirm="handleConfirm"
      />
    </template>
  </UiModal>
</template>
