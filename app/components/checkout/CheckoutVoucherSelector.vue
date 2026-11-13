<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useCartStore, type AppliedCoupon } from '~/features/cart/stores/cart'
import { formatRupiah } from '~/utils/format'
import { useUiToast } from '~/composables/useUiToast'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useUserVouchers } from '~/composables/useUserVouchers'
import { useVoucherSelection, type AvailableCoupon } from '~/composables/useVoucherSelection'
import VoucherSelectModal from '~/components/cart/VoucherSelectModal.vue'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    disabled?: boolean
  }>(),
  {
    compact: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  applied: [coupon: AppliedCoupon]
  removed: []
}>()

const cartStore = useCartStore()
const toast = useUiToast()
const auth = useAuth()
const userVouchers = useUserVouchers()

const isModalOpen = ref(false)

const { allEligibleCoupons, bestEligibleCoupon, bestSavingsCents, applyBestCoupon, fetchCoupons } =
  useVoucherSelection({
    context: 'checkout',
    onApplied: (c) => emit('applied', c),
    onRemoved: () => emit('removed'),
  })

onMounted(() => {
  fetchCoupons()
  if (auth.isLoggedIn.value) {
    userVouchers.fetchVouchers().catch(() => {})
  }
})

const walletVoucherCount = computed(() => {
  return auth.isLoggedIn.value ? userVouchers.activeCount.value : 0
})

const totalAvailableCount = computed(() => {
  return allEligibleCoupons.value.length
})

const formattedBestSavings = computed(() => {
  return formatRupiah(bestSavingsCents.value / 100)
})

const shortfallCents = computed(() => {
  if (!cartStore.appliedCoupon) return 0
  return Math.max(0, cartStore.appliedCoupon.min_purchase_cents - cartStore.totalPriceCents)
})

const handleOpenModal = () => {
  if (props.disabled) return
  isModalOpen.value = true
}

const handleRemoveCoupon = () => {
  if (props.disabled) return
  cartStore.removeCoupon()
  toast.add({
    severity: 'info',
    summary: 'Voucher Dihapus',
    detail: 'Voucher promo telah dilepas dari pesanan checkout.',
    life: 3000,
  })
  emit('removed')
}

const handleApplyBest = () => {
  if (props.disabled || !bestEligibleCoupon.value) return
  const success = applyBestCoupon()
  if (success && bestEligibleCoupon.value) {
    toast.add({
      severity: 'success',
      summary: 'Voucher Otomatis Diterapkan',
      detail: `Voucher ${bestEligibleCoupon.value.code} hemat ${formattedBestSavings.value} berhasil dipasang.`,
      life: 3500,
    })
  }
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
    <!-- State 1: Active Coupon Applied -->
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
          <button
            type="button"
            class="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-ink hover:bg-brand-canvas transition-colors border border-transparent hover:border-brand-hair cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="props.disabled"
            aria-label="Ubah voucher promo checkout"
            @click="handleOpenModal"
          >
            <span>Ubah</span>
            <i class="pi pi-chevron-right text-[10px]" />
          </button>

          <UiTooltip text="Hapus voucher promo" position="left">
            <button
              type="button"
              class="shrink-0 p-1.5 text-brand-faint hover:text-brand-danger hover:bg-brand-danger-tint transition-colors cursor-pointer rounded-lg border-0 bg-transparent flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="props.disabled"
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
        Tambah belanjaan hingga {{ formatRupiah(shortfallCents / 100) }} untuk menikmati diskon
        voucher ini.
      </p>
    </div>

    <!-- State 2: Auto-Discount Best Recommendation (When not applied yet, but best discount available) -->
    <div
      v-else-if="bestEligibleCoupon && bestSavingsCents > 0"
      class="rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/25 p-3 transition-all"
    >
      <div class="flex items-center justify-between gap-2.5">
        <div class="flex items-center gap-2.5 min-w-0">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-whisper"
          >
            <i class="pi pi-bolt text-xs" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span
                class="rounded bg-amber-100 px-1.5 py-0.2 text-[9.5px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
              >
                Diskon Terbaik
              </span>
              <span class="font-mono text-xs font-bold text-brand-ink uppercase tracking-wider">
                {{ bestEligibleCoupon.code }}
              </span>
            </div>
            <p
              class="m-0 mt-0.5 truncate text-[11px] font-medium text-amber-900 dark:text-amber-200"
            >
              Hemat {{ formattedBestSavings }} untuk pesanan ini
            </p>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            class="rounded-lg bg-brand-ink px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-ink/90 transition-colors shadow-whisper cursor-pointer border-0 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="props.disabled"
            @click="handleApplyBest"
          >
            Pakai
          </button>
          <button
            type="button"
            class="p-1 text-xs font-medium text-brand-muted hover:text-brand-ink transition-colors cursor-pointer border-0 bg-transparent"
            :disabled="props.disabled"
            aria-label="Pilih voucher lainnya"
            @click="handleOpenModal"
          >
            <i class="pi pi-chevron-right text-[11px]" />
          </button>
        </div>
      </div>
    </div>

    <!-- State 3: Default Trigger Button (No voucher applied & no active recommendation) -->
    <button
      v-else
      type="button"
      :class="[
        'group flex w-full items-center justify-between rounded-xl border border-brand-hair bg-brand-canvas text-left transition-all hover:border-brand-ink hover:shadow-whisper cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        props.compact ? 'p-2.5' : 'p-3',
      ]"
      :disabled="props.disabled"
      @click="handleOpenModal"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-accent-tint text-brand-accent group-hover:bg-brand-ink group-hover:text-white transition-colors"
        >
          <i class="pi pi-ticket text-xs" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <p class="m-0 text-xs font-semibold text-brand-ink">Gunakan / Masukkan Voucher</p>
            <span
              v-if="walletVoucherCount > 0 || totalAvailableCount > 0"
              class="rounded-full bg-brand-accent/15 px-1.5 py-0.2 text-[9.5px] font-bold text-brand-accent border border-brand-accent/30"
            >
              {{
                walletVoucherCount > 0
                  ? `${walletVoucherCount} di dompet`
                  : `${totalAvailableCount} tersedia`
              }}
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
    <VoucherSelectModal
      v-model:visible="isModalOpen"
      @applied="(c) => emit('applied', c)"
      @removed="() => emit('removed')"
    />
  </div>
</template>
