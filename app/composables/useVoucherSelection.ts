import { computed, ref } from 'vue'
import { useCartStore, type AppliedCoupon } from '~/features/cart/stores/cart'
import type { CouponSummary } from '~~/shared/schemas/coupon'
import {
  calculateCouponDiscountCents,
  isCouponEligible,
  findBestCoupon,
} from '~~/shared/utils/coupon-math'
import { formatRupiah } from '~/utils/format'
import { useUiToast } from '~/composables/useUiToast'
import { useAuth } from '~/features/auth/composables/useAuth'
import { useUserVouchers } from '~/composables/useUserVouchers'

export interface AvailableCoupon {
  id: string
  coupon_id?: string
  code: string
  name: string
  description?: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  formatted_discount: string
  max_discount_cents?: number | null
  formatted_max_discount?: string | null
  min_purchase_cents: number
  formatted_min_purchase: string
  usage_limit?: number | null
  usage_count?: number
  remaining_quota?: number | null
  user_limit?: number | null
  starts_at?: string | null
  expires_at?: string | null
  is_expired: boolean
  is_available?: boolean
  status?: string
}

export function useVoucherSelection(
  options: {
    onApplied?: (coupon: AppliedCoupon) => void
    onRemoved?: () => void
    onClose?: () => void
    context?: 'cart' | 'checkout'
  } = {},
) {
  const cartStore = useCartStore()
  const toast = useUiToast()
  const auth = useAuth()
  const userVouchers = useUserVouchers()
  const isCheckoutContext = options.context === 'checkout'

  const activeTab = ref<'wallet' | 'public'>('public')
  const availableCoupons = ref<AvailableCoupon[]>([])
  const manualCoupons = ref<AvailableCoupon[]>([])
  const isLoadingCoupons = ref(false)
  const couponsError = ref('')
  const isClaimingCode = ref<string | null>(null)

  const manualCode = ref('')
  const isManualValidating = ref(false)
  const manualError = ref('')
  const manualSuccessMessage = ref('')

  const selectedCode = ref<string>(cartStore.appliedCoupon?.code || '')

  const walletCoupons = computed<AvailableCoupon[]>(() => {
    return (userVouchers.claimedVouchers.value || []).map((v) => ({
      ...v,
      is_available: v.status === 'claimed' && !v.is_expired,
    }))
  })

  const calculateDiscountCents = (
    coupon: AvailableCoupon | CouponSummary | null,
    subtotalCents: number,
  ): number => {
    return calculateCouponDiscountCents(coupon, subtotalCents)
  }

  const fetchCoupons = async () => {
    isLoadingCoupons.value = true
    couponsError.value = ''
    try {
      const res = await $fetch<{ status: string; data: AvailableCoupon[] }>('/api/coupons')
      availableCoupons.value = res.data || []
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      couponsError.value =
        fetchErr.data?.message || 'Gagal memuat daftar kupon promosi. Silakan coba kembali.'
    } finally {
      isLoadingCoupons.value = false
    }
  }

  const isEligible = (coupon: AvailableCoupon): boolean => {
    return isCouponEligible(coupon, cartStore.totalPriceCents)
  }

  const dedupe = (list: AvailableCoupon[]) =>
    Array.from(new Map(list.map((c) => [c.code.toUpperCase(), c])).values())
  const allCoupons = computed(() =>
    dedupe([...manualCoupons.value, ...walletCoupons.value, ...availableCoupons.value]),
  )
  const currentTabCoupons = computed(() => {
    const source = activeTab.value === 'wallet' ? walletCoupons.value : availableCoupons.value
    return dedupe([...manualCoupons.value, ...source])
  })

  const eligibleCoupons = computed(() => currentTabCoupons.value.filter((c) => isEligible(c)))
  const ineligibleCoupons = computed(() => currentTabCoupons.value.filter((c) => !isEligible(c)))
  const allEligibleCoupons = computed(() => allCoupons.value.filter((c) => isEligible(c)))
  const bestEligibleCoupon = computed(() =>
    findBestCoupon(allEligibleCoupons.value, cartStore.totalPriceCents),
  )
  const bestSavingsCents = computed(() =>
    bestEligibleCoupon.value
      ? calculateDiscountCents(bestEligibleCoupon.value, cartStore.totalPriceCents)
      : 0,
  )

  const bestDiscountCode = computed(() => {
    return findBestCoupon(eligibleCoupons.value, cartStore.totalPriceCents)?.code || ''
  })

  const selectedCoupon = computed(() => {
    if (!selectedCode.value) return null
    return (
      allCoupons.value.find((c) => c.code.toUpperCase() === selectedCode.value.toUpperCase()) ||
      null
    )
  })

  const selectedDiscountCents = computed(() => {
    if (!selectedCoupon.value) return 0
    return calculateDiscountCents(selectedCoupon.value, cartStore.totalPriceCents)
  })

  const toggleSelectCoupon = (coupon: AvailableCoupon) => {
    if (!isEligible(coupon)) return
    if (selectedCode.value.toUpperCase() === coupon.code.toUpperCase()) {
      selectedCode.value = ''
    } else {
      selectedCode.value = coupon.code
      manualError.value = ''
      manualSuccessMessage.value = ''
    }
  }

  const handleConfirm = () => {
    if (selectedCode.value && selectedCoupon.value) {
      const chosen = selectedCoupon.value
      const discountCents = calculateDiscountCents(chosen, cartStore.totalPriceCents)
      const applied: AppliedCoupon = {
        code: chosen.code,
        name: chosen.name,
        description: chosen.description,
        discount_type: chosen.discount_type,
        discount_value: chosen.discount_value,
        max_discount_cents: chosen.max_discount_cents,
        min_purchase_cents: chosen.min_purchase_cents,
        discount_cents: discountCents,
        formatted_discount: formatRupiah(discountCents / 100),
      }
      cartStore.applyCoupon(applied)
      toast.add({
        severity: 'success',
        summary: 'Voucher Diterapkan',
        detail: `Voucher ${chosen.code} berhasil memotong ${formatRupiah(discountCents / 100)}.`,
        life: 3500,
      })
      options.onApplied?.(applied)
    } else if (cartStore.appliedCoupon) {
      cartStore.removeCoupon()
      toast.add({
        severity: 'info',
        summary: 'Voucher Dihapus',
        detail: isCheckoutContext
          ? 'Voucher promo telah dilepas dari pesanan checkout.'
          : 'Voucher promo telah dilepas dari keranjang belanja.',
        life: 3000,
      })
      options.onRemoved?.()
    }
    options.onClose?.()
  }

  const handleClaimAndApply = async (coupon: AvailableCoupon) => {
    if (auth.isLoggedIn.value && (coupon.coupon_id || coupon.id)) {
      isClaimingCode.value = coupon.code
      await userVouchers.claimVoucher(coupon.coupon_id || coupon.id)
      isClaimingCode.value = null
    }
    selectedCode.value = coupon.code
    handleConfirm()
  }

  const handleApplyManual = async () => {
    const code = manualCode.value.trim().toUpperCase()
    if (!code) {
      manualError.value = 'Masukkan kode voucher terlebih dahulu.'
      return
    }

    isManualValidating.value = true
    manualError.value = ''
    manualSuccessMessage.value = ''

    try {
      const res = await $fetch<{ status: string; data: CouponSummary }>('/api/coupons/validate', {
        method: 'POST',
        body: {
          code,
          subtotal_cents: cartStore.totalPriceCents,
        },
      })

      if (res.data) {
        const s = res.data
        const couponObj: AvailableCoupon = {
          id: s.code,
          code: s.code,
          name: s.name,
          description: s.description,
          discount_type: s.discount_type,
          discount_value: s.discount_value,
          formatted_discount: s.formatted_discount,
          max_discount_cents: s.max_discount_cents,
          formatted_max_discount:
            s.max_discount_cents != null ? formatRupiah(s.max_discount_cents / 100) : null,
          min_purchase_cents: s.min_purchase_cents,
          formatted_min_purchase:
            s.min_purchase_cents > 0 ? formatRupiah(s.min_purchase_cents / 100) : 'Tanpa Minimum',
          is_expired: false,
          is_available: true,
        }

        if (!manualCoupons.value.some((c) => c.code.toUpperCase() === code)) {
          manualCoupons.value.unshift(couponObj)
        }

        selectedCode.value = couponObj.code
        manualCode.value = ''
        manualSuccessMessage.value = `Voucher ${couponObj.code} berhasil diverifikasi dan dipilih.`
      }
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      manualError.value =
        fetchErr.data?.message || 'Kode voucher tidak valid atau tidak memenuhi syarat belanja.'
    } finally {
      isManualValidating.value = false
    }
  }

  const handleCancel = () => {
    selectedCode.value = cartStore.appliedCoupon?.code || ''
    manualError.value = ''
    manualSuccessMessage.value = ''
    options.onClose?.()
  }

  const initModal = () => {
    selectedCode.value = cartStore.appliedCoupon?.code || ''
    manualError.value = ''
    manualSuccessMessage.value = ''
    fetchCoupons()
    if (auth.isLoggedIn.value) {
      userVouchers.fetchVouchers().then(() => {
        if (walletCoupons.value.length > 0) activeTab.value = 'wallet'
      })
    }
  }

  const applyBestCoupon = (targetCoupon?: AvailableCoupon) => {
    const chosen = targetCoupon || bestEligibleCoupon.value
    if (!chosen) return false
    selectedCode.value = chosen.code
    handleConfirm()
    return true
  }

  return {
    activeTab,
    availableCoupons,
    manualCoupons,
    walletCoupons,
    currentTabCoupons,
    eligibleCoupons,
    ineligibleCoupons,
    allEligibleCoupons,
    bestEligibleCoupon,
    bestSavingsCents,
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
    isLoggedIn: computed(() => auth.isLoggedIn.value),
    fetchCoupons,
    initModal,
    toggleSelectCoupon,
    handleClaimAndApply,
    handleApplyManual,
    handleConfirm,
    handleCancel,
    applyBestCoupon,
  }
}
