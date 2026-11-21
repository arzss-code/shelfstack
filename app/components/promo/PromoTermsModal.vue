<script setup lang="ts">
import type { PromoCoupon } from '~/types/promo'

const props = defineProps<{
  modelValue: boolean
  coupon: PromoCoupon | null
  isClaimed: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  claim: [coupon: PromoCoupon]
}>()

const formatDiscountBadge = (coupon: PromoCoupon) => {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}%`
  }
  const thousands = Math.floor(coupon.discount_value / 100000)
  return `${thousands.toLocaleString('id-ID')}rb`
}

const handleClaim = () => {
  if (props.coupon) {
    emit('claim', props.coupon)
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <UiModal
    :visible="modelValue"
    size="sm"
    :title="coupon ? 'Syarat &amp; Ketentuan' : 'Syarat &amp; Ketentuan Voucher'"
    @update:visible="$emit('update:modelValue', $event)"
  >
    <div v-if="coupon" class="space-y-4">
      <!-- Voucher header -->
      <div
        class="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-canvas-soft border border-brand-hair"
      >
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0"
          :class="
            coupon.discount_type === 'percentage'
              ? 'bg-blue-100 text-brand-accent'
              : 'bg-emerald-100 text-emerald-700'
          "
        >
          {{ formatDiscountBadge(coupon) }}
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="font-bold text-sm text-brand-ink truncate">{{ coupon.name }}</h3>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="font-mono text-[10px] font-bold bg-brand-canvas text-brand-ink px-2 py-0.5 rounded border border-brand-hair"
            >
              {{ coupon.code }}
            </span>
            <UiBadge
              :label="
                coupon.discount_type === 'percentage' ? 'Diskon Belanja' : 'Potongan Langsung'
              "
              :variant="coupon.discount_type === 'percentage' ? 'info' : 'success'"
            />
          </div>
        </div>
      </div>

      <!-- Bento Grid Parameters -->
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="p-2.5 rounded-xl bg-brand-canvas border border-brand-hair space-y-0.5">
          <p class="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
            Min. Belanja
          </p>
          <p class="font-bold text-brand-ink">{{ coupon.formatted_min_purchase }}</p>
        </div>

        <div class="p-2.5 rounded-xl bg-brand-canvas border border-brand-hair space-y-0.5">
          <p class="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
            Maks. Diskon
          </p>
          <p class="font-bold text-brand-ink">
            {{ coupon.formatted_max_discount || 'Tanpa Batas Pagu' }}
          </p>
        </div>

        <div class="p-2.5 rounded-xl bg-brand-canvas border border-brand-hair space-y-0.5">
          <p class="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
            Masa Berlaku
          </p>
          <p class="font-bold text-brand-ink">
            {{
              coupon.expires_at
                ? new Date(coupon.expires_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Berlaku Seterusnya'
            }}
          </p>
        </div>

        <div class="p-2.5 rounded-xl bg-brand-canvas border border-brand-hair space-y-0.5">
          <p class="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
            Batas Kuota
          </p>
          <p class="font-bold text-brand-ink">
            {{
              coupon.remaining_quota != null
                ? `Sisa ${coupon.remaining_quota} kuota`
                : 'Kuota Tersedia'
            }}
          </p>
        </div>
      </div>

      <!-- Usage terms -->
      <div class="space-y-2 text-xs">
        <p class="font-semibold text-brand-ink text-xs">Ketentuan Penggunaan:</p>
        <div class="space-y-2 text-brand-muted leading-relaxed">
          <div class="flex items-start gap-2">
            <span
              class="w-4 h-4 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-[10px] font-bold text-brand-ink shrink-0 mt-0.5"
              >1</span
            >
            <span>
              Voucher berlaku untuk transaksi belanja dengan nilai minimal
              <strong class="text-brand-ink font-semibold">{{
                coupon.formatted_min_purchase
              }}</strong
              >.
            </span>
          </div>

          <div class="flex items-start gap-2">
            <span
              class="w-4 h-4 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-[10px] font-bold text-brand-ink shrink-0 mt-0.5"
              >2</span
            >
            <span>
              Potongan otomatis memotong total belanja pada saat proses checkout setelah syarat
              terpenuhi.
            </span>
          </div>

          <div class="flex items-start gap-2">
            <span
              class="w-4 h-4 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-[10px] font-bold text-brand-ink shrink-0 mt-0.5"
              >3</span
            >
            <span>
              Dapat digunakan hingga
              <strong class="text-brand-ink font-semibold">{{ coupon.user_limit }} kali</strong>
              per akun pengguna terdaftar.
            </span>
          </div>

          <div class="flex items-start gap-2">
            <span
              class="w-4 h-4 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-[10px] font-bold text-brand-ink shrink-0 mt-0.5"
              >4</span
            >
            <span>
              Voucher tidak dapat diuangkan dan berlaku selama alokasi kuota promosi masih tersedia
              di ShelfStack.
            </span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <UiButton variant="outline" size="sm" @click="$emit('update:modelValue', false)">
        Tutup
      </UiButton>
      <UiButton
        v-if="coupon"
        :variant="isClaimed ? 'primary' : 'accent'"
        size="sm"
        @click="handleClaim"
      >
        {{ isClaimed ? 'Gunakan di Keranjang' : 'Klaim Voucher' }}
      </UiButton>
    </template>
  </UiModal>
</template>
