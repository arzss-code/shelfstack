<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCartStore, type AppliedCoupon } from '~/features/cart/stores/cart'
import type { CouponSummary } from '~~/shared/schemas/coupon'
import { formatRupiah } from '~/utils/format'
import { useUiToast } from '~/composables/useUiToast'

export interface AvailableCoupon {
  id: string
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
  usage_count: number
  remaining_quota?: number | null
  user_limit?: number | null
  starts_at?: string | null
  expires_at?: string | null
  is_expired: boolean
  is_available: boolean
}

const visible = defineModel<boolean>('visible', { default: false })

const emit = defineEmits<{
  applied: [coupon: AppliedCoupon]
  removed: []
}>()

const cartStore = useCartStore()
const toast = useUiToast()

const availableCoupons = ref<AvailableCoupon[]>([])
const manualCoupons = ref<AvailableCoupon[]>([])
const isLoadingCoupons = ref(false)
const couponsError = ref('')

const manualCode = ref('')
const isManualValidating = ref(false)
const manualError = ref('')
const manualSuccessMessage = ref('')

const selectedCode = ref<string>(cartStore.appliedCoupon?.code || '')

const formatExpiryDate = (isoString?: string | null): string => {
  if (!isoString) return 'Tanpa batas waktu'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return 'Tanpa batas waktu'
    const day = date.getDate()
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return 'Tanpa batas waktu'
  }
}

const formatDiscountBadge = (coupon: AvailableCoupon): string => {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}%`
  }
  const val = coupon.discount_value / 100
  if (val >= 1000) {
    return `${Math.round(val / 1000)}rb`
  }
  return formatRupiah(val)
}

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
  if (coupon.is_expired || !coupon.is_available) return false
  return cartStore.totalPriceCents >= coupon.min_purchase_cents
}

const getDeficit = (coupon: AvailableCoupon): number => {
  return Math.max(0, coupon.min_purchase_cents - cartStore.totalPriceCents)
}

const allCoupons = computed(() => {
  const combined = [...manualCoupons.value, ...availableCoupons.value]
  const map = new Map<string, AvailableCoupon>()
  for (const c of combined) {
    const key = c.code.toUpperCase()
    if (!map.has(key)) {
      map.set(key, c)
    }
  }
  return Array.from(map.values())
})

const eligibleCoupons = computed(() => allCoupons.value.filter((c) => isEligible(c)))
const ineligibleCoupons = computed(() => allCoupons.value.filter((c) => !isEligible(c)))

const selectedCoupon = computed(() => {
  if (!selectedCode.value) return null
  return (
    allCoupons.value.find((c) => c.code.toUpperCase() === selectedCode.value.toUpperCase()) || null
  )
})

const selectedDiscountCents = computed(() => {
  if (!selectedCoupon.value) return 0
  return calculateDiscountCents(selectedCoupon.value, cartStore.totalPriceCents)
})

const isSelected = (code: string): boolean => {
  return selectedCode.value.toUpperCase() === code.toUpperCase()
}

const toggleSelectCoupon = (coupon: AvailableCoupon) => {
  if (!isEligible(coupon)) return

  if (isSelected(coupon.code)) {
    selectedCode.value = ''
  } else {
    selectedCode.value = coupon.code
    manualError.value = ''
    manualSuccessMessage.value = ''
  }
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
        usage_limit: null,
        usage_count: 0,
        remaining_quota: null,
        user_limit: null,
        starts_at: null,
        expires_at: null,
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
    emit('applied', applied)
  } else {
    if (cartStore.appliedCoupon) {
      cartStore.removeCoupon()
      toast.add({
        severity: 'info',
        summary: 'Voucher Dihapus',
        detail: 'Voucher promo telah dilepas dari keranjang belanja.',
        life: 3000,
      })
      emit('removed')
    }
  }

  visible.value = false
}

const handleCancel = () => {
  selectedCode.value = cartStore.appliedCoupon?.code || ''
  manualError.value = ''
  manualSuccessMessage.value = ''
  visible.value = false
}

watch(
  visible,
  (isOpen) => {
    if (isOpen) {
      selectedCode.value = cartStore.appliedCoupon?.code || ''
      manualError.value = ''
      manualSuccessMessage.value = ''
      fetchCoupons()
    }
  },
  { immediate: true },
)
</script>

<template>
  <UiModal
    v-model:visible="visible"
    title="Pilih Voucher & Promo"
    description="Gunakan voucher promo untuk mendapatkan potongan harga belanja."
    size="md"
    @closed="handleCancel"
  >
    <div class="space-y-3.5">
      <!-- Sleek Manual Code Input (Shopee / Tokopedia style) -->
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

      <!-- Loading Skeletons -->
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
      <UiEmptyState
        v-else-if="allCoupons.length === 0"
        icon="pi-ticket"
        title="Belum Ada Voucher Tersedia"
        description="Saat ini belum ada voucher promo yang aktif. Nantikan penawaran menarik berikutnya."
      />

      <!-- Coupon Lists -->
      <div v-else class="space-y-3.5">
        <!-- Section 1: Eligible Coupons -->
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
            <div
              v-for="coupon in eligibleCoupons"
              :key="coupon.code"
              role="button"
              tabindex="0"
              :aria-pressed="isSelected(coupon.code)"
              :class="[
                'group relative flex items-stretch rounded-xl border transition-all text-left overflow-hidden cursor-pointer select-none',
                isSelected(coupon.code)
                  ? 'border-brand-ink ring-2 ring-brand-ink/10 bg-brand-canvas shadow-whisper'
                  : 'border-brand-hair bg-brand-canvas hover:border-brand-ink/60 hover:shadow-whisper',
              ]"
              @click="toggleSelectCoupon(coupon)"
              @keydown.enter.prevent="toggleSelectCoupon(coupon)"
              @keydown.space.prevent="toggleSelectCoupon(coupon)"
            >
              <!-- Ticket Left Stub -->
              <div
                :class="[
                  'w-20 sm:w-24 p-2 sm:p-2.5 flex flex-col items-center justify-center text-center shrink-0 border-r border-dashed transition-colors',
                  isSelected(coupon.code)
                    ? 'bg-brand-ink text-white border-brand-ink'
                    : 'bg-brand-canvas-soft text-brand-ink border-brand-hair group-hover:bg-brand-field',
                ]"
              >
                <span
                  class="font-display font-extrabold text-xs sm:text-sm tracking-tight leading-none"
                >
                  {{ formatDiscountBadge(coupon) }}
                </span>
                <span
                  :class="[
                    'text-[9px] uppercase font-bold tracking-wider mt-1 px-1.5 py-0.5 rounded',
                    isSelected(coupon.code)
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-hair text-brand-muted',
                  ]"
                >
                  {{ coupon.discount_type === 'percentage' ? 'Diskon' : 'Potongan' }}
                </span>
              </div>

              <!-- Ticket Body -->
              <div class="flex-1 p-2.5 px-3 flex flex-col justify-center gap-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span
                      class="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-ink bg-brand-canvas-soft px-1.5 py-0.5 rounded border border-brand-hairsoft shrink-0"
                    >
                      {{ coupon.code }}
                    </span>
                    <span class="font-semibold text-xs text-brand-ink truncate">
                      {{ coupon.name }}
                    </span>
                  </div>

                  <!-- Radio Selector -->
                  <div class="shrink-0">
                    <div
                      :class="[
                        'flex h-4 w-4 items-center justify-center rounded-full border transition-all',
                        isSelected(coupon.code)
                          ? 'border-brand-ink bg-brand-ink text-white'
                          : 'border-brand-hair bg-brand-canvas group-hover:border-brand-ink',
                      ]"
                    >
                      <i v-if="isSelected(coupon.code)" class="pi pi-check text-[8px]" />
                    </div>
                  </div>
                </div>

                <!-- Terms Meta Badges -->
                <div class="flex items-center gap-1.5 text-[10.5px] text-brand-muted truncate">
                  <span>Min. {{ coupon.formatted_min_purchase }}</span>
                  <span v-if="coupon.formatted_max_discount"
                    >· Maks. {{ coupon.formatted_max_discount }}</span
                  >
                  <span>· s.d. {{ formatExpiryDate(coupon.expires_at) }}</span>
                  <span v-if="coupon.remaining_quota != null" class="text-brand-accent font-medium">
                    · Sisa {{ coupon.remaining_quota }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2: Ineligible Coupons -->
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
            <div
              v-for="coupon in ineligibleCoupons"
              :key="coupon.code"
              class="relative flex items-stretch rounded-xl border border-brand-hair/60 bg-brand-canvas-soft/50 text-left overflow-hidden opacity-75 cursor-not-allowed select-none"
            >
              <!-- Ticket Left Stub (Muted) -->
              <div
                class="w-20 sm:w-24 bg-brand-field text-brand-muted border-r border-dashed border-brand-hair/60 p-2 sm:p-2.5 flex flex-col items-center justify-center text-center shrink-0"
              >
                <span
                  class="font-display font-extrabold text-xs sm:text-sm tracking-tight leading-none"
                >
                  {{ formatDiscountBadge(coupon) }}
                </span>
                <span
                  class="text-[9px] uppercase font-bold tracking-wider mt-1 px-1.5 py-0.5 rounded bg-brand-hairsoft text-brand-muted"
                >
                  {{ coupon.discount_type === 'percentage' ? 'Diskon' : 'Potongan' }}
                </span>
              </div>

              <!-- Ticket Body -->
              <div class="flex-1 p-2.5 px-3 flex flex-col justify-center gap-1.5 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span
                      class="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted bg-brand-field px-1.5 py-0.5 rounded border border-brand-hairsoft shrink-0"
                    >
                      {{ coupon.code }}
                    </span>
                    <span class="font-semibold text-xs text-brand-muted truncate">
                      {{ coupon.name }}
                    </span>
                  </div>

                  <div class="shrink-0">
                    <div
                      class="flex h-4 w-4 items-center justify-center rounded-full border border-brand-hair/60 bg-brand-field text-transparent"
                    />
                  </div>
                </div>

                <!-- Reason for Ineligibility Warning Banner -->
                <div
                  v-if="getDeficit(coupon) > 0"
                  class="flex items-center gap-1.5 rounded-md border border-brand-warning-edge bg-brand-warning-tint px-2 py-1 text-[10.5px] font-medium text-brand-warning-text"
                >
                  <i class="pi pi-exclamation-triangle shrink-0 text-[9px]" />
                  <span>
                    Kurang {{ formatRupiah(getDeficit(coupon) / 100) }} untuk menggunakan voucher
                    ini.
                  </span>
                </div>
                <div
                  v-else-if="coupon.is_expired"
                  class="flex items-center gap-1.5 rounded-md border border-brand-danger-edge bg-brand-danger-tint px-2 py-1 text-[10.5px] font-medium text-brand-danger-text"
                >
                  <i class="pi pi-times-circle shrink-0 text-[9px]" />
                  <span>Voucher telah kedaluwarsa.</span>
                </div>
                <div
                  v-else-if="!coupon.is_available"
                  class="flex items-center gap-1.5 rounded-md border border-brand-hair bg-brand-field px-2 py-1 text-[10.5px] font-medium text-brand-muted"
                >
                  <i class="pi pi-ban shrink-0 text-[9px]" />
                  <span>Kuota pemakaian voucher telah habis.</span>
                </div>

                <!-- Terms Meta -->
                <div class="flex items-center gap-1.5 text-[10.5px] text-brand-muted truncate">
                  <span>Min. {{ coupon.formatted_min_purchase }}</span>
                  <span v-if="coupon.formatted_max_discount"
                    >· Maks. {{ coupon.formatted_max_discount }}</span
                  >
                  <span>· s.d. {{ formatExpiryDate(coupon.expires_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Footer -->
    <template #footer>
      <div class="flex w-full items-center justify-between gap-3">
        <!-- Savings Summary -->
        <div class="min-w-0">
          <div v-if="selectedCoupon && selectedDiscountCents > 0" class="flex items-center gap-2">
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-success-tint text-brand-success-text"
            >
              <i class="pi pi-check text-xs" />
            </div>
            <div>
              <p class="m-0 text-[10px] uppercase font-bold tracking-wider text-brand-muted">
                Total Penghematan:
              </p>
              <p
                class="m-0 font-display text-sm font-bold text-brand-success-text tabular leading-none"
              >
                {{ formatRupiah(selectedDiscountCents / 100) }}
              </p>
            </div>
          </div>
          <div v-else-if="selectedCoupon" class="text-xs text-brand-muted">
            Voucher
            <span class="font-mono font-bold text-brand-ink uppercase">{{
              selectedCoupon.code
            }}</span>
            dipilih
          </div>
          <div v-else class="text-xs text-brand-muted">Belum ada voucher dipilih</div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2 shrink-0">
          <UiButton variant="outline" size="sm" @click="handleCancel"> Batal </UiButton>
          <UiButton variant="primary" size="sm" @click="handleConfirm"> Gunakan Voucher </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>
