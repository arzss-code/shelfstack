<script setup lang="ts">
export interface CouponMetrics {
  total_coupons: number
  active_coupons: number
  total_usages: number
  total_discount_cents: number
  formatted_total_discount: string
}

defineProps<{
  metrics: CouponMetrics
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <!-- Total Master Voucher -->
    <div class="space-y-1 rounded-2xl border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
        Total Voucher
      </p>
      <p class="font-display text-2xl font-bold tabular text-brand-ink">
        {{ metrics.total_coupons }}
      </p>
      <p class="text-[11px] text-brand-muted">Master voucher terdaftar</p>
    </div>

    <!-- Voucher Aktif -->
    <div class="space-y-1 rounded-2xl border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
        Voucher Aktif
      </p>
      <p class="font-display text-2xl font-bold tabular text-brand-success-text">
        {{ metrics.active_coupons }}
      </p>
      <p class="text-[11px] text-brand-muted">Siap digunakan saat checkout</p>
    </div>

    <!-- Total Penggunaan -->
    <div class="space-y-1 rounded-2xl border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
        Total Penggunaan
      </p>
      <p class="font-display text-2xl font-bold tabular text-brand-ink">
        {{ metrics.total_usages }} kali
      </p>
      <p class="text-[11px] text-brand-muted">Klaim sukses transaksi</p>
    </div>

    <!-- Total Penghematan Diskon -->
    <div class="space-y-1 rounded-2xl border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
        Total Diskon Diberikan
      </p>
      <p class="font-display text-2xl font-bold tabular text-brand-accent-text">
        {{ metrics.formatted_total_discount }}
      </p>
      <p class="text-[11px] text-brand-muted">Penghematan belanja pelanggan</p>
    </div>
  </div>
</template>
