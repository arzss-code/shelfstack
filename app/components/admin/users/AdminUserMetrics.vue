<script setup lang="ts">
import type { AdminCrmMetrics } from '~~/shared/types/admin-crm'

defineProps<{
  metrics: AdminCrmMetrics
}>()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <!-- Total Pelanggan -->
    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
          >Total Pelanggan</span
        >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-canvas-soft text-brand-ink border border-brand-hair"
        >
          <i class="pi pi-users text-xs" aria-hidden="true" />
        </div>
      </div>
      <div class="font-display text-xl sm:text-2xl font-bold tracking-tight tabular text-brand-ink">
        {{ new Intl.NumberFormat('id-ID').format(metrics.totalCustomers) }}
      </div>
      <p class="text-[11px] text-brand-muted m-0">Akun pembeli terdaftar</p>
    </div>

    <!-- Akumulasi Omzet LTV -->
    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
          >Akumulasi Belanja</span
        >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-success-tint text-brand-success-text border border-brand-success-edge"
        >
          <i class="pi pi-dollar text-xs" aria-hidden="true" />
        </div>
      </div>
      <div
        class="font-display text-xl sm:text-2xl font-bold tracking-tight tabular text-brand-ink truncate"
      >
        {{ metrics.formattedTotalRevenue }}
      </div>
      <p class="text-[11px] text-brand-muted m-0">Dari seluruh pesanan lunas</p>
    </div>

    <!-- Rata-rata Customer Lifetime Value (LTV) -->
    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
          >Rata-rata Belanja</span
        >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-accent-tint text-brand-accent-text border border-brand-accent-edge"
        >
          <i class="pi pi-chart-line text-xs" aria-hidden="true" />
        </div>
      </div>
      <div
        class="font-display text-xl sm:text-2xl font-bold tracking-tight tabular text-brand-ink truncate"
      >
        {{ metrics.formattedAverageLtv }}
      </div>
      <p class="text-[11px] text-brand-muted m-0">Rata-rata belanja per akun</p>
    </div>

    <!-- Pelanggan Aktif Belanja -->
    <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper space-y-2">
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
          >Pernah Berbelanja</span
        >
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-warning-tint text-brand-warning-text border border-brand-warning-edge"
        >
          <i class="pi pi-shopping-bag text-xs" aria-hidden="true" />
        </div>
      </div>
      <div class="font-display text-xl sm:text-2xl font-bold tracking-tight tabular text-brand-ink">
        {{ new Intl.NumberFormat('id-ID').format(metrics.activeOrderingCustomers) }}
      </div>
      <p class="text-[11px] text-brand-muted m-0">Memiliki minimal 1 pesanan</p>
    </div>
  </div>
</template>
