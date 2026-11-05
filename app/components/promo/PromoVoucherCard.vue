<script setup lang="ts">
import type { PromoCoupon } from '~/types/promo'

defineProps<{
  coupon: PromoCoupon
  isCopied: boolean
  isClaimed: boolean
}>()

defineEmits<{
  copy: [code: string]
  claim: [coupon: PromoCoupon]
  'open-terms': [coupon: PromoCoupon]
}>()

const formatDiscountBadge = (coupon: PromoCoupon) => {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}%`
  }
  const thousands = Math.floor(coupon.discount_value / 100000)
  return `${thousands.toLocaleString('id-ID')}rb`
}
</script>

<template>
  <article
    class="relative bg-white border border-brand-hair hover:border-brand-ink/40 rounded-2xl shadow-whisper overflow-hidden flex transition-all duration-200"
  >
    <!-- Left Stub: Discount value -->
    <div
      class="w-24 sm:w-28 shrink-0 p-3 sm:p-3.5 flex flex-col justify-between items-center text-center"
      :class="coupon.discount_type === 'percentage' ? 'bg-blue-50/70' : 'bg-emerald-50/70'"
    >
      <UiBadge
        :label="coupon.discount_type === 'percentage' ? 'Diskon' : 'Potongan'"
        :variant="coupon.discount_type === 'percentage' ? 'info' : 'success'"
      />

      <div class="my-auto py-1">
        <p
          class="text-xl sm:text-2xl font-extrabold tracking-tight leading-none whitespace-nowrap"
          :class="coupon.discount_type === 'percentage' ? 'text-brand-accent' : 'text-emerald-700'"
        >
          {{ formatDiscountBadge(coupon) }}
        </p>
      </div>

      <p
        class="text-[10px] font-medium text-brand-muted pt-1.5 border-t border-brand-hairsoft w-full truncate"
      >
        Min. {{ coupon.formatted_min_purchase }}
      </p>
    </div>

    <!-- Right Body: Detail, actions, S&K -->
    <div class="flex-1 p-3 sm:p-3.5 flex flex-col justify-between space-y-2 min-w-0">
      <div>
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-xs sm:text-sm font-bold text-brand-ink truncate">
            {{ coupon.name }}
          </h2>
          <span
            class="shrink-0 font-mono text-[10px] font-bold bg-brand-canvas-soft text-brand-ink px-2 py-0.5 rounded border border-brand-hair"
          >
            {{ coupon.code }}
          </span>
        </div>

        <!-- Compact info row -->
        <div class="mt-1 flex items-center gap-1.5 text-[11px] text-brand-muted truncate">
          <span v-if="coupon.formatted_max_discount" class="font-medium text-brand-ink shrink-0">
            Maks. {{ coupon.formatted_max_discount }}
          </span>
          <span v-if="coupon.formatted_max_discount" class="text-brand-faint">•</span>
          <span class="inline-flex items-center gap-1 shrink-0">
            <i class="pi pi-clock text-[10px]" />
            <span>{{
              coupon.expires_at
                ? `Hingga ${new Date(coupon.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                : 'Seterusnya'
            }}</span>
          </span>
          <span v-if="coupon.remaining_quota != null" class="text-brand-faint">•</span>
          <span v-if="coupon.remaining_quota != null" class="shrink-0">
            Sisa {{ coupon.remaining_quota }}
          </span>
        </div>
      </div>

      <!-- Action & S&K row -->
      <div class="flex items-center justify-between gap-2 pt-2 border-t border-brand-hairsoft">
        <button
          type="button"
          class="text-[11px] font-semibold text-brand-muted hover:text-brand-ink flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0 transition-colors"
          title="Lihat Syarat & Ketentuan Lengkap"
          @click="$emit('open-terms', coupon)"
        >
          <span>S&amp;K</span>
          <i class="pi pi-angle-right text-[10px]" />
        </button>

        <div class="flex items-center gap-1.5 shrink-0">
          <UiButton
            variant="outline"
            size="xs"
            :icon="isCopied ? 'pi-check' : 'pi-copy'"
            @click="$emit('copy', coupon.code)"
          >
            {{ isCopied ? 'Tersalin' : 'Salin' }}
          </UiButton>

          <UiButton
            :variant="isClaimed ? 'primary' : 'accent'"
            size="xs"
            @click="$emit('claim', coupon)"
          >
            {{ isClaimed ? 'Pakai' : 'Klaim' }}
          </UiButton>
        </div>
      </div>
    </div>
  </article>
</template>
