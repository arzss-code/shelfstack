import { ref, computed, watch } from 'vue'
import type { AdminCoupon } from '~/components/admin/coupons/AdminCouponTable.vue'
import type { CouponFormPayload } from '~/components/admin/coupons/AdminCouponModal.vue'

const toLocalDateTimeString = (isoString?: string | null): string => {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60000)
  return localDate.toISOString().slice(0, 16)
}

export const useAdminCouponForm = (
  props: { visible: boolean; isEditing: boolean; coupon: AdminCoupon | null },
  emit: (e: 'submit', payload: CouponFormPayload) => void,
) => {
  const form = ref({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    max_discount_rupiah: null as number | null,
    min_purchase_rupiah: 0,
    usage_limit: null as number | null,
    user_limit: 1,
    starts_at: '',
    expires_at: '',
    is_active: true,
    is_loyalty_voucher: false,
    coin_cost: null as number | null,
  })

  const discountValueModel = computed({
    get: () => String(form.value.discount_value ?? ''),
    set: (val: string) => {
      form.value.discount_value = Number(val) || 0
    },
  })

  const maxDiscountModel = computed({
    get: () =>
      form.value.max_discount_rupiah != null ? String(form.value.max_discount_rupiah) : '',
    set: (val: string) => {
      form.value.max_discount_rupiah = val.trim() ? Number(val) : null
    },
  })

  const minPurchaseModel = computed({
    get: () => String(form.value.min_purchase_rupiah ?? 0),
    set: (val: string) => {
      form.value.min_purchase_rupiah = Number(val) || 0
    },
  })

  const usageLimitModel = computed({
    get: () => (form.value.usage_limit != null ? String(form.value.usage_limit) : ''),
    set: (val: string) => {
      form.value.usage_limit = val.trim() ? Number(val) : null
    },
  })

  const userLimitModel = computed({
    get: () => String(form.value.user_limit ?? 1),
    set: (val: string) => {
      form.value.user_limit = Number(val) || 1
    },
  })

  const coinCostModel = computed({
    get: () => (form.value.coin_cost != null ? String(form.value.coin_cost) : ''),
    set: (val: string) => {
      form.value.coin_cost = val.trim() ? Math.max(0, Number(val)) : null
    },
  })

  watch(
    () => props.visible,
    (isOpen) => {
      if (!isOpen) return

      if (props.isEditing && props.coupon) {
        const c = props.coupon
        const discountVal =
          c.discount_type === 'percentage' ? c.discount_value : c.discount_value / 100

        form.value = {
          code: c.code,
          name: c.name,
          description: c.description || '',
          discount_type: c.discount_type,
          discount_value: discountVal,
          max_discount_rupiah: c.max_discount_cents != null ? c.max_discount_cents / 100 : null,
          min_purchase_rupiah: c.min_purchase_cents ? c.min_purchase_cents / 100 : 0,
          usage_limit: c.usage_limit,
          user_limit: c.user_limit || 1,
          starts_at: toLocalDateTimeString(c.starts_at),
          expires_at: toLocalDateTimeString(c.expires_at),
          is_active: c.is_active,
          is_loyalty_voucher: Boolean(c.coin_cost),
          coin_cost: c.coin_cost,
        }
      } else {
        form.value = {
          code: '',
          name: '',
          description: '',
          discount_type: 'percentage',
          discount_value: 10,
          max_discount_rupiah: null,
          min_purchase_rupiah: 0,
          usage_limit: 100,
          user_limit: 1,
          starts_at: '',
          expires_at: '',
          is_active: true,
          is_loyalty_voucher: false,
          coin_cost: null,
        }
      }
    },
  )

  const handleFormSubmit = () => {
    const discountVal =
      form.value.discount_type === 'percentage'
        ? Math.floor(form.value.discount_value)
        : Math.floor(form.value.discount_value * 100)

    const payload: CouponFormPayload = {
      code: form.value.code.trim().toUpperCase(),
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      discount_type: form.value.discount_type,
      discount_value: discountVal,
      max_discount_cents:
        form.value.discount_type === 'percentage' && form.value.max_discount_rupiah != null
          ? Math.floor(form.value.max_discount_rupiah * 100)
          : null,
      min_purchase_cents: Math.floor(form.value.min_purchase_rupiah * 100),
      usage_limit: form.value.usage_limit,
      user_limit: form.value.user_limit || 1,
      starts_at: form.value.starts_at ? new Date(form.value.starts_at).toISOString() : null,
      expires_at: form.value.expires_at ? new Date(form.value.expires_at).toISOString() : null,
      is_active: form.value.is_active,
      coin_cost:
        form.value.is_loyalty_voucher && form.value.coin_cost ? form.value.coin_cost : null,
    }

    emit('submit', payload)
  }

  return {
    form,
    discountValueModel,
    maxDiscountModel,
    minPurchaseModel,
    usageLimitModel,
    userLimitModel,
    coinCostModel,
    handleFormSubmit,
  }
}
