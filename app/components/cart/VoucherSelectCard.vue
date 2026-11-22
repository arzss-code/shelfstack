<script setup lang="ts">
import { computed } from 'vue'
import { formatRupiah } from '~/utils/format'
import type { AvailableCoupon } from './VoucherSelectModal.vue'

const props = withDefaults(
  defineProps<{
    coupon: AvailableCoupon
    selected: boolean
    isBestDiscount?: boolean
    subtotalCents: number
    mode?: 'wallet' | 'public'
    isClaiming?: boolean
  }>(),
  {
    isBestDiscount: false,
    mode: 'wallet',
    isClaiming: false,
  },
)

const emit = defineEmits<{
  select: [coupon: AvailableCoupon]
  claimAndApply: [coupon: AvailableCoupon]
}>()

const isEligible = computed(() => {
  if (props.coupon.is_expired || props.coupon.is_available === false) return false
  return props.subtotalCents >= props.coupon.min_purchase_cents
})

const deficit = computed(() => {
  return Math.max(0, props.coupon.min_purchase_cents - props.subtotalCents)
})

const formatDiscountBadge = (c: AvailableCoupon): string => {
  if (c.discount_type === 'percentage') {
    return `${c.discount_value}%`
  }
  const val = c.discount_value / 100
  if (val >= 1000) {
    return `${Math.round(val / 1000)}rb`
  }
  return formatRupiah(val)
}

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

const handleClick = () => {
  if (!isEligible.value) return
  emit('select', props.coupon)
}
</script>

<template>
  <div
    v-if="isEligible"
    role="button"
    tabindex="0"
    :aria-pressed="selected"
    :class="[
      'group relative flex items-stretch rounded-xl border transition-all text-left overflow-hidden select-none cursor-pointer',
      selected
        ? 'border-brand-ink ring-2 ring-brand-ink/10 bg-brand-canvas shadow-whisper'
        : 'border-brand-hair bg-brand-canvas hover:border-brand-ink/60 hover:shadow-whisper',
    ]"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Ticket Left Stub -->
    <div
      :class="[
        'w-20 sm:w-24 p-2 sm:p-2.5 flex flex-col items-center justify-center text-center shrink-0 border-r border-dashed transition-colors',
        selected
          ? 'bg-brand-ink text-brand-onink border-brand-ink'
          : 'bg-brand-canvas-soft text-brand-ink border-brand-hair group-hover:bg-brand-field',
      ]"
    >
      <span class="font-display font-extrabold text-xs sm:text-sm tracking-tight leading-none">
        {{ formatDiscountBadge(coupon) }}
      </span>
      <span
        :class="[
          'text-[9px] uppercase font-bold tracking-wider mt-1 px-1.5 py-0.5 rounded',
          selected ? 'bg-brand-onink/20 text-brand-onink' : 'bg-brand-hair text-brand-muted',
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

          <!-- Badge Paling Hemat -->
          <span
            v-if="isBestDiscount"
            class="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9.5px] font-bold text-amber-700 dark:text-amber-300 shrink-0"
          >
            <i class="pi pi-bolt text-[8px]" />
            Paling Hemat
          </span>
        </div>

        <!-- Action / Selector -->
        <div class="shrink-0 flex items-center gap-1.5">
          <button
            v-if="mode === 'public' && !selected"
            type="button"
            class="rounded-lg bg-brand-ink px-2.5 py-1 text-[11px] font-bold text-brand-onink hover:bg-brand-ink/90 transition-colors shadow-whisper shrink-0 cursor-pointer border-0"
            :disabled="isClaiming"
            @click.stop="emit('claimAndApply', coupon)"
          >
            <i v-if="isClaiming" class="pi pi-spin pi-spinner text-[10px] mr-1" />
            Klaim &amp; Pakai
          </button>
          <div
            v-else
            :class="[
              'flex h-4 w-4 items-center justify-center rounded-full border transition-all',
              selected
                ? 'border-brand-ink bg-brand-ink text-brand-onink'
                : 'border-brand-hair bg-brand-canvas group-hover:border-brand-ink',
            ]"
          >
            <i v-if="selected" class="pi pi-check text-[8px]" />
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

  <!-- Ineligible Card State -->
  <div
    v-else
    class="relative flex items-stretch rounded-xl border border-brand-hair/60 bg-brand-canvas-soft/50 text-left overflow-hidden opacity-75 cursor-not-allowed select-none"
  >
    <!-- Ticket Left Stub (Muted) -->
    <div
      class="w-20 sm:w-24 bg-brand-field text-brand-muted border-r border-dashed border-brand-hair/60 p-2 sm:p-2.5 flex flex-col items-center justify-center text-center shrink-0"
    >
      <span class="font-display font-extrabold text-xs sm:text-sm tracking-tight leading-none">
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

      <!-- Ineligibility Banner -->
      <div
        v-if="deficit > 0"
        class="flex items-center gap-1.5 rounded-md border border-brand-warning-edge bg-brand-warning-tint px-2 py-1 text-[10.5px] font-medium text-brand-warning-text"
      >
        <i class="pi pi-exclamation-triangle shrink-0 text-[9px]" />
        <span> Kurang {{ formatRupiah(deficit / 100) }} untuk menggunakan voucher ini. </span>
      </div>
      <div
        v-else-if="coupon.is_expired"
        class="flex items-center gap-1.5 rounded-md border border-brand-danger-edge bg-brand-danger-tint px-2 py-1 text-[10.5px] font-medium text-brand-danger-text"
      >
        <i class="pi pi-times-circle shrink-0 text-[9px]" />
        <span>Voucher telah kedaluwarsa.</span>
      </div>
      <div
        v-else-if="coupon.is_available === false"
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
</template>
