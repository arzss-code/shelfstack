<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCartStore } from '~/features/cart/stores/cart'
import { formatRupiah } from '~/utils/format'
import { useUiToast } from '~/composables/useUiToast'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useUserVouchers } from '~/composables/useUserVouchers'
import VoucherSelectModal from './VoucherSelectModal.vue'

const props = withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const cartStore = useCartStore()
const toast = useUiToast()
const auth = useAuth()
const userVouchers = useUserVouchers()

const isModalOpen = ref(false)

const walletVoucherCount = computed(() => {
  return auth.isLoggedIn.value ? userVouchers.activeCount.value : 0
})

const handleOpenModal = () => {
  isModalOpen.value = true
}

const handleRemoveCoupon = () => {
  cartStore.removeCoupon()
  toast.add({
    severity: 'info',
    summary: 'Voucher Dihapus',
    detail: 'Voucher promo telah dilepas dari keranjang belanja.',
    life: 3000,
  })
}

const couponExtraInfo = computed(() => {
  if (!cartStore.appliedCoupon) return ''
  const name = (cartStore.appliedCoupon.name || '').trim()
  const discountStr = cartStore.formattedDiscountAmount.replace(/\s+/g, '').toLowerCase()
  const normName = name.replace(/\s+/g, '').toLowerCase()

  if (
    normName === `hemat${discountStr}` ||
    normName === `diskon${discountStr}` ||
    normName === `potongan${discountStr}` ||
    normName === cartStore.appliedCoupon.code.toLowerCase()
  ) {
    return ''
  }
  return name
})
</script>

<template>
  <div class="space-y-2.5">
    <!-- Active Coupon Pill Card (When voucher is applied) -->
    <div
      v-if="cartStore.appliedCoupon"
      class="rounded-xl border border-brand-success-edge bg-brand-success-tint/70 p-3 transition-all"
    >
      <div class="flex items-center justify-between gap-2.5">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-success text-white shadow-whisper"
          >
            <i class="pi pi-ticket text-xs" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono text-xs font-bold text-brand-ink uppercase tracking-wider">
                {{ cartStore.appliedCoupon.code }}
              </span>
              <span
                class="inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] font-bold text-brand-success-text bg-brand-success/15 tabular"
              >
                -{{ cartStore.formattedDiscountAmount }}
              </span>
            </div>
            <p v-if="couponExtraInfo" class="m-0 mt-0.5 truncate text-[10.5px] text-brand-muted">
              {{ couponExtraInfo }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <!-- Button Ubah Voucher (Shopee / Tokopedia style) -->
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-ink hover:bg-brand-canvas transition-colors border border-transparent hover:border-brand-hair cursor-pointer"
            aria-label="Ubah voucher promo"
            @click="handleOpenModal"
          >
            <span>Ubah</span>
            <i class="pi pi-chevron-right text-[10px]" />
          </button>

          <!-- Quick Delete Button -->
          <UiTooltip text="Hapus voucher promo" position="left">
            <button
              type="button"
              class="shrink-0 p-1.5 text-brand-faint hover:text-brand-danger hover:bg-brand-danger-tint transition-colors cursor-pointer rounded-lg border-0 bg-transparent flex items-center justify-center"
              aria-label="Hapus voucher promo"
              @click="handleRemoveCoupon"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </UiTooltip>
        </div>
      </div>

      <!-- Warning if Subtotal Drops Below Minimum Purchase -->
      <p
        v-if="!cartStore.isCouponValidForCurrentSubtotal"
        class="m-0 mt-2.5 rounded-lg bg-brand-warning-tint p-2 text-[10.5px] leading-snug text-brand-warning-text border border-brand-warning-edge"
      >
        <i class="pi pi-exclamation-triangle mr-1 text-[10px]" />
        Tambah belanjaan hingga
        {{ formatRupiah(cartStore.appliedCoupon.min_purchase_cents / 100) }} untuk menikmati diskon
        voucher ini.
      </p>
    </div>

    <!-- Trigger Button (When no voucher is applied, Tokopedia / Shopee style) -->
    <button
      v-else
      type="button"
      :class="[
        'group flex w-full items-center justify-between rounded-xl border border-brand-hair bg-brand-canvas text-left transition-all hover:border-brand-ink hover:shadow-whisper cursor-pointer',
        props.compact ? 'p-2.5' : 'p-3',
      ]"
      @click="handleOpenModal"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-accent-tint text-brand-accent group-hover:bg-brand-ink group-hover:text-brand-onink transition-colors"
        >
          <i class="pi pi-ticket text-xs" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <p class="m-0 text-xs font-semibold text-brand-ink">Gunakan / Masukkan Voucher</p>
            <span
              v-if="walletVoucherCount > 0"
              class="rounded-full bg-brand-accent/15 px-1.5 py-0.2 text-[9.5px] font-bold text-brand-accent border border-brand-accent/30"
            >
              {{ walletVoucherCount }} tersedia
            </span>
          </div>
          <p v-if="!props.compact" class="m-0 mt-0.5 truncate text-[11px] text-brand-muted">
            Pilih atau masukkan kode voucher promo hemat
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1 text-xs font-semibold text-brand-ink shrink-0 ml-2">
        <span
          v-if="!props.compact"
          class="text-[11px] text-brand-muted group-hover:text-brand-ink transition-colors"
        >
          Pilih
        </span>
        <i
          class="pi pi-chevron-right text-[11px] text-brand-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-ink"
        />
      </div>
    </button>

    <!-- Dialog Modal Voucher Picker -->
    <VoucherSelectModal v-model:visible="isModalOpen" />
  </div>
</template>
