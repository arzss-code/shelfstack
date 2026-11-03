import { computed, ref } from 'vue'
import { useCartStore, type AppliedCoupon } from '~/features/cart/stores/cart'
import type { CouponSummary } from '~~/shared/schemas/coupon'
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

export function useVoucherSelection(options: {
  onApplied?: (coupon: AppliedCoupon) => void
  onRemoved?: () => void
  onClose?: () => void
}) {
  const cartStore = useCartStore()
  const toast = useUiToast()
  const auth = useAuth()
  const userVouchers = useUserVouchers()

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
      id: v.id,
      coupon_id: v.coupon_id,
      code: v.code,
      name: v.name,
      description: v.description,
      discount_type: v.discount_type,
      discount_value: v.discount_value,
      formatted_discount: v.formatted_discount,
      max_discount_cents: v.max_discount_cents,
      formatted_max_discount: v.formatted_max_discount,
      min_purchase_cents: v.min_purchase_cents,
      formatted_min_purchase: v.formatted_min_purchase,
      starts_at: v.starts_at,
      expires_at: v.expires_at,
      is_expired: v.is_expired,
      is_available: v.status === 'claimed' && !v.is_expired,
      status: v.status,
    }))
  })

  const calculateDiscountCents = (
    coupon: AvailableCoupon | CouponSummary | null,
    subtotalCents: number,
  ): number => {
    if (!coupon || subtotalCents <= 0) return 0
    if (coupon.min_purchase_cents > 0 && subtotalCents < coupon.min_purchase_cents) {
      return 0
    }
    if (coupon.discount_type === 'percentage') {
      let d = Math.floor((subtotalCents * coupon.discount_value) / 100)
      if (coupon.max_discount_cents != null && d > coupon.max_discount_cents) {
        d = coupon.max_discount_cents
      }
      return Math.min(d, subtotalCents)
    }
    return Math.min(coupon.discount_value, subtotalCents)
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
    if (coupon.is_expired || coupon.is_available === false) return false
    return cartStore.totalPriceCents >= coupon.min_purchase_cents
  }

  const allCoupons = computed(() => {
    const combined = [...manualCoupons.value, ...walletCoupons.value, ...availableCoupons.value]
    const map = new Map<string, AvailableCoupon>()
    for (const c of combined) {
      map.set(c.code.toUpperCase(), c)
    }
    return Array.from(map.values())
  })

  const currentTabCoupons = computed(() => {
    const source = activeTab.value === 'wallet' ? walletCoupons.value : availableCoupons.value
    const combined = [...manualCoupons.value, ...source]
    const map = new Map<string, AvailableCoupon>()
    for (const c of combined) {
      map.set(c.code.toUpperCase(), c)
    }
    return Array.from(map.values())
  })

  const eligibleCoupons = computed(() => currentTabCoupons.value.filter((c) => isEligible(c)))
  const ineligibleCoupons = computed(() => currentTabCoupons.value.filter((c) => !isEligible(c)))

  const bestDiscountCode = computed(() => {
    let maxDiscount = 0
    let bestCode = ''
    for (const c of eligibleCoupons.value) {
      const d = calculateDiscountCents(c, cartStore.totalPriceCents)
      if (d > maxDiscount) {
        maxDiscount = d
        bestCode = c.code
      }
    }
    return bestCode
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
    } else {
      if (cartStore.appliedCoupon) {
        cartStore.removeCoupon()
        toast.add({
          severity: 'info',
          summary: 'Voucher Dihapus',
          detail: 'Voucher promo telah dilepas dari keranjang belanja.',
          life: 3000,
        })
        options.onRemoved?.()
      }
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
        const summary = res.data
        const couponObj: AvailableCoupon = {
          id: summary.code,
          code: summary.code,
          name: summary.name,
          description: summary.description,
          discount_type: summary.discount_type,
          discount_value: summary.discount_value,
          formatted_discount: summary.formatted_discount,
          max_discount_cents: summary.max_discount_cents,
          formatted_max_discount:
            summary.max_discount_cents != null
              ? formatRupiah(summary.max_discount_cents / 100)
              : null,
          min_purchase_cents: summary.min_purchase_cents,
          formatted_min_purchase:
            summary.min_purchase_cents > 0
              ? formatRupiah(summary.min_purchase_cents / 100)
              : 'Tanpa Minimum',
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
        if (walletCoupons.value.length > 0) {
          activeTab.value = 'wallet'
        }
      })
    }
  }

  return {
    activeTab,
    availableCoupons,
    manualCoupons,
    walletCoupons,
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
    isLoggedIn: computed(() => auth.isLoggedIn.value),
    fetchCoupons,
    initModal,
    toggleSelectCoupon,
    handleClaimAndApply,
    handleApplyManual,
    handleConfirm,
    handleCancel,
  }
}
