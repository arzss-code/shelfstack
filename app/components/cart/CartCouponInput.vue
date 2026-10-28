<script setup lang="ts">
import { useCartStore } from '~/features/cart/stores/cart'
import type { CouponSummary } from '~~/shared/schemas/coupon'
import { formatRupiah } from '~/utils/format'

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

const couponCodeInput = ref('')
const isValidating = ref(false)
const errorMessage = ref('')

const quickCoupons = [
  { code: 'SHELF10', label: 'Diskon 10%' },
  { code: 'HEMAT50K', label: 'Hemat Rp 50rb' },
  { code: 'SUPERDEAL', label: 'Promo 20%' },
]

const handleApplyCoupon = async (codeToUse?: string) => {
  const code = (codeToUse || couponCodeInput.value).trim().toUpperCase()
  if (!code) {
    errorMessage.value = 'Masukkan kode voucher terlebih dahulu.'
    return
  }

  if (cartStore.totalPriceCents <= 0) {
    errorMessage.value = 'Keranjang belanja masih kosong.'
    return
  }

  isValidating.value = true
  errorMessage.value = ''

  try {
    const res = await $fetch<{ status: string; data: CouponSummary }>('/api/coupons/validate', {
      method: 'POST',
      body: {
        code,
        subtotal_cents: cartStore.totalPriceCents,
      },
    })

    if (res.data) {
      cartStore.applyCoupon({
        code: res.data.code,
        name: res.data.name,
        description: res.data.description,
        discount_type: res.data.discount_type,
        discount_value: res.data.discount_value,
        max_discount_cents: res.data.max_discount_cents,
        min_purchase_cents: res.data.min_purchase_cents,
        discount_cents: res.data.discount_cents,
        formatted_discount: res.data.formatted_discount,
      })

      couponCodeInput.value = ''
      toast.add({
        severity: 'success',
        summary: 'Voucher Diterapkan',
        detail: `Voucher ${res.data.code} berhasil memotong ${res.data.formatted_discount}.`,
        life: 3500,
      })
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string } }
    errorMessage.value =
      fetchErr.data?.message || 'Kode voucher tidak valid atau telah kedaluwarsa.'
  } finally {
    isValidating.value = false
  }
}

const handleRemoveCoupon = () => {
  cartStore.removeCoupon()
  errorMessage.value = ''
  toast.add({
    severity: 'info',
    summary: 'Voucher Dihapus',
    detail: 'Voucher promo telah dilepas dari keranjang belanja.',
    life: 3000,
  })
}

const handleQuickSelect = (code: string) => {
  couponCodeInput.value = code
  handleApplyCoupon(code)
}
</script>

<template>
  <div class="space-y-3">
    <!-- Active Coupon Pill Card -->
    <div
      v-if="cartStore.appliedCoupon"
      class="rounded-xl border border-brand-success-edge bg-brand-success-tint p-3 transition-all"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-success text-white shadow-whisper"
          >
            <i class="pi pi-ticket text-xs" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono text-xs font-bold text-brand-ink uppercase">
                {{ cartStore.appliedCoupon.code }}
              </span>
              <UiBadge variant="success" label="Aktif" class="!text-[9px] !py-0 !px-1.5" />
            </div>
            <p class="m-0 mt-0.5 truncate text-[11px] text-brand-muted">
              {{ cartStore.appliedCoupon.name }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="shrink-0 p-1 text-brand-faint hover:text-brand-danger transition-colors cursor-pointer rounded-full hover:bg-brand-danger-tint border-0 bg-transparent"
          aria-label="Hapus voucher"
          title="Hapus voucher promo"
          @click="handleRemoveCoupon"
        >
          <i class="pi pi-times text-xs" />
        </button>
      </div>

      <div
        class="mt-2.5 flex items-center justify-between border-t border-brand-success-edge/50 pt-2 text-xs"
      >
        <span class="text-brand-muted font-medium">Hemat:</span>
        <span class="font-bold tabular text-brand-success-text">
          -{{ cartStore.formattedDiscountAmount }}
        </span>
      </div>

      <!-- Warning if Subtotal Drops Below Minimum Purchase -->
      <p
        v-if="!cartStore.isCouponValidForCurrentSubtotal"
        class="m-0 mt-2 rounded-lg bg-brand-warning-tint p-2 text-[10.5px] leading-snug text-brand-warning-text border border-brand-warning-edge"
      >
        <i class="pi pi-exclamation-triangle mr-1 text-[10px]" />
        Tambah belanjaan hingga
        {{ formatRupiah(cartStore.appliedCoupon.min_purchase_cents / 100) }} untuk menikmati diskon
        voucher ini.
      </p>
    </div>

    <!-- Coupon Input Form (When no active coupon) -->
    <div v-else class="space-y-2">
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            v-model="couponCodeInput"
            type="text"
            placeholder="Kode promo (cth: SHELF10)"
            class="w-full rounded-xl border border-brand-hair bg-brand-canvas-soft px-3 py-2 text-xs font-mono uppercase tracking-wide text-brand-ink placeholder:normal-case placeholder:font-body placeholder:text-brand-faint focus:border-brand-ink focus:bg-brand-canvas focus:outline-none transition-colors"
            :disabled="isValidating"
            @keydown.enter.prevent="() => handleApplyCoupon()"
          />
        </div>

        <UiButton
          variant="secondary"
          size="sm"
          class="shrink-0 font-semibold"
          :loading="isValidating"
          :disabled="isValidating || !couponCodeInput.trim()"
          @click="() => handleApplyCoupon()"
        >
          Gunakan
        </UiButton>
      </div>

      <!-- Quick Suggestion Pills -->
      <div v-if="!props.compact" class="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span class="text-[10px] text-brand-muted">Voucher:</span>
        <button
          v-for="qc in quickCoupons"
          :key="qc.code"
          type="button"
          class="rounded-full border border-dashed border-brand-hair bg-brand-canvas px-2 py-0.5 text-[10px] font-mono font-medium text-brand-ink hover:border-brand-ink hover:bg-brand-field transition-colors cursor-pointer"
          @click="handleQuickSelect(qc.code)"
        >
          {{ qc.code }}
        </button>
      </div>

      <!-- Error Message -->
      <p
        v-if="errorMessage"
        class="m-0 text-[11px] font-medium text-brand-danger flex items-center gap-1"
      >
        <i class="pi pi-times-circle text-[10px]" />
        <span>{{ errorMessage }}</span>
      </p>
    </div>
  </div>
</template>
