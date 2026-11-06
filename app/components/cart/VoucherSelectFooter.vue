<script setup lang="ts">
import type { AvailableCoupon } from '~/composables/useVoucherSelection'
import { formatRupiah } from '~/utils/format'

defineProps<{
  selectedCoupon: AvailableCoupon | null
  selectedDiscountCents: number
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
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
        <span class="font-mono font-bold text-brand-ink uppercase">{{ selectedCoupon.code }}</span>
        dipilih
      </div>
      <div v-else class="text-xs text-brand-muted">Belum ada voucher dipilih</div>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center justify-end gap-2 shrink-0">
      <UiButton variant="outline" size="sm" @click="emit('cancel')"> Batal </UiButton>
      <UiButton variant="primary" size="sm" @click="emit('confirm')"> Gunakan Voucher </UiButton>
    </div>
  </div>
</template>
