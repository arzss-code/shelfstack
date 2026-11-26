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
    <div class="space-y-2 rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <div class="flex items-center justify-between gap-2">
        <p class="m-0 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Total Voucher
        </p>
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-hair bg-brand-canvas-soft text-brand-ink"
        >
          <i class="pi pi-ticket text-xs" aria-hidden="true" />
        </div>
      </div>
      <p class="m-0 font-display text-xl sm:text-2xl font-bold tabular text-brand-ink">
        {{ metrics.total_coupons }}
      </p>
      <p class="m-0 text-[11px] text-brand-muted">Master voucher terdaftar</p>
    </div>

    <!-- Voucher Aktif -->
    <div class="space-y-2 rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <div class="flex items-center justify-between gap-2">
        <p class="m-0 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Voucher Aktif
        </p>
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-success-edge bg-brand-success-tint text-brand-success-text"
        >
          <i class="pi pi-check-circle text-xs" aria-hidden="true" />
        </div>
      </div>
      <p class="m-0 font-display text-xl sm:text-2xl font-bold tabular text-brand-success-text">
        {{ metrics.active_coupons }}
      </p>
      <p class="m-0 text-[11px] text-brand-muted">Siap digunakan saat checkout</p>
    </div>

    <!-- Total Penggunaan -->
    <div class="space-y-2 rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <div class="flex items-center justify-between gap-2">
        <p class="m-0 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Total Penggunaan
        </p>
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-hair bg-brand-canvas-soft text-brand-ink"
        >
          <i class="pi pi-users text-xs" aria-hidden="true" />
        </div>
      </div>
      <p class="m-0 font-display text-xl sm:text-2xl font-bold tabular text-brand-ink">
        {{ metrics.total_usages }} kali
      </p>
      <p class="m-0 text-[11px] text-brand-muted">Klaim sukses transaksi</p>
    </div>

    <!-- Total Penghematan Diskon -->
    <div class="space-y-2 rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
      <div class="flex items-center justify-between gap-2">
        <p class="m-0 text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
          Total Diskon Diberikan
        </p>
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-accent-edge bg-brand-accent-tint text-brand-accent-text"
        >
          <i class="pi pi-percentage text-xs" aria-hidden="true" />
        </div>
      </div>
      <p
        class="m-0 font-display text-xl sm:text-2xl font-bold tabular text-brand-accent-text truncate"
      >
        {{ metrics.formatted_total_discount }}
      </p>
      <p class="m-0 text-[11px] text-brand-muted">Penghematan belanja pelanggan</p>
    </div>
  </div>
</template>
